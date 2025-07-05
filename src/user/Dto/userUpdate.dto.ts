import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";


export class UserUpdateDto{
    @IsOptional()
    @IsString({message:"Name debe ser un string valido"})
    @IsNotEmpty({ message: "Name no puede estar vacío" })
    name?:string;

    @IsOptional()
    @IsEmail({},{message:"Email no valido"})
    @IsNotEmpty({ message: "Email no puede estar vacío" })
    email?:string;

    @IsOptional()
    @IsString({message:"Password debe ser un string valido"})
    @IsNotEmpty({ message: "Password no puede estar vacío" })
    password?:string;
}
