import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/shared/infrastructure/db/prisma.module';
import { LoggerModule } from 'nestjs-pino';
import { IdempotencyMiddleware } from '@/shared/infrastructure/http/middleware/idempotency.middleware';
import { TransactionInterceptor } from '@/shared/infrastructure/interceptors/transaction.interceptor';
import { validate } from '@/shared/infrastructure/config/env.validation';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RequestIdMiddleware } from '@/shared/infrastructure/http/middleware/request-id.middleware';

import { EventsModule } from '@/shared/infrastructure/events/events.module';
import {
  appConfig,
  databaseConfig,
  emailConfig,
  jwtConfig,
  redisConfig,
  throttlerConfig,
} from '@/shared/infrastructure/config/configs';
import { RedisCacheModule } from '@/shared/infrastructure/cache/cache.module';
import { QueuesModule } from '@/shared/infrastructure/queues/queues.module';
import { HealthModule } from '@/shared/infrastructure/health/health.module';
import { CatalogsModule } from '@/modules/catalogs/catalogs.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { IamModule } from '@/modules/iam/iam.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { DocsAuthMiddleware } from '@/shared/infrastructure/http/middleware/docs-auth.middleware';
import { BullBoardAuthMiddleware } from '@/shared/infrastructure/http/middleware/bull-board-auth.middleware';
import { AuditableInterceptor } from '@/modules/audit/infrastructure/interceptors/auditable.interceptor';
import { JwtPassportAuthGuard } from '@/modules/iam/infrastructure/guards/jwt-passport-auth.guard';
import { PermissionsGuard } from '@/modules/iam/infrastructure/guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validate,
      load: [
        appConfig,
        databaseConfig,
        emailConfig,
        jwtConfig,
        redisConfig,
        throttlerConfig,
      ],
    }),
    PrismaModule,
    EventsModule,
    RedisCacheModule,
    QueuesModule,
    HealthModule,
    CatalogsModule,
    StorageModule,
    AuditModule,
    IamModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: config.get<number>('THROTTLE_GLOBAL_TTL')!,
            limit: config.get<number>('THROTTLE_GLOBAL_LIMIT')!,
          },
          {
            // Named throttler 'login' — only applies to routes that opt in via
            // @Throttle({ login: {...} }). Driven by env (THROTTLE_LOGIN_*).
            name: 'login',
            ttl: config.get<number>('THROTTLE_LOGIN_TTL')!,
            limit: config.get<number>('THROTTLE_LOGIN_LIMIT')!,
          },
        ],
      }),
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level:
            config.get<string>('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport:
            config.get<string>('NODE_ENV') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true },
                }
              : undefined,
          genReqId: (req: import('http').IncomingMessage) => {
            const id = Reflect.get(req, 'id');
            return typeof id === 'string' ? id : 'unknown';
          },
          autoLogging: true,
          quietReqLogger: false,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
              'req.body.password',
              'req.body.new_password',
              'req.body.old_password',
              'req.body.token',
              'req.body.refresh_token',
              'password',
              'token',
              'refresh_token',
              'accessToken',
              'access_token',
            ],
            censor: '[REDACTED]',
            remove: false,
          },
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditableInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtPassportAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
    consumer
      .apply(IdempotencyMiddleware)
      .forRoutes(
        { path: '*path', method: RequestMethod.POST },
        { path: '*path', method: RequestMethod.PUT },
      );

    const enableApiDocs =
      this.configService.get<boolean>('ENABLE_API_DOCS') === true;

    if (enableApiDocs) {
      consumer
        .apply(DocsAuthMiddleware)
        .forRoutes(
          { path: 'docs', method: RequestMethod.ALL },
          { path: 'api/docs', method: RequestMethod.ALL },
          { path: 'api/docs-json', method: RequestMethod.ALL },
        );
    }

    consumer
      .apply(BullBoardAuthMiddleware)
      .forRoutes(
        { path: 'admin/queues', method: RequestMethod.ALL },
        { path: 'admin/queues/*path', method: RequestMethod.ALL },
      );
  }
}
