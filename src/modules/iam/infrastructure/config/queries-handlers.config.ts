import { EmailVerificationValidationHandler } from '@/modules/iam/application/auth/queries/email-verification-validation/email-verification-validation.handler';
import { GetSessionsHandler } from '@/modules/iam/application/auth/queries/get-sessions/get-sessions.handler';
import { GetAddressByIdHandler } from '@/modules/iam/application/profile/queries/address/get-address-by-id/get-address-by-id.handler';
import { GetAddressesHandler } from '@/modules/iam/application/profile/queries/address/get-addresses/get-addresses.handler';
import { GetDocumentByIdHandler } from '@/modules/iam/application/profile/queries/document/get-document-by-id/get-document-by-id.handler';
import { GetDocumentsHandler } from '@/modules/iam/application/profile/queries/document/get-documents/get-documents.handler';
import { GetDocumentTypeByIdHandler } from '@/modules/iam/application/profile/queries/document-type/get-document-type-by-id/get-document-type-by-id.handler';
import { GetDocumentTypesHandler } from '@/modules/iam/application/profile/queries/document-type/get-document-types/get-document-types.handler';
import { GetPeopleHandler } from '@/modules/iam/application/profile/queries/person/get-people/get-people.handler';
import { GetPersonByEmailHandler } from '@/modules/iam/application/profile/queries/person/get-person-by-email/get-person-by-email.handler';
import { GetPersonByIdHandler } from '@/modules/iam/application/profile/queries/person/get-person-by-id/get-person-by-id.handler';
import { GetProfileByIdPersonHandler } from '@/modules/iam/application/profile/queries/person/get-profile-by-id-person/get-profile-by-id-person.handler';
import { CheckPermissionsHandler } from '@/modules/iam/application/security/queries/authorization/check-permissions/queries/check-permissions.handler';
import { FilterRoutesUserHandler } from '@/modules/iam/application/security/queries/authorization/filter-routes-user/queries/filter-routes-user.handler';
import { HasRoleHandler } from '@/modules/iam/application/security/queries/authorization/has-role/queries/has-role.handler';
import { GetCategoryPermissionsHandler } from '@/modules/iam/application/security/queries/category-permissions/get-category-permissions/get-category-permissions.handler';
import { GetCategoryPermissionsByIdHandler } from '@/modules/iam/application/security/queries/category-permissions/get-category-permissions-by-id/get-category-permissions-by-id.handler';
import { GetMenuUserHandler } from '@/modules/iam/application/security/queries/menu/get-menu-user/get-menu-user.handler';
import { GetPermissionsHandler } from '@/modules/iam/application/security/queries/permissions/get-permissions/get-permissions.handler';
import { GetPermissionsByIdHandler } from '@/modules/iam/application/security/queries/permissions/get-permissions-by-id/get-permissions-by-id.handler';
import { GetRolByCodeHandler } from '@/modules/iam/application/security/queries/rol/get-rol-by-code/get-rol-by-code.handler';
import { GetRolByIdHandler } from '@/modules/iam/application/security/queries/rol/get-rol-by-id/get-rol-by-id.handler';
import { GetRolesHandler } from '@/modules/iam/application/security/queries/rol/get-roles/get-roles.handler';
import { GetRouteByIdHandler } from '@/modules/iam/application/security/queries/route/get-route-by-id/get-route-by-id.handler';
import { GetRoutesHandler } from '@/modules/iam/application/security/queries/route/get-routes/get-routes.handler';
import { GetUserIdsByRoleIdHandler } from '@/modules/iam/application/security/queries/user-rol/get-user-ids-by-role-id/get-user-ids-by-role-id.handler';
import { GetUserRoleByIdHandler } from '@/modules/iam/application/security/queries/user-rol/get-user-role-by-id/get-user-role-by-id.handler';
import { GetUserAuthByNameHandler } from '@/modules/iam/application/users/queries/get-user-auth-by-name/get-user-auth-by-name.handler';
import { GetUserByEmailHandler } from '@/modules/iam/application/users/queries/get-user-by-email/get-user-by-email.handler';
import { GetUserByIdHandler } from '@/modules/iam/application/users/queries/get-user-by-id/get-user-by-id.handler';
import { GetUserByUserNameHandler } from '@/modules/iam/application/users/queries/get-user-by-user-name/get-user-by-user-name.handler';
import { GetUsersHandler } from '@/modules/iam/application/users/queries/get-users/get-users.handler';

export const queryHandlerProviders = [
  EmailVerificationValidationHandler,
  GetSessionsHandler,
  GetAddressByIdHandler,
  GetAddressesHandler,
  GetDocumentByIdHandler,
  GetDocumentsHandler,
  GetDocumentTypeByIdHandler,
  GetDocumentTypesHandler,
  GetPeopleHandler,
  GetPersonByEmailHandler,
  GetPersonByIdHandler,
  GetProfileByIdPersonHandler,
  CheckPermissionsHandler,
  FilterRoutesUserHandler,
  HasRoleHandler,
  GetCategoryPermissionsHandler,
  GetCategoryPermissionsByIdHandler,
  GetMenuUserHandler,
  GetPermissionsHandler,
  GetPermissionsByIdHandler,
  GetRolByCodeHandler,
  GetRolByIdHandler,
  GetRolesHandler,
  GetRouteByIdHandler,
  GetRoutesHandler,
  GetUserIdsByRoleIdHandler,
  GetUserRoleByIdHandler,
  GetUserAuthByNameHandler,
  GetUserByEmailHandler,
  GetUserByIdHandler,
  GetUserByUserNameHandler,
  GetUsersHandler,
];
