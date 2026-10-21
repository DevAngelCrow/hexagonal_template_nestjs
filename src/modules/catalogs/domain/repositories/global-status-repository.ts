import { GlobalStatus } from '@/modules/catalogs/domain/entities/global-status';
import { GlobalStatusId } from '@/modules/catalogs/domain/value-objects/goblal-status-value-object/global-status-id';
export abstract class GlobalStatsusRepository {
  abstract create(global_status: GlobalStatus): Promise<void>;
  abstract update(global_status: GlobalStatus): Promise<void>;
  abstract toggleStatus(id: GlobalStatusId): Promise<GlobalStatus>;
}
