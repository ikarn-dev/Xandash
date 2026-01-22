'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  mobilePlaceholder?: string;
  className?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  onSearch,
  placeholder = "Search by NAME or IP or PUBKEY...",
  mobilePlaceholder,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Auto search as user types
    onSearch(value);
  };

  const handleManualSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  // Use mobile placeholder if provided and on mobile, otherwise use regular placeholder
  const displayPlaceholder = isMobile && mobilePlaceholder ? mobilePlaceholder : placeholder;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={displayPlaceholder}
            aria-label="Search"
            className="w-full pl-9 sm:pl-12 pr-8 sm:pr-12 py-2 sm:py-3 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-0 text-xs sm:text-sm font-mono placeholder:text-[9px] sm:placeholder:text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        {/* Search Button - White theme */}
        <button
          type="button"
          onClick={handleManualSearch}
          disabled={!query.trim()}
          aria-label="Submit search"
          className="px-3 sm:px-5 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed border-l border-white/20 rounded-r-lg"
        >
          <span className="text-xs sm:text-sm font-medium">Search</span>
        </button>
      </div>
    </div>
  );
};
