import { Link } from '@prisma/client';
import {
  IsArray,
  //   IsBoolean,
  IsBooleanString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCardDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  about: string;

  @IsString()
  email: string;

  @IsBooleanString()
  activeStatus: boolean;

  @IsString()
  @IsOptional()
  shortName: string;

  @IsArray()
  links: [Link];

  @IsOptional()
  marker: any;
}
