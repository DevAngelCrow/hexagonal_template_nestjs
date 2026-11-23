import { AuditLogEntry } from '@/modules/audit/domain/entities/audit-log';

export abstract class AuditQueuePort {
  abstract enqueue(entry: AuditLogEntry): Promise<void>;
}
