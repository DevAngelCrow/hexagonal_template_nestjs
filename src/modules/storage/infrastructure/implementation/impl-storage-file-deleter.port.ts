import { Injectable, Logger } from '@nestjs/common';
import { StorageFileDeleterPort } from '@/modules/storage/domain/ports/storage-file-deleter.port';
import { StorageBackendRegistry } from '@/modules/storage/infrastructure/backends/storage-backend.registry';
import { PrismaService } from '@/shared/infrastructure/db/prisma.service';

@Injectable()
export class ImplStorageFileDeleterPort extends StorageFileDeleterPort {
  private readonly logger = new Logger(ImplStorageFileDeleterPort.name);

  constructor(
    private readonly backends: StorageBackendRegistry,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async delete(pathOrUrl: string, providerCode?: string): Promise<boolean> {
    if (!pathOrUrl) return false;

    try {
      const backend = this.backends.resolve(providerCode);
      const deleted = await backend.delete(pathOrUrl);

      // Marca el archivo como inactivo en mnt_storage_files si está registrado
      await this.prisma.client.mnt_storage_files.updateMany({
        where: { path: pathOrUrl },
        data: { active: false, deleted_at: new Date() },
      });

      return deleted;
    } catch (error) {
      this.logger.error(
        `Error al procesar eliminación de almacenamiento para "${pathOrUrl}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}

