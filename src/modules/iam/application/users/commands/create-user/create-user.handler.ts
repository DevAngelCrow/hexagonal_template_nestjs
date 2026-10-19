import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@/modules/iam/domain/repositories/user-repository';
import { CreateUserCommand } from '@/modules/iam/application/users/commands/create-user/create-user.command';
import { User } from '@/modules/iam/domain/aggregates/user.aggregate';
import { PasswordHasherPort } from '@/modules/iam/domain/ports/password-hasher.port';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly repository: UserRepository,
    private readonly dispatcher: EventDispatcherPort,
    private readonly passwordHasherPort: PasswordHasherPort,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const hashedPassword = await this.passwordHasherPort.hash(
      command.user_dto.password,
    );

    const userDto = { ...command.user_dto, password: hashedPassword };
    const user = User.create(userDto);

    const createdUser = await this.repository.create(user);
    createdUser.created();

    await this.dispatcher.dispatch(createdUser.getDomainEvents());
    createdUser.clearDomainEvents();

    return createdUser;
  }
}
