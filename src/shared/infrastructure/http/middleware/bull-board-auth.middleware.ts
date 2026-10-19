import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { verify as jwtVerify } from 'jsonwebtoken';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const isDevelopment =
      this.configService.get<string>('NODE_ENV')?.trim() === 'development';
    const jwtSecret = this.configService.get<string>('JWT_SECRET') ?? '';

    // 1. Try Authorization header
    const authHeader = req.headers['authorization'];
    let token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    // 2. Try cookie header manually
    if (!token) {
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
      token = cookies['queues_access'] || cookies['docs_access'] || null;
    }

    // 3. Try query parameter (only for GET requests on the base path)
    const queryToken = req.query.token;
    if (!token && typeof queryToken === 'string') {
      try {
        jwtVerify(queryToken, jwtSecret);
        // Set cookie and redirect to remove token from URL bar
        res.cookie('queues_access', queryToken, {
          httpOnly: true,
          secure: !isDevelopment,
          path: '/admin/queues',
          sameSite: 'strict',
        });
        return res.redirect('/admin/queues');
      } catch {
        res.status(401).json({
          statusCode: 401,
          message: 'Invalid token in query parameter',
        });
        return;
      }
    }

    if (!token) {
      res.status(401).json({
        statusCode: 401,
        message:
          'Unauthorized. Please provide a token in Authorization header, cookie (queues_access/docs_access), or query parameter (?token=...)',
      });
      return;
    }

    try {
      jwtVerify(token, jwtSecret);
      return next();
    } catch {
      res.status(401).json({
        statusCode: 401,
        message: 'Invalid or expired token',
      });
      return;
    }
  }
}
