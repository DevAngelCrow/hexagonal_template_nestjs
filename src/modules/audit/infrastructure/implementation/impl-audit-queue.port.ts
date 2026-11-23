import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@/shared/infrastructure/queues/queues.constants';
import { AuditQueuePort } from '@/modules/audit/domain/ports/audit-queue.port';
import { AuditLogEntry } from '@/modules/audit/application/services/audit-log.service';

@Injectable()
export class ImplAuditQueuePort implements AuditQueuePort {
  constructor(
    @InjectQueue(QUEUE_NAMES.AUDIT_LOGS)
    private readonly auditQueue: Queue,
  ) {}

  async enqueue(entry: AuditLogEntry): Promise<void> {
    await this.auditQueue.add('persist-log', entry, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: { count: 100 },
    });
  }
}
