'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

interface ToastDismisserProps {
  toastId: string;
}

export function ToastDismisser({ toastId }: ToastDismisserProps) {
  useEffect(() => {
    // Dismiss the toast immediately when this component mounts
    toast.dismiss(toastId);
  }, [toastId]);

  return null; // This component renders nothing
}