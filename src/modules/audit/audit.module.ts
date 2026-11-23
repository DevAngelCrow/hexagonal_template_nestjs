import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RouterModule } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { QUEUE_NAMES } from '@/shared/infrastructure/queues/queues.constants';
import { AuditLogService } from './application/services/audit-log.service';
import { repositories } from './infrastructure/config/repositories.config';
import { services } from './infrastructure/config/services.config';
import { PrismaModule } from '@/shared/infrastructure/db/prisma.module';
import { AuditableInterceptor } from './infrastructure/interceptors/auditable.interceptor';
import { AuditController } from './infrastructure/controllers/audit.controller';
import { GetAuditLogsHandler } from './application/queries/get-audit-logs/get-audit-logs.handler';

@Module({
  imports: [
    PrismaModule,
    CqrsModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.AUDIT_LOGS,
    }),
    BullBoardModule.forFeature({
      name: QUEUE_NAMES.AUDIT_LOGS,
      adapter: BullMQAdapter,
    }),
    RouterModule.register([{ path: 'audit', module: AuditModule }]),
  ],
  controllers: [AuditController],
  providers: [
    AuditableInterceptor,
    GetAuditLogsHandler,
    ...repositories,
    ...services,
  ],
  exports: [
    AuditLogService,
    AuditableInterceptor,
    ...repositories,
    BullModule,
  ],
})
export class AuditModule {}
