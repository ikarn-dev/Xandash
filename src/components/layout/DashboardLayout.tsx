'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/ui';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  // Dismiss loading toasts immediately when on profile pages
  useEffect(() => {
    if (pathname.includes('/profile/')) {
      toast.dismiss('node-profile-loading');
    }
  }, [pathname]);

  return (
    <div className="gradient-bg min-h-screen flex flex-col">
      {/* Modern Floating Navbar */}
      <Navbar />

      {/* Main Content - min-h ensures footer stays at bottom during loading */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 min-h-[calc(100vh-180px)]">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 pt-2 sm:pt-4 pb-6">
            <Breadcrumb />
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};
