import { ApiProperty } from '@nestjs/swagger';
import { Link } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value.toLowerCase().trim())
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'John', description: "New Users's First name" })
  @Transform(({ value }) => value.toLowerCase().trim())
  @Matches(RegExp('^[A-Za-zıöüçğşİÖÜÇĞŞñÑáéíóúÁÉÍÓÚ ]+$'))
  @MaxLength(20)
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Doe', description: "New Users's Last name" })
  @Transform(({ value }) => value.toLowerCase().trim())
  @Matches(RegExp('^[A-Za-zıöüçğşİÖÜÇĞŞñÑáéíóúÁÉÍÓÚ ]+$'))
  @MaxLength(20)
  lastName?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsArray()
  @IsOptional()
  links?: [Link];

  @IsOptional()
  @ApiProperty({ description: "New Users's Profile photo" })
  profilePhoto: any;
}
