import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImplStorageFileDeleterPort } from '@/modules/storage/infrastructure/implementation/impl-storage-file-deleter.port';
import { StorageBackendRegistry } from '@/modules/storage/infrastructure/backends/storage-backend.registry';
import { PrismaService } from '@/shared/infrastructure/db/prisma.service';

describe('ImplStorageFileDeleterPort', () => {
  let deleter: ImplStorageFileDeleterPort;
  let mockBackendRegistry: StorageBackendRegistry;
  let mockBackend: any;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBackend = {
      delete: vi.fn().mockResolvedValue(true),
    };

    mockBackendRegistry = {
      resolve: vi.fn().mockReturnValue(mockBackend),
    } as unknown as StorageBackendRegistry;

    mockPrisma = {
      client: {
        mnt_storage_files: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      },
    } as unknown as PrismaService;

    deleter = new ImplStorageFileDeleterPort(mockBackendRegistry, mockPrisma);
  });

  it('should call backend.delete and mark file inactive in database', async () => {
    const path = 'https://pub-r2.dev/inventory_img/sample.jpg';
    const result = await deleter.delete(path);

    expect(result).toBe(true);
    expect(mockBackendRegistry.resolve).toHaveBeenCalledWith(undefined);
    expect(mockBackend.delete).toHaveBeenCalledWith(path);
    expect(mockPrisma.client.mnt_storage_files.updateMany).toHaveBeenCalledWith({
      where: { path },
      data: { active: false, deleted_at: expect.any(Date) },
    });
  });

  it('should return false immediately when path is empty without calling backend or prisma', async () => {
    const result = await deleter.delete('');

    expect(result).toBe(false);
    expect(mockBackend.delete).not.toHaveBeenCalled();
    expect(mockPrisma.client.mnt_storage_files.updateMany).not.toHaveBeenCalled();
  });

  it('should handle backend error gracefully and return false', async () => {
    mockBackend.delete.mockRejectedValueOnce(new Error('S3 error'));

    const result = await deleter.delete('https://pub-r2.dev/inventory_img/sample.jpg');

    expect(result).toBe(false);
  });
});

