export abstract class CachePort {
  abstract invalidateUserPermissions(userId: string): Promise<void>;
  abstract invalidateUsersPermissions(idsUser: string[]): Promise<void>;
  abstract getMenuCacheVersion(): Promise<string>;
  abstract invalidateAllMenus(): Promise<void>;
}
