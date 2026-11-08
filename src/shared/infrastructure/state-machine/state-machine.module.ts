import { Global, Module } from '@nestjs/common';
import { StateMachineEnginePort } from '@/shared/domain/ports/state-machine-engine.port';
import { XStateEngineAdapter } from './xstate-engine.adapter';

@Global()
@Module({
  providers: [
    XStateEngineAdapter,
    {
      provide: StateMachineEnginePort,
      useExisting: XStateEngineAdapter,
    },
  ],
  exports: [StateMachineEnginePort, XStateEngineAdapter],
})
export class StateMachineModule {}

