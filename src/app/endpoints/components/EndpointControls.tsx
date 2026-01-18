import { Play, Loader } from 'lucide-react';

interface EndpointControlsProps {
  testing: boolean;
  isPending: boolean;
  hasResults: boolean;
  onClearResults: () => void;
  onTestAll: () => void;
}

export const EndpointControls = ({
  testing,
  isPending,
  hasResults,
  onClearResults,
  onTestAll
}: EndpointControlsProps) => {
  return (
    <div className="flex items-center justify-end space-x-2 sm:space-x-3">
      <button
        onClick={onClearResults}
        disabled={isPending || !hasResults}
        className="relative group px-3 sm:px-4 py-1.5 sm:py-2 bg-black border border-white/20 text-white/70 text-xs sm:text-sm hover:border-white/40 hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2">
          <div className="absolute top-0 left-0 w-1 h-px bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
          <div className="absolute top-0 left-0 w-px h-1 bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
        </div>
        <div className="absolute top-0 right-0 w-2 h-2">
          <div className="absolute top-0 right-0 w-1 h-px bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
          <div className="absolute top-0 right-0 w-px h-1 bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
        </div>
        <div className="absolute bottom-0 left-0 w-2 h-2">
          <div className="absolute bottom-0 left-0 w-1 h-px bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
          <div className="absolute bottom-0 left-0 w-px h-1 bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
        </div>
        <div className="absolute bottom-0 right-0 w-2 h-2">
          <div className="absolute bottom-0 right-0 w-1 h-px bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
          <div className="absolute bottom-0 right-0 w-px h-1 bg-white/20 group-hover:bg-white/40 transition-all duration-300" />
        </div>
        <span className="relative z-10 font-mono">Clear All</span>
      </button>
      <button
        onClick={onTestAll}
        disabled={testing || isPending}
        className="relative group flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black border border-emerald-400/30 text-emerald-400 text-xs sm:text-sm hover:border-emerald-400/50 hover:bg-emerald-400/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2">
          <div className="absolute top-0 left-0 w-1 h-px bg-emerald-400/30 group-hover:bg-emerald-400/50 transition-all duration-300" />
          <div className="absolute top-0 left-0 w-px h-1 bg-emerald-400/30 group-hover:bg-emerald-400/50 transition-all duration-300" />
        </div>
        <div className="absolute top-0 right-0 w-2 h-2">
          <div className="absolute top-0 right-0 w-1 h-px bg-emerald-400/30 group-hover:bg-emerald-400/50 transition-all duration-300" />
          <div className="absolute top-0 right-0 w-px h-1 bg-emerald-400/30 group-hover:bg-emerald-400/50 transition-all duration-300" />
        </div>
        <div className="absolute bottom-0 left-0 w-2 h-2">
          <div className="absolute bottom-0 left-0 w-1 h-px bg-emerald-400/30 group-hover:bg-emerald-400/50 transition-all duration-300" />
          <div className="absolute bottom-0 left-0 w-px h-1 bg-emerald-400/30 group-hover:bg-emerald-400/50 transition-all duration-300" />
        </div>
        <div className="absolute bottom-0 right-0 w-2 h-2">
          <div className="absolute bottom-0 right-0 w-1 h-px bg-emerald-400/30 group-hover:bg-emerald-400/50 transition-all duration-300" />
          <div className="absolute bottom-0 right-0 w-px h-1 bg-emerald-400/30 group-hover:bg-emerald-400/50 transition-all duration-300" />
        </div>
        <div className="relative z-10 flex items-center space-x-1.5 sm:space-x-2">
          {testing ? (
            <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span className="font-mono">{testing ? 'Testing...' : 'Test All'}</span>
        </div>
      </button>
    </div>
  );
};
