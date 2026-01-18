'use client';

interface CompareTypeSwitcherProps {
  activeType: 'nodes' | 'countries';
  onTypeChange: (type: 'nodes' | 'countries') => void;
}

export function CompareTypeSwitcher({ activeType, onTypeChange }: CompareTypeSwitcherProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center p-1 bg-black border border-white/10">
        <button
          onClick={() => onTypeChange('nodes')}
          className={`relative px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeType === 'nodes'
              ? 'text-white bg-white/10 border border-emerald-500/50'
              : 'text-white/50 hover:text-white/70 border border-transparent'
          }`}
        >
          <span className="relative flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
            <span>Nodes</span>
          </span>
        </button>
        
        <button
          onClick={() => onTypeChange('countries')}
          className={`relative px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeType === 'countries'
              ? 'text-white bg-white/10 border border-purple-500/50'
              : 'text-white/50 hover:text-white/70 border border-transparent'
          }`}
        >
          <span className="relative flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Countries</span>
          </span>
        </button>
      </div>
    </div>
  );
}
