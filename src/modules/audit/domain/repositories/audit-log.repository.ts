import { AuditLog } from '@/modules/audit/domain/entities/audit-log';

export abstract class AuditLogRepository {
  abstract create(auditLog: AuditLog): Promise<void>;
}
