import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddLinkClicksDto {
  @IsString()
  @IsNotEmpty()
  cardId: string;

  @IsString()
  @IsOptional()
  name: string;
}
