import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';

import { AuthService } from './auth.service';
import { StorageService } from '../storage/storage.service';
import { StripeService } from '../stripe/stripe.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
        signOptions: {
          expiresIn: configService.get('auth.expires'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
    StorageService,
    StripeService,
    MailService,
    Logger,
  ],
  exports: [AuthService],
})
export class AuthModule {}
