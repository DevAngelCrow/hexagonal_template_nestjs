import { registerService } from '@/shared/infrastructure/factories/register-service.factory';
import { AuditLogService } from '@/modules/audit/application/services/audit-log.service';
import { AuditQueuePort } from '@/modules/audit/domain/ports/audit-queue.port';
import { AuditLoggerPort } from '@/modules/audit/domain/ports/audit-logger.port';

const servicesToRegister = [
  {
    service: AuditLogService,
    deps: [AuditQueuePort, AuditLoggerPort],
  },
];

export const services = servicesToRegister.map((uc) => {
  return registerService(uc.service, uc.deps);
});
