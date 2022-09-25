import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'test1@example.com', description: "Users's email" })
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'sdsewf224rfew', description: "Users's password" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
