export abstract class CatalogCachePort {
  /**
   * Fetches data from the cache, or executes the factory function if not found.
   * @param key Cache key
   * @param ttlSeconds Time to live in seconds
   * @param factory Function to execute if cache miss
   */
  abstract fetch<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T>;

  /**
   * Invalidates a specific key in the cache.
   * @param key Cache key to invalidate
   */
  abstract invalidate(key: string): Promise<void>;
}
