import { Module } from '@nestjs/common';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';
import { EventsModule } from '@/shared/infrastructure/events/events.module';
import { NestEventDispatcherAdapter } from './nest-event-dispatcher.adapter';

@Module({
  imports: [EventsModule],
  providers: [
    {
      provide: EventDispatcherPort,
      useClass: NestEventDispatcherAdapter,
    },
  ],
  exports: [EventDispatcherPort],
})
export class EventDispatcherModule {}
