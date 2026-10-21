import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { AuditLogDto } from '@/modules/audit/application/dtos/audit-log.dto';

export interface AuditLogFilters {
  action?: string;
  user_id?: string;
  entity_type?: string;
  from?: Date;
  to?: Date;
}

export abstract class AuditLogReadRepository {
  abstract getAll(
    pagination_params: PaginationParams,
    filters?: AuditLogFilters,
  ): Promise<Pagination<AuditLogDto>>;
}
