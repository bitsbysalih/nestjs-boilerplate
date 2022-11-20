import { IsNotEmpty, IsString } from 'class-validator';

export class AddLinkClicksDto {
  @IsString()
  @IsNotEmpty()
  cardId: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
