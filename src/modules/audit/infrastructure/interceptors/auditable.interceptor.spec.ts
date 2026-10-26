import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { AuditableInterceptor } from './auditable.interceptor';
import { AuditLogService } from '@/modules/audit/application/services/audit-log.service';
import { AuditAction } from '@/modules/audit/domain/enums/audit-action.enum';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';

describe('AuditableInterceptor', () => {
  const createMockContext = (request: Record<string, unknown>): ExecutionContext => {
    return {
      getType: () => 'http',
      getHandler: () => () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('logs immediately when outside of a transaction', async () => {
    const reflector = {
      get: vi.fn().mockReturnValue({
        action: AuditAction.REGISTER,
        entityType: 'User',
      }),
    } as unknown as Reflector;

    const auditLogService = {
      log: vi.fn(),
    } as unknown as AuditLogService;

    const transactionContext = {
      isInTransaction: vi.fn().mockReturnValue(false),
      addAfterCommitHook: vi.fn(),
    } as unknown as TransactionContextService;

    const interceptor = new AuditableInterceptor(
      reflector,
      auditLogService,
      transactionContext,
    );

    const context = createMockContext({
      headers: { 'user-agent': 'Jest' },
      user: { id: 'u1', user_name: 'john' },
      params: { id: '123' },
    });

    const next: CallHandler = {
      handle: () => of({ success: true }),
    };

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, next).subscribe({
        next: () => resolve(),
      });
    });

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.REGISTER,
        user_id: 'u1',
        user_name: 'john',
        entity_type: 'User',
      }),
    );
    expect(transactionContext.addAfterCommitHook).not.toHaveBeenCalled();
  });

  it('enqueues logging to after-commit hook when inside a transaction', async () => {
    const reflector = {
      get: vi.fn().mockReturnValue({
        action: AuditAction.REGISTER,
        entityType: 'User',
      }),
    } as unknown as Reflector;

    const auditLogService = {
      log: vi.fn(),
    } as unknown as AuditLogService;

    let capturedHook: (() => void) | undefined;
    const transactionContext = {
      isInTransaction: vi.fn().mockReturnValue(true),
      addAfterCommitHook: vi.fn((hook: () => void) => {
        capturedHook = hook;
      }),
    } as unknown as TransactionContextService;

    const interceptor = new AuditableInterceptor(
      reflector,
      auditLogService,
      transactionContext,
    );

    const context = createMockContext({
      headers: {},
      user: { id: 'u1', user_name: 'john' },
      params: { id: '123' },
    });

    const next: CallHandler = {
      handle: () => of({ success: true }),
    };

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, next).subscribe({
        next: () => resolve(),
      });
    });

    // Not logged immediately
    expect(auditLogService.log).not.toHaveBeenCalled();
    expect(transactionContext.addAfterCommitHook).toHaveBeenCalledOnce();

    // After commit hook executes
    expect(capturedHook).toBeDefined();
    capturedHook!();

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.REGISTER,
        user_id: 'u1',
      }),
    );
  });

  it('logs failureAction immediately on error even if inside transaction', async () => {
    const reflector = {
      get: vi.fn().mockReturnValue({
        action: AuditAction.LOGIN_SUCCESS,
        failureAction: AuditAction.LOGIN_FAILED,
        entityType: 'User',
      }),
    } as unknown as Reflector;

    const auditLogService = {
      log: vi.fn(),
    } as unknown as AuditLogService;

    const transactionContext = {
      isInTransaction: vi.fn().mockReturnValue(true),
      addAfterCommitHook: vi.fn(),
    } as unknown as TransactionContextService;

    const interceptor = new AuditableInterceptor(
      reflector,
      auditLogService,
      transactionContext,
    );

    const context = createMockContext({
      headers: {},
      body: { user_name: 'bad_user' },
    });

    const next: CallHandler = {
      handle: () => throwError(() => new Error('Invalid credentials')),
    };

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, next).subscribe({
        error: () => resolve(),
      });
    });

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.LOGIN_FAILED,
        user_name: 'bad_user',
      }),
    );
    expect(transactionContext.addAfterCommitHook).not.toHaveBeenCalled();
  });
});
