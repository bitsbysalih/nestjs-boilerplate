import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteMarkerRequest {
  @IsString()
  @IsNotEmpty()
  uniqueId: string;
}
