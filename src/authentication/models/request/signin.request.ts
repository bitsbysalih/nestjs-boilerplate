import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SigninRequest {
  @ApiProperty({
    example: 'john@example.com',
    description: "user's email",
  })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({
    example: 'test12345',
    description: "user's account password",
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
