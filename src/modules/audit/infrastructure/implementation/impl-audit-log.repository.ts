import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from '@/modules/audit/domain/repositories/audit-log.repository';
import {
  AuditLogFilters,
  AuditLogReadRepository,
} from '@/modules/audit/application/repositories/audit-log-read.repository';
import { AuditLog } from '@/modules/audit/domain/entities/audit-log';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { AuditLogDto } from '@/modules/audit/application/dtos/audit-log.dto';
import { EntityList } from '@/shared/domain/value-object/entity-list';
import { TotalItems } from '@/shared/domain/value-object/total-items';
import { TotalPages } from '@/shared/domain/value-object/total-page';
import { AuditAction } from '@/modules/audit/domain/enums/audit-action.enum';

@Injectable()
export class ImplAuditLogRepository
  implements AuditLogRepository, AuditLogReadRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(auditLog: AuditLog): Promise<void> {
    // Use `this.prisma.rootClient` (not `this.prisma.client`) so that audit logs
    // are written outside any ongoing business transaction — ensuring they are
    // persisted even when the parent transaction rolls back or has already committed.
    await this.prisma.rootClient.mnt_audit_log.create({
      data: {
        action: auditLog.action,
        user_name: auditLog.user_name,
        user_id: auditLog.user_id,
        ip_address: auditLog.ip_address,
        user_agent: auditLog.user_agent,
        entity_type: auditLog.entity_type,
        entity_id: auditLog.entity_id,
        metadata:
          auditLog.metadata && typeof auditLog.metadata === 'object'
            ? (auditLog.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      },
    });
  }

  async getAll(
    pagination_params: PaginationParams,
    filters?: AuditLogFilters,
  ): Promise<Pagination<AuditLogDto>> {
    const where: Prisma.mnt_audit_logWhereInput = {
      ...(filters?.action ? { action: filters.action } : {}),
      ...(filters?.user_id ? { user_id: filters.user_id } : {}),
      ...(filters?.entity_type ? { entity_type: filters.entity_type } : {}),
      ...(filters?.from || filters?.to
        ? {
            created_at: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const skip =
      (pagination_params.getPage().value() - 1) *
      pagination_params.getPerPage().value();
    const take = pagination_params.getPerPage().value();

    const [rows, total] = await Promise.all([
      this.prisma.client.mnt_audit_log.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.client.mnt_audit_log.count({ where }),
    ]);

    const items: AuditLogDto[] = rows.map(
      (r) =>
        new AuditLogDto(
          r.id,
          r.action as AuditAction,
          r.user_id,
          r.user_name,
          r.ip_address,
          r.user_agent,
          r.entity_type,
          r.entity_id,
          typeof r.metadata === 'object' && r.metadata !== null
            ? (r.metadata as Record<string, unknown>)
            : null,
          r.created_at,
        ),
    );

    return new Pagination<AuditLogDto>(
      new EntityList<AuditLogDto>(items),
      pagination_params.getPage(),
      pagination_params.getPerPage(),
      new TotalItems(total),
      new TotalPages(Math.ceil(total / pagination_params.getPerPage().value())),
    );
  }
}
