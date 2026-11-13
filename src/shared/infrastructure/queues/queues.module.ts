import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardAuthMiddleware } from '@/shared/infrastructure/http/middleware/bull-board-auth.middleware';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        if (isProduction) {
          return {
            connection: {
              url: configService.get<string>('REDIS_URL'),
            },
          };
        }
        const password = configService.get<string>('REDIS_PASSWORD');
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            ...(password ? { password } : {}),
          },
        };
      },
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
      middleware: BullBoardAuthMiddleware,
    }),
  ],
  providers: [BullBoardAuthMiddleware],
  exports: [BullModule, BullBoardModule],
})
export class QueuesModule {}
