import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CatalogCacheService } from './catalog-cache.service';
import { CatalogCachePort } from '@/shared/application/ports/catalog-cache.port';
import { Logger } from '@nestjs/common';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        const password = configService.get<string>('REDIS_PASSWORD');
        const redisUrl =
          configService.get<string>('NODE_ENV') === 'production'
            ? configService.get<string>('REDIS_URL')
            : password
              ? `redis://:${password}@${host}:${port}`
              : `redis://${host}:${port}`;
        const keyvRedis = new KeyvRedis(redisUrl);
        const logger = new Logger('template-project:redis');

        keyvRedis.client.on('connect', () => {
          logger.log('Redis connected successfully');
        });

        keyvRedis.client.on('close', () => {
          logger.log('Redis connection closed');
        });

        keyvRedis.client.on('error', (err: unknown) => {
          logger.error('Redis connection error', err);
        });
        return {
          stores: [keyvRedis],
        };
      },
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: CatalogCachePort,
      useClass: CatalogCacheService,
    },
  ],
  exports: [CacheModule, CatalogCachePort],
})
export class RedisCacheModule {}
