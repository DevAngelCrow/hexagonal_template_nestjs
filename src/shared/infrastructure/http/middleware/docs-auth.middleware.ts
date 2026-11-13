import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { verify as jwtVerify } from 'jsonwebtoken';
import { extractSafeCookie } from '@/shared/infrastructure/http/utils/cookie-parser.util';

export function isDocsAccessTokenPayload(decoded: unknown): boolean {
  if (typeof decoded !== 'object' || decoded === null) return false;
  const id: unknown = Reflect.get(decoded, 'id');
  const purpose: unknown = Reflect.get(decoded, 'purpose');
  return typeof id === 'string' && id.length > 0 && purpose === 'docs_access';
}

@Injectable()
export class DocsAuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const token = extractSafeCookie(req, 'docs_access');
    if (!token) {
      const redirect = encodeURIComponent(req.originalUrl);
      return res.redirect(`/api/docs/login?redirect=${redirect}`);
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET') ?? '';
    try {
      const decoded: unknown = jwtVerify(token, jwtSecret);
      if (!isDocsAccessTokenPayload(decoded)) {
        const redirect = encodeURIComponent(req.originalUrl);
        return res.redirect(`/api/docs/login?redirect=${redirect}`);
      }
      return next();
    } catch {
      const redirect = encodeURIComponent(req.originalUrl);
      return res.redirect(`/api/docs/login?redirect=${redirect}`);
    }
  }
}
