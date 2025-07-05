import { Exclude, Expose } from "class-transformer";

export class UserToPlainDto {
  @Expose() 
  _id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Exclude() 
  password: string;

  @Exclude()
  __v: number; 

  constructor(partial: Partial<UserToPlainDto>) {
    Object.assign(this, partial);
  }
}