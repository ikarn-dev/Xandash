'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LiveRefresh, NetworkSelector, Breadcrumb } from '@/components/ui';
import { useRPCContext } from '@/libs';
import { cn } from '@/libs';
import { Footer } from './Footer';

interface NavbarItem {
  title: string;
  href: string;
  badge?: string;
}

const navigationItems: NavbarItem[] = [
  { title: 'Analytics', href: '/' },
  { title: 'pNodes', href: '/nodes' },
  { title: 'Leaderboard', href: '/leaderboard' },
  { title: 'Network', href: '/network' },
  { title: 'XAND', href: '/xand' },
  { title: 'Endpoints', href: '/endpoints' },
  { title: 'Docs', href: '/about' },
];

const BinaryAnimation: React.FC<{ text: string; isHovered: boolean }> = ({ text, isHovered }) => {
  const [displayText, setDisplayText] = useState(text);

  React.useEffect(() => {
    if (!isHovered) {
      setDisplayText(text);
      return;
    }

    const binaryChars = '01';
    const originalText = text;
    let currentIndex = 0;
    let timeouts: NodeJS.Timeout[] = [];
    let intervals: NodeJS.Timeout[] = [];
    let isActive = true;
    
    const animateChar = () => {
      if (!isActive) {
        setDisplayText(originalText);
        return;
      }
      
      if (currentIndex >= originalText.length) {
        setDisplayText(originalText);
        return;
      }
      
      let binaryCount = 0;
      const binaryInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(binaryInterval);
          setDisplayText(originalText);
          return;
        }
        
        setDisplayText(prev => {
          const chars = prev.split('');
          chars[currentIndex] = binaryChars[Math.floor(Math.random() * 2)];
          return chars.join('');
        });
        
        binaryCount++;
        if (binaryCount >= 2) {
          clearInterval(binaryInterval);
          
          setDisplayText(prev => {
            const chars = prev.split('');
            chars[currentIndex] = originalText[currentIndex];
            return chars.join('');
          });
          
          currentIndex++;
          const timeout = setTimeout(animateChar, 25);
          timeouts.push(timeout);
        }
      }, 15);
      
      intervals.push(binaryInterval);
    };

    const startTimeout = setTimeout(animateChar, 10);
    timeouts.push(startTimeout);

    return () => {
      isActive = false;
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      setDisplayText(originalText);
    };

  }, [isHovered, text]);

  return <span className="font-mono">{displayText}</span>;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { refreshAll } = useRPCContext();
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleRefresh = () => {
    console.log('Dashboard refreshed - calling RPC refresh');
    refreshAll();
  };

  return (
    <div className="gradient-bg min-h-screen flex flex-col">
      {/* Top Navbar */}
      <div className="w-full bg-black border-b border-white/10 sticky top-0 z-50">
        <div className="px-4 sm:px-6">
          <div className="flex items-center h-14">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-6 h-6 bg-gradient-to-r from-white/80 to-white/40 rounded-sm"></div>
              <h2 className="text-white font-bold text-base">XanDash</h2>
            </div>

            {/* Center - Navigation Links (properly centered using absolute positioning) */}
            <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  const isHovered = hoveredItem === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'px-5 py-4 transition-all duration-200 relative border-b-2 cursor-pointer text-sm font-medium whitespace-nowrap',
                        isActive 
                          ? 'text-white border-white' 
                          : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
                      )}
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <BinaryAnimation text={item.title} isHovered={isHovered && !isActive} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Spacer to push right controls */}
            <div className="hidden lg:block flex-1" />

            {/* Right side - Controls */}
            <div className="hidden sm:flex items-center space-x-3 flex-shrink-0">
              <NetworkSelector />
              <LiveRefresh onRefresh={handleRefresh} interval={30} />
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden ml-auto">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/10 bg-black/95 backdrop-blur-sm">
              <div className="py-4 space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'block px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-2',
                        isActive 
                          ? 'text-white bg-white/10 border-l-4 border-white' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.title}
                    </Link>
                  );
                })}
                
                {/* Mobile Controls */}
                <div className="pt-4 border-t border-white/10 mx-2 mt-2">
                  <div className="flex flex-col space-y-3 px-2">
                    <NetworkSelector />
                    <LiveRefresh onRefresh={handleRefresh} interval={30} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 pt-6 pb-6">
            <Breadcrumb />
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};
