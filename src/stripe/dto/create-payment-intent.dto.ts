import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({
    example: 200,
    description: 'Number of cards Users wants',
  })
  @IsString()
  cardSlots: any;

  @ApiProperty({
    example: 'true',
    description:
      'set to true if the Users is trying to subscribe to the yearly plan',
  })
  @IsBoolean()
  yearlySubscription: boolean;
}
