import { useCallback } from 'react';
import { useOptimisticNavigation } from './useOptimisticNavigation';
import { ProfileCacheService } from '@/libs/services/profile-cache';

/**
 * Hook to prefetch profile data when hovering over a node
 * This dramatically speeds up navigation by caching data before click
 */
export function usePrefetchProfile() {
  const { navigateWithFeedback } = useOptimisticNavigation();

  // Prefetch manager assets data
  const prefetchManagerAssets = useCallback(async (managerAddress: string) => {
    if (!managerAddress) return;

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
  }, []);

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
