import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

//Schema imports
import { User } from 'src/users/schemas/user.schema';

export type MarkerDocument = Marker & Document;

@Schema()
export class Marker {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop()
  markerImageLink: string;

  @Prop()
  markerFileLink: string;

  @Prop()
  uniqueId: string;
}

export const MarkerSchema = SchemaFactory.createForClass(Marker);
