import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { MailSenderModule } from 'src/mail-sender/mail-sender.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import config from '../config';

//Schema imports
import { Card, CardSchema } from './schemas/card.schema';
import { Marker, MarkerSchema } from './schemas/marker.schema';
import { EditToken, EditTokenSchema } from './schemas/edit-token.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import {
  DeleteToken,
  DeleteTokenSchema,
} from './schemas/deletion-token.schema';
import {
  EmailEditToken,
  EmailEditTokenSchema,
} from './schemas/email-edit-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }]),
    MongooseModule.forFeature([{ name: Marker.name, schema: MarkerSchema }]),
    MongooseModule.forFeature([
      { name: EditToken.name, schema: EditTokenSchema },
    ]),
    MongooseModule.forFeature([
      { name: DeleteToken.name, schema: DeleteTokenSchema },
    ]),
    MongooseModule.forFeature([
      { name: EmailEditToken.name, schema: EmailEditTokenSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.jwt.secretOrKey,
      signOptions: {
        expiresIn: config.jwt.expiresIn,
      },
    }),

    MailSenderModule,
  ],
  providers: [CardsService],
  controllers: [CardsController],
  exports: [CardsModule, CardsService],
})
export class CardsModule {}
