import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogCacheService } from './catalog-cache.service';
import { Cache } from 'cache-manager';

describe('CatalogCacheService', () => {
  let cacheService: CatalogCacheService;
  let mockCache: Cache;

  beforeEach(() => {
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    } as unknown as Cache;

    cacheService = new CatalogCacheService(mockCache);
  });

  it('should return cached value if present (cache hit)', async () => {
    vi.mocked(mockCache.get).mockResolvedValueOnce(['item1', 'item2']);
    const factory = vi.fn();

    const result = await cacheService.fetch('test-key', 60, factory);

    expect(result).toEqual(['item1', 'item2']);
    expect(mockCache.get).toHaveBeenCalledWith('test-key');
    expect(factory).not.toHaveBeenCalled();
    expect(mockCache.set).not.toHaveBeenCalled();
  });

  it('should execute factory and save to cache if not present (cache miss)', async () => {
    vi.mocked(mockCache.get).mockResolvedValueOnce(undefined);
    const factory = vi.fn().mockResolvedValueOnce(['fresh-data']);

    const result = await cacheService.fetch('test-key', 60, factory);

    expect(result).toEqual(['fresh-data']);
    expect(mockCache.get).toHaveBeenCalledWith('test-key');
    expect(factory).toHaveBeenCalledTimes(1);
    expect(mockCache.set).toHaveBeenCalledWith('test-key', ['fresh-data'], 60000);
  });

  it('should fall through to factory if cache get throws', async () => {
    vi.mocked(mockCache.get).mockRejectedValueOnce(new Error('Redis connection down'));
    const factory = vi.fn().mockResolvedValueOnce(['fallback-data']);

    const result = await cacheService.fetch('test-key', 60, factory);

    expect(result).toEqual(['fallback-data']);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('should invalidate cache key', async () => {
    await cacheService.invalidate('test-key');
    expect(mockCache.del).toHaveBeenCalledWith('test-key');
  });
});
