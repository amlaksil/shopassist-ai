import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const corsOrigin = String(process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors:
      corsOrigin.length > 0
        ? {
            origin: corsOrigin,
            methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: false
          }
        : true
  });
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.set('trust proxy', 1);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`ShopAssist AI backend listening on http://0.0.0.0:${port}/api`);

  if (corsOrigin.length > 0) {
    logger.log(`CORS origin allowlist enabled for: ${corsOrigin.join(', ')}`);
  } else {
    logger.warn('CORS origin allowlist not set. Falling back to permissive CORS.');
  }
}

void bootstrap();
