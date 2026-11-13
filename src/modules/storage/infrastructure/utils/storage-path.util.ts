import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { isAbsolute, relative, resolve } from 'node:path';

const SAFE_FOLDER_REGEX = /^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/;
const MAX_FOLDER_LENGTH = 80;

export function sanitizeStorageFolder(
  folder: string | undefined,
  defaultFolder: string,
): string {
  if (!folder || folder.trim().length === 0) {
    return defaultFolder;
  }

  const normalized = folder.trim().replace(/^\/+|\/+$/g, '');
  if (normalized.length === 0) {
    return defaultFolder;
  }

  if (
    normalized.length > MAX_FOLDER_LENGTH ||
    normalized.includes('..') ||
    normalized.includes('\\') ||
    normalized.includes('\0') ||
    !SAFE_FOLDER_REGEX.test(normalized)
  ) {
    throw new BadRequestException(
      'Invalid folder name: only alphanumeric characters, "_", "-", and "/" segments are allowed',
    );
  }

  return normalized;
}

/**
 * Resolves `targetPath` only if it lies strictly inside `baseDir`. Returns null
 * for traversal attempts, null bytes, or paths outside the storage root.
 */
export function resolveConfinedStoragePath(
  baseDir: string,
  targetPath: string,
): string | null {
  if (!targetPath || targetPath.includes('\0')) {
    return null;
  }

  const resolvedBase = resolve(baseDir);
  const resolvedTarget = isAbsolute(targetPath)
    ? resolve(targetPath)
    : resolve(resolvedBase, targetPath);

  const rel = relative(resolvedBase, resolvedTarget);
  if (rel.length === 0 || rel.startsWith('..') || isAbsolute(rel)) {
    return null;
  }

  return resolvedTarget;
}

