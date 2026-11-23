import { describe, it, expect, vi } from 'vitest';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from '@/modules/audit/domain/enums/audit-action.enum';
import { AuditQueuePort } from '@/modules/audit/domain/ports/audit-queue.port';
import { AuditLoggerPort } from '@/modules/audit/domain/ports/audit-logger.port';

describe('AuditLogService', () => {
  it('enqueues an audit log entry via AuditQueuePort', async () => {
    const mockQueue: AuditQueuePort = {
      enqueue: vi.fn().mockResolvedValue(undefined),
    };
    const mockLogger: AuditLoggerPort = {
      warn: vi.fn(),
      log: vi.fn(),
      error: vi.fn(),
    };

    const service = new AuditLogService(mockQueue, mockLogger);
    service.log({
      action: AuditAction.LOGIN_SUCCESS,
      user_id: 'user-123',
      ip_address: '127.0.0.1',
      request_id: 'req-abc-123',
    });

    expect(mockQueue.enqueue).toHaveBeenCalledOnce();
    expect(mockQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.LOGIN_SUCCESS,
        user_id: 'user-123',
        request_id: 'req-abc-123',
      }),
    );
  });

  it('swallows errors and logs a warning when queueing fails', async () => {
    const mockQueue: AuditQueuePort = {
      enqueue: vi.fn().mockRejectedValue(new Error('Redis connection failure')),
    };
    const mockLogger: AuditLoggerPort = {
      warn: vi.fn(),
      log: vi.fn(),
      error: vi.fn(),
    };

    const service = new AuditLogService(mockQueue, mockLogger);
    service.log({
      action: AuditAction.LOGIN_FAILED,
      user_name: 'test@example.com',
    });

    // Allow promise rejection handler to run
    await new Promise((r) => setTimeout(r, 10));

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to enqueue audit log'),
    );
  });
});
