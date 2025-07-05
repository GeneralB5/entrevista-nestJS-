import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UserDto{

    @IsNotEmpty({message:"Email requerido"})
    @IsEmail({},{message:"Email no valido"})
    email:string;

    @IsNotEmpty({message:"Password requerida"})
    @IsString({message:"Password debe ser un string valido"})
    password:string;
}
