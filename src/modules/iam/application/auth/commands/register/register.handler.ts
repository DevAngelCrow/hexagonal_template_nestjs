import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MetricsPort } from '@/shared/application/ports/metrics.port';
import { CreateUserService } from '@/modules/iam/application/users/services/create-user.service';
import { PersonCreateService } from '@/modules/iam/application/profile/services/person/person-create.service';
import { PersonGetOneByEmailService } from '@/modules/iam/application/profile/services/person/person-get-one-by-email.service';
import { CreateUserRoleService } from '@/modules/iam/application/security/services/user-role/create-user-role.service';
import { GetGlobalStatusByCodeService } from '@/modules/catalogs/application/services/global-status/get-global-status-by-code.service';
import { GetRoleByCodeService } from '@/modules/iam/application/security/services/user-role/get-rol-by-code.service';
import { RegisterCommand } from '@/modules/iam/application/auth/commands/register/register.command';
import {
  MultipleStatusCode,
  CategoryStatus,
} from '@/shared/domain/enums/multiple-status';
import { PersonDto } from '@/modules/iam/application/profile/dtos/person.dto';
import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';
import { UserRolDto } from '@/modules/iam/application/security/dtos/user-rol.dto';
import { SendVerificationEmailCommand } from '@/modules/iam/application/auth/commands/send-verification-email/send-verification-email.command';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { DomainException } from '@/shared/domain/exceptions/domain.exception';
import { ErrorCode } from '@/shared/domain/enums/error-code.enum';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    private readonly userCreateService: CreateUserService,
    private readonly personCreateService: PersonCreateService,
    private readonly personGetOneByEmail: PersonGetOneByEmailService,
    private readonly commandBus: CommandBus,
    private readonly userRoleCreateService: CreateUserRoleService,
    private readonly getGlobalStatusByCode: GetGlobalStatusByCodeService,
    private readonly getRoleByCode: GetRoleByCodeService,
    private readonly metrics?: MetricsPort,
  ) {}
  async execute(command: RegisterCommand): Promise<void> {
    // 0. Verificar rol antes de iniciar (fail fast — evita enviar emails con tokens que se pierden en rollback)
    const roleUnverified = await this.getRoleByCode.run('USER_UNVERIFIED');
    if (!roleUnverified?.id) {
      throw new NotFoundException('Role', 'USER_UNVERIFIED');
    }
    const statusPending = await this.getGlobalStatusByCode.run(
      MultipleStatusCode.NOT_VERIFIED,
      CategoryStatus.NAME,
    );
    if (!statusPending?.id) {
      throw new NotFoundException('GlobalStatus', 'NOT_VERIFIED');
    }
    const statusActivePerson = await this.getGlobalStatusByCode.run(
      MultipleStatusCode.ACTIVE,
      CategoryStatus.NAME,
    );
    if (!statusActivePerson?.id) {
      throw new NotFoundException('GlobalStatus', 'ACTIVE');
    }
    // 1. Verificar unicidad del email antes de iniciar cualquier escritura
    const existingPerson = await this.personGetOneByEmail.run(
      command.register_dto.email,
    );
    if (existingPerson) {
      throw new ConflictException(
        'Account registration failed. Please verify your information and try again.',
      );
    }

    // 2. Crear persona
    const peopleDto = new PersonDto(
      command.register_dto.first_name,
      command.register_dto.birthdate,
      command.register_dto.id_gender,
      command.register_dto.email,
      command.register_dto.id_marital_status,
      command.register_dto.phone,
      statusActivePerson.id,
      command.register_dto.middle_name,
      command.register_dto.last_name,
      '',
      command.register_dto.nationalities,
    );

    const person = await this.personCreateService.run(peopleDto);
    const idPerson = person?.getId()?.value();
    if (!idPerson) {
      throw new DomainException(
        'Person id is undefined after creation',
        ErrorCode.INTERNAL_SERVER_ERROR,
      );
    }

    // 5. Crear usuario
    const userDto = new UserDto(
      idPerson,
      command.register_dto.user_name,
      command.register_dto.password,
      statusPending.id,
      command.register_dto.last_access,
      command.register_dto.is_validated,
      [],
    );
    const userCreated = await this.userCreateService.run(userDto);
    const idUser = userCreated.getId()?.value();
    if (!idUser) {
      throw new DomainException(
        'User id is undefined after creation',
        ErrorCode.INTERNAL_SERVER_ERROR,
      );
    }
    // 6. Asignar rol
    const userRoleDto = new UserRolDto(idUser, [roleUnverified.id]);
    await this.userRoleCreateService.run(userRoleDto);

    // 7. Despachar comando de verificación de correo
    const sendVerifyEmailCommand = new SendVerificationEmailCommand(
      idUser,
      command.register_dto.email,
      command.register_dto.user_name,
    );
    await this.commandBus.execute(sendVerifyEmailCommand);

    this.metrics?.incrementRegister();
  }
}
