import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

//Global files
import config from '../config';
import { JwtStrategy } from './jwt.strategy';

//Controller imports
import { AuthenticationController } from '../authentication/authentication.controller';

//Service imports
import { AuthenticationService } from '../authentication/authentication.service';
import { MongooseModule } from '@nestjs/mongoose';

//Schema imports
import { User, UserSchema } from 'src/users/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';

//Module imports
import { MailSenderModule } from 'src/mail-sender/mail-sender.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.jwt.secretOrKey,
      signOptions: {
        expiresIn: config.jwt.expiresIn,
      },
    }),
    MailSenderModule,
    StripeModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthenticationModule {}
