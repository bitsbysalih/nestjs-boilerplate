import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  _id: string;
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, default: ['basic'] })
  role: string[];

  @Prop()
  apiKey: string;

  @Prop()
  emailVerification: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  dateOfBirth: string;

  @Prop({ required: true, default: false })
  verified: boolean;

  @Prop({ required: true, default: 0 })
  cardSlots: number;

  @Prop()
  stripeCustomerId: string;

  @Prop()
  otpToken: string;

  @Prop({ requred: true, default: 0 })
  availableCardSlots: number;

  @Prop()
  monthlySubscriptionStatus: string;

  @Prop()
  subscriptionId: string;

  @Prop()
  subscriptionType: string;

  @Prop()
  signUpStep: number;

  @Prop()
  subscriptionCycle: string;

  @Prop()
  profilePhotoUrl: string;

  @Prop()
  jobTitle: string;

  @Prop()
  links: [
    {
      name: string;
      link: string;
    },
  ];

  @Prop()
  subscriptionEndDate: Date;

  @Prop({ default: 0 })
  manuallyAddedSlots: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
