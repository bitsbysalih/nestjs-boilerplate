import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class CheckEmailRequest {
  @ApiProperty({
    example: 'john@example.com',
    description: "user's email",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
