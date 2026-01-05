import React from 'react';

interface NavigationLoaderProps {
  message?: string;
}

export const NavigationLoader: React.FC<NavigationLoaderProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-black border border-white/20 rounded-lg p-6 flex items-center space-x-4">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-white text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};