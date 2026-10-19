import { UserRepository } from '../../domain/repositories/user-repository';
import { ImplUserRepository } from '../persistence/users/impl-user.repository';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { ImplPasswordHasherPort } from '../persistence/users/impl-password-hasher.port';
import { PersonRepository } from '../../domain/repositories/person.repository';
import { ImplPersonRepository } from '../persistence/profile/impl-person.repository';
import { DocumentTypeRepository } from '../../domain/repositories/document-type.repository';
import { ImplDocumentTypeRepository } from '../persistence/profile/impl-document-type.repository';
import { ImplDocumentReadRepository } from '../persistence/profile/impl-document-read.repository';
import { ImplAddressReadRepository } from '../persistence/profile/impl-address-read.repository';
import { CategoryPermissionsRepository } from '../../domain/repositories/category-permissions-repository';
import { ImplCategoryPermissionsRepository } from '../persistence/security/impl-category-permissions.repository';
import { PermissionsRepository } from '../../domain/repositories/permissions-repository';
import { ImplPermissionsRepository } from '../persistence/security/impl-permissions.repository';
import { RolRepository } from '../../domain/repositories/rol-repository';
import { ImplRolRepository } from '../persistence/security/impl-rol.repository';
import { RouteRepository } from '../../domain/repositories/route-repository';
import { ImplRouteRepository } from '../persistence/security/impl-route.repository';
import { UserRoleRepository } from '../../domain/repositories/user-rol-repository';
import { ImplUserRoleRepository } from '../persistence/security/impl-user-role.repository';
import {
  UserReadRepository,
  PersonReadRepository,
  DocumentTypeReadRepository,
  DocumentReadRepository,
  AddressReadRepository,
  CategoryPermissionsReadRepository,
  PermissionsReadRepository,
  RolReadRepository,
  RouteReadRepository,
  UsersRoleReadRepository,
} from '../../application/repositories';

import { VerificationTokenRepository } from '../../domain/repositories/verification-token-repository';
import { ImplVerificationTokenRepository } from '../persistence/auth/impl-verification-token.repository';
import { EmailSenderPort } from '../../domain/ports/email-sender.port';
import { EmailQueueService } from '../adapters/services/emailQueue.service';
import { CreateOrUpdateRefreshTokenPort } from '../../domain/ports/create-or-update-refresh-token.port';
import { AuthReadPort } from '../../application/auth/ports/auth-read.port';
import { ImplAuthPort } from '../persistence/auth/auth-port-implementation/impl-auth.port';
import { AuthCachePort } from '../../domain/ports/auth-cache.port';
import { ImplAuthCachePort } from '../persistence/auth/impl-auth-cache.port';
import { SecurityAuthorizationPort } from '../../domain/ports/security-authorization.port';
import { ImplSecurityAuthorizationPort } from '../persistence/security/impl-authorization.port';
import { CachePort } from '../../domain/ports/cache.port';
import { ImplCachePort } from '../persistence/security/impl-cache.port';

export const repositories = [
  // Auth
  { provide: EmailSenderPort, useClass: EmailQueueService },
  { provide: VerificationTokenRepository, useClass: ImplVerificationTokenRepository },
  { provide: CreateOrUpdateRefreshTokenPort, useClass: ImplAuthPort },
  { provide: AuthReadPort, useClass: ImplAuthPort },
  { provide: ImplAuthPort, useExisting: AuthReadPort },
  { provide: AuthCachePort, useClass: ImplAuthCachePort },
  // Users
  { provide: UserRepository, useClass: ImplUserRepository },
  { provide: UserReadRepository, useClass: ImplUserRepository },
  { provide: PasswordHasherPort, useClass: ImplPasswordHasherPort },
  // Profile
  { provide: PersonRepository, useClass: ImplPersonRepository },
  { provide: PersonReadRepository, useClass: ImplPersonRepository },
  { provide: DocumentTypeRepository, useClass: ImplDocumentTypeRepository },
  { provide: DocumentTypeReadRepository, useClass: ImplDocumentTypeRepository },
  { provide: DocumentReadRepository, useClass: ImplDocumentReadRepository },
  { provide: AddressReadRepository, useClass: ImplAddressReadRepository },
  // Security
  { provide: RouteRepository, useClass: ImplRouteRepository },
  { provide: RouteReadRepository, useClass: ImplRouteRepository },
  { provide: CategoryPermissionsRepository, useClass: ImplCategoryPermissionsRepository },
  { provide: CategoryPermissionsReadRepository, useClass: ImplCategoryPermissionsRepository },
  { provide: PermissionsRepository, useClass: ImplPermissionsRepository },
  { provide: PermissionsReadRepository, useClass: ImplPermissionsRepository },
  { provide: RolRepository, useClass: ImplRolRepository },
  { provide: RolReadRepository, useClass: ImplRolRepository },
  { provide: UserRoleRepository, useClass: ImplUserRoleRepository },
  { provide: UsersRoleReadRepository, useClass: ImplUserRoleRepository },
  { provide: SecurityAuthorizationPort, useClass: ImplSecurityAuthorizationPort },
  { provide: CachePort, useClass: ImplCachePort },
];
