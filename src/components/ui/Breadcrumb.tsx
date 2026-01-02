'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Custom SVG Icons
const HomeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// Route name mappings
const routeNames: Record<string, string> = {
  '': 'Analytics',
  'nodes': 'pNodes',
  'leaderboard': 'Leaderboard',
  'network': 'Network',
  'xand': 'XAND',
  'endpoints': 'Endpoints',
  'about': 'Docs',
  'profile': 'Node Profile',
  'country': 'Country',
};

// Routes that should not be clickable (no intermediate pages)
const nonClickableRoutes = ['profile', 'country'];

// Get display name for a route segment
const getDisplayName = (segment: string, fullPath: string): string => {
  // Check if it's a dynamic segment (IP address or country code)
  if (fullPath.includes('/profile/')) {
    const parts = fullPath.split('/');
    const ipIndex = parts.indexOf('profile') + 1;
    if (parts[ipIndex] === segment) {
      return segment; // Return the IP as-is
    }
  }
  
  if (fullPath.includes('/country/')) {
    const parts = fullPath.split('/');
    const codeIndex = parts.indexOf('country') + 1;
    if (parts[codeIndex] === segment) {
      return segment.toUpperCase(); // Return country code in uppercase
    }
  }

  return routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
};

// Check if a route should be clickable
const isClickableRoute = (segment: string, index: number, segments: string[]): boolean => {
  // Last item is never clickable (current page)
  if (index === segments.length - 1) return false;
  
  // Check if this segment is in the non-clickable list
  if (nonClickableRoutes.includes(segment)) return false;
  
  return true;
};

export const Breadcrumb: React.FC = () => {
  const pathname = usePathname();
  
  // Don't show breadcrumb on home page
  if (pathname === '/') {
    return null;
  }

  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    const isClickable = isClickableRoute(segment, index, segments);
    const displayName = getDisplayName(segment, pathname);

    return {
      name: displayName,
      path,
      isLast,
      isClickable,
    };
  });

  return (
    <nav className="flex items-center gap-1 text-sm mb-4">
      {/* Home link */}
      <Link 
        href="/" 
        className="flex items-center gap-1 text-white/50 hover:text-white transition-colors"
      >
        <HomeIcon className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          <ChevronRightIcon className="w-3 h-3 text-white/30" />
          {item.isLast ? (
            <span className="text-white font-medium">{item.name}</span>
          ) : (
            <Link 
              href={item.path}
              className="text-white/50 hover:text-white transition-colors"
            >
              {item.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
