import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AdjustCardCountRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
