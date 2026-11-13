import { createHash, timingSafeEqual } from 'node:crypto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfirmEmailChangeCommand } from '@/modules/iam/application/auth/commands/email-change/confirm-email-change.command';
import { EmailChangeTokenPort } from '@/modules/iam/application/auth/ports/email-change-token.port';
import { PersonRepository } from '@/modules/iam/domain/repositories/person.repository';
import { AuthReadPort } from '@/modules/iam/application/auth/ports/auth-read.port';
import { PersonId } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-id';
import { PersonEmail } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-email';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';

const DEFAULT_ACCESS_TOKEN_BLACKLIST_SECONDS = 86_400;

@CommandHandler(ConfirmEmailChangeCommand)
export class ConfirmEmailChangeHandler
  implements ICommandHandler<ConfirmEmailChangeCommand>
{
  constructor(
    private readonly emailChangeTokenPort: EmailChangeTokenPort,
    private readonly personRepository: PersonRepository,
    private readonly authReadPort?: AuthReadPort,
  ) {}

  async execute(command: ConfirmEmailChangeCommand): Promise<void> {
    const challenge = await this.emailChangeTokenPort.findChallengeById(
      command.id,
    );
    if (!challenge) {
      throw new BadRequestException('Invalid or expired email change token');
    }

    if (new Date() > new Date(challenge.expires_at)) {
      await this.emailChangeTokenPort.deleteChallenge(
        challenge.id,
        challenge.user_id,
      );
      throw new BadRequestException('Email change token has expired');
    }

    const incomingDigest = createHash('sha256').update(command.token).digest();
    const expectedDigest = Buffer.from(challenge.token_hash, 'hex');
    const tokensMatch =
      incomingDigest.length === expectedDigest.length &&
      timingSafeEqual(incomingDigest, expectedDigest);

    if (!tokensMatch) {
      throw new BadRequestException('Invalid or expired email change token');
    }

    const newEmail = new PersonEmail(challenge.new_email);
    const existingOwner = await this.personRepository.getOneByEmail(newEmail);
    if (existingOwner && existingOwner.getId()?.value() !== challenge.person_id) {
      await this.emailChangeTokenPort.deleteChallenge(
        challenge.id,
        challenge.user_id,
      );
      throw new ConflictException(
        'The requested email address is already associated with another account.',
      );
    }

    await this.personRepository.updateEmail(
      new PersonId(challenge.person_id),
      newEmail,
    );
    await this.emailChangeTokenPort.deleteChallenge(
      challenge.id,
      challenge.user_id,
    );

    if (this.authReadPort) {
      await this.authReadPort.closeSession({ id: challenge.user_id });
      await this.authReadPort.blacklistAccessToken(
        challenge.user_id,
        Math.floor(Date.now() / 1000) + DEFAULT_ACCESS_TOKEN_BLACKLIST_SECONDS,
      );
    }
  }
}

