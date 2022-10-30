import { Link, Marker } from '@prisma/client';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  about?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  shortName?: string;

  @IsString()
  @IsOptional()
  activeStatus?: string;

  @IsString()
  @IsOptional()
  cardImage: string;

  @IsString()
  @IsOptional()
  logoImage: string;

  @IsString()
  @IsOptional()
  backgroundImage: string;

  @IsArray()
  @IsOptional()
  links?: [Link];

  @IsOptional()
  marker: Marker;
}
