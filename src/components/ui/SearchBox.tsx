'use client';

import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ 
  onSearch, 
  placeholder = "Search by NAME or IP or PUBKEY...",
  className = ""
}) => {
  const [query, setQuery] = useState('');

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

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-0 text-sm font-mono"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Search Button - White theme */}
        <button
          onClick={handleManualSearch}
          disabled={!query.trim()}
          className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed border-l border-white/20 rounded-r-lg"
        >
          <span className="text-sm font-medium">Search</span>
        </button>
      </div>
    </div>
  );
};
