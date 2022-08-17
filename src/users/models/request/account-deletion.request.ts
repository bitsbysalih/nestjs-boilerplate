import { IsNotEmpty, IsString } from 'class-validator';

export class AccountDeletionRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
