import { AuditLogEntry } from '@/modules/audit/domain/entities/audit-log';
import { AuditLoggerPort } from '@/modules/audit/domain/ports/audit-logger.port';
import { AuditQueuePort } from '@/modules/audit/domain/ports/audit-queue.port';

export type { AuditLogEntry };

export class AuditLogService {
  constructor(
    private readonly auditQueue: AuditQueuePort,
    private readonly logger: AuditLoggerPort,
  ) {}

  /**
   * Fire-and-forget: enqueues the audit entry without blocking the response.
   * Any queueing failure is swallowed and logged as a warning so that
   * audit errors never affect the main business flow.
   */
  log(entry: AuditLogEntry): void {
    this.auditQueue.enqueue(entry).catch((err: Error) => {
      this.logger.warn(
        `Failed to enqueue audit log [${entry.action}]: ${err.message}`,
      );
    });
  }
}
