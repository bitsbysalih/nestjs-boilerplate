import { IsArray, IsBoolean, IsString } from 'class-validator';

export class CreateCardDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  about: string;

  @IsBoolean()
  activeStatus: boolean;

  @IsString()
  email: string;

  @IsString()
  shortName: string;

  @IsArray()
  links: [];
}
