import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import { AuditAction } from '@/modules/audit/domain/enums/audit-action.enum';

export class AuditLogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
