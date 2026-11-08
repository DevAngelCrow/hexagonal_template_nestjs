import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageFilesController } from '@/modules/storage/infrastructure/controllers/storage-files.controller';
import { BadRequestException } from '@nestjs/common';
import { StorageFiles } from '@/modules/storage/domain/entities/storage-files';
import { Express } from 'express';

describe('StorageFilesController', () => {
  let controller: StorageFilesController;
  let mockCommandBus: any;
  let mockQueryBus: any;
  let mockConfigService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCommandBus = {
      execute: vi.fn(),
    };
    mockQueryBus = {
      execute: vi.fn(),
    };
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'PROVIDER_STORAGE_CODE') return 'S3';
        return undefined;
      }),
    };

    controller = new StorageFilesController(
      mockCommandBus,
      mockQueryBus,
      mockConfigService,
    );
  });

  describe('upload', () => {
    it('should throw BadRequestException when magic bytes do not match declared mimetype', async () => {
      // JPEG requires magic bytes 0xFF 0xD8 0xFF
      const fakeFile = {
        originalname: 'fake.jpg',
        mimetype: 'image/jpeg',
        size: 100,
        buffer: Buffer.from([0x00, 0x00, 0x00, 0x00]),
      } as Express.Multer.File;

      await expect(controller.upload(fakeFile)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should successfully upload valid PNG image and return StorageFilesHttpDto with 201', async () => {
      // Valid PNG magic bytes: 0x89 0x50 0x4E 0x47
      const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const validFile = {
        originalname: 'catalogo-silla.png',
        mimetype: 'image/png',
        size: 512,
        buffer: validPngBuffer,
      } as Express.Multer.File;

      const mockCreatedEntity = StorageFiles.create({
        id: '11111111-2222-4333-8444-555555555555',
        filename: 'catalogo-silla.png',
        id_provider: '00000000-0000-4000-8000-000000000002',
        size: 512,
        mime_type: 'image/png',
        active: true,
        content_file: validFile,
        path: 'https://pub-r2.dev/catalog/products/uuid.png',
      });

      mockCommandBus.execute.mockResolvedValue(mockCreatedEntity);

      const response = await controller.upload(validFile);

      expect(response.statusCode).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe('11111111-2222-4333-8444-555555555555');
      expect(response.data.path).toBe(
        'https://pub-r2.dev/catalog/products/uuid.png',
      );
      expect(response.data.filename).toBe('catalogo-silla.png');
      expect(response.data.mime_type).toBe('image/png');
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          provider_storage_code: 'S3',
        }),
      );
    });

    it('should respect custom provider_code passed via query param', async () => {
      // Valid WEBP magic bytes: RIFF....WEBP
      const webpHeader = Buffer.from('RIFF1234WEBP');
      const validFile = {
        originalname: 'mesa.webp',
        mimetype: 'image/webp',
        size: 1024,
        buffer: webpHeader,
      } as Express.Multer.File;

      const mockCreatedEntity = StorageFiles.create({
        id: '22222222-3333-4444-8555-666666666666',
        filename: 'mesa.webp',
        id_provider: '00000000-0000-4000-8000-000000000001',
        size: 1024,
        mime_type: 'image/webp',
        active: true,
        content_file: validFile,
        path: '/storage/profile_img/local-path.webp',
      });

      mockCommandBus.execute.mockResolvedValue(mockCreatedEntity);

      const response = await controller.upload(validFile, 'LOCAL');

      expect(response.statusCode).toBe(201);
      expect(response.data.path).toBe('/storage/profile_img/local-path.webp');
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          provider_storage_code: 'LOCAL',
        }),
      );
    });

    it('should pass folder query param to StorageFilesUploadFlowCommand', async () => {
      const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const validFile = {
        originalname: 'item.png',
        mimetype: 'image/png',
        size: 256,
        buffer: validPngBuffer,
      } as Express.Multer.File;

      const mockCreatedEntity = StorageFiles.create({
        id: '33333333-4444-5555-9666-777777777777',
        filename: 'item.png',
        id_provider: '00000000-0000-4000-8000-000000000002',
        size: 256,
        mime_type: 'image/png',
        active: true,
        content_file: validFile,
        path: 'https://pub-r2.dev/inventory_img/item.png',
      });

      mockCommandBus.execute.mockResolvedValue(mockCreatedEntity);

      await controller.upload(validFile, 'S3', 'inventory_img');

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          provider_storage_code: 'S3',
          folder: 'inventory_img',
        }),
      );
    });
  });
});
