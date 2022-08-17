import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type StripeEventDocument = StripeEvent & Document;

@Schema()
export class StripeEvent {
  @Prop()
  id: string;

  @Prop()
  eventId: string;

  @Prop()
  eventType: string;
}

export const StripeEventSchema = SchemaFactory.createForClass(StripeEvent);
