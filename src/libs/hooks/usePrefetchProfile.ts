import { useCallback } from 'react';
import { useOptimisticNavigation } from './useOptimisticNavigation';
import { ProfileCacheService } from '@/libs/services/profile-cache';

/**
 * Hook to prefetch profile data when hovering over a node
 * This dramatically speeds up navigation by caching data before click
 */
export function usePrefetchProfile() {
  const { navigateWithFeedback } = useOptimisticNavigation();

  const prefetchProfile = useCallback(async (ip: string) => {
    if (!ip) return;

    try {
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
  }, []);

  const navigateToProfile = useCallback((ip: string) => {
    if (!ip) return;
    // Just navigate - toast is handled by the caller
    navigateWithFeedback(`/profile/${encodeURIComponent(ip)}`);
  }, [navigateWithFeedback]);

  return { prefetchProfile, navigateToProfile };
}
