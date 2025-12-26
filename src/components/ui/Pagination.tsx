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
    const delta = 2;
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
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* Previous Button */}
      <div className="relative group">
        <div className={`absolute -inset-1 rounded-lg blur-sm opacity-50 group-hover:opacity-70 transition duration-300 ${
          hasPrev 
            ? 'bg-gradient-to-r from-gray-400/20 to-gray-600/10' 
            : 'bg-gradient-to-r from-gray-600/10 to-gray-800/5'
        }`}></div>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className={`relative flex items-center px-4 py-2 bg-gradient-to-br from-black/60 to-black/80 border rounded-lg transition-all duration-200 cursor-pointer ${
            hasPrev
              ? 'border-white/20 text-white hover:border-white/40 hover:text-white'
              : 'border-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>
      </div>

      {/* Page Numbers */}
      <div className="flex items-center space-x-1">
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <div className="flex items-center justify-center w-10 h-10 text-white/40">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            ) : (
              <div className="relative group">
                <div className={`absolute -inset-1 rounded-lg blur-sm opacity-50 group-hover:opacity-70 transition duration-300 ${
                  currentPage === page 
                    ? 'bg-gradient-to-r from-orange-400/40 to-red-600/30' 
                    : 'bg-gradient-to-r from-gray-400/20 to-gray-600/10'
                }`}></div>
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`relative w-10 h-10 bg-gradient-to-br from-black/60 to-black/80 border rounded-lg transition-all duration-200 cursor-pointer ${
                    currentPage === page
                      ? 'border-orange-400/40 text-orange-400 shadow-lg'
                      : 'border-white/20 text-white hover:border-white/40 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next Button */}
      <div className="relative group">
        <div className={`absolute -inset-1 rounded-lg blur-sm opacity-50 group-hover:opacity-70 transition duration-300 ${
          hasNext 
            ? 'bg-gradient-to-r from-gray-400/20 to-gray-600/10' 
            : 'bg-gradient-to-r from-gray-600/10 to-gray-800/5'
        }`}></div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className={`relative flex items-center px-4 py-2 bg-gradient-to-br from-black/60 to-black/80 border rounded-lg transition-all duration-200 cursor-pointer ${
            hasNext
              ? 'border-white/20 text-white hover:border-white/40 hover:text-white'
              : 'border-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};