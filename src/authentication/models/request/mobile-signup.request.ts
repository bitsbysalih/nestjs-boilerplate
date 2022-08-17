import { IsEmail, IsString } from 'class-validator';

export class MobileSignupRequest {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  title: string;

  @IsString()
  password: string;

  @IsString()
  profilePhoto: string;
}
