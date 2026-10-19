import { CreateUpdateRefreshTokenHandler } from '../../application/auth/commands/creat-update-refresh-token/create-update-refresh-token.handler';
import { GrantDocsAccessHandler } from '../../application/auth/commands/docs-access/grant-docs-access.handler';
import { VerifyEmailHandler } from '../../application/auth/commands/email-verification/verify-email.handler';
import { GenerateTokenForgottenPasswordHandler } from '../../application/auth/commands/generate-token-forgotten-password/generate-token-forgotten-password.handler';
import { LoginHandler } from '../../application/auth/commands/login/login.handler';
import { LogoutHandler } from '../../application/auth/commands/logout/logout.handler';
import { MarkAsUsedTokenHandler } from '../../application/auth/commands/mark-as-used-token/mark-as-used-token.handler';
import { RefreshHandler } from '../../application/auth/commands/refresh/refresh.handler';
import { RegisterHandler } from '../../application/auth/commands/register/register.handler';
import { ResetForgottenPasswordHandler } from '../../application/auth/commands/reset-forgotten-password/reset-forgotten-password.handler';
import { RevokeAllSessionsHandler } from '../../application/auth/commands/revoke-all-sessions/revoke-all-sessions.handler';
import { RevokeSessionHandler } from '../../application/auth/commands/revoke-session/revoke-session.handler';
import { SendVerificationEmailHandler } from '../../application/auth/commands/send-verification-email/send-verification-email.handler';
import { UpdateProfileHandler } from '../../application/auth/commands/update-profile/update-profile.handler';
import { CreateAddressHandler } from '../../application/profile/commands/address/create-address/create-address.handler';
import { DeleteAddressHandler } from '../../application/profile/commands/address/delete-address/delete-address.handler';
import { UpdateAddressHandler } from '../../application/profile/commands/address/update-address/update-address.handler';
import { CreateDocumentHandler } from '../../application/profile/commands/document/create-document/create-document.handler';
import { DeleteDocumentHandler } from '../../application/profile/commands/document/delete-document/delete-document.handler';
import { UpdateDocumentHandler } from '../../application/profile/commands/document/update-document/update-document.handler';
import { CreateDocumentTypeHandler } from '../../application/profile/commands/document-type/create-document-type/create-document-type.handler';
import { DeleteDocumentTypeHandler } from '../../application/profile/commands/document-type/delete-document-type/delete-document-type.handler';
import { UpdateDocumentTypeHandler } from '../../application/profile/commands/document-type/update-document-type/update-document-type.handler';
import { CreatePersonHandler } from '../../application/profile/commands/person/create-person/create-person.handler';
import { DeletePersonHandler } from '../../application/profile/commands/person/delete-person/delete-person.handler';
import { UpdatePersonHandler } from '../../application/profile/commands/person/update-person/update-person.handler';
import { CreateCategoryPermissionsHandler } from '../../application/security/commands/category-permissions/create-category-permissions/create-category-permissions.handler';
import { DeleteCategoryPermissionsHandler } from '../../application/security/commands/category-permissions/delete-category-permissions/delete-category-permissions.handler';
import { UpdateCategoryPermissionsHandler } from '../../application/security/commands/category-permissions/update-category-permissions/update-category-permissions.handler';
import { CreatePermissionsHandler } from '../../application/security/commands/permissions/create-permissions/create-permissions.handler';
import { DeletePermissionsHandler } from '../../application/security/commands/permissions/delete-permissions/delete-permissions.handler';
import { UpdatePermissionsHandler } from '../../application/security/commands/permissions/update-permissions/update-permissions.handler';
import { CreateRolHandler } from '../../application/security/commands/rol/create-rol/create-rol.handler';
import { DeleteRolHandler } from '../../application/security/commands/rol/delete-rol/delete-rol.handler';
import { UpdateRolHandler } from '../../application/security/commands/rol/update-rol/update-rol.handler';
import { CreateRouteHandler } from '../../application/security/commands/route/create-route/create-route.handler';
import { DeleteRouteHandler } from '../../application/security/commands/route/delete-route/delete-route.handler';
import { UpdateRouteHandler } from '../../application/security/commands/route/update-route/update-route.handler';
import { CreateUserRoleHandler } from '../../application/security/commands/user-rol/create-user-role/create-user-role.handler';
import { UpdateUserRoleByIdHandler } from '../../application/security/commands/user-rol/update-user-role-by-id/update-user-role-by-id.handler';
import { CreateUserHandler } from '../../application/users/commands/create-user/create-user.handler';
import { ResetPasswordUserHandler } from '../../application/users/commands/reset-password-user/reset-password-user.handler';
import { UpdateNameUserHandler } from '../../application/users/commands/update-name-user/update-name-user.handler';

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
