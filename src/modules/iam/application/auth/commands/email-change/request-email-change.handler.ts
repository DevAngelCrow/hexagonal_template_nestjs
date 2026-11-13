import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RequestEmailChangeCommand } from '@/modules/iam/application/auth/commands/email-change/request-email-change.command';
import { UserReadRepository } from '@/modules/iam/application/repositories/user-read.repository';
import { PersonRepository } from '@/modules/iam/domain/repositories/person.repository';
import { PasswordHasherPort } from '@/modules/iam/domain/ports/password-hasher.port';
import { EmailSenderPort } from '@/modules/iam/domain/ports/email-sender.port';
import { EmailChangeTokenPort } from '@/modules/iam/application/auth/ports/email-change-token.port';
import { PersonEmail } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-email';
import { UserName } from '@/modules/iam/domain/value-objects/user/user-value-object/user-name';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { UnauthorizedException } from '@/shared/application/exceptions/unauthorized.exception';

const EMAIL_CHANGE_TTL_MS = 15 * 60 * 1000;

@CommandHandler(RequestEmailChangeCommand)
export class RequestEmailChangeHandler
  implements ICommandHandler<RequestEmailChangeCommand>
{
  constructor(
    private readonly userReadRepository: UserReadRepository,
    private readonly personRepository: PersonRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly emailChangeTokenPort: EmailChangeTokenPort,
    private readonly emailSenderPort: EmailSenderPort,
  ) {}

  async execute(command: RequestEmailChangeCommand): Promise<void> {
    const user = await this.userReadRepository.getOneById(command.user_id);
    if (!user) {
      throw new NotFoundException('User', command.user_id);
    }

    const passwordMatches = await this.passwordHasher.compare(
      command.current_password,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid current password');
    }

    const normalizedEmail = new PersonEmail(
      command.new_email.trim().toLowerCase(),
    );

    if (user.email && user.email.trim().toLowerCase() === normalizedEmail.value()) {
      throw new BadRequestException(
        'New email must be different from your current email address',
      );
    }

    const existingOwner =
      await this.personRepository.getOneByEmail(normalizedEmail);
    if (existingOwner && existingOwner.getId()?.value() !== user.id_people) {
      throw new ConflictException(
        'The requested email address is already associated with another account.',
      );
    }

    const challengeId = randomUUID();
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await this.emailChangeTokenPort.saveChallenge(
      {
        id: challengeId,
        user_id: command.user_id,
        person_id: user.id_people,
        new_email: normalizedEmail.value(),
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + EMAIL_CHANGE_TTL_MS).toISOString(),
      },
      EMAIL_CHANGE_TTL_MS,
    );

    await this.emailSenderPort.sendEmailChangeConfirmation(
      normalizedEmail,
      new UserName(user.user_name),
      { id: challengeId, token: rawToken },
    );
  }
}

