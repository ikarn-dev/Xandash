'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useNetwork } from '@/libs/context/network-context';
import { useRPCContext } from '@/libs';
import { cn } from '@/libs';

interface NavItem {
  title: string;
  href: string;
  category?: 'main' | 'tools' | 'info';
}

const navItems: NavItem[] = [
  { title: 'Analytics', href: '/', category: 'main' },
  { title: 'pNodes', href: '/nodes', category: 'main' },
  { title: 'Network', href: '/network', category: 'main' },
  { title: 'Leaderboard', href: '/leaderboard', category: 'main' },
  { title: 'Governance', href: '/governance', category: 'main' },
  { title: 'Compare', href: '/compare', category: 'tools' },
  { title: 'XAND', href: '/xand', category: 'tools' },
  { title: 'STOINC', href: '/stoinc', category: 'tools' },
  { title: 'Endpoints', href: '/endpoints', category: 'tools' },
  { title: 'About', href: '/about-xandash', category: 'info' },
  { title: 'Docs', href: '/docs', category: 'info' },
];

const mainItems = navItems.filter(item => item.category === 'main');
const toolsItems = navItems.filter(item => item.category === 'tools');
const infoItems = navItems.filter(item => item.category === 'info');

// Mobile Network Selector - Compact for mobile
const MobileNetworkSelector: React.FC = () => {
  const { setNetwork, isMainnet } = useNetwork();
  const { refreshAll } = useRPCContext();
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshRef = useRef(refreshAll);

  useEffect(() => {
    refreshRef.current = refreshAll;
  }, [refreshAll]);

  useEffect(() => {
    const tick = () => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimeout(() => refreshRef.current(), 0);
          return 30;
        }
        return prev - 1;
      });
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refreshRef.current();
    setTimeLeft(30);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  return (
    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
      {/* Network Toggle Buttons - Compact */}
      <div className="flex gap-1.5 flex-1">
        <button
          onClick={() => setNetwork('devnet')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-medium transition-all',
            !isMainnet 
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
              : 'bg-white/5 border border-transparent text-white/40'
          )}
        >
          <div className={cn('w-1.5 h-1.5 rounded-full', !isMainnet ? 'bg-emerald-400' : 'bg-white/30')} />
          Devnet
        </button>
        <button
          onClick={() => setNetwork('mainnet')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-medium transition-all',
            isMainnet 
              ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400' 
              : 'bg-white/5 border border-transparent text-white/40'
          )}
        >
          <div className={cn('w-1.5 h-1.5 rounded-full', isMainnet ? 'bg-blue-400' : 'bg-white/30')} />
          Mainnet
        </button>
      </div>
      
      {/* Refresh Timer - Compact */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
        <span className="font-mono text-white/50 text-[10px]">{timeLeft}s</span>
        <button
          onClick={handleRefresh}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={cn(
            'w-3 h-3 text-white/40',
            isRefreshing && 'animate-spin'
          )} />
        </button>
      </div>
    </div>
  );
};

// Network Status with Live indicator
const NetworkStatus: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { setNetwork, isMainnet } = useNetwork();
  const { refreshAll } = useRPCContext();
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const refreshRef = useRef(refreshAll);

  useEffect(() => {
    refreshRef.current = refreshAll;
  }, [refreshAll]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const tick = () => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimeout(() => refreshRef.current(), 0);
          return 30;
        }
        return prev - 1;
      });
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refreshRef.current();
    setTimeLeft(30);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 sm:gap-2 rounded-full transition-all duration-300',
          'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20',
          compact ? 'px-2 py-1' : 'px-2 sm:px-3 py-1 sm:py-1.5',
          isOpen && 'bg-white/10 border-white/20'
        )}
      >
        {/* Live Pulse */}
        <div className="relative flex items-center justify-center w-1.5 h-1.5 sm:w-2 sm:h-2">
          <div className={cn(
            'absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-ping opacity-75',
            isMainnet ? 'bg-blue-400' : 'bg-emerald-400'
          )} />
          <div className={cn(
            'relative w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full',
            isMainnet ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
          )} />
        </div>

        {/* Network Name */}
        <span className={cn(
          'font-semibold tracking-wide',
          compact ? 'text-[10px]' : 'text-[10px] sm:text-xs',
          isMainnet ? 'text-blue-400' : 'text-emerald-400'
        )}>
          {isMainnet ? 'MAINNET' : 'DEVNET'}
        </span>

        {/* Timer */}
        <div className="flex items-center gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 border-l border-white/10">
          <span className={cn(
            'font-mono text-white/50 text-center',
            compact ? 'text-[9px] min-w-[14px]' : 'text-[9px] sm:text-[10px] min-w-[14px] sm:min-w-[18px]'
          )}>{timeLeft}s</span>
          <span
            onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
            className="p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleRefresh(); } }}
          >
            <RefreshCw className={cn(
              'text-white/40 hover:text-white/70',
              compact ? 'w-2.5 h-2.5' : 'w-2.5 h-2.5 sm:w-3 sm:h-3',
              isRefreshing && 'animate-spin'
            )} />
          </span>
        </div>

        <ChevronDown className={cn(
          'text-white/40 transition-transform duration-200',
          compact ? 'w-2.5 h-2.5' : 'w-2.5 h-2.5 sm:w-3 sm:h-3',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      <div className={cn(
        'absolute top-full right-0 mt-2 w-32 sm:w-36 py-1 rounded-xl overflow-hidden transition-all duration-200',
        'bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl',
        isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
      )}>
        <button
          onClick={() => { setNetwork('devnet'); setIsOpen(false); }}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-[11px] sm:text-xs transition-colors',
            !isMainnet ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/60 hover:bg-white/5 hover:text-white'
          )}
        >
          <div className={cn('w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full', !isMainnet ? 'bg-emerald-400' : 'bg-white/20')} />
          <span>Devnet</span>
          {!isMainnet && <span className="ml-auto text-[8px] sm:text-[9px] opacity-60">LIVE</span>}
        </button>
        <button
          onClick={() => { setNetwork('mainnet'); setIsOpen(false); }}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-[11px] sm:text-xs transition-colors',
            isMainnet ? 'bg-blue-500/10 text-blue-400' : 'text-white/60 hover:bg-white/5 hover:text-white'
          )}
        >
          <div className={cn('w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full', isMainnet ? 'bg-blue-400' : 'bg-white/20')} />
          <span>Mainnet</span>
          {isMainnet && <span className="ml-auto text-[8px] sm:text-[9px] opacity-60">LIVE</span>}
        </button>
      </div>
    </div>
  );
};

// Dropdown for utilities
const NavDropdown: React.FC<{ title: string; items: NavItem[]; pathname: string }> = ({ title, items, pathname }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasActive = items.some(item => pathname === item.href);

  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className={cn(
        'flex items-center gap-0.5 px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200',
        hasActive ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
      )}>
        {title}
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>
      <div className={cn(
        'absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 py-1 rounded-xl overflow-hidden transition-all duration-200',
        'bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl',
        isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
      )}>
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block px-3 py-2 text-xs transition-colors',
              pathname === item.href ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
            )}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Floating Navbar */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'py-1.5 sm:py-2' : 'py-2 sm:py-3'
      )}>
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className={cn(
            'flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl transition-all duration-300',
            'bg-black/80 backdrop-blur-xl border border-white/10',
            scrolled && 'shadow-2xl shadow-black/20'
          )}>
            {/* Logo */}
            <Link href="/" className="flex items-center group flex-shrink-0">
              <span className="text-white font-bold text-xs sm:text-sm tracking-tight group-hover:opacity-80 transition-opacity">
                XANDASH
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              {mainItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {item.title}
                </Link>
              ))}
              <NavDropdown title="Utilities" items={toolsItems} pathname={pathname} />
              {infoItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden sm:block">
                <NetworkStatus />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                <div className="w-4 h-3 sm:w-5 sm:h-4 flex flex-col justify-between">
                  <span className={cn(
                    'block h-0.5 bg-white rounded-full transition-all duration-300 origin-center',
                    mobileOpen && 'rotate-45 translate-y-[5px] sm:translate-y-[7px]'
                  )} />
                  <span className={cn(
                    'block h-0.5 bg-white rounded-full transition-all duration-300',
                    mobileOpen && 'opacity-0 scale-0'
                  )} />
                  <span className={cn(
                    'block h-0.5 bg-white rounded-full transition-all duration-300 origin-center',
                    mobileOpen && '-rotate-45 -translate-y-[5px] sm:-translate-y-[7px]'
                  )} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={cn(
        'fixed inset-0 z-40 lg:hidden transition-all duration-300',
        mobileOpen ? 'visible' : 'invisible pointer-events-none'
      )}>
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Menu Panel - Scrollable */}
        <div className={cn(
          'absolute top-14 sm:top-16 left-2 right-2 sm:left-3 sm:right-3 bottom-4',
          'bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl',
          'transition-all duration-300 flex flex-col',
          mobileOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
        )}>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-hide">
            {/* Mobile Network Status - Full Width Prominent */}
            <div className="sm:hidden">
              <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 mb-2">Network</p>
              <MobileNetworkSelector />
            </div>

            {/* Main Links */}
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 sm:px-3 mb-1.5 sm:mb-2">Main</p>
              {mainItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all',
                    pathname === item.href
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 active:bg-white/5 hover:text-white'
                  )}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className={cn('w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0', pathname === item.href ? 'bg-white' : 'bg-white/30')} />
                  {item.title}
                </Link>
              ))}
            </div>

            {/* Utilities */}
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 sm:px-3 mb-1.5 sm:mb-2">Utilities</p>
              {toolsItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all',
                    pathname === item.href
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 active:bg-white/5 hover:text-white'
                  )}
                  style={{ animationDelay: `${(mainItems.length + i) * 30}ms` }}
                >
                  <div className={cn('w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0', pathname === item.href ? 'bg-white' : 'bg-white/30')} />
                  {item.title}
                </Link>
              ))}
            </div>

            {/* Info */}
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 sm:px-3 mb-1.5 sm:mb-2">Info</p>
              {infoItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all',
                    pathname === item.href
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 active:bg-white/5 hover:text-white'
                  )}
                  style={{ animationDelay: `${(mainItems.length + toolsItems.length + i) * 30}ms` }}
                >
                  <div className={cn('w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0', pathname === item.href ? 'bg-white' : 'bg-white/30')} />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-12 sm:h-14 lg:h-16" />
    </>
  );
};
