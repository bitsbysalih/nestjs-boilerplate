import { Link, Marker } from '@prisma/client';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateCardDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  about: string;

  @IsString()
  email: string;

  @IsString()
  activeStatus: string;

  @IsString()
  @IsOptional()
  shortName: string;

  @IsString()
  @IsOptional()
  cardImage: string;

  @IsString()
  @IsOptional()
  logoImage: string;

  @IsString()
  @IsOptional()
  backgroundImage: string;

  @IsOptional()
  links: [Link];

  @IsOptional()
  marker: any;
}
