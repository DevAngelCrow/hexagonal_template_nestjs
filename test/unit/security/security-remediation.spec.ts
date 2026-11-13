import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { sign as jwtSign } from 'jsonwebtoken';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';

import { BullBoardAuthMiddleware } from '@/shared/infrastructure/http/middleware/bull-board-auth.middleware';
import {
  DocsAuthMiddleware,
  isDocsAccessTokenPayload,
} from '@/shared/infrastructure/http/middleware/docs-auth.middleware';
import { CheckAuthenticatedUserGuard } from '@/modules/iam/infrastructure/guards/check-authenticated-user.guard';
import {
  resolveConfinedStoragePath,
  sanitizeStorageFolder,
} from '@/modules/storage/infrastructure/utils/storage-path.util';
import { LocalStorageBackend } from '@/modules/storage/infrastructure/backends/local-storage.backend';
import { IdempotencyMiddleware } from '@/shared/infrastructure/http/middleware/idempotency.middleware';
import { RequestIdMiddleware } from '@/shared/infrastructure/http/middleware/request-id.middleware';
import { LoginThrottleGuard } from '@/modules/iam/infrastructure/guards/login-throttle.guard';
import { MetricsController } from '@/shared/infrastructure/health/metrics.controller';
import { UpdateProfileHandler } from '@/modules/iam/application/auth/commands/update-profile/update-profile.handler';
import { UpdateProfileCommand } from '@/modules/iam/application/auth/commands/update-profile/update-profile.command';
import { UpdateProfileDto } from '@/modules/iam/application/auth/dtos/update-profile.dto';
import { RequestEmailChangeHandler } from '@/modules/iam/application/auth/commands/email-change/request-email-change.handler';
import { RequestEmailChangeCommand } from '@/modules/iam/application/auth/commands/email-change/request-email-change.command';
import { ConfirmEmailChangeHandler } from '@/modules/iam/application/auth/commands/email-change/confirm-email-change.handler';
import { ConfirmEmailChangeCommand } from '@/modules/iam/application/auth/commands/email-change/confirm-email-change.command';
import { ResetPasswordUserHandler } from '@/modules/iam/application/users/commands/reset-password-user/reset-password-user.handler';
import { ResetPasswordUserCommand } from '@/modules/iam/application/users/commands/reset-password-user/reset-password-user.command';
import { RefreshHandler } from '@/modules/iam/application/auth/commands/refresh/refresh.handler';
import { RefreshCommand } from '@/modules/iam/application/auth/commands/refresh/refresh.command';
import { MultipleStatusId } from '@/shared/domain/enums/multiple-status';
import { ForbiddenException } from '@/shared/application/exceptions/forbidden.exception';
import { UnauthorizedException } from '@/shared/application/exceptions/unauthorized.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function makeMockResponse() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    redirectUrl: undefined as string | undefined,
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((payload: unknown) => {
      res.body = payload;
      return res;
    }),
    redirect: vi.fn((url: string) => {
      res.redirectUrl = url;
      return res;
    }),
    setHeader: vi.fn((k: string, v: string) => {
      headers[k] = v;
    }),
    getHeader: (k: string) => headers[k],
    headers,
  };
  return res;
}

describe('Security Remediations Verification', () => {
  const JWT_SECRET = 'super-secret-signing-key-32-chars-min';

  describe('BullBoardAuthMiddleware & DocsAuthMiddleware', () => {
    it('rejects ?token= query param and docs_access cookies on /admin/queues', async () => {
      const cache = { get: vi.fn().mockResolvedValue(undefined) };
      const prisma = {
        client: {
          mnt_user: { findFirst: vi.fn() },
        },
      };
      const middleware = new BullBoardAuthMiddleware(
        makeConfig({ JWT_SECRET, NODE_ENV: 'development' }),
        prisma as never,
        cache as never,
      );

      // 1. Attempt using ?token= query param only -> 401
      const reqQuery = {
        headers: {},
        query: { token: jwtSign({ id: 'u-1' }, JWT_SECRET) },
        cookies: {},
      };
      const resQuery = makeMockResponse();
      const nextQuery = vi.fn();
      await middleware.use(reqQuery as never, resQuery as never, nextQuery);
      expect(resQuery.statusCode).toBe(401);
      expect(nextQuery).not.toHaveBeenCalled();

      // 2. Attempt using docs_access cookie -> 401 (no cookie fallback)
      const docsJwt = jwtSign({ id: 'u-1', purpose: 'docs_access' }, JWT_SECRET);
      const reqDocsCookie = {
        headers: { cookie: `docs_access=${docsJwt}` },
        query: {},
        cookies: { docs_access: docsJwt },
      };
      const resDocsCookie = makeMockResponse();
      const nextDocsCookie = vi.fn();
      await middleware.use(
        reqDocsCookie as never,
        resDocsCookie as never,
        nextDocsCookie,
      );
      expect(resDocsCookie.statusCode).toBe(401);
      expect(nextDocsCookie).not.toHaveBeenCalled();

      // 3. Attempt passing docs_access JWT in Authorization Bearer header -> 403
      const reqDocsBearer = {
        headers: { authorization: `Bearer ${docsJwt}` },
        query: {},
        cookies: {},
      };
      const resDocsBearer = makeMockResponse();
      const nextDocsBearer = vi.fn();
      await middleware.use(
        reqDocsBearer as never,
        resDocsBearer as never,
        nextDocsBearer,
      );
      expect(resDocsBearer.statusCode).toBe(403);
      expect(nextDocsBearer).not.toHaveBeenCalled();
    });

    it('enforces listar-administracion permission and active status for /admin/queues', async () => {
      const apiToken = jwtSign({ id: 'user-123' }, JWT_SECRET);
      const cache = { get: vi.fn().mockResolvedValue(undefined) };

      const prismaWithoutPerm = {
        client: {
          mnt_user: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'user-123',
              mnt_user_rol: [{ mnt_role: { rol_permissions: [] } }],
            }),
          },
        },
      };
      const mwDenied = new BullBoardAuthMiddleware(
        makeConfig({ JWT_SECRET, NODE_ENV: 'production' }),
        prismaWithoutPerm as never,
        cache as never,
      );
      const resDenied = makeMockResponse();
      const nextDenied = vi.fn();
      await mwDenied.use(
        { headers: { authorization: `Bearer ${apiToken}` }, cookies: {} } as never,
        resDenied as never,
        nextDenied,
      );
      expect(resDenied.statusCode).toBe(403);
      expect(nextDenied).not.toHaveBeenCalled();

      const prismaAdmin = {
        client: {
          mnt_user: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'user-123',
              mnt_user_rol: [
                {
                  mnt_role: {
                    rol_permissions: [{ id: 'rp-1' }],
                  },
                },
              ],
            }),
          },
        },
      };
      const mwAllowed = new BullBoardAuthMiddleware(
        makeConfig({ JWT_SECRET, NODE_ENV: 'production' }),
        prismaAdmin as never,
        cache as never,
      );
      const resAllowed = makeMockResponse();
      const nextAllowed = vi.fn();
      await mwAllowed.use(
        { headers: { authorization: `Bearer ${apiToken}` }, cookies: {} } as never,
        resAllowed as never,
        nextAllowed,
      );
      expect(nextAllowed).toHaveBeenCalledTimes(1);
    });

    it('DocsAuthMiddleware requires purpose=docs_access', () => {
      expect(isDocsAccessTokenPayload({ id: 'u1' })).toBe(false);
      expect(isDocsAccessTokenPayload({ id: 'u1', purpose: 'queues_access' })).toBe(
        false,
      );
      expect(isDocsAccessTokenPayload({ id: 'u1', purpose: 'docs_access' })).toBe(
        true,
      );

      const middleware = new DocsAuthMiddleware(makeConfig({ JWT_SECRET }));
      const apiToken = jwtSign({ id: 'u1' }, JWT_SECRET);
      const resBad = makeMockResponse();
      const nextBad = vi.fn();
      middleware.use(
        {
          originalUrl: '/api/docs',
          headers: { cookie: `docs_access=${apiToken}` },
          cookies: { docs_access: apiToken },
        } as never,
        resBad as never,
        nextBad,
      );
      expect(nextBad).not.toHaveBeenCalled();
      expect(resBad.redirectUrl).toContain('/api/docs/login');

      const docsToken = jwtSign(
        { id: 'u1', purpose: 'docs_access' },
        JWT_SECRET,
      );
      const resOk = makeMockResponse();
      const nextOk = vi.fn();
      middleware.use(
        {
          originalUrl: '/api/docs',
          headers: {},
          cookies: { docs_access: docsToken },
        } as never,
        resOk as never,
        nextOk,
      );
      expect(nextOk).toHaveBeenCalledTimes(1);
    });
  });

  describe('CheckAuthenticatedUserGuard (IDOR)', () => {
    it('does NOT allow ver-perfil-usuario to bypass ownership unless explicitly listed', () => {
      const reflector = {
        get: vi.fn().mockReturnValue({ paramName: 'id', bypassWithPermissions: [] }),
      } as unknown as Reflector;
      const guard = new CheckAuthenticatedUserGuard(reflector);
      const ctx = {
        getHandler: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: 'victim-user-id' },
            user: {
              id: 'attacker-user-id',
              user_name: 'attacker',
              permissions: ['ver-perfil-usuario'],
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('allows explicit bypassWithPermissions when declared', () => {
      const reflector = {
        get: vi.fn().mockReturnValue({
          paramName: 'user_name',
          bypassWithPermissions: ['ver-perfil-usuario'],
        }),
      } as unknown as Reflector;
      const guard = new CheckAuthenticatedUserGuard(reflector);
      const ctx = {
        getHandler: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            params: { user_name: 'someone_else' },
            user: {
              id: 'admin-id',
              user_name: 'admin',
              permissions: ['ver-perfil-usuario'],
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Storage Path Confinement', () => {
    it('sanitizes traversal segments in folders and confines target paths', () => {
      expect(() => sanitizeStorageFolder('../../etc', 'profile_img')).toThrow();
      expect(() => sanitizeStorageFolder('a\\b', 'profile_img')).toThrow();
      expect(sanitizeStorageFolder('/profile_img/', 'profile_img')).toBe(
        'profile_img',
      );
      expect(
        resolveConfinedStoragePath('/app/storage', '../.env'),
      ).toBeNull();
      expect(
        resolveConfinedStoragePath('/app/storage', 'profile_img/avatar.png'),
      ).not.toBeNull();
    });

    it('LocalStorageBackend delete rejects traversal attempts safely', async () => {
      const backend = new LocalStorageBackend();
      await expect(backend.delete('../../.env')).resolves.toBe(false);
    });
  });

  describe('IdempotencyMiddleware & RequestIdMiddleware', () => {
    it('bypasses excluded auth endpoints like /api/v1/auth/login and /change-email/request', async () => {
      const cache = { get: vi.fn(), set: vi.fn() };
      const middleware = new IdempotencyMiddleware(cache as never);
      const next = vi.fn();

      await middleware.use(
        {
          originalUrl: '/api/v1/auth/login',
          method: 'POST',
          headers: { 'idempotency-key': randomUUID() },
          body: { user_name: 'alice', password: 'secret' },
        } as never,
        makeMockResponse() as never,
        next,
      );
      expect(cache.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);

      await middleware.use(
        {
          originalUrl: '/api/v1/auth/change-email/request',
          method: 'POST',
          headers: { 'idempotency-key': randomUUID() },
          body: {},
        } as never,
        makeMockResponse() as never,
        next,
      );
      expect(cache.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(2);
    });

    it('scopes cache key by actor + route and returns 409 on payload mismatch', async () => {
      const store = new Map<string, unknown>();
      const cache = {
        get: vi.fn(async (k: string) => store.get(k)),
        set: vi.fn(async (k: string, v: unknown) => {
          store.set(k, v);
        }),
      };
      const middleware = new IdempotencyMiddleware(cache as never);
      const key = randomUUID();
      const bodyHash = createHash('sha256')
        .update(JSON.stringify({ amount: 100 }))
        .digest('hex');

      const reqA = {
        originalUrl: '/api/v1/orders',
        method: 'POST',
        headers: {
          'idempotency-key': key,
          authorization: 'Bearer token-A',
        },
        ip: '127.0.0.1',
        body: { amount: 200 },
      };
      const actorHash = createHash('sha256')
        .update('Bearer token-A')
        .digest('hex');
      store.set(
        `idempotency:auth:${actorHash}:POST:/api/v1/orders:${key}`,
        { statusCode: 201, body: { ok: true }, bodyHash },
      );

      const resMismatch = makeMockResponse();
      const nextMismatch = vi.fn();
      await middleware.use(reqA as never, resMismatch as never, nextMismatch);
      expect(resMismatch.statusCode).toBe(409);
      expect(nextMismatch).not.toHaveBeenCalled();

      // Different actor with same idempotency key does NOT receive user A cached response
      const reqB = {
        ...reqA,
        headers: {
          'idempotency-key': key,
          authorization: 'Bearer token-B',
        },
      };
      const nextB = vi.fn();
      await middleware.use(reqB as never, makeMockResponse() as never, nextB);
      expect(nextB).toHaveBeenCalledTimes(1);
    });

    it('RequestIdMiddleware replaces invalid x-request-id with generated UUID', () => {
      const middleware = new RequestIdMiddleware();
      const reqBad = { headers: { 'x-request-id': 'bad\nvalue\x00' } };
      const resBad = makeMockResponse();
      middleware.use(reqBad as never, resBad as never, vi.fn());
      expect(resBad.getHeader('X-Request-ID')).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      const reqGood = { headers: { 'x-request-id': 'req_trace-123' } };
      const resGood = makeMockResponse();
      middleware.use(reqGood as never, resGood as never, vi.fn());
      expect(resGood.getHeader('X-Request-ID')).toBe('req_trace-123');
    });
  });

  describe('LoginThrottleGuard & MetricsController', () => {
    it('LoginThrottleGuard ignores spoofed x-forwarded-for and uses req.ip', async () => {
      const guard = new LoginThrottleGuard(
        {} as never,
        {} as never,
        new Reflector(),
      );
      const getTracker = Reflect.get(guard, 'getTracker').bind(guard) as (
        req: Record<string, unknown>,
      ) => Promise<string>;
      const tracker = await getTracker({
        ip: '198.51.100.7',
        headers: { 'x-forwarded-for': '203.0.113.99' },
        body: { user_name: 'Alice' },
      });
      expect(tracker).toBe('198.51.100.7:alice');
    });

    it('MetricsController enforces METRICS_TOKEN and blocks production without token', async () => {
      const controllerWithToken = new MetricsController(
        makeConfig({ METRICS_TOKEN: 'secret-metrics-key', NODE_ENV: 'production' }),
      );
      await expect(
        controllerWithToken.index(
          { headers: { authorization: 'Bearer wrong' } } as never,
          makeMockResponse() as never,
        ),
      ).rejects.toThrow(/Invalid metrics token/);

      const controllerNoTokenProd = new MetricsController(
        makeConfig({ NODE_ENV: 'production' }),
      );
      await expect(
        controllerNoTokenProd.index(
          { headers: {} } as never,
          makeMockResponse() as never,
        ),
      ).rejects.toThrow(/Metrics endpoint disabled/);
    });
  });

  describe('Email Change Flow, UpdateProfile Option A, Sessions & Password Reset', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('UpdateProfileHandler ignores attempted email changes (Option A)', async () => {
      const personUpdateService = { run: vi.fn().mockResolvedValue(undefined) };
      const userReadRepository = {
        getOneById: vi.fn().mockResolvedValue({
          id: 'u-1',
          id_people: 'p-1',
          email: 'original@example.com',
          id_status: MultipleStatusId.ACTIVE,
          user_name: 'alice',
        }),
      };
      const handler = new UpdateProfileHandler(
        personUpdateService as never,
        {} as never,
        { run: vi.fn().mockResolvedValue(undefined) } as never,
        { run: vi.fn() } as never,
        { run: vi.fn() } as never,
        userReadRepository as never,
        { execute: vi.fn() } as never,
      );

      const dto = new UpdateProfileDto(
        'Alice',
        null,
        'Doe',
        null,
        'attacker@evil.com',
        null,
        null,
        null,
        null,
        null,
        [],
        null,
        null,
        'alice',
        '',
        new Date(),
        null,
        'u-1',
      );

      await handler.execute(new UpdateProfileCommand(dto, 'LOCAL'));
      expect(personUpdateService.run).toHaveBeenCalledTimes(1);
      const passedPersonDto = personUpdateService.run.mock.calls[0]?.[0] as {
        email: string;
      };
      expect(passedPersonDto.email).toBe('original@example.com');
    });

    it('RequestEmailChangeHandler validates password, uniqueness, and enqueues worker email', async () => {
      const emailChangeTokenPort = {
        saveChallenge: vi.fn().mockResolvedValue(undefined),
      };
      const emailSenderPort = {
        sendEmailChangeConfirmation: vi.fn().mockResolvedValue(undefined),
      };
      const handler = new RequestEmailChangeHandler(
        {
          getOneById: vi.fn().mockResolvedValue({
            id: 'u-1',
            id_people: 'p-1',
            user_name: 'alice',
            email: 'old@example.com',
            password: 'hashed-password',
          }),
        } as never,
        {
          getOneByEmail: vi.fn().mockResolvedValue(null),
        } as never,
        {
          compare: vi.fn().mockImplementation(async (plain: string) => plain === 'correct-pass'),
        } as never,
        emailChangeTokenPort as never,
        emailSenderPort as never,
      );

      await expect(
        handler.execute(
          new RequestEmailChangeCommand('u-1', 'wrong-pass', 'new@example.com'),
        ),
      ).rejects.toThrow(UnauthorizedException);

      await handler.execute(
        new RequestEmailChangeCommand('u-1', 'correct-pass', 'NEW@example.com'),
      );
      expect(emailChangeTokenPort.saveChallenge).toHaveBeenCalledTimes(1);
      expect(emailSenderPort.sendEmailChangeConfirmation).toHaveBeenCalledTimes(1);
    });

    it('ConfirmEmailChangeHandler validates token, updates person email, deletes challenge, and revokes sessions', async () => {
      const rawToken = 'a'.repeat(64);
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const challenge = {
        id: '11111111-1111-4111-8111-111111111111',
        user_id: 'u-1',
        person_id: '22222222-2222-4222-8222-222222222222',
        new_email: 'verified-new@example.com',
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      };
      const tokenPort = {
        findChallengeById: vi.fn().mockResolvedValue(challenge),
        deleteChallenge: vi.fn().mockResolvedValue(undefined),
      };
      const personRepo = {
        getOneByEmail: vi.fn().mockResolvedValue(null),
        updateEmail: vi.fn().mockResolvedValue(undefined),
      };
      const authPort = {
        closeSession: vi.fn().mockResolvedValue(undefined),
        blacklistAccessToken: vi.fn().mockResolvedValue(undefined),
      };

      const handler = new ConfirmEmailChangeHandler(
        tokenPort as never,
        personRepo as never,
        authPort as never,
      );

      await expect(
        handler.execute(new ConfirmEmailChangeCommand(challenge.id, 'wrong-token')),
      ).rejects.toThrow(BadRequestException);

      // Conflict when another person claimed email between request and confirm
      personRepo.getOneByEmail.mockResolvedValueOnce({
        getId: () => ({ value: () => '33333333-3333-4333-8333-333333333333' }),
      });
      await expect(
        handler.execute(new ConfirmEmailChangeCommand(challenge.id, rawToken)),
      ).rejects.toThrow(ConflictException);

      // Valid confirmation
      personRepo.getOneByEmail.mockResolvedValueOnce(null);
      await handler.execute(new ConfirmEmailChangeCommand(challenge.id, rawToken));
      expect(personRepo.updateEmail).toHaveBeenCalledTimes(1);
      expect(tokenPort.deleteChallenge).toHaveBeenCalledWith(challenge.id, 'u-1');
      expect(authPort.closeSession).toHaveBeenCalledWith({ id: 'u-1' });
      expect(authPort.blacklistAccessToken).toHaveBeenCalledTimes(1);
    });

    it('ResetPasswordUserHandler closes sessions and blacklists active access tokens', async () => {
      const mockUser = {
        getPassword: () => ({ value: () => 'old-hash' }),
        resetPassword: vi.fn(),
        getDomainEvents: () => [],
        clearDomainEvents: vi.fn(),
      };
      const authPort = {
        closeSession: vi.fn().mockResolvedValue(undefined),
        blacklistAccessToken: vi.fn().mockResolvedValue(undefined),
      };
      const handler = new ResetPasswordUserHandler(
        {
          findById: vi.fn().mockResolvedValue(mockUser),
          checkPasswordHistory: vi.fn().mockResolvedValue(undefined),
          savePasswordHistory: vi.fn().mockResolvedValue(undefined),
          update: vi.fn().mockResolvedValue(undefined),
        } as never,
        { dispatch: vi.fn().mockResolvedValue(undefined) } as never,
        { hash: vi.fn().mockResolvedValue('new-hash-123456') } as never,
        authPort as never,
      );

      const userId = '11111111-1111-4111-8111-111111111111';
      await handler.execute(
        new ResetPasswordUserCommand(userId, 'NewStrong1!'),
      );
      expect(authPort.closeSession).toHaveBeenCalledWith({ id: userId });
      expect(authPort.blacklistAccessToken).toHaveBeenCalledTimes(1);
    });

    it('RefreshHandler blocks INACTIVE users, rotates via consumeRefreshTokenSession, and keeps blacklist intact', async () => {
      const authPort = {
        decodeToken: vi
          .fn()
          .mockResolvedValueOnce({ id: 'u-1', user_name: 'alice' }),
        consumeRefreshTokenSession: vi.fn().mockResolvedValue({ sessionId: 's-2' }),
        clearAccessTokenBlacklist: vi.fn(),
        generateToken: vi.fn().mockResolvedValue('new-access'),
        generateRefreshToken: vi.fn().mockResolvedValue('new-refresh'),
      };
      const findUser = {
        run: vi.fn().mockResolvedValueOnce({
          id: 'u-1',
          id_people: 'p-1',
          user_name: 'alice',
          id_status: MultipleStatusId.INACTIVE,
          last_access: new Date(),
          is_validated: true,
          permissions: [],
        }),
      };
      const handler = new RefreshHandler(
        authPort as never,
        findUser as never,
        { createUpdate: vi.fn().mockResolvedValue(undefined) } as never,
      );

      await expect(
        handler.execute(new RefreshCommand('incoming-refresh')),
      ).rejects.toThrow(UnauthorizedException);

      // Reset for active user test
      authPort.decodeToken
        .mockResolvedValueOnce({ id: 'u-1', user_name: 'alice' })
        .mockResolvedValueOnce({ exp: Math.floor(Date.now() / 1000) + 3600 });
      findUser.run.mockResolvedValueOnce({
        id: 'u-1',
        id_people: 'p-1',
        user_name: 'alice',
        id_status: MultipleStatusId.ACTIVE,
        last_access: new Date(),
        is_validated: true,
        permissions: [],
      });

      const result = await handler.execute(new RefreshCommand('incoming-refresh'));
      expect(result.token).toBe('new-access');
      expect(authPort.consumeRefreshTokenSession).toHaveBeenCalledWith(
        'u-1',
        'incoming-refresh',
      );
      expect(authPort.clearAccessTokenBlacklist).not.toHaveBeenCalled();
    });
  });
});
