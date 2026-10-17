import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventPublisherPort } from '@/shared/application/ports/event-publisher.port';
import { TransactionAwareEventPublisher } from './transaction-aware-event-publisher';
import { DateProviderPort } from '@/shared/application/ports/date-provider.port';
import { DayjsDateAdapter } from '@/shared/infrastructure/services/dayjs-date.adapter';
import { LoggerPort } from '@/shared/application/ports/logger.port';
import { PinoLoggerAdapter } from '@/shared/infrastructure/adapters/pino-logger.adapter';

@Global()
@Module({
  imports: [CqrsModule.forRoot()],
  providers: [
    {
      provide: EventPublisherPort,
      useClass: TransactionAwareEventPublisher,
    },
    {
      provide: DateProviderPort,
      useClass: DayjsDateAdapter,
    },
    {
      provide: LoggerPort,
      useClass: PinoLoggerAdapter,
    },
  ],
  exports: [CqrsModule, EventPublisherPort, DateProviderPort, LoggerPort],
})
export class EventsModule {}
