import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { UserRegisterDto } from './Dto/UserRegister.dto';
import { UserDto } from './Dto/User.dto';
import * as bcrypt from "bcrypt"
import { plainToInstance } from 'class-transformer';
import { isString } from 'class-validator';
import { UserUpdateDto } from './Dto/userUpdate.dto';
import { UserToPlainDto } from './Dto/userToPlain.dto';
@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>){}

    async FindAllUser():Promise<UserToPlainDto[]>{
        try {
            //verificamos la existencia de usuarios en la base de datos
            const users = await this.userModel.find().lean(true).exec();
            if(!users || users.length === 0) throw new NotFoundException("No se encontraton usuarios en la base de datos")

            // Convertimos los usuarios a una instancia para evistar datos sensibles
            return users.map(user => plainToInstance(UserToPlainDto,user));    
        } catch (error) {
            throw new InternalServerErrorException("Error finding users: "+ error.message)
        }
    }
    async createUser(user:UserRegisterDto):Promise<UserToPlainDto>{
        try {
            const filteredUpdates = Object.fromEntries( Object.entries(user).filter(([key, value]) => value !== undefined && value !==null && (isString(value) && value.trim() !== "") ))
            if(Object.keys(filteredUpdates).length !== 4) throw new BadRequestException("No se han proporcionado datos necesarios para crear el usuario")

            // verificar que existan los campos
            if(!user.email|| !user.name || !user.password)throw new BadRequestException("Los campos email, name y password son obligatorios")

            // Validar que el email no este registrado
            const userCoincide = await this.userModel.findOne({email:user.email}).lean(true).exec()            
            if(userCoincide) throw new ConflictException(`este email:${user.email} ya esta registrado en nuestra base de datos`)        
            
            //hasheo de la contraseña
            const hashedPassword = await bcrypt.hash(user.password,10) 
            
            //creacion del usuario
            const newUser = new this.userModel({
                name:user.name,email:user.email,password:hashedPassword
            })

            //guardamos el user y lo convertimos para evitar datos sensibles
            const userResponse = await newUser.save()
            return plainToInstance(UserToPlainDto,userResponse.toObject(),{excludeExtraneousValues:true})
            
        } catch (error){ 
            throw new InternalServerErrorException("Error creating user:"+ error.message)
        }
    }

    async findOneUser(user:UserDto):Promise<UserToPlainDto>{
        try {
            // Validar que el email este registrado y extraemos la contraseña
            const findedUser = await this.userModel.findOne({email:user.email}).select("+password").lean(true).exec()
            if(!findedUser) throw new ConflictException(`el usuario con email:${user.email} no existe en nuestra base de datos`)
            //verificamos la existencia del campo password en el user
            if(!user.password) throw new BadRequestException("El campo password es obligatorio")

            // verificamos que las contraseñas sean iguales
            if(!await bcrypt.compare(user.password,findedUser.password))throw new UnauthorizedException(`la contraseña no coincide con el usuario ingresado`)

            //lo convertimos para evitar datos sensibles
            return plainToInstance(UserToPlainDto,findedUser,{excludeExtraneousValues:true})
        } catch (error) {
            throw new InternalServerErrorException("Error finding user: " + error.message)
        }
    }

    async deleteUserById(_id:string):Promise<{message:string}>{
        try {
            //verificamos que el id sea valido y si existe el usuario
            if(!_id)throw new BadRequestException("El _id es obligatorio")
            const deletedUser = await this.userModel.findByIdAndDelete(_id).exec()
            if(!deletedUser)throw new NotFoundException("el usuario no existe en nuestra base de datos")

            //Retornamos un mensaje de confirmacion
            return {message:"usuario eleminado correctamente"}
        } catch (error) {
            throw new InternalServerErrorException("Error deleting user: " + error.message)
        }
    }

    async findByIdAndUpdate(_id:string,user:UserUpdateDto):Promise<UserToPlainDto>{
        try {
            //filtramos para evitar errores en los campos
            const filteredUpdates = Object.fromEntries( Object.entries(user).filter(([key, value]) => value !== undefined && value !==null && (isString(value) && value.trim() !== "") ))
            if(Object.keys(filteredUpdates).length === 0) throw new BadRequestException("No se han proporcionado actualizaciones validas")
            
            //solo si existe el campo password lo hasheamos
            if(filteredUpdates.password){
                const userExist = await this.userModel.findById(_id).select("+password").lean(true).exec()
                
                if(!userExist)throw new NotFoundException("Usuario no existente")

                if(await bcrypt.compare(filteredUpdates.password,userExist.password))throw new BadRequestException("La contraseña no puede ser la misma que la anterior")    

                filteredUpdates.password = await bcrypt.hash(filteredUpdates.password,10)
            }

            //verificamos si existe y lo cambiamos
            const updatedUser = await this.userModel.findByIdAndUpdate(_id,{$set:filteredUpdates},{new:true,lean:true,runValidators:true}).exec()
            if(!updatedUser)throw new NotFoundException("El usuario no existe en la base de datos")
            
            //Lo convertiomos para evitar datos sensibles
            return plainToInstance(UserToPlainDto,updatedUser,{excludeExtraneousValues:true})
        } catch (error) {
            throw new InternalServerErrorException("Error updating user: " + error.message)
        }
    }

}
