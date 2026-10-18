import { AuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { ImplAuditLogRepository } from '../implementation/impl-audit-log.repository';
import { AuditLoggerPort } from '../../domain/ports/audit-logger.port';
import { ImplAuditLoggerPort } from '../implementation/impl-audit-logger.port';
import { AuditLogReadRepository } from '../../application/repositories/audit-log-read.repository';

export const repositories = [
  { provide: AuditLogRepository, useClass: ImplAuditLogRepository },
  { provide: AuditLogReadRepository, useClass: ImplAuditLogRepository },
  { provide: AuditLoggerPort, useClass: ImplAuditLoggerPort },
];
