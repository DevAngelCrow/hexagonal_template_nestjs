import { CookieOptions, Request } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

// Restricts the cookie to the auth module so the browser only attaches it to
// /api/v1/auth/* requests (refresh-token, logout). Business endpoints never
// receive it, which keeps them immune to CSRF (they require a Bearer header).
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

export function buildRefreshTokenCookieOptions(
  nodeEnv: string | undefined,
  expiresAtEpochSeconds?: number,
): CookieOptions {
  const isProduction = nodeEnv?.trim() !== 'development';
  const options: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: REFRESH_TOKEN_COOKIE_PATH,
  };
  if (expiresAtEpochSeconds !== undefined) {
    const maxAge = expiresAtEpochSeconds * 1000 - Date.now();
    if (maxAge > 0) {
      options.maxAge = maxAge;
    }
  }
  return options;
}

export function extractRefreshTokenFromCookie(req: Request): string | null {
  const cookies: unknown = req.cookies;
  if (cookies && typeof cookies === 'object') {
    const value = (cookies as Record<string, unknown>)[
      REFRESH_TOKEN_COOKIE_NAME
    ];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
}

export function extractRefreshToken(req: Request): string | null {
  const fromCookie = extractRefreshTokenFromCookie(req);
  if (fromCookie) return fromCookie;
  // Fallback for non-browser clients (Swagger, mobile, integrations).
  const header = req.get('Authorization');
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }
  return null;
}
