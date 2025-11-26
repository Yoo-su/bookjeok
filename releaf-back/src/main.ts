import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CLIENT_DOMAIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  });

  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableShutdownHooks();

  const dataSource = app.get(DataSource);

  app
    .getHttpAdapter()
    .getInstance()
    .on('close', async () => {
      console.log('Server is closing, closing database connection...');
      if (dataSource.isInitialized) {
        await dataSource.destroy();
        console.log('Database connection closed.');
      }
    });

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
