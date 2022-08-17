import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RefreshAccessTokenRequest {
  @ApiProperty({
    example: 'EUOn3RDDm0KPlzao1daq8',
    format: 'string',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
