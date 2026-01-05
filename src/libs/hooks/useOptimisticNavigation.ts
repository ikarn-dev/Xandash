import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook for optimistic navigation with immediate feedback
 * Shows loading state immediately while navigation happens in background
 */
export function useOptimisticNavigation() {
  const router = useRouter();

  const navigateWithFeedback = useCallback((url: string, label?: string) => {
    // Show immediate toast feedback and return the toast ID
    const loadingToast = toast.loading(`Loading ${label || 'page'}...`, {
      duration: 5000, // Longer duration, will be dismissed manually
    });
    
    // Store toast ID in sessionStorage so the destination page can dismiss it
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('navigationToastId', loadingToast.toString());
    }
    
    // Start navigation immediately
    router.push(url);

    return loadingToast;
  }, [router]);

  return {
    navigateWithFeedback,
  };
}