import { Injectable } from '@nestjs/common';
import { createMachine, getNextSnapshot } from 'xstate';
import {
  StateEvent,
  StateMachineDefinition,
  StateMachineEnginePort,
} from '@/shared/domain/ports/state-machine-engine.port';
import { InvalidStateTransitionException } from '@/shared/domain/exceptions/invalid-state-transition.exception';

@Injectable()
export class XStateEngineAdapter extends StateMachineEnginePort {
  private readonly machineCache = new Map<string, ReturnType<typeof createMachine>>();

  constructor() {
    super();
    StateMachineEnginePort.registerEngine(this);
  }

  public transition<S extends string, E extends string>(
    definition: StateMachineDefinition<S, E>,
    currentState: S,
    event: StateEvent<E>,
  ): S {
    let machine = this.machineCache.get(definition.id);
    if (!machine) {
      machine = createMachine({
        id: definition.id,
        initial: definition.initial,
        states: definition.states,
      });
      this.machineCache.set(definition.id, machine);
    }

    const actorState = machine.resolveState({
      value: currentState,
    });

    if (!actorState.can(event)) {
      throw new InvalidStateTransitionException(currentState, event.type);
    }

    const nextSnapshot = getNextSnapshot(machine, actorState, event);
    return definition.parseState(nextSnapshot.value);
  }
}

export const defaultXStateEngineAdapter = new XStateEngineAdapter();

