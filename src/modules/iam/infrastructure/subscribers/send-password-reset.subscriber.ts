import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { UserPasswordResetDomainEvent } from '../../domain/events/user-password-reset.domain-event';
import { QUEUE_NAMES } from '@/shared/infrastructure/queues/queues.constants';

@EventsHandler(UserPasswordResetDomainEvent)
export class SendPasswordResetSubscriber
  implements IEventHandler<UserPasswordResetDomainEvent>
{
  private readonly logger = new Logger(SendPasswordResetSubscriber.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.SEND_PASSWORD_RESET)
    private readonly passwordResetQueue: Queue,
  ) {}

  async handle(event: UserPasswordResetDomainEvent): Promise<void> {
    this.logger.log(
      `Disparando encolamiento de restablecimiento de contraseña para ${event.email}`,
    );

    try {
      await this.passwordResetQueue.add(
        'send_password_reset',
        {
          userId: event.userId,
          email: event.email,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Error al encolar reset de contraseña para ${event.email}: ${(error as Error).message}`,
      );
    }
  }
}
