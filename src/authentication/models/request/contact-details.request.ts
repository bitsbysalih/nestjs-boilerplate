import { IsString } from 'class-validator';

export class ContactDetailsRequest {
  @IsString()
  links: string;
}
