import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateSubscriptionRequest {
  @ApiProperty({
    example: 200,
    description: 'Creates a subscription based on number of cards',
  })
  @IsNumber()
  cardAmount: number;

  @ApiProperty({
    example: 'true',
    description:
      'set to true if the user is trying subscribe to the yearly plan',
  })
  @IsBoolean()
  yearlySubscription: boolean;
}
