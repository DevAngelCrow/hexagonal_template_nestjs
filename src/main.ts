import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { HttpExceptionFilter } from '@/shared/infrastructure/http/filters/http-exception.filter';
import { ThrottlerExceptionFilter } from '@/shared/infrastructure/http/filters/throttler-exception.filter';
import { BigIntTransformInterceptor } from '@/shared/infrastructure/interceptors/bigint-transform.interceptor';
import { setupSecurity } from '@/shared/infrastructure/setup/security.setup';
import { setupSwagger } from '@/shared/infrastructure/setup/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger))
  const configService = app.get(ConfigService);
  const enableApiDocs = configService.get<boolean>('ENABLE_API_DOCS') === true;
  const port = configService.get<number>('PORT') ?? 3000;
  const appUrl = configService.get<string>('APP_URL');

  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ limit: '50kb', extended: true }));

  setupSecurity(app, configService);

  app.setGlobalPrefix('api', {
    exclude: enableApiDocs
      ? [
        'docs',
        'api/docs',
        'api/docs-json',
        'metrics',
        'admin/queues',
        'admin/queues/{*path}',
      ]
      : ['metrics', 'admin/queues', 'admin/queues/{*path}'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(configService),
    new ThrottlerExceptionFilter(),
  );

  app.useGlobalInterceptors(new BigIntTransformInterceptor());

  if (enableApiDocs) {
    setupSwagger(app, configService);
  }

  app.enableShutdownHooks();
  const shutdown = (signal: string) => {
    void app
      .close()
      .catch((err) => {
        console.error(`Error during shutdown on ${signal}:`, err);
        process.exit(1);
      })
      .then(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  const server = await app.listen(port);
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  const logger = app.get(Logger);
  logger.log(`Application is running on: ${appUrl}`);
  if (enableApiDocs) {
    logger.log(`Swagger UI: ${appUrl}/api/docs`);
    logger.log(`Scalar Docs: ${appUrl}/docs`);
  }
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
