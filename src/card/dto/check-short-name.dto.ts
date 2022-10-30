import { IsString } from 'class-validator';

export class CheckShortNameDto {
  @IsString()
  shortName: string;
}
