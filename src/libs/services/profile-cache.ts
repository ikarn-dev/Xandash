/**
 * Profile Cache Service
 * Pre-loads and caches profile data for faster access
 */

import { cache } from '@/libs/cache/LocalCache';

interface CachedProfileData {
  ip: string;
  location: any;
  currentNode: any;
  dbHistory?: any[];
  dbEvents?: any[];
  cachedAt: number;
}

const PROFILE_CACHE_TTL = 300; // 5 minutes
const PROFILE_CACHE_PREFIX = 'profile:';

export class ProfileCacheService {
  /**
   * Cache profile data for an IP with error handling
   */
  static async cacheProfile(ip: string, profileData: any): Promise<void> {
    try {
      if (!ip || typeof ip !== 'string') {
        throw new Error('Invalid IP address provided');
      }
      
      if (!profileData) {
        throw new Error('No profile data provided to cache');
      }

      const cacheKey = `${PROFILE_CACHE_PREFIX}${ip}`;
      const cachedData: CachedProfileData = {
        ...profileData,
        cachedAt: Date.now(),
      };
      
      await cache.set(cacheKey, cachedData, PROFILE_CACHE_TTL);
    } catch (error) {
      throw new Error(`Failed to cache profile for ${ip}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cached profile data for an IP with error handling
   */
  static async getCachedProfile(ip: string): Promise<CachedProfileData | null> {
    try {
      if (!ip || typeof ip !== 'string') {
        return null;
      }

      const cacheKey = `${PROFILE_CACHE_PREFIX}${ip}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return cached as CachedProfileData;
      }
      
      return null;
    } catch (error) {
      // Return null on cache errors to allow fallback to fresh data
      return null;
    }
  }

  /**
   * Pre-load profile data for multiple IPs using server-side functions
   */
  static async preloadProfilesServerSide(
    ips: string[], 
    getProfileDataFn: (ip: string) => Promise<any>
  ): Promise<void> {
    // Process in smaller batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (ip) => {
          try {
            // Check if already cached and fresh
            const existing = await this.getCachedProfile(ip);
            if (existing && Date.now() - existing.cachedAt < PROFILE_CACHE_TTL * 1000) {
              return; // Still fresh
            }

            // Fetch and cache profile data using server-side function
            const profileData = await getProfileDataFn(ip);
            if (profileData) {
              await this.cacheProfile(ip, profileData);
            }
          } catch (error) {
            // Silently handle individual profile loading errors
          }
        })
      );
      
      // Small delay between batches
      if (i + batchSize < ips.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  /**
   * Clear all cached profiles
   */
  static async clearCache(): Promise<void> {
    // Cache clearing not implemented for LRU cache
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{ size: number; keys: string[] }> {
    return { size: 0, keys: [] };
  }
}