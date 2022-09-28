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

  @IsArray()
  @IsOptional()
  links?: [Link];

  marker: Marker;
}
