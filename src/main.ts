import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as requestIp from 'request-ip';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import rawBodyMiddleware from './stripe/raw-body.middleware';

async function bootstrap() {
  const port = process.env.PORT || 8080;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://www.sailspad.com',
      'https://cards.sailspad.com',
      'https://app.sailspad.com',
      'https://ebc.sailspad.com',
    ],
  });

  app.use(rawBodyMiddleware());
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use(requestIp.mw());

  //   Helmet Middleware against known security vulnerabilities
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [
            `'self'`,
            `'unsafe-inline'`,
            'cdn.jsdelivr.net',
            'fonts.googleapis.com',
            'img.icons8.com',
          ],
          fontSrc: [`'self'`, 'fonts.gstatic.com'],
          imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net', 'img.icons8.com'],
          scriptSrc: [
            `'self'`,
            `https: 'unsafe-inline'`,
            `cdn.jsdelivr.net`,
            'img.icons8.com',
          ],
        },
      },
    }),
  );

  // Swagger API Documentation
  const options = new DocumentBuilder()
    .setTitle('Beyin API')
    .setDescription('API for the EBC platform and other Beyin Apps')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
}
bootstrap();
