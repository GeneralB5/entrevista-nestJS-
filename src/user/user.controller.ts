import { Body, ConflictException, Controller,Delete,Get,HttpCode,InternalServerErrorException,Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserRegisterDto } from './Dto/UserRegister.dto';
import { UserResDto } from './Dto/userRes.dto';
import { UserDto } from './Dto/User.dto';
import { JwtAuthGuardFactory } from './guards/jwt.guard';
import { UserToPlainDto } from './Dto/userToPlain.dto';
import { clearAuthCookies } from './utils/clear.cookies';
import { UserUpdateDto } from './Dto/userUpdate.dto';

@Controller('user')
export class UserController {
constructor(
    private userService:UserService ,
    private readonly jwtService:JwtService    
){}

@Get()
async getCars(){
    try {
        const getCars = await fetch("https://vpic.nhtsa.dot.gov/api/vehicles/getallmanufacturers?format=json")
        const jsoncars = await getCars.json()

        return jsoncars["Results"]
    } catch (error) {
     throw new InternalServerErrorException("Error al te" + error.message)
    }   
}

@Post("create")
async createUser(@Body() user:UserRegisterDto):Promise<UserResDto>{
    try {
        if(!user)throw new ConflictException("El body no existe o esta vacio")
        return await this.userService.createUser(user);    
    } catch (error) {
        throw new InternalServerErrorException("Error creating user: "+ error.message)
    }
    
}

@Post("find")
async LoginUser(@Body() user:UserDto, @Res({passthrough:true}) res:Response): Promise<UserResDto>{
    if(!user)throw new ConflictException("El body no existe o esta vacio")
    const {email,name,_id} = await this.userService.findOneUser(user)
    const jwtPrueba = this.jwtService.sign({email,name,_id},{expiresIn:"1h"})
    
    const jwtPruebaRefresh =this.jwtService.sign({email,name,_id},{expiresIn:"1h",secret:process.env.SECRET_JWT_KEY_REFRESH})
    res.cookie("cookie", jwtPrueba,{
        secure:false,
        maxAge: 10 * 60 * 100, // 10 minute
        httpOnly:true
    })
    
    res.cookie("refresh_cookie", jwtPruebaRefresh,{
        secure:false,
        maxAge: 3600000, // 1 hour
        httpOnly:true
    })
    
    return {email,name,_id}
}

@UseGuards(JwtAuthGuardFactory("refresh_cookie","SECRET_JWT_KEY_REFRESH"))
@Get("refresh")
async prueba(@Req() req:Request,@Res({passthrough:true})res:Response ){
    let user= req.user?req.user:(()=>{throw new Error("hola")})();
    let {email,name,_id} = new UserToPlainDto(user)
    const jwtUserSing= await this.jwtService.signAsync({email,name,_id},{expiresIn:"1h"})
    res.cookie("cookie", jwtUserSing,{
        secure:false,
        maxAge: 10 * 60 * 100, 
        httpOnly:true
    })
    return {email,name,_id}
}

@UseGuards(JwtAuthGuardFactory("cookie","SECRET_JWT_KEY"))
@Delete()
async deleteUser(@Req() req:Request,@Res({ passthrough: true }) res: Response):Promise<{message:string}>{
    try{
        const userId = req.user?.['_id'] || req.user?.['id'];
        if(!userId) throw new ConflictException("No se encontro un _id de usuario");
        const userDeleted = await this.userService.deleteUserById(userId);
        if(!userDeleted)throw new ConflictException("no se ha podido elminar el usuario")
        clearAuthCookies(res,["cookie","refresh_cookie"])
        return userDeleted;
        
    } catch (error) {
        throw new InternalServerErrorException("Error" + error.message)
    }
}

@UseGuards(JwtAuthGuardFactory("cookie","SECRET_JWT_KEY"))
@Put()
async updateUser(@Body() user:UserUpdateDto, @Req() req:Request,@Res({ passthrough: true }) res: Response):Promise<{message:string}>{
    try {
        const userId = req.user?.['_id'] || req.user?.['id'];
        if(!user || !userId) throw new ConflictException("No se encontro un _id de usuario o el Body esta vacio");
        const updatedUser:UserToPlainDto = await this.userService.findByIdAndUpdate(userId,user);
        if(!updatedUser) throw new ConflictException("no se ha podido actualizar el usuario")
        clearAuthCookies(res,["cookie","refresh_cookie"])

        const jwtPrueba = this.jwtService.sign({...updatedUser},{expiresIn:"1h"})
        const jwtPruebaRefresh =this.jwtService.sign({...updatedUser},{expiresIn:"1h",secret:process.env.SECRET_JWT_KEY_REFRESH})
    
        // Crear cookies
        res.cookie("cookie", jwtPrueba,{
            secure:false,
            maxAge: 10 * 60 * 100, // 10 minute
            httpOnly:true
        })
        
        res.cookie("refresh_cookie", jwtPruebaRefresh,{
            secure:false,
            maxAge: 3600000, // 1 hour
            httpOnly:true
        })   

        return {message:"usuario actualizado correctamente"}
    } catch (error) {
        throw new InternalServerErrorException("Error" + error.message)
    }
}

}