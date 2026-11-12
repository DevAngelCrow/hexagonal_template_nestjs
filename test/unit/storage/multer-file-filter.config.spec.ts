import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import {
  multerDocumentOptions,
  validateFileMagicBytes,
} from '@/modules/storage/infrastructure/config/multer-file-filter.config';
import { StorageFilesPath } from '@/modules/storage/domain/value-objects/storage-files-value-object/storage-files-path';
import { StorageUploadService } from '@/modules/storage/application/services/storage/storage-upload.service';
import { StorageFilesUploadFlowHandler } from '@/modules/storage/application/storage-files/commands/storage-files-upload-flow/storage-files-upload-flow.handler';
import { StorageFiles } from '@/modules/storage/domain/entities/storage-files';

describe('Storage Document Validation & Folder Upload', () => {
  it('validates PDF magic bytes (%PDF) and rejects spoofed PDF buffers', () => {
    const validPdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
    const fakePdf = Buffer.from('NOT_A_PDF');

    expect(validateFileMagicBytes(validPdf, 'application/pdf')).toBe(true);
    expect(validateFileMagicBytes(fakePdf, 'application/pdf')).toBe(false);
  });

  it('multerDocumentOptions enforces 10MB limit and accepts PDF while rejecting SVG', () => {
    expect(multerDocumentOptions.limits?.fileSize).toBe(10 * 1024 * 1024);

    const callbackAccept = vi.fn();
    multerDocumentOptions.fileFilter?.(
      {} as Request,
      { mimetype: 'application/pdf' } as Express.Multer.File,
      callbackAccept,
    );
    expect(callbackAccept).toHaveBeenCalledWith(null, true);

    const callbackReject = vi.fn();
    multerDocumentOptions.fileFilter?.(
      {} as Request,
      { mimetype: 'image/svg+xml' } as Express.Multer.File,
      callbackReject,
    );
    expect(callbackReject).toHaveBeenCalledWith(
      expect.any(BadRequestException),
      false,
    );
  });

  it('allows StorageFilesPath values up to 500 characters for CDN URLs', () => {
    const longCdnUrl = `https://cdn.example.com/${'a'.repeat(450)}.webp`;
    expect(longCdnUrl.length).toBeGreaterThan(150);
    expect(longCdnUrl.length).toBeLessThanOrEqual(500);
    expect(new StorageFilesPath(longCdnUrl).value()).toBe(longCdnUrl);

    const tooLong = `https://cdn.example.com/${'a'.repeat(490)}.webp`;
    expect(() => new StorageFilesPath(tooLong)).toThrow();
  });

  it('forwards optional folder parameter from StorageUploadService.run to command handler', async () => {
    const mockFile = {
      originalname: 'avatar.png',
      size: 200,
      mimetype: 'image/png',
    };
    const executeMock = vi
      .fn()
      .mockResolvedValueOnce({} as StorageFiles<typeof mockFile>);
    const uploadService = new StorageUploadService({
      execute: executeMock,
    } as unknown as StorageFilesUploadFlowHandler<typeof mockFile>);

    await uploadService.run(mockFile, 'S3', 'profile_img');

    expect(executeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider_storage_code: 'S3',
        folder: 'profile_img',
      }),
    );
  });
});
