'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

type NetworkType = 'devnet' | 'mainnet';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  isMainnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

const NETWORK_STORAGE_KEY = 'xandash_network';

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [network, setNetworkState] = useState<NetworkType>('devnet');
  const [mounted, setMounted] = useState(false);

  // Load network preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(NETWORK_STORAGE_KEY);
      if (stored === 'mainnet' || stored === 'devnet') {
        setNetworkState(stored);
      }
    } catch (err) {
      // Silently handle localStorage errors
    }
  }, []);

  // Save network preference to localStorage
  const setNetwork = (newNetwork: NetworkType) => {
    setNetworkState(newNetwork);
    try {
      localStorage.setItem(NETWORK_STORAGE_KEY, newNetwork);
    } catch (err) {
      // Silently handle localStorage errors
    }
  };

  // Memoize isMainnet to prevent unnecessary re-renders
  const isMainnet = useMemo(() => network === 'mainnet', [network]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    network,
    setNetwork,
    isMainnet
  }), [network, isMainnet]);

  // Don't render children until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};
