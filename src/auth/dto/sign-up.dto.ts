import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class SignUpDto {
  @IsString()
  @ApiProperty({ example: 'John', description: "New Users's First name" })
  @Matches(RegExp('^[A-Za-zıöüçğşİÖÜÇĞŞñÑáéíóúÁÉÍÓÚ ]+$'))
  @MaxLength(20)
  firstName: string;

  @IsString()
  @ApiProperty({ example: 'Doe', description: "New Users's Last name" })
  @Matches(RegExp('^[A-Za-zıöüçğşİÖÜÇĞŞñÑáéíóúÁÉÍÓÚ ]+$'))
  @MaxLength(20)
  lastName: string;

  @IsString()
  @ApiProperty({ example: 'Gardener', description: "New Users's Job title" })
  @MaxLength(20)
  jobTitle: string;

  @IsEmail()
  @ApiProperty({
    example: 'test1@example.com',
    description: "New Users's email",
  })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'sdsewf224rfew',
    description: "New Users's password",
  })
  password: string;

  @ApiProperty({ description: "New Users's Profile photo" })
  profilePhoto: Express.Multer.File;
}
