import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNumber,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupRequest {
  @ApiProperty({
    example: 'John',
    description: "user's first name",
  })
  @IsNotEmpty()
  @IsString()
  @Matches(RegExp('^[A-Za-zıöüçğşİÖÜÇĞŞñÑáéíóúÁÉÍÓÚ ]+$'))
  @MaxLength(20)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: "user's Last name",
  })
  @IsNotEmpty()
  @IsString()
  @Matches(RegExp('^[A-Za-zıöüçğşİÖÜÇĞŞñÑáéíóúÁÉÍÓÚ ]+$'))
  @MaxLength(20)
  lastName: string;

  @ApiProperty({
    example: 'johndoe@example.com',
    description: "user's email",
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    example: 'test12345',
    description: "user's account's password",
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: '+901234567890',
    description: "user's phone number",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/)
  phoneNumber: string;

  @ApiProperty({
    example: '01/01/2022',
    description: "user's date of birth",
  })
  @IsString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({
    example: 'Personal',
    description: "user's subscription type",
  })
  @IsString()
  @IsNotEmpty()
  subscriptionType: string;
}
