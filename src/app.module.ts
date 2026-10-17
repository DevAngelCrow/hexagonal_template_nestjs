import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/shared/infrastructure/db/prisma.module';
import { LoggerModule } from 'nestjs-pino';
//import { RequestIdMiddleware } from '@/shared/infrastructure/http/middleware/request-id.middleware';
import { IdempotencyMiddleware } from '@/shared/infrastructure/http/middleware/idempotency.middleware';
import { TransactionInterceptor } from '@/shared/infrastructure/interceptors/transaction.interceptor';
import { validate } from './shared/infrastructure/config/env.validation';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RequestIdMiddleware } from './shared/infrastructure/http/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validate,
      load: [
      ],
    }),
    PrismaModule,
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
    // Exposes /metrics with default Node process metrics (heap, gc, event loop).
    // Uses a custom controller (see MetricsController) so the route opts out of
    // global URI versioning and the JWT auth guard. The endpoint is
    // unauthenticated — network isolation lives at the reverse-proxy / network
    // policy layer, not in this app.
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
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionInterceptor,
    },
    // {
    //   // Reads @Auditable metadata on handlers and writes to mnt_audit_log on
    //   // success. No-op for handlers without the decorator, so the cost on
    //   // unaudited routes is a single reflector lookup.
    //   provide: APP_INTERCEPTOR,
    //   useClass: AuditableInterceptor,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtPassportAuthGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: PermissionsGuard,
    // },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
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
  }
}
