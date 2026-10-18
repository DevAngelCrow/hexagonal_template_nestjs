import { describe, it, expect, vi } from 'vitest';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from '../../domain/enums/audit-action.enum';
import { AuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLoggerPort } from '../../domain/ports/audit-logger.port';

describe('AuditLogService', () => {
  it('creates an audit log entry and calls repository.create', async () => {
    const mockRepo: AuditLogRepository = {
      create: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findAll: vi.fn(),
    };
    const mockLogger: AuditLoggerPort = {
      warn: vi.fn(),
      log: vi.fn(),
      error: vi.fn(),
    };

    const service = new AuditLogService(mockRepo, mockLogger);
    service.log({
      action: AuditAction.LOGIN_SUCCESS,
      user_id: 'user-123',
      ip_address: '127.0.0.1',
    });

    expect(mockRepo.create).toHaveBeenCalledOnce();
  });

  it('swallows errors and logs a warning when repository fails', async () => {
    const mockRepo: AuditLogRepository = {
      create: vi.fn().mockRejectedValue(new Error('DB failure')),
      findById: vi.fn(),
      findAll: vi.fn(),
    };
    const mockLogger: AuditLoggerPort = {
      warn: vi.fn(),
      log: vi.fn(),
      error: vi.fn(),
    };

    const service = new AuditLogService(mockRepo, mockLogger);
    service.log({
      action: AuditAction.LOGIN_FAILED,
      user_name: 'test@example.com',
    });

    // Let the rejected promise execute
    await new Promise((r) => setTimeout(r, 10));

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to write audit log'),
    );
  });
});
