import { QUEUE_NAMES } from '@/shared/infrastructure/queues/queues.constants';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PersonEmail } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-email';
import { UserName } from '@/modules/iam/domain/value-objects/user/user-value-object/user-name';
import { ImplAuthPort } from '@/modules/iam/infrastructure/persistence/auth/auth-port-implementation/impl-auth.port';
import { PinoLogger } from 'nestjs-pino';

@Processor(QUEUE_NAMES.SEND_EMAIL_CHANGE_CONFIRMATION)
export class EmailChangeProcessor extends WorkerHost {
  constructor(
    private readonly emailService: ImplAuthPort,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(EmailChangeProcessor.name);
  }

  async process(
    job: Job<{
      email: string;
      user_name: string;
      verificationToken: { id: string; token: string };
    }>,
  ) {
    try {
      const { email, user_name, verificationToken } = job.data;
      await this.emailService.sendEmailChangeConfirmation(
        new PersonEmail(email),
        new UserName(user_name),
        verificationToken,
      );
    } catch (error) {
      // Log only error name + message — never job.data containing tokens
      this.logger.error(
        {
          jobId: job.id,
          jobName: job.name,
          attemptsMade: job.attemptsMade,
          errorName: error instanceof Error ? error.name : 'UnknownError',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        },
        'Failed to process email change confirmation job',
      );
      throw error;
    }
  }
}

