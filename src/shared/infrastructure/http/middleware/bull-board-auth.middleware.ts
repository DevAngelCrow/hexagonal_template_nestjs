import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Request, Response, NextFunction } from 'express';
import { verify as jwtVerify } from 'jsonwebtoken';
import { PrismaService } from '@/shared/infrastructure/db/prisma.service';
import { MultipleStatusCode } from '@/shared/domain/enums/multiple-status';
import { extractSafeCookie } from '@/shared/infrastructure/http/utils/cookie-parser.util';

const BULL_BOARD_REQUIRED_PERMISSION = 'listar-administracion';
const verifiedQueueRequests = new WeakSet<Request>();

interface VerifiedQueueToken {
  id: string;
  iat?: number;
  purpose?: string;
}

function parseVerifiedToken(decoded: unknown): VerifiedQueueToken | null {
  if (typeof decoded !== 'object' || decoded === null) return null;
  const id: unknown = Reflect.get(decoded, 'id');
  if (typeof id !== 'string' || id.length === 0) return null;
  const iat: unknown = Reflect.get(decoded, 'iat');
  const purpose: unknown = Reflect.get(decoded, 'purpose');
  return {
    id,
    iat: typeof iat === 'number' ? iat : undefined,
    purpose: typeof purpose === 'string' ? purpose : undefined,
  };
}

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BullBoardAuthMiddleware.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (verifiedQueueRequests.has(req)) {
      next();
      return;
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET') ?? '';
    const isProduction =
      this.configService.get<string>('NODE_ENV')?.trim() === 'production';

    const authHeader = req.headers['authorization'];
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    const token = bearerToken || extractSafeCookie(req, 'queues_access');

    if (!token) {
      res.status(401).json({
        statusCode: 401,
        message:
          'Unauthorized. Provide a Bearer token or queues_access cookie.',
      });
      return;
    }

    let parsed: VerifiedQueueToken | null = null;
    try {
      const verified: unknown = jwtVerify(token, jwtSecret);
      parsed = parseVerifiedToken(verified);
    } catch {
      res.status(401).json({
        statusCode: 401,
        message: 'Invalid or expired token',
      });
      return;
    }

    if (!parsed) {
      res.status(401).json({
        statusCode: 401,
        message: 'Invalid token payload',
      });
      return;
    }

    // Never accept tokens issued specifically for API documentation.
    if (parsed.purpose && parsed.purpose !== 'queues_access') {
      res.status(403).json({
        statusCode: 403,
        message: 'Token is not valid for queue administration access',
      });
      return;
    }

    try {
      const loggedOutAt = await this.cacheManager.get<number>(
        `blacklist:user:${parsed.id}`,
      );
      if (
        typeof loggedOutAt === 'number' &&
        parsed.iat !== undefined &&
        loggedOutAt >= parsed.iat
      ) {
        res.status(401).json({
          statusCode: 401,
          message: 'Token has been invalidated',
        });
        return;
      }
    } catch (error) {
      this.logger.warn(
        `Unable to read blacklist for Bull Board user ${parsed.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (isProduction) {
        res.status(401).json({
          statusCode: 401,
          message: 'Unable to verify token revocation status',
        });
        return;
      }
    }

    const now = new Date();
    const user = await this.prisma.client.mnt_user.findFirst({
      where: {
        id: parsed.id,
        deleted_at: null,
        ctl_status: { code: MultipleStatusCode.ACTIVE },
        OR: [{ locked_until: null }, { locked_until: { lte: now } }],
      },
      select: {
        id: true,
        mnt_user_rol: {
          where: {
            deleted_at: null,
            mnt_role: {
              deleted_at: null,
              ctl_status: { code: MultipleStatusCode.ACTIVE },
            },
          },
          select: {
            mnt_role: {
              select: {
                rol_permissions: {
                  where: {
                    deleted_at: null,
                    ctl_permissions: {
                      active: true,
                      deleted_at: null,
                      name: BULL_BOARD_REQUIRED_PERMISSION,
                    },
                  },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        statusCode: 401,
        message: 'User account is inactive, locked, or does not exist',
      });
      return;
    }

    const hasAdminPermission = user.mnt_user_rol.some(
      (ur) => ur.mnt_role.rol_permissions.length > 0,
    );
    if (!hasAdminPermission) {
      res.status(403).json({
        statusCode: 403,
        message: 'Forbidden: insufficient permissions for queue administration',
      });
      return;
    }

    verifiedQueueRequests.add(req);
    next();
  }
}
