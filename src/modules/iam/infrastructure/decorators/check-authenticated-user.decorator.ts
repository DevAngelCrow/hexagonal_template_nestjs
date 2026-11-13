import { SetMetadata } from '@nestjs/common';

export const CHECK_AUTHENTICATED_USER = 'check_authenticated_user';

export interface CheckAuthenticatedUserMetadata {
  paramName: string;
  bypassWithPermissions: string[];
}

/**
 * Verifies that the `:paramName` route parameter matches the authenticated
 * user's `id` or `user_name`, unless the user holds one of
 * `bypassWithPermissions` (which must be granted explicitly per endpoint).
 */
export const CheckAuthenticatedUser = (
  paramName: string,
  bypassWithPermissions: string[] = [],
) =>
  SetMetadata(CHECK_AUTHENTICATED_USER, {
    paramName,
    bypassWithPermissions,
  });
