import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { Express } from 'express';
import { StorageBackend } from './storage-backend';
import { MIME_TO_EXTENSION } from '@/modules/storage/infrastructure/config/multer-file-filter.config';

/**
 * S3-compatible backend (AWS S3, MinIO, Cloudflare R2, Backblaze B2, etc).
 *
 * Required env vars:
 *   S3_BUCKET     - bucket name
 *   S3_REGION     - AWS region (use `us-east-1` for MinIO/R2 when not applicable)
 * Optional env vars:
 *   S3_ENDPOINT          - custom endpoint URL (set for non-AWS providers like MinIO/R2)
 *   S3_ACCESS_KEY_ID     - explicit access key (omit to use IAM role / default chain)
 *   S3_SECRET_ACCESS_KEY - explicit secret (omit to use IAM role / default chain)
 *   S3_FORCE_PATH_STYLE  - "true" for MinIO and other path-style providers
 *   S3_PUBLIC_BASE_URL   - if set, returned path uses this (e.g. CDN URL); otherwise `s3://bucket/key`
 *   S3_KEY_PREFIX        - optional prefix applied to every uploaded key (e.g. "profiles/")
 */
function extractS3ErrorInfo(err: unknown): {
  status: number | undefined;
  errName: string;
} {
  if (typeof err === 'object' && err !== null) {
    const rawName: unknown = Reflect.get(err, 'name');
    const errName =
      typeof rawName === 'string' && rawName.length > 0 ? rawName : 'S3Error';
    const metadata: unknown = Reflect.get(err, '$metadata');
    const rawStatus: unknown =
      typeof metadata === 'object' && metadata !== null
        ? Reflect.get(metadata, 'httpStatusCode')
        : undefined;
    const status = typeof rawStatus === 'number' ? rawStatus : undefined;
    return { status, errName };
  }
  return { status: undefined, errName: 'S3Error' };
}

@Injectable()
export class S3StorageBackend extends StorageBackend {
  readonly code = 'S3';
  private readonly logger = new Logger(S3StorageBackend.name);
  private client: S3Client | null = null;
  private bucket: string | null = null;
  private keyPrefix: string = '';
  private publicBaseUrl?: string;

  constructor(private readonly config: ConfigService) {
    super();
    const isS3Selected =
      (
        this.config.get<string>('PROVIDER_STORAGE_CODE') ?? 'LOCAL'
      ).toUpperCase() === 'S3';

    const region = this.config.get<string>('S3_REGION');
    const bucket = this.config.get<string>('S3_BUCKET');
    const endpoint = this.config.get<string>('S3_ENDPOINT');

    // Fail-fast only when S3 is the active backend — same as original behaviour.
    if (isS3Selected && (!region || !bucket)) {
      throw new Error(
        'S3StorageBackend requires S3_REGION and S3_BUCKET env vars.',
      );
    }

    if (isS3Selected && region?.toLowerCase() === 'auto' && !endpoint) {
      throw new Error(
        'S3StorageBackend: S3_REGION is set to "auto" but S3_ENDPOINT is missing. ' +
          'Check your .env for typos (e.g. S3_ENPOINT vs S3_ENDPOINT).',
      );
    }

    if (region && bucket) {
      this.bucket = bucket;
      this.keyPrefix = (this.config.get<string>('S3_KEY_PREFIX') ?? '').replace(
        /^\/+|\/+$/g,
        '',
      );
      this.publicBaseUrl = this.config.get<string>('S3_PUBLIC_BASE_URL');

      const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID');
      const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY');
      const forcePathStyle =
        this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true';

      this.client = new S3Client({
        region,
        endpoint,
        forcePathStyle,
        // If explicit credentials aren't supplied, the SDK falls back to the
        // default provider chain (env, container role, IMDS). Prefer that in
        // production (IAM role) and only set keys for local/dev/CI.
        credentials:
          accessKeyId && secretAccessKey
            ? { accessKeyId, secretAccessKey }
            : undefined,
      });
    }
  }

  async upload(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ path: string }> {
    if (!this.client || !this.bucket) {
      throw new Error(
        'S3StorageBackend requires S3_REGION and S3_BUCKET env vars.',
      );
    }
    const ext = MIME_TO_EXTENSION[file?.mimetype] ?? 'bin';
    const targetFolder = folder?.trim()
      ? folder.trim().replace(/^\/+|\/+$/g, '')
      : '';
    const prefix = [this.keyPrefix, targetFolder].filter(Boolean).join('/');
    const key = `${prefix ? prefix + '/' : ''}${randomUUID()}.${ext}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (err) {
      const { status, errName } = extractS3ErrorInfo(err);
      this.logger.error(
        `S3 upload failed for key=${key} [${errName}${status ? ` HTTP ${status}` : ''}]: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
    const path = this.publicBaseUrl
      ? `${this.publicBaseUrl.replace(/\/+$/, '')}/${key}`
      : `s3://${this.bucket}/${key}`;
    return { path };
  }

  async delete(pathOrUrl: string): Promise<boolean> {
    if (!this.client || !this.bucket) {
      throw new Error(
        'S3StorageBackend requires S3_REGION and S3_BUCKET env vars.',
      );
    }

    const key = this.extractKeyFromPath(pathOrUrl);
    if (!key) {
      this.logger.debug(
        `S3 delete skipped: path "${pathOrUrl}" is not an S3/CDN URL of this bucket`,
      );
      return false;
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`S3 object deleted successfully: key=${key}`);
      return true;
    } catch (err) {
      const { status, errName } = extractS3ErrorInfo(err);
      this.logger.error(
        `S3 delete failed for key=${key} [${errName}${status ? ` HTTP ${status}` : ''}]: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  async readBuffer(pathOrUrl: string): Promise<Buffer | null> {
    if (!this.client || !this.bucket) {
      return null;
    }

    const key = this.extractKeyFromPath(pathOrUrl);
    if (!key) {
      return null;
    }

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      if (!response.Body) {
        return null;
      }
      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (err) {
      const { status, errName } = extractS3ErrorInfo(err);
      this.logger.error(
        `S3 read failed for key=${key} [${errName}${status ? ` HTTP ${status}` : ''}]: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  private extractKeyFromPath(pathOrUrl: string): string | null {
    if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
    const trimmed = pathOrUrl.trim();

    if (trimmed.startsWith(`s3://${this.bucket}/`)) {
      return trimmed.slice(`s3://${this.bucket}/`.length);
    }

    if (this.publicBaseUrl && trimmed.startsWith(this.publicBaseUrl)) {
      return trimmed.slice(this.publicBaseUrl.length).replace(/^\/+/, '');
    }

    // Ignore external URLs (http/https not matching CDN) or data/blob URIs
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return null;
    }

    // If passed a relative clean key (e.g. "inventory_img/uuid.jpg")
    return trimmed.replace(/^\/+/, '');
  }
}
