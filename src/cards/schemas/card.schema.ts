import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

//Schema imports
import { User } from 'src/users/schemas/user.schema';
import { Marker } from './marker.schema';

export type CardDocument = Card & Document;

@Schema({
  timestamps: true,
})
export class Card {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  title: string;

  @Prop({
    required: true,
    default:
      'https://ebc-markers-and-images.s3.eu-central-1.amazonaws.com/images/mojtaba-mosayebzadeh-WvFy1eFAxjM-unsplash.jpg',
  })
  cardImage: string;

  @Prop({
    required: true,
    default: {
      markerImageLink:
        'https://ebc-markers-and-images.s3.eu-central-1.amazonaws.com/marker-images/tavin-dotson-WC4IWN3-fSo-unsplash.jpg',
      markerFileLink:
        'https://ebc-markers-and-images.s3.eu-central-1.amazonaws.com/markers/targets+(3).mind',
    },
  })
  marker: Marker;

  @Prop({ required: true })
  about: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, unique: true })
  shortName: string;

  @Prop({ required: true, unique: true })
  uniqueId: string;

  @Prop()
  logoImageUrl: string;

  @Prop()
  links: [
    {
      name: string;
      link: string;
    },
  ];

  @Prop({ required: true, default: false })
  activeStatus: boolean;

  @Prop({ required: true, default: true })
  editable: boolean;

  @Prop({ required: true, default: 0 })
  numberOfEdits: number;

  @Prop({ required: true })
  editableUntil: Date;

  @Prop({ required: true, default: false })
  deleted: boolean;

  @Prop({ required: true })
  dateTillDeletion: Date;

  @Prop({ required: true, default: false })
  deleteable: boolean;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  user: User;

  @Prop()
  emailEditable: boolean;

  @Prop()
  cardBackground: String;
}

export const CardSchema = SchemaFactory.createForClass(Card);
