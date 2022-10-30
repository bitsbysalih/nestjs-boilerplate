import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { join } from 'path';
import * as requestIp from 'request-ip';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://card-viewer.vercel.app',
      'https://sailspad-card-viewer-bitsbysalih.vercel.app',
      'https://sailspad-card-viewer.vercel.app',
      'https://sailspad-client-dev.vercel.app',
      'https://www.sailspad.com',
      'https://cards.sailspad.com',
      'https://app.sailspad.com',
      'https://ebc.sailspad.com',
    ],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const configService = app.get(ConfigService);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();
  app.setGlobalPrefix(configService.get('app.apiPrefix'), {
    exclude: ['/'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.use(requestIp.mw());

  //   app.use(
  //     helmet({
  //       contentSecurityPolicy: {
  //         directives: {
  //           defaultSrc: [`'self'`],
  //           styleSrc: [
  //             `'self'`,
  //             `'unsafe-inline'`,
  //             'cdn.jsdelivr.net',
  //             'fonts.googleapis.com',
  //             'img.icons8.com',
  //           ],
  //           fontSrc: [`'self'`, 'fonts.gstatic.com'],
  //           imgSrc: [
  //             `'self'`,
  //             'data:',
  //             'cdn.jsdelivr.net',
  //             'img.icons8.com',
  //             'sailspad.fra1.digitaloceanspaces.com',
  //             'res.cloudinary.com',
  //           ],
  //           scriptSrc: [
  //             `'self'`,
  //             `https: 'unsafe-inline'`,
  //             `cdn.jsdelivr.net`,
  //             'img.icons8.com',
  //           ],
  //         },
  //       },
  //     }),
  //   );

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);
  await app.listen(configService.get('app.port'));
}
bootstrap();
