import { Request } from 'express';

/**
 * Safely reads a named cookie from `req.cookies` or parses the raw `Cookie`
 * header without throwing on malformed percent-encoding.
 */
export function extractSafeCookie(req: Request, name: string): string | null {
  const parsedCookies: unknown = Reflect.get(req, 'cookies');
  if (typeof parsedCookies === 'object' && parsedCookies !== null) {
    const val: unknown = Reflect.get(parsedCookies, name);
    if (typeof val === 'string' && val.length > 0) {
      return val;
    }
  }

  const cookieHeader = req.headers['cookie'];
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) {
    return null;
  }

  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    if (key !== name) continue;
    const rawValue = pair.slice(idx + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return null;
    }
  }

  return null;
}

