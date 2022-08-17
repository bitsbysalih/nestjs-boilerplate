import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema()
export class RefreshToken {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  refreshToken: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
