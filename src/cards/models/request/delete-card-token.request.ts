import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteCardTokenRequest {
  @ApiProperty({
    example: '622bb0940e165a01d02e953a',
    description: 'Id of card to be deleted',
  })
  @IsNotEmpty()
  @IsString()
  _id: string;
}
