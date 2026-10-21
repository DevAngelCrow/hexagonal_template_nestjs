import { UserRepository } from '@/modules/iam/domain/repositories/user-repository';
import { ImplUserRepository } from '@/modules/iam/infrastructure/persistence/users/impl-user.repository';
import { PasswordHasherPort } from '@/modules/iam/domain/ports/password-hasher.port';
import { ImplPasswordHasherPort } from '@/modules/iam/infrastructure/persistence/users/impl-password-hasher.port';
import { PersonRepository } from '@/modules/iam/domain/repositories/person.repository';
import { ImplPersonRepository } from '@/modules/iam/infrastructure/persistence/profile/impl-person.repository';
import { DocumentTypeRepository } from '@/modules/iam/domain/repositories/document-type.repository';
import { ImplDocumentTypeRepository } from '@/modules/iam/infrastructure/persistence/profile/impl-document-type.repository';
import { ImplDocumentReadRepository } from '@/modules/iam/infrastructure/persistence/profile/impl-document-read.repository';
import { ImplAddressReadRepository } from '@/modules/iam/infrastructure/persistence/profile/impl-address-read.repository';
import { CategoryPermissionsRepository } from '@/modules/iam/domain/repositories/category-permissions-repository';
import { ImplCategoryPermissionsRepository } from '@/modules/iam/infrastructure/persistence/security/impl-category-permissions.repository';
import { PermissionsRepository } from '@/modules/iam/domain/repositories/permissions-repository';
import { ImplPermissionsRepository } from '@/modules/iam/infrastructure/persistence/security/impl-permissions.repository';
import { RolRepository } from '@/modules/iam/domain/repositories/rol-repository';
import { ImplRolRepository } from '@/modules/iam/infrastructure/persistence/security/impl-rol.repository';
import { RouteRepository } from '@/modules/iam/domain/repositories/route-repository';
import { ImplRouteRepository } from '@/modules/iam/infrastructure/persistence/security/impl-route.repository';
import { UserRoleRepository } from '@/modules/iam/domain/repositories/user-rol-repository';
import { ImplUserRoleRepository } from '@/modules/iam/infrastructure/persistence/security/impl-user-role.repository';
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
} from '@/modules/iam/application/repositories';

import { VerificationTokenRepository } from '@/modules/iam/domain/repositories/verification-token-repository';
import { ImplVerificationTokenRepository } from '@/modules/iam/infrastructure/persistence/auth/impl-verification-token.repository';
import { EmailSenderPort } from '@/modules/iam/domain/ports/email-sender.port';
import { EmailQueueService } from '@/modules/iam/infrastructure/adapters/services/emailQueue.service';
import { CreateOrUpdateRefreshTokenPort } from '@/modules/iam/domain/ports/create-or-update-refresh-token.port';
import { AuthReadPort } from '@/modules/iam/application/auth/ports/auth-read.port';
import { ImplAuthPort } from '@/modules/iam/infrastructure/persistence/auth/auth-port-implementation/impl-auth.port';
import { AuthCachePort } from '@/modules/iam/domain/ports/auth-cache.port';
import { ImplAuthCachePort } from '@/modules/iam/infrastructure/persistence/auth/impl-auth-cache.port';
import { SecurityAuthorizationPort } from '@/modules/iam/domain/ports/security-authorization.port';
import { ImplSecurityAuthorizationPort } from '@/modules/iam/infrastructure/persistence/security/impl-authorization.port';
import { CachePort } from '@/modules/iam/domain/ports/cache.port';
import { ImplCachePort } from '@/modules/iam/infrastructure/persistence/security/impl-cache.port';

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
