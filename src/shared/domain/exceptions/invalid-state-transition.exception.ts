import { DomainException } from './domain.exception';

export class InvalidStateTransitionException extends DomainException {
  constructor(currentState: string, event: string) {
    super(
      `Transición inválida: No se puede ejecutar el evento "${event}" desde el estado "${currentState}".`,
      'INVALID_STATE_TRANSITION',
    );
    this.name = 'InvalidStateTransitionException';
  }
}

