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

  @IsArray()
  links: [Link];

  @IsOptional()
  marker: Marker;
}
