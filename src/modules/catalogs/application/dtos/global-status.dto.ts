import { GlobalStatusDto as SharedGlobalStatusDto } from '@/shared/application/dtos/global-status.dto';
import { GlobalStatus } from '@/modules/catalogs/domain/entities/global-status';

export class GlobalStatusDto<T = unknown> extends SharedGlobalStatusDto<T> {
  public static fromEntity(globalStatus: GlobalStatus): GlobalStatusDto {
    return new GlobalStatusDto(
      globalStatus.getName().value(),
      globalStatus.getDescription().value(),
      globalStatus.getCode().value(),
      globalStatus.getActive().value(),
      globalStatus.getStateColor().value(),
      globalStatus.getTextColor().value(),
      globalStatus.getIdCategoryStatus().value(),
      globalStatus.getId() ? globalStatus.getId()!.value() : undefined,
    );
  }

  public static override fromDto<T>(dto: SharedGlobalStatusDto<T>): GlobalStatusDto<T> {
    return new GlobalStatusDto(
      dto.name,
      dto.description,
      dto.code,
      dto.active,
      dto.state_color,
      dto.text_color,
      dto.id_category_status,
      dto.id,
      dto.category_status,
    );
  }
}
