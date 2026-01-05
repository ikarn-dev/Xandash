'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NavigationLoader } from '@/components/ui/NavigationLoader';

interface NavigationContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');

  const showLoader = (msg = 'Loading...') => {
    setMessage(msg);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  return (
    <NavigationContext.Provider value={{ showLoader, hideLoader, isLoading }}>
      {children}
      {isLoading && <NavigationLoader message={message} />}
    </NavigationContext.Provider>
  );
}

export function useNavigationLoader() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationLoader must be used within NavigationProvider');
  }
  return context;
}