import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckShortNameRequest {
  @ApiProperty({
    example: 'beyin',
    description: "card's special name",
  })
  @IsString()
  shortName: string;
}
