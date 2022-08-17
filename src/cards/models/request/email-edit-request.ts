import { IsEmail, IsString } from 'class-validator';

export class EmailEditRequest {
  @IsString()
  @IsEmail()
  email: string;
}
