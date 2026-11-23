import { AuditLogEntry } from '@/modules/audit/application/services/audit-log.service';

export abstract class AuditQueuePort {
  abstract enqueue(entry: AuditLogEntry): Promise<void>;
}
