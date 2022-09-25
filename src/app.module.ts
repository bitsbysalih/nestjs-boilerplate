import { Logger, Module } from '@nestjs/common';
import * as path from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { StripeController } from './stripe/stripe.controller';
import { StripeService } from './stripe/stripe.service';
import { StripeModule } from './stripe/stripe.module';
import { CardService } from './card/card.service';
import { CardController } from './card/card.controller';
import { CardModule } from './card/card.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

//Config imports
import appConfig from './config/app.config';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import authConfig from './config/auth.config';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';

import { StorageService } from './storage/storage.service';
import stripeConfig from './config/stripe.config';
import mailConfig from './config/mail.config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, stripeConfig, mailConfig],
      envFilePath: ['.env'],
    }),
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
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('app.fallbackLanguage'),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService) => {
            return configService.get('app.headerLanguage');
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    StripeModule,
    CardModule,
    MailModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    StripeController,
    CardController,
  ],
  providers: [
    AppService,
    PrismaService,
    AuthService,
    UserService,
    StripeService,
    CardService,
    MailService,
    StorageService,
    Logger,
  ],
})
export class AppModule {}
