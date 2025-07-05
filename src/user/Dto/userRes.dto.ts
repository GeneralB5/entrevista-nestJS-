import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UserResDto{

    @IsNotEmpty({message:"Email requerido"})
    @IsEmail({},{message:"Email no valido"})
    email:string;

    @IsNotEmpty({message:"Name requerido"})
    @IsString({message:"Name debe ser un string valido"})
    name:string;

    @IsNotEmpty({message:"_id requerido"})
    _id:string;
}
