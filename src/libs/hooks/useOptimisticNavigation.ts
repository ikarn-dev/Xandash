import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for optimistic navigation
 * Navigation only - toast is handled by the caller
 */
export function useOptimisticNavigation() {
  const router = useRouter();

  const navigateWithFeedback = useCallback((url: string) => {
    // Start navigation immediately - toast is handled by caller
    router.push(url);
  }, [router]);

  return {
    navigateWithFeedback,
  };
}