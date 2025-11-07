import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.use(helmet());
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  Logger.log(`API listening on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  Logger.error(error, 'Bootstrap');
  process.exit(1);
});
