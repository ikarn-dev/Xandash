'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

interface ToastDismisserProps {
  toastId: string;
}

export function ToastDismisser({ toastId }: ToastDismisserProps) {
  // Dismiss immediately on mount
  if (typeof window !== 'undefined') {
    toast.dismiss(toastId);
  }

  // Also dismiss in useEffect as backup
  useEffect(() => {
    toast.dismiss(toastId);
  }, [toastId]);

  return null; // This component renders nothing
}