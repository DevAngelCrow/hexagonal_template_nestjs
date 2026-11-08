import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageFileListDto } from '@/modules/storage/application/dtos/storage-file-list.dto';
import { StorageFiles } from '@/modules/storage/domain/entities/storage-files';

export class StorageFilesHttpDto {
  @ApiProperty({ description: 'ID único del archivo almacenado' })
  public readonly id: string;

  @ApiProperty({ description: 'Nombre original del archivo' })
  public readonly filename: string;

  @ApiProperty({ description: 'Tipo MIME del archivo' })
  public readonly mime_type: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes' })
  public readonly size: number;

  @ApiProperty({ description: 'Ruta o URL pública accesible del archivo' })
  public readonly path: string;

  @ApiProperty({ description: 'Estado activo del archivo' })
  public readonly active: boolean;

  @ApiProperty({ description: 'ID del proveedor de almacenamiento' })
  public readonly id_provider: string;

  @ApiPropertyOptional({ description: 'ID del usuario que subió el archivo' })
  public readonly id_user: string | null;

  @ApiPropertyOptional({ description: 'Fecha de creación' })
  public readonly created_at: Date | null;

  constructor(
    id: string,
    filename: string,
    mime_type: string,
    size: number,
    path: string,
    active: boolean,
    id_provider: string,
    id_user: string | null = null,
    created_at: Date | null = null,
  ) {
    this.id = id;
    this.filename = filename;
    this.mime_type = mime_type;
    this.size = size;
    this.path = path;
    this.active = active;
    this.id_provider = id_provider;
    this.id_user = id_user;
    this.created_at = created_at;
  }

  public static fromDto(dto: StorageFileListDto): StorageFilesHttpDto {
    return new StorageFilesHttpDto(
      dto.id,
      dto.filename,
      dto.mime_type,
      dto.size,
      dto.path,
      dto.active,
      dto.id_provider,
      dto.id_user,
      dto.created_at,
    );
  }

  public static fromEntity<T>(entity: StorageFiles<T>): StorageFilesHttpDto {
    return new StorageFilesHttpDto(
      entity.getId()?.value() ?? '',
      entity.getFilename().value(),
      entity.getMimeType().value(),
      entity.getSize().value(),
      entity.getPath().value(),
      entity.getActive().value(),
      entity.getIdProvider().value(),
      entity.getIdUser()?.value() ?? null,
      null,
    );
  }
}
