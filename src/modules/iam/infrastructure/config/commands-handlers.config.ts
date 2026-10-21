import { CreateUpdateRefreshTokenHandler } from '@/modules/iam/application/auth/commands/creat-update-refresh-token/create-update-refresh-token.handler';
import { GrantDocsAccessHandler } from '@/modules/iam/application/auth/commands/docs-access/grant-docs-access.handler';
import { VerifyEmailHandler } from '@/modules/iam/application/auth/commands/email-verification/verify-email.handler';
import { GenerateTokenForgottenPasswordHandler } from '@/modules/iam/application/auth/commands/generate-token-forgotten-password/generate-token-forgotten-password.handler';
import { LoginHandler } from '@/modules/iam/application/auth/commands/login/login.handler';
import { LogoutHandler } from '@/modules/iam/application/auth/commands/logout/logout.handler';
import { MarkAsUsedTokenHandler } from '@/modules/iam/application/auth/commands/mark-as-used-token/mark-as-used-token.handler';
import { RefreshHandler } from '@/modules/iam/application/auth/commands/refresh/refresh.handler';
import { RegisterHandler } from '@/modules/iam/application/auth/commands/register/register.handler';
import { ResetForgottenPasswordHandler } from '@/modules/iam/application/auth/commands/reset-forgotten-password/reset-forgotten-password.handler';
import { RevokeAllSessionsHandler } from '@/modules/iam/application/auth/commands/revoke-all-sessions/revoke-all-sessions.handler';
import { RevokeSessionHandler } from '@/modules/iam/application/auth/commands/revoke-session/revoke-session.handler';
import { SendVerificationEmailHandler } from '@/modules/iam/application/auth/commands/send-verification-email/send-verification-email.handler';
import { UpdateProfileHandler } from '@/modules/iam/application/auth/commands/update-profile/update-profile.handler';
import { CreateAddressHandler } from '@/modules/iam/application/profile/commands/address/create-address/create-address.handler';
import { DeleteAddressHandler } from '@/modules/iam/application/profile/commands/address/delete-address/delete-address.handler';
import { UpdateAddressHandler } from '@/modules/iam/application/profile/commands/address/update-address/update-address.handler';
import { CreateDocumentHandler } from '@/modules/iam/application/profile/commands/document/create-document/create-document.handler';
import { DeleteDocumentHandler } from '@/modules/iam/application/profile/commands/document/delete-document/delete-document.handler';
import { UpdateDocumentHandler } from '@/modules/iam/application/profile/commands/document/update-document/update-document.handler';
import { CreateDocumentTypeHandler } from '@/modules/iam/application/profile/commands/document-type/create-document-type/create-document-type.handler';
import { DeleteDocumentTypeHandler } from '@/modules/iam/application/profile/commands/document-type/delete-document-type/delete-document-type.handler';
import { UpdateDocumentTypeHandler } from '@/modules/iam/application/profile/commands/document-type/update-document-type/update-document-type.handler';
import { CreatePersonHandler } from '@/modules/iam/application/profile/commands/person/create-person/create-person.handler';
import { DeletePersonHandler } from '@/modules/iam/application/profile/commands/person/delete-person/delete-person.handler';
import { UpdatePersonHandler } from '@/modules/iam/application/profile/commands/person/update-person/update-person.handler';
import { CreateCategoryPermissionsHandler } from '@/modules/iam/application/security/commands/category-permissions/create-category-permissions/create-category-permissions.handler';
import { DeleteCategoryPermissionsHandler } from '@/modules/iam/application/security/commands/category-permissions/delete-category-permissions/delete-category-permissions.handler';
import { UpdateCategoryPermissionsHandler } from '@/modules/iam/application/security/commands/category-permissions/update-category-permissions/update-category-permissions.handler';
import { CreatePermissionsHandler } from '@/modules/iam/application/security/commands/permissions/create-permissions/create-permissions.handler';
import { DeletePermissionsHandler } from '@/modules/iam/application/security/commands/permissions/delete-permissions/delete-permissions.handler';
import { UpdatePermissionsHandler } from '@/modules/iam/application/security/commands/permissions/update-permissions/update-permissions.handler';
import { CreateRolHandler } from '@/modules/iam/application/security/commands/rol/create-rol/create-rol.handler';
import { DeleteRolHandler } from '@/modules/iam/application/security/commands/rol/delete-rol/delete-rol.handler';
import { UpdateRolHandler } from '@/modules/iam/application/security/commands/rol/update-rol/update-rol.handler';
import { CreateRouteHandler } from '@/modules/iam/application/security/commands/route/create-route/create-route.handler';
import { DeleteRouteHandler } from '@/modules/iam/application/security/commands/route/delete-route/delete-route.handler';
import { UpdateRouteHandler } from '@/modules/iam/application/security/commands/route/update-route/update-route.handler';
import { CreateUserRoleHandler } from '@/modules/iam/application/security/commands/user-rol/create-user-role/create-user-role.handler';
import { UpdateUserRoleByIdHandler } from '@/modules/iam/application/security/commands/user-rol/update-user-role-by-id/update-user-role-by-id.handler';
import { CreateUserHandler } from '@/modules/iam/application/users/commands/create-user/create-user.handler';
import { ResetPasswordUserHandler } from '@/modules/iam/application/users/commands/reset-password-user/reset-password-user.handler';
import { UpdateNameUserHandler } from '@/modules/iam/application/users/commands/update-name-user/update-name-user.handler';

export const commandHandlerProviders = [
  CreateUpdateRefreshTokenHandler,
  GrantDocsAccessHandler,
  VerifyEmailHandler,
  GenerateTokenForgottenPasswordHandler,
  LoginHandler,
  LogoutHandler,
  MarkAsUsedTokenHandler,
  RefreshHandler,
  RegisterHandler,
  ResetForgottenPasswordHandler,
  RevokeAllSessionsHandler,
  RevokeSessionHandler,
  SendVerificationEmailHandler,
  UpdateProfileHandler,
  CreateAddressHandler,
  DeleteAddressHandler,
  UpdateAddressHandler,
  CreateDocumentHandler,
  DeleteDocumentHandler,
  UpdateDocumentHandler,
  CreateDocumentTypeHandler,
  DeleteDocumentTypeHandler,
  UpdateDocumentTypeHandler,
  CreatePersonHandler,
  DeletePersonHandler,
  UpdatePersonHandler,
  CreateCategoryPermissionsHandler,
  DeleteCategoryPermissionsHandler,
  UpdateCategoryPermissionsHandler,
  CreatePermissionsHandler,
  DeletePermissionsHandler,
  UpdatePermissionsHandler,
  CreateRolHandler,
  DeleteRolHandler,
  UpdateRolHandler,
  CreateRouteHandler,
  DeleteRouteHandler,
  UpdateRouteHandler,
  CreateUserRoleHandler,
  UpdateUserRoleByIdHandler,
  CreateUserHandler,
  ResetPasswordUserHandler,
  UpdateNameUserHandler,
];
