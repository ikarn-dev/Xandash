'use client';

import React, { useState, useEffect } from 'react';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="gradient-bg fixed inset-0 z-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/80 text-lg font-medium">Loading XanDash...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen">
      {children}
    </div>
  );
};