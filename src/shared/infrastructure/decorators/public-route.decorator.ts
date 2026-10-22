import { SetMetadata } from '@nestjs/common';

export const SKIP_AUTH_KEY = 'isPublic';

/**
 * Marks a route or controller as public, bypassing the global JWT authentication guard.
 */
export const SkipAuth = () => SetMetadata(SKIP_AUTH_KEY, true);

/**
 * Alias for SkipAuth.
 */
export const Public = SkipAuth;
