import { IsNotEmpty, IsString } from "class-validator";
import { UserDto } from "./User.dto";
import { isSameInput } from "../class.validator/IsSameInput";

export class UserRegisterDto extends UserDto{
    @IsNotEmpty({message:"Name Required"})
    @IsString({message:"Name debe ser un string valido"})
    name:string;

    @IsNotEmpty({message: "ambas contraseñas son requeridas"})
    @IsString({message:"Password debe ser un string valido"})
    @isSameInput("password",{message:"las contraseñas no coinciden"})
    confirmPasword:string;
}