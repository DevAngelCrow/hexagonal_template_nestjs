import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';
import { MetricsPort } from '@/shared/application/ports/metrics.port';
import { PrometheusMetricsAdapter } from './prometheus-metrics.adapter';

@Global()
@Module({
  imports: [TerminusModule],
  controllers: [HealthController, MetricsController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    {
      provide: MetricsPort,
      useClass: PrometheusMetricsAdapter,
    },
  ],
  exports: [MetricsPort],
})
export class HealthModule {}
