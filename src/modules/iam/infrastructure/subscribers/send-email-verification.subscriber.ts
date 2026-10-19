import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { UserRegisteredDomainEvent } from '@/modules/iam/domain/events/user-registered.domain-event';
import { QUEUE_NAMES } from '@/shared/infrastructure/queues/queues.constants';

@EventsHandler(UserRegisteredDomainEvent)
export class SendEmailVerificationSubscriber
  implements IEventHandler<UserRegisteredDomainEvent>
{
  private readonly logger = new Logger(SendEmailVerificationSubscriber.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.SEND_EMAIL_VERIFICATION)
    private readonly emailQueue: Queue,
  ) {}

  async handle(event: UserRegisteredDomainEvent): Promise<void> {
    this.logger.log(
      `Disparando encolamiento de email de verificación para usuario: ${event.userName} (${event.userId})`,
    );

    try {
      await this.emailQueue.add(
        'send_email_verification',
        {
          userId: event.userId,
          email: event.email,
          userName: event.userName,
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
        `Error al encolar email de verificación para ${event.email}: ${(error as Error).message}`,
      );
    }
  }
}
