import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';

export interface StateEvent<E extends string> {
  readonly type: E;
}

export type StateNodeDefinition<S extends string, E extends string> = {
  readonly on?: {
    readonly [K in E]?: { readonly target: S };
  };
  readonly type?: 'final';
};

export type StatesMapDefinition<S extends string, E extends string> = {
  readonly [K in S]: StateNodeDefinition<S, E>;
};

export class StateMachineDefinition<S extends string, E extends string> {
  private readonly validStates: ReadonlySet<S>;

  constructor(
    public readonly id: string,
    public readonly initial: S,
    public readonly statesList: readonly S[],
    public readonly states: StatesMapDefinition<S, E>,
  ) {
    this.validStates = new Set<S>(statesList);
  }

  public parseState(rawState: unknown): S {
    if (typeof rawState === 'string') {
      for (const state of this.validStates) {
        if (state === rawState) {
          return state;
        }
      }
    }
    throw new InvalidValueObjectException(
      `${this.id}State`,
      `Estado inválido "${String(rawState)}" para la máquina "${this.id}"`,
    );
  }
}

export abstract class StateMachineEnginePort {
  private static activeEngine: StateMachineEnginePort | null = null;

  public static registerEngine(engine: StateMachineEnginePort): void {
    StateMachineEnginePort.activeEngine = engine;
  }

  public static getEngine(): StateMachineEnginePort {
    if (!StateMachineEnginePort.activeEngine) {
      throw new Error(
        'StateMachineEnginePort no ha sido inicializado. Registre XStateEngineAdapter en la capa de infraestructura.',
      );
    }
    return StateMachineEnginePort.activeEngine;
  }

  abstract transition<S extends string, E extends string>(
    definition: StateMachineDefinition<S, E>,
    currentState: S,
    event: StateEvent<E>,
  ): S;
}

