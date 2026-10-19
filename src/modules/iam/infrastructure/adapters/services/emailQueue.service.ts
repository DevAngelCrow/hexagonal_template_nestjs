import { Queue } from 'bullmq';
import { EmailSenderPort } from '@/modules/iam/domain/ports/email-sender.port';
import { UserName } from '@/modules/iam/domain/value-objects/user/user-value-object/user-name';
import { PersonEmail } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-email';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@/shared/infrastructure/queues/queues.constants';
import { Injectable } from '@nestjs/common';
@Injectable()
export class EmailQueueService implements EmailSenderPort {
  constructor(
    @InjectQueue(QUEUE_NAMES.SEND_EMAIL_VERIFICATION)
    private readonly emailVerificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SEND_PASSWORD_RESET)
    private readonly passwordResetQueue: Queue,
  ) {}
  async sendForgottenPasswordEmail(
    email: PersonEmail,
    user_name: UserName,
    verificationToken: { id: string; token: string },
  ): Promise<void> {
    try {
      await this.passwordResetQueue.add(
        'send-forgotten-password-email',
        {
          email: email.value(),
          user_name: user_name.value(),
          verificationToken,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: { count: 100 },
        },
      );
    } catch (error) {
      console.error('Failed to enqueue password reset email job:', error);
    }
  }
  async sendVerificationEmail(
    email: PersonEmail,
    user_name: UserName,
    verificationToken: { id: string; token: string },
  ): Promise<void> {
    try {
      await this.emailVerificationQueue.add(
        'send-verification-email',
        {
          email: email.value(),
          user_name: user_name.value(),
          verificationToken,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: { count: 100 },
        },
      );
    } catch (error) {
      console.error('Failed to enqueue email job:', error);
    }
  }
}
