import { AuditLogRepository } from '@/modules/audit/domain/repositories/audit-log.repository';
import { ImplAuditLogRepository } from '@/modules/audit/infrastructure/implementation/impl-audit-log.repository';
import { AuditLoggerPort } from '@/modules/audit/domain/ports/audit-logger.port';
import { ImplAuditLoggerPort } from '@/modules/audit/infrastructure/implementation/impl-audit-logger.port';
import { AuditLogReadRepository } from '@/modules/audit/application/repositories/audit-log-read.repository';
import { AuditQueuePort } from '@/modules/audit/domain/ports/audit-queue.port';
import { ImplAuditQueuePort } from '@/modules/audit/infrastructure/implementation/impl-audit-queue.port';

export const repositories = [
  { provide: AuditLogRepository, useClass: ImplAuditLogRepository },
  { provide: AuditLogReadRepository, useClass: ImplAuditLogRepository },
  { provide: AuditLoggerPort, useClass: ImplAuditLoggerPort },
  { provide: AuditQueuePort, useClass: ImplAuditQueuePort },
];
