import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { AVExceptionFilter } from './infra/filters/exception.filter';
import helmet from 'helmet';
import { init as SentryInit } from '@sentry/node';
import hpp from 'hpp';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  SentryInit({
    dsn: process.env.SENTRY_DNS,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV !== 'local',
  });
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.use(helmet());
  app.use(hpp());
  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalFilters(new AVExceptionFilter());

  await app.listen(3000);
}
bootstrap();
