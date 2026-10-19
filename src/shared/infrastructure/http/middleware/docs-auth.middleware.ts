import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { verify as jwtVerify } from 'jsonwebtoken';

@Injectable()
export class DocsAuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const cookieHeader = req.headers['cookie'] ?? '';
    const cookies: Record<string, string> = Object.fromEntries(
      cookieHeader.split(';').flatMap((pair) => {
        const idx = pair.indexOf('=');
        if (idx === -1) return [];
        const k = pair.slice(0, idx).trim();
        const v = decodeURIComponent(pair.slice(idx + 1).trim());
        return [[k, v]];
      }),
    );

    const token = cookies['docs_access'];
    if (!token) {
      const redirect = encodeURIComponent(req.originalUrl);
      return res.redirect(`/api/docs/login?redirect=${redirect}`);
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET') ?? '';
    try {
      jwtVerify(token, jwtSecret);
      return next();
    } catch {
      const redirect = encodeURIComponent(req.originalUrl);
      return res.redirect(`/api/docs/login?redirect=${redirect}`);
    }
  }
}
