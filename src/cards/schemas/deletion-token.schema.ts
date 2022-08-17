import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

//Schema imports
// import { User } from 'src/users/schemas/user.schema';
import { Card } from './card.schema';

export type DeleteTokenDocument = DeleteToken & Document;

@Schema()
export class DeleteToken {
  @Prop()
  deleteToken: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Card' })
  card: Card;

  @Prop({ required: true, default: false })
  tokenUsed: boolean;
}

export const DeleteTokenSchema = SchemaFactory.createForClass(DeleteToken);
