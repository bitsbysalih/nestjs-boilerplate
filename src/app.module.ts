import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import config from './config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

//Controller imports
import { AuthenticationController } from './authentication/authentication.controller';

//Module imports
import { UsersModule } from './users/users.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { MailSenderModule } from './mail-sender/mail-sender.module';
import { CardsModule } from './cards/cards.module';

//Schema imports
import { User, UserSchema } from './users/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './authentication/schemas/refresh-token.schema';

//Service imports
import { AuthenticationService } from './authentication/authentication.service';

//Guards imports
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { StripeService } from './stripe/stripe.service';
import { StripeModule } from './stripe/stripe.module';

import {
  StripeEvent,
  StripeEventSchema,
} from './stripe/schemas/stripe-event.schema';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 50,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    MongooseModule.forFeature([
      { name: StripeEvent.name, schema: StripeEventSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.jwt.secretOrKey,
      signOptions: {
        expiresIn: config.jwt.expiresIn,
      },
    }),
    AuthenticationModule,
    UsersModule,
    CardsModule,
    MailSenderModule,
    StripeModule,
  ],
  controllers: [AppController, AuthenticationController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    AppService,
    AuthenticationService,
    StripeService,
  ],
})
export class AppModule {}
