import { describe, it, expect, vi } from 'vitest';
import { AuditLogProcessor } from './audit-log.processor';
import { AuditLogRepository } from '@/modules/audit/domain/repositories/audit-log.repository';
import { AuditLoggerPort } from '@/modules/audit/domain/ports/audit-logger.port';
import { AuditAction } from '@/modules/audit/domain/enums/audit-action.enum';
import { Job } from 'bullmq';
import { AuditLogEntry } from '@/modules/audit/application/services/audit-log.service';

describe('AuditLogProcessor', () => {
  it('processes job and invokes repository.create', async () => {
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

    const processor = new AuditLogProcessor(mockRepo, mockLogger);
    const mockJob = {
      id: 'job-1',
      data: {
        action: AuditAction.REGISTER,
        user_id: 'user-1',
        user_name: 'john',
        request_id: 'req-999',
      },
    } as unknown as Job<AuditLogEntry>;

    await processor.process(mockJob);

    expect(mockRepo.create).toHaveBeenCalledOnce();
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.REGISTER,
        user_id: 'user-1',
        request_id: 'req-999',
      }),
    );
  });

  it('logs error and rethrows when repository fails so BullMQ can retry', async () => {
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

    const processor = new AuditLogProcessor(mockRepo, mockLogger);
    const mockJob = {
      id: 'job-2',
      data: {
        action: AuditAction.LOGIN_SUCCESS,
        user_id: 'user-1',
      },
    } as unknown as Job<AuditLogEntry>;

    await expect(processor.process(mockJob)).rejects.toThrow('DB failure');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to process audit log job [job-2]'),
      expect.any(String),
    );
  });
});
