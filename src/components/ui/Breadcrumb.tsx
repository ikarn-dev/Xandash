'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Custom SVG Icons
const HomeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Route name mappings
const routeNames: Record<string, string> = {
  '': 'Analytics',
  'nodes': 'pNodes',
  'mainnet': 'Mainnet',
  'leaderboard': 'Leaderboard',
  'network': 'Network',
  'governance': 'Governance',
  'xand': 'XAND',
  'stoinc': 'STOINC',
  'endpoints': 'Endpoints',
  'about-xandash': 'About',
  'docs': 'Docs',
  'profile': 'Node Profile',
  'country': 'Country',
  'manager': 'Managers',
  'managers': 'Managers',
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

  // Check if it's a manager address (long alphanumeric string)
  if (fullPath.includes('/manager/') && segment.length > 20) {
    const parts = fullPath.split('/');
    const addressIndex = parts.indexOf('manager') + 1;
    if (parts[addressIndex] === segment) {
      // Truncate manager address for breadcrumb
      return `${segment.slice(0, 6)}...${segment.slice(-4)}`;
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
    let path = '/' + segments.slice(0, index + 1).join('/');

    // Redirect 'manager' segment to '/managers' list page
    if (segment === 'manager') {
      path = '/managers';
    }

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
    <nav className="flex items-center gap-1 text-xs sm:text-sm mb-3 sm:mb-4 overflow-hidden">
      {/* Home link */}
      <Link
        href="/"
        className="flex items-center gap-1 text-white/50 hover:text-white transition-colors flex-shrink-0"
      >
        <HomeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="hidden xs:inline">Home</span>
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          <ChevronRightIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/30 flex-shrink-0" />
          {item.isLast ? (
            <span className="text-white font-medium truncate min-w-0">{item.name}</span>
          ) : item.isClickable ? (
            <Link
              href={item.path}
              className="text-white/50 hover:text-white transition-colors truncate min-w-0"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-white/50 truncate min-w-0">{item.name}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
