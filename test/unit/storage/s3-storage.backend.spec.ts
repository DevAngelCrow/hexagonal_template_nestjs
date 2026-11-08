import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { S3StorageBackend } from '@/modules/storage/infrastructure/backends/s3-storage.backend';
import { Express } from 'express';

const mockSend = vi.fn();
const mockS3ClientConstructor = vi.fn();
const mockPutObjectCommandConstructor = vi.fn();
const mockDeleteObjectCommandConstructor = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class MockS3Client {
      send = mockSend;
      constructor(config: any) {
        mockS3ClientConstructor(config);
      }
    },
    PutObjectCommand: class MockPutObjectCommand {
      constructor(input: any) {
        mockPutObjectCommandConstructor(input);
      }
    },
    DeleteObjectCommand: class MockDeleteObjectCommand {
      constructor(input: any) {
        mockDeleteObjectCommandConstructor(input);
      }
    },
  };
});

describe('S3StorageBackend', () => {
  let mockConfigService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  it('should initialize S3Client with custom endpoint for Cloudflare R2', () => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        const env: Record<string, string> = {
          PROVIDER_STORAGE_CODE: 'S3',
          S3_REGION: 'auto',
          S3_BUCKET: 'gv-catalog-r2',
          S3_ENDPOINT: 'https://test-account.r2.cloudflarestorage.com',
          S3_ACCESS_KEY_ID: 'test-access-key',
          S3_SECRET_ACCESS_KEY: 'test-secret-key',
          S3_PUBLIC_BASE_URL: 'https://pub-r2.dev',
          S3_KEY_PREFIX: 'catalog/products',
        };
        return env[key];
      }),
    };

    const backend = new S3StorageBackend(mockConfigService as ConfigService);
    expect(backend.code).toBe('S3');
    expect(mockS3ClientConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'auto',
        endpoint: 'https://test-account.r2.cloudflarestorage.com',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      }),
    );
  });

  it('should throw error when S3 is selected but bucket or region are missing', () => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'PROVIDER_STORAGE_CODE') return 'S3';
        return undefined;
      }),
    };

    expect(() => new S3StorageBackend(mockConfigService as ConfigService)).toThrow(
      'S3StorageBackend requires S3_REGION and S3_BUCKET env vars.',
    );
  });

  it('should throw error when S3_REGION is auto but S3_ENDPOINT is missing', () => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        const env: Record<string, string> = {
          PROVIDER_STORAGE_CODE: 'S3',
          S3_REGION: 'auto',
          S3_BUCKET: 'gv-inventory',
        };
        return env[key];
      }),
    };

    expect(() => new S3StorageBackend(mockConfigService as ConfigService)).toThrow(
      'S3StorageBackend: S3_REGION is set to "auto" but S3_ENDPOINT is missing.',
    );
  });

  it('should upload file to specific folder (inventory_img) when folder argument is provided', async () => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        const env: Record<string, string> = {
          PROVIDER_STORAGE_CODE: 'S3',
          S3_REGION: 'auto',
          S3_BUCKET: 'gv-inventory',
          S3_ENDPOINT: 'https://test-account.r2.cloudflarestorage.com',
          S3_PUBLIC_BASE_URL: 'https://pub-r2.dev',
        };
        return env[key];
      }),
    };

    const backend = new S3StorageBackend(mockConfigService as ConfigService);
    const mockFile = {
      originalname: 'silla.webp',
      mimetype: 'image/webp',
      buffer: Buffer.from('fake-webp-buffer'),
      size: 1024,
    } as Express.Multer.File;

    const result = await backend.upload(mockFile, 'inventory_img');

    expect(result.path).toMatch(/^https:\/\/pub-r2\.dev\/inventory_img\/[a-f0-9-]+\.webp$/);
    expect(mockPutObjectCommandConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'gv-inventory',
        Key: expect.stringMatching(/^inventory_img\/[a-f0-9-]+\.webp$/),
        ContentType: 'image/webp',
        Body: mockFile.buffer,
      }),
    );
  });

  it('should upload file to specific folder (profile_img) when folder argument is provided', async () => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        const env: Record<string, string> = {
          PROVIDER_STORAGE_CODE: 'S3',
          S3_REGION: 'auto',
          S3_BUCKET: 'gv-inventory',
          S3_ENDPOINT: 'https://test-account.r2.cloudflarestorage.com',
          S3_PUBLIC_BASE_URL: 'https://pub-r2.dev',
        };
        return env[key];
      }),
    };

    const backend = new S3StorageBackend(mockConfigService as ConfigService);
    const mockFile = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-avatar-buffer'),
      size: 512,
    } as Express.Multer.File;

    const result = await backend.upload(mockFile, 'profile_img');

    expect(result.path).toMatch(/^https:\/\/pub-r2\.dev\/profile_img\/[a-f0-9-]+\.png$/);
    expect(mockPutObjectCommandConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'gv-inventory',
        Key: expect.stringMatching(/^profile_img\/[a-f0-9-]+\.png$/),
        ContentType: 'image/png',
      }),
    );
  });

  it('should log error with HTTP status code and rethrow when S3 upload fails', async () => {
    const s3Error: any = new Error('Access Denied');
    s3Error.name = 'AccessDenied';
    s3Error.$metadata = { httpStatusCode: 403 };
    mockSend.mockRejectedValueOnce(s3Error);

    mockConfigService = {
      get: vi.fn((key: string) => {
        const env: Record<string, string> = {
          PROVIDER_STORAGE_CODE: 'S3',
          S3_REGION: 'auto',
          S3_BUCKET: 'gv-inventory',
          S3_ENDPOINT: 'https://test-account.r2.cloudflarestorage.com',
        };
        return env[key];
      }),
    };

    const backend = new S3StorageBackend(mockConfigService as ConfigService);
    const mockFile = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-jpeg'),
      size: 100,
    } as Express.Multer.File;

    await expect(backend.upload(mockFile, 'inventory_img')).rejects.toThrow('Access Denied');
  });

  it('should upload file and return public URL when S3_PUBLIC_BASE_URL is configured', async () => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        const env: Record<string, string> = {
          PROVIDER_STORAGE_CODE: 'S3',
          S3_REGION: 'auto',
          S3_BUCKET: 'gv-catalog-r2',
          S3_ENDPOINT: 'https://test-account.r2.cloudflarestorage.com',
          S3_ACCESS_KEY_ID: 'test-access-key',
          S3_SECRET_ACCESS_KEY: 'test-secret-key',
          S3_PUBLIC_BASE_URL: 'https://media.gvrentals.com',
          S3_KEY_PREFIX: 'catalog/products',
        };
        return env[key];
      }),
    };

    const backend = new S3StorageBackend(mockConfigService as ConfigService);
    const mockFile = {
      originalname: 'silla-tiffany.webp',
      mimetype: 'image/webp',
      buffer: Buffer.from('fake-webp-buffer'),
      size: 1024,
    } as Express.Multer.File;

    const result = await backend.upload(mockFile);

    expect(result.path).toMatch(/^https:\/\/media\.gvrentals\.com\/catalog\/products\/[a-f0-9-]+\.webp$/);
    expect(mockPutObjectCommandConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'gv-catalog-r2',
        ContentType: 'image/webp',
        Body: mockFile.buffer,
      }),
    );
  });

  it('should return s3:// path when S3_PUBLIC_BASE_URL is not set', async () => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        const env: Record<string, string> = {
          PROVIDER_STORAGE_CODE: 'S3',
          S3_REGION: 'us-east-1',
          S3_BUCKET: 'internal-s3-bucket',
        };
        return env[key];
      }),
    };

    const backend = new S3StorageBackend(mockConfigService as ConfigService);
    const mockFile = {
      originalname: 'foto.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-jpeg-buffer'),
      size: 2048,
    } as Express.Multer.File;

    const result = await backend.upload(mockFile);

    expect(result.path).toMatch(/^s3:\/\/internal-s3-bucket\/[a-f0-9-]+\.jpg$/);
  });

  describe('delete', () => {
    const s3Env: Record<string, string> = {
      PROVIDER_STORAGE_CODE: 'S3',
      S3_REGION: 'auto',
      S3_BUCKET: 'gv-inventory',
      S3_ENDPOINT: 'https://test-account.r2.cloudflarestorage.com',
      S3_PUBLIC_BASE_URL: 'https://pub-r2.dev',
    };

    it('should delete object given a full public CDN URL', async () => {
      mockConfigService = { get: vi.fn((key: string) => s3Env[key]) };
      const backend = new S3StorageBackend(mockConfigService as ConfigService);

      const result = await backend.delete('https://pub-r2.dev/inventory_img/sample.webp');

      expect(result).toBe(true);
      expect(mockDeleteObjectCommandConstructor).toHaveBeenCalledWith({
        Bucket: 'gv-inventory',
        Key: 'inventory_img/sample.webp',
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it('should delete object given an s3:// URL', async () => {
      mockConfigService = { get: vi.fn((key: string) => s3Env[key]) };
      const backend = new S3StorageBackend(mockConfigService as ConfigService);

      const result = await backend.delete('s3://gv-inventory/profile_img/user-avatar.png');

      expect(result).toBe(true);
      expect(mockDeleteObjectCommandConstructor).toHaveBeenCalledWith({
        Bucket: 'gv-inventory',
        Key: 'profile_img/user-avatar.png',
      });
    });

    it('should delete object given a relative key', async () => {
      mockConfigService = { get: vi.fn((key: string) => s3Env[key]) };
      const backend = new S3StorageBackend(mockConfigService as ConfigService);

      const result = await backend.delete('inventory_img/direct-key.jpg');

      expect(result).toBe(true);
      expect(mockDeleteObjectCommandConstructor).toHaveBeenCalledWith({
        Bucket: 'gv-inventory',
        Key: 'inventory_img/direct-key.jpg',
      });
    });

    it('should safely ignore external URLs without calling S3', async () => {
      mockConfigService = { get: vi.fn((key: string) => s3Env[key]) };
      const backend = new S3StorageBackend(mockConfigService as ConfigService);

      const result = await backend.delete('https://images.unsplash.com/photo-12345');

      expect(result).toBe(false);
      expect(mockDeleteObjectCommandConstructor).not.toHaveBeenCalled();
    });

    it('should return false when S3 DeleteObjectCommand fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('S3 Delete Failure'));
      mockConfigService = { get: vi.fn((key: string) => s3Env[key]) };
      const backend = new S3StorageBackend(mockConfigService as ConfigService);

      const result = await backend.delete('https://pub-r2.dev/inventory_img/sample.webp');

      expect(result).toBe(false);
    });
  });
});
