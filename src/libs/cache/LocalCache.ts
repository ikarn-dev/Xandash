// High-performance local caching system to replace Redis
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  staleTime: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

class LocalCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0
  };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }

  // Get item from cache with stale-while-revalidate support
  get<T>(key: string): { data: T | null; isStale: boolean } {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return { data: null, isStale: false };
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return { data: null, isStale: false };
    }

    // Check if stale
    const isStale = age > entry.staleTime;
    this.stats.hits++;
    
    return { data: entry.data, isStale };
  }

  // Set item in cache
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000, staleTime: number = 30 * 1000): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      staleTime
    });

    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  // Delete item from cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get cache hit ratio
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  // Stale-while-revalidate pattern
  async getWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000,
    staleTime: number = 30 * 1000
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached.data && !cached.isStale) {
      // Fresh data, return immediately
      return cached.data;
    }
    
    if (cached.data && cached.isStale) {
      // Stale data, return it but refresh in background
      this.refreshInBackground(key, fetcher, ttl, staleTime);
      return cached.data;
    }
    
    // No data, fetch fresh
    const freshData = await fetcher();
    this.set(key, freshData, ttl, staleTime);
    return freshData;
  }

  // Background refresh for SWR
  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    staleTime: number
  ): Promise<void> {
    try {
      const freshData = await fetcher();
      this.set(key, freshData, ttl, staleTime);
    } catch (error) {
      console.warn(`Background refresh failed for key ${key}:`, error);
    }
  }

  // LRU eviction
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.deletes++;
    }
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.deletes++;
    });

    this.stats.size = this.cache.size;
  }

  // Start periodic cleanup
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Cleanup every minute
  }

  // Stop cleanup (for cleanup)
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance
export const localCache = new LocalCache(2000); // Increased size for better performance

// Cache key generators
export const cacheKeys = {
  nodes: (page: number, limit: number) => `v3:nodes:page:${page}:limit:${limit}`,
  nodesAll: () => `v3:nodes:all`,
  nodesTotal: () => `v3:nodes:total`,
  nodeStats: () => `v3:nodes:stats`,
  podCredits: () => `v3:pod-credits:all`,
  validatorsByStatus: (status: string) => `v3:validators:status:${status}`,
  validatorsByVersion: (version: string) => `v3:validators:version:${version}`,
  rpcCall: (method: string, params?: any) => `v3:rpc:${method}:${JSON.stringify(params || {})}`,
};

// Helper functions for easy migration from Redis
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const result = localCache.get<T>(key);
    return result.data;
  },

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      localCache.set(key, value, ttlSeconds * 1000, Math.min(ttlSeconds * 1000 * 0.1, 30000));
      return true;
    } catch {
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    return localCache.delete(key);
  },

  async getWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300,
    staleSeconds: number = 30
  ): Promise<T | null> {
    try {
      return await localCache.getWithSWR(key, fetcher, ttlSeconds * 1000, staleSeconds * 1000);
    } catch {
      return null;
    }
  },

  // Batch operations for better performance
  async mset(keyValuePairs: Record<string, any>, ttlSeconds: number = 300): Promise<boolean> {
    try {
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        localCache.set(key, value, ttlSeconds * 1000);
      });
      return true;
    } catch {
      return false;
    }
  },

  // Cache statistics
  getStats: () => localCache.getStats(),
  getHitRatio: () => localCache.getHitRatio(),
  
  // Key generators (keeping same interface)
  keys: cacheKeys
};