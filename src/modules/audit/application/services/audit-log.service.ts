import { AuditAction } from '@/modules/audit/domain/enums/audit-action.enum';
import { AuditLoggerPort } from '@/modules/audit/domain/ports/audit-logger.port';
import { AuditQueuePort } from '@/modules/audit/domain/ports/audit-queue.port';

export interface AuditLogEntry {
  action: AuditAction;
  user_name?: string | null;
  user_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
  /** The type/name of the business entity affected (e.g. 'User', 'Invoice') */
  entity_type?: string | null;
  /** The ID of the business entity affected */
  entity_id?: string | null;
  /** Correlation request ID */
  request_id?: string | null;
}

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
