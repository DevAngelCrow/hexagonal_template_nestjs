import { Inject, Injectable, Logger } from '@nestjs/common';
import { CachePort } from '@/modules/iam/domain/ports/cache.port';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'node:crypto';

const MENU_VERSION_CACHE_KEY = 'menu:routes:version';
const MENU_VERSION_TTL_MS = 86_400_000;

@Injectable()
export class ImplCachePort implements CachePort {
  private readonly logger = new Logger(ImplCachePort.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getMenuCacheVersion(): Promise<string> {
    try {
      const cachedVersion = await this.cacheManager.get<string>(
        MENU_VERSION_CACHE_KEY,
      );
      if (typeof cachedVersion === 'string' && cachedVersion.length > 0) {
        return cachedVersion;
      }
      const initialVersion = randomUUID();
      await this.cacheManager.set(
        MENU_VERSION_CACHE_KEY,
        initialVersion,
        MENU_VERSION_TTL_MS,
      );
      return initialVersion;
    } catch (error) {
      this.logger.warn(
        `Error getting menu cache version: ${error instanceof Error ? error.message : String(error)}`,
      );
      return randomUUID();
    }
  }

  async invalidateAllMenus(): Promise<void> {
    try {
      const nextVersion = randomUUID();
      await this.cacheManager.set(
        MENU_VERSION_CACHE_KEY,
        nextVersion,
        MENU_VERSION_TTL_MS,
      );
    } catch (error) {
      this.logger.warn(
        `Error invalidating all menus cache version: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async invalidateUsersPermissions(idsUser: string[]): Promise<void> {
    try {
      if (idsUser.length === 0) return;
      const keys = idsUser.flatMap((id) => [
        `user:${id}:permissions`,
        `user:${id}:roles`,
        `user:${id}:menu`,
      ]);
      await this.cacheManager.mdel(keys);
    } catch (error) {
      this.logger.warn(
        `Error invalidating cache for users ${idsUser.join(', ')}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  async invalidateUserPermissions(userId: string): Promise<void> {
    try {
      await this.cacheManager.mdel([
        `user:${userId}:permissions`,
        `user:${userId}:roles`,
        `user:${userId}:menu`,
      ]);
    } catch (error) {
      this.logger.warn(
        `Error invalidating cache for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
