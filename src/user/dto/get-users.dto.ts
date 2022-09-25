import { IsNumber, IsOptional, Max } from 'class-validator';

export class GetUsersDto {
  @IsNumber()
  @IsOptional()
  skip: number;

  @IsNumber()
  @IsOptional()
  @Max(20)
  take: number;
}
