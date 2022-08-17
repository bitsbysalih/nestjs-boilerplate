import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class CheckUsernameRequest {
  @ApiProperty({
    example: 'johndoe2345',
    description: "user's username",
  })
  @IsNotEmpty()
  @IsEmail()
  username: string;
}
