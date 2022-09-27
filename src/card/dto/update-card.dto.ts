import { Link } from '@prisma/client';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  activeStatus?: boolean;

  @IsArray()
  @IsOptional()
  links?: [Link];
}
