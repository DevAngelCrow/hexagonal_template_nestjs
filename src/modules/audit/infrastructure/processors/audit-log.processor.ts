import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '@/shared/infrastructure/queues/queues.constants';
import { AuditLogRepository } from '@/modules/audit/domain/repositories/audit-log.repository';
import { AuditLog } from '@/modules/audit/domain/entities/audit-log';
import { AuditLogEntry } from '@/modules/audit/application/services/audit-log.service';
import { AuditLoggerPort } from '@/modules/audit/domain/ports/audit-logger.port';

@Processor(QUEUE_NAMES.AUDIT_LOGS)
export class AuditLogProcessor extends WorkerHost {
  constructor(
    private readonly repository: AuditLogRepository,
    private readonly logger: AuditLoggerPort,
  ) {
    super();
  }

  async process(job: Job<AuditLogEntry>): Promise<void> {
    try {
      const auditLog = AuditLog.create(job.data);
      await this.repository.create(auditLog);
    } catch (error) {
      this.logger.error(
        `Failed to process audit log job [${job.id}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
