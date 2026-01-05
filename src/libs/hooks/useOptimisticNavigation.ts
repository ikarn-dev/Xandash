import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

/**
 * Hook for optimistic navigation with immediate feedback
 * Shows loading state immediately while navigation happens in background
 */
export function useOptimisticNavigation() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string>('');

  const navigateWithFeedback = useCallback((url: string, label?: string) => {
    setIsNavigating(true);
    setNavigationTarget(label || 'page');
    
    // Start navigation immediately
    router.push(url);

    // Clean up after navigation should be complete
    setTimeout(() => {
      setIsNavigating(false);
      setNavigationTarget('');
    }, 2000);
  }, [router]);

  return {
    navigateWithFeedback,
    isNavigating,
    navigationTarget,
  };
}