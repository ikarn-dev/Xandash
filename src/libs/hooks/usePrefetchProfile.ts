import { useCallback } from 'react';
import { useOptimisticNavigation } from './useOptimisticNavigation';
import { ProfileCacheService } from '@/libs/services/profile-cache';

/**
 * Hook to prefetch profile data when hovering over a node
 * This dramatically speeds up navigation by caching data before click
 */
export function usePrefetchProfile() {
  const { navigateWithFeedback } = useOptimisticNavigation();

  // Check localStorage for existing cached manager assets
  const hasCachedAssets = useCallback((managerAddress: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      const raw = localStorage.getItem('xandash_manager_assets');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const cached = parsed?.data?.[managerAddress];
      if (!cached) return false;
      // Consider fresh if less than 5 minutes old
      return (Date.now() - (cached.last_updated || 0)) < 5 * 60 * 1000;
    } catch {
      return false;
    }
  }, []);

  // Prefetch manager assets data (skips if localStorage has fresh data)
  const prefetchManagerAssets = useCallback(async (managerAddress: string) => {
    if (!managerAddress) return;
    // Skip if we already have fresh cached data
    if (hasCachedAssets(managerAddress)) return;

    try {
      // Fire and forget - prefetch to prime the cache
      fetch(`/api/manager-assets?address=${managerAddress}`, {
        method: 'GET',
        priority: 'low' as any,
      }).catch(() => {
        // Silently fail - prefetch is optional
      });
    } catch {
      // Silently fail
    }
  }, [hasCachedAssets]);

  const prefetchProfile = useCallback(async (ip: string, managerAddress?: string) => {
    if (!ip) return;

    try {
      // Also prefetch manager assets if provided
      if (managerAddress) {
        prefetchManagerAssets(managerAddress);
      }

      // Check if already cached
      const cached = await ProfileCacheService.getCachedProfile(ip);
      if (cached) return; // Already cached, no need to prefetch

      // Use faster minimal endpoint for prefetch
      fetch(`/api/node-profile-minimal?ip=${encodeURIComponent(ip)}`, {
        method: 'GET',
        priority: 'low' as any, // Low priority to not block user interactions
      })
        .then(response => response.json())
        .then(data => {
          // Cache the minimal data
          if (data && !data.error) {
            ProfileCacheService.cacheProfile(ip, data).catch(() => {
              // Silently handle cache errors
            });
          }
        })
        .catch(() => {
          // Silently fail - prefetch is optional
        });
    } catch (_error) {
      // Silently fail - prefetch is optional
    }
  }, [prefetchManagerAssets]);

  // Navigate to profile - also prefetch manager assets if provided
  const navigateToProfile = useCallback((ip: string, managerAddress?: string) => {
    if (!ip) return;

    // Prefetch manager assets immediately when navigating (high priority)
    if (managerAddress) {
      fetch(`/api/manager-assets?address=${managerAddress}`, {
        method: 'GET',
      }).catch(() => {
        // Silently fail
      });
    }

    // Navigate
    navigateWithFeedback(`/profile/${encodeURIComponent(ip)}`);
  }, [navigateWithFeedback]);

  return { prefetchProfile, navigateToProfile, prefetchManagerAssets };
}
