import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createHash } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { extractClientIp } from '@/shared/infrastructure/http/utils/client-request-info';

const IDEMPOTENCY_TTL_MS = 86_400_000; // 24 hours
const KEY_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXCLUDED_AUTH_PATHS = new Set<string>([
  '/api/v1/auth/login',
  '/api/v1/auth/refresh-token',
  '/api/v1/auth/sign-up',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/logout',
  '/api/v1/auth/docs-access',
  '/api/v1/auth/change-email/request',
]);

interface CachedResponse {
  statusCode: number;
  body: unknown;
  bodyHash: string;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function resolveActorScope(req: Request): string {
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.length > 0) {
    return `auth:${sha256Hex(authHeader)}`;
  }
  const ip = extractClientIp(req) ?? 'unknown-ip';
  return `ip:${ip}`;
}

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestPath = (req.originalUrl || req.url || '').split('?')[0];
    if (EXCLUDED_AUTH_PATHS.has(requestPath)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'];
    if (typeof idempotencyKey !== 'string' || !KEY_REGEX.test(idempotencyKey)) {
      return next();
    }

    const actorScope = resolveActorScope(req);
    const bodyHash = sha256Hex(JSON.stringify(req.body ?? null));
    const cacheKey = `idempotency:${actorScope}:${req.method.toUpperCase()}:${requestPath}:${idempotencyKey}`;

    const cached = await this.cacheManager.get<CachedResponse>(cacheKey);
    if (cached) {
      if (cached.bodyHash !== bodyHash) {
        res.status(409).json({
          statusCode: 409,
          message:
            'Idempotency-Key has already been used with a different request payload',
        });
        return;
      }
      res.setHeader('X-Idempotent-Replayed', 'true');
      res.status(cached.statusCode).json(cached.body);
      return;
    }

    // Capture the outgoing response so we can store it in Redis.
    const originalJson = res.json.bind(res);
    res.json = (body?: unknown): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        this.cacheManager
          .set(
            cacheKey,
            { statusCode: res.statusCode, body, bodyHash },
            IDEMPOTENCY_TTL_MS,
          )
          .catch(() => {
            // Non-fatal — if Redis is down, idempotency degrades gracefully.
          });
      }
      return originalJson(body);
    };

    next();
  }
}
