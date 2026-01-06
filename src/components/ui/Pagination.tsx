'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  className = '',
}) => {
  const getVisiblePages = () => {
    const delta = 1; // Reduced for mobile
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border transition-all duration-200 ${
          hasPrev
            ? 'bg-black/50 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 hover:text-white cursor-pointer'
            : 'bg-black/30 border-white/10 text-white/30 cursor-not-allowed'
        }`}
      >
        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline ml-1">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 text-white/40">
                <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`w-7 h-7 sm:w-9 sm:h-9 text-xs sm:text-sm rounded-lg border transition-all duration-200 ${
                  currentPage === page
                    ? 'bg-white/20 border-white/40 text-white font-medium'
                    : 'bg-black/50 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white cursor-pointer'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border transition-all duration-200 ${
          hasNext
            ? 'bg-black/50 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 hover:text-white cursor-pointer'
            : 'bg-black/30 border-white/10 text-white/30 cursor-not-allowed'
        }`}
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};
