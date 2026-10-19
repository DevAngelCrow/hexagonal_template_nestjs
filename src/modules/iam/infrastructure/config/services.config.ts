import { Abstract, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { registerService } from '@/shared/infrastructure/factories/register-service.factory';

// Auth services
import { TokenGeneratorService } from '../../application/auth/services/token-generator.service';
import { CredentialsValidationService } from '../../application/auth/services/credentials-validation.service';
import { TokenDedecoderService } from '../../application/auth/services/token-decoder.service';
import { AuthReadPort } from '../../application/auth/ports/auth-read.port';
import { JwtRefreshStrategy } from '../strategies/jwt-refresh.strategy';
import { JwtStrategy } from '../strategies/jwt.strategy';

// Users services
import { CreateUserService } from '../../application/users/services/create-user.service';
import { FindUserService } from '../../application/users/services/find-user.service';
import { FindUserAuthByNameService } from '../../application/users/services/find-user-auth-by-user-name.service';
import { FindUserByIdService } from '../../application/users/services/find-user-by-id.service';
import { GetUserByEmailService } from '../../application/users/services/get-user-by-email.service';
import { ResetPasswordUserService } from '../../application/users/services/reset-password-user.service';
import { UpdateUserNameService } from '../../application/users/services/update-user-name.service';
import { UserReadRepository } from '../../application/repositories/user-read.repository';

// Profile services
import { PersonCreateService } from '../../application/profile/services/person/person-create.service';
import { PersonGetOneByEmailService } from '../../application/profile/services/person/person-get-one-by-email.service';
import { PersonUpdateService } from '../../application/profile/services/person/person-update.service';
import { AddressCreateService } from '../../application/profile/services/address/address-create.service';
import { AddressUpdateService } from '../../application/profile/services/address/address-update.service';
import { DocumentCreateService } from '../../application/profile/services/document/document-create.service';
import { DocumentUpdateService } from '../../application/profile/services/document/document-update.service';
import { GetDocumentTypesService } from '../../application/profile/services/document-type/get-document-types.service';

// Security services
import { CreateUserRoleService } from '../../application/security/services/user-role/create-user-role.service';
import { GetRoleByCodeService } from '../../application/security/services/user-role/get-rol-by-code.service';
import { UpdateOrCreateUserRoleService } from '../../application/security/services/user-role/update-or-create-user-role.service';

// External services
import { StorageUploadService } from '@/modules/storage/application/services/storage/storage-upload.service';
import { StorageFilesUploadFlowHandler } from '@/modules/storage/application/storage-files/commands/storage-files-upload-flow/storage-files-upload-flow.handler';

// Handlers for dependency injection
import { CreateUserHandler } from '../../application/users/commands/create-user/create-user.handler';
import { GetUserByUserNameHandler } from '../../application/users/queries/get-user-by-user-name/get-user-by-user-name.handler';
import { GetUserByIdHandler } from '../../application/users/queries/get-user-by-id/get-user-by-id.handler';
import { GetUserAuthByNameHandler } from '../../application/users/queries/get-user-auth-by-name/get-user-auth-by-name.handler';
import { GetUserByEmailHandler } from '../../application/users/queries/get-user-by-email/get-user-by-email.handler';
import { ResetPasswordUserHandler } from '../../application/users/commands/reset-password-user/reset-password-user.handler';
import { UpdateNameUserHandler } from '../../application/users/commands/update-name-user/update-name-user.handler';

import { CreatePersonHandler } from '../../application/profile/commands/person/create-person/create-person.handler';
import { UpdatePersonHandler } from '../../application/profile/commands/person/update-person/update-person.handler';
import { GetPersonByEmailHandler } from '../../application/profile/queries/person/get-person-by-email/get-person-by-email.handler';
import { CreateAddressHandler } from '../../application/profile/commands/address/create-address/create-address.handler';
import { UpdateAddressHandler } from '../../application/profile/commands/address/update-address/update-address.handler';
import { CreateDocumentHandler } from '../../application/profile/commands/document/create-document/create-document.handler';
import { UpdateDocumentHandler } from '../../application/profile/commands/document/update-document/update-document.handler';
import { GetDocumentTypesHandler } from '../../application/profile/queries/document-type/get-document-types/get-document-types.handler';

import { CreateUserRoleHandler } from '../../application/security/commands/user-rol/create-user-role/create-user-role.handler';
import { UpdateUserRoleByIdHandler } from '../../application/security/commands/user-rol/update-user-role-by-id/update-user-role-by-id.handler';
import { GetRolByCodeHandler } from '../../application/security/queries/rol/get-rol-by-code/get-rol-by-code.handler';

export const services: Array<{
  service: Type<unknown>;
  deps: Array<Type<unknown> | Abstract<unknown> | string>;
}> = [
  // Auth
  { service: TokenGeneratorService, deps: [AuthReadPort] },
  { service: CredentialsValidationService, deps: [AuthReadPort] },
  { service: TokenDedecoderService, deps: [AuthReadPort] },
  { service: JwtRefreshStrategy, deps: [UserReadRepository, ConfigService] },
  { service: JwtStrategy, deps: [UserReadRepository, CACHE_MANAGER, ConfigService] },
  // Users
  { service: CreateUserService, deps: [CreateUserHandler] },
  { service: FindUserService, deps: [GetUserByUserNameHandler] },
  { service: FindUserAuthByNameService, deps: [GetUserAuthByNameHandler] },
  { service: FindUserByIdService, deps: [GetUserByIdHandler] },
  { service: GetUserByEmailService, deps: [GetUserByEmailHandler] },
  { service: ResetPasswordUserService, deps: [ResetPasswordUserHandler] },
  { service: UpdateUserNameService, deps: [UpdateNameUserHandler] },
  // Profile
  { service: PersonCreateService, deps: [CreatePersonHandler] },
  { service: PersonUpdateService, deps: [UpdatePersonHandler] },
  { service: PersonGetOneByEmailService, deps: [GetPersonByEmailHandler] },
  { service: AddressCreateService, deps: [CreateAddressHandler] },
  { service: AddressUpdateService, deps: [UpdateAddressHandler] },
  { service: DocumentCreateService, deps: [CreateDocumentHandler] },
  { service: DocumentUpdateService, deps: [UpdateDocumentHandler] },
  { service: GetDocumentTypesService, deps: [GetDocumentTypesHandler] },
  // Security
  { service: CreateUserRoleService, deps: [CreateUserRoleHandler] },
  { service: GetRoleByCodeService, deps: [GetRolByCodeHandler] },
  { service: UpdateOrCreateUserRoleService, deps: [UpdateUserRoleByIdHandler] },
  // Storage
  { service: StorageUploadService, deps: [StorageFilesUploadFlowHandler] },
];

export const serviceProviders = services.map((uc) => {
  return registerService(uc.service, uc.deps);
});
