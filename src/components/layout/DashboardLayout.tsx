'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LiveRefresh, NetworkSelector, Breadcrumb } from '@/components/ui';
import { useRPCContext } from '@/libs';
import { cn } from '@/libs';
import { Footer } from './Footer';
import { ChevronDown, Menu, X } from 'lucide-react';

interface NavbarItem {
  title: string;
  href: string;
  badge?: string;
  category?: 'main' | 'tools' | 'info';
}

const navigationItems: NavbarItem[] = [
  { title: 'Analytics', href: '/', category: 'main' },
  { title: 'pNodes', href: '/nodes', category: 'main' },
  { title: 'Network', href: '/network', category: 'main' },
  { title: 'Leaderboard', href: '/leaderboard', category: 'main' },
  { title: 'XAND', href: '/xand', category: 'tools' },
  { title: 'STOINC', href: '/stoinc', category: 'tools' },
  { title: 'Endpoints', href: '/endpoints', category: 'tools' },
  { title: 'About', href: '/about-xandash', category: 'info' },
  { title: 'Docs', href: '/about', category: 'info' },
];

// Group navigation items
const mainItems = navigationItems.filter(item => item.category === 'main');
const toolsItems = navigationItems.filter(item => item.category === 'tools');
const infoItems = navigationItems.filter(item => item.category === 'info');

// XanDash Logo Component with complete XANDASH text
export const XanDashLogo: React.FC<{ className?: string; textClassName?: string; showText?: boolean }> = ({ 
  className = "h-6", 
  textClassName = "text-base",
  showText = true 
}) => (
  <div className={cn("text-white font-bold flex items-center", textClassName)}>
    <span className="tracking-tight">XANDASH</span>
  </div>
);

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

// Dropdown Menu Component
const DropdownMenu: React.FC<{
  title: string;
  items: NavbarItem[];
  pathname: string;
  hoveredItem: string | null;
  setHoveredItem: (item: string | null) => void;
}> = ({ title, items, pathname, hoveredItem, setHoveredItem }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveItem = items.some(item => pathname === item.href);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          'flex items-center gap-1 px-3 py-4 transition-all duration-200 border-b-2 text-sm font-medium whitespace-nowrap',
          hasActiveItem 
            ? 'text-white border-white' 
            : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
        )}
      >
        <span>{title}</span>
        <ChevronDown className={cn(
          'w-3 h-3 transition-transform duration-200',
          isOpen ? 'rotate-180' : ''
        )} />
      </button>
      
      {/* Dropdown Content */}
      <div className={cn(
        'absolute top-full left-0 mt-0 w-48 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl transition-all duration-200 z-50',
        isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
      )}>
        <div className="py-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const isHovered = hoveredItem === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block px-4 py-2 text-sm transition-colors duration-200',
                  isActive 
                    ? 'text-white bg-white/10 border-r-2 border-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
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
    </div>
  );
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
    refreshAll();
  };

  return (
    <div className="gradient-bg min-h-screen flex flex-col">
      {/* Top Navbar */}
      <div className="w-full bg-black border-b border-white/10 sticky top-0 z-50">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-12">
            {/* Left side - Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <XanDashLogo className="h-4 sm:h-5" textClassName="text-xs sm:text-sm" />
              </Link>
            </div>

            {/* Center - Navigation Links (Desktop) */}
            <div className="hidden xl:flex items-center space-x-1">
              {/* Main Navigation Items */}
              {mainItems.map((item) => {
                const isActive = pathname === item.href;
                const isHovered = hoveredItem === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-3 py-3 transition-all duration-200 border-b-2 text-sm font-medium whitespace-nowrap',
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
              
              {/* Utilities Dropdown */}
              <DropdownMenu
                title="Utilities"
                items={toolsItems}
                pathname={pathname}
                hoveredItem={hoveredItem}
                setHoveredItem={setHoveredItem}
              />
              
              {/* Info Items */}
              {infoItems.map((item) => {
                const isActive = pathname === item.href;
                const isHovered = hoveredItem === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-3 py-3 transition-all duration-200 border-b-2 text-sm font-medium whitespace-nowrap',
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

            {/* Right side - Controls */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Desktop Controls */}
              <div className="hidden sm:flex items-center space-x-2">
                <NetworkSelector />
                <LiveRefresh onRefresh={handleRefresh} interval={30} />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-1.5 text-white/70 hover:text-white transition-all duration-200 rounded-lg hover:bg-white/10 relative z-[60]"
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <span className={cn(
                    "absolute block w-4 h-0.5 bg-current transform transition-all duration-300 ease-in-out",
                    mobileMenuOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"
                  )} />
                  <span className={cn(
                    "absolute block w-4 h-0.5 bg-current transform transition-all duration-300 ease-in-out",
                    mobileMenuOpen ? "opacity-0" : "opacity-100"
                  )} />
                  <span className={cn(
                    "absolute block w-4 h-0.5 bg-current transform transition-all duration-300 ease-in-out",
                    mobileMenuOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5"
                  )} />
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Overlay */}
        <div 
          className={cn(
            "xl:hidden fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out z-40",
            mobileMenuOpen 
              ? "opacity-100 visible" 
              : "opacity-0 invisible"
          )}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Mobile Navigation Menu */}
        <div 
          className={cn(
            "xl:hidden fixed top-12 left-0 right-0 bg-black border-b border-white/10 shadow-2xl transition-all duration-300 ease-in-out z-50",
            mobileMenuOpen 
              ? "translate-y-0 opacity-100" 
              : "-translate-y-full opacity-0"
          )}
        >
          <div className="max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="px-3 py-4 space-y-4">
              {/* Main Navigation */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-0.5 h-3 bg-white rounded-full"></div>
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Main</h3>
                </div>
                <div className="space-y-0.5">
                  {mainItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive 
                            ? 'text-white bg-white/10 border border-white/20' 
                            : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                        )}
                        style={{
                          transitionDelay: mobileMenuOpen ? `${index * 30}ms` : '0ms'
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                          isActive ? "bg-white" : "bg-white/30"
                        )} />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Utilities Navigation */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-0.5 h-3 bg-white/60 rounded-full"></div>
                  <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Utilities</h3>
                </div>
                <div className="space-y-0.5">
                  {toolsItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive 
                            ? 'text-white bg-white/10 border border-white/20' 
                            : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                        )}
                        style={{
                          transitionDelay: mobileMenuOpen ? `${(mainItems.length + index) * 30}ms` : '0ms'
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                          isActive ? "bg-white" : "bg-white/30"
                        )} />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Info Navigation */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-0.5 h-3 bg-white/40 rounded-full"></div>
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Info</h3>
                </div>
                <div className="space-y-0.5">
                  {infoItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive 
                            ? 'text-white bg-white/10 border border-white/20' 
                            : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                        )}
                        style={{
                          transitionDelay: mobileMenuOpen ? `${(mainItems.length + toolsItems.length + index) * 30}ms` : '0ms'
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                          isActive ? "bg-white" : "bg-white/30"
                        )} />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              {/* Mobile Controls */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-white/5 rounded-lg p-2.5 border border-white/10">
                    <NetworkSelector />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-lg p-2.5 border border-white/10">
                    <LiveRefresh onRefresh={handleRefresh} interval={30} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-6">
            <Breadcrumb />
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};
