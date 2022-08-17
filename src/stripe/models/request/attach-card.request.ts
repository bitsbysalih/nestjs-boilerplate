import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AttachCardRequest {
  @ApiProperty({
    example: 'pm_1KpKPxByeePakSrHtCOuJQ3M',
    description: 'Payment id recieved from client',
  })
  @IsString()
  paymentMethodId: string;
}
