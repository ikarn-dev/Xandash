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
        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black border border-white/20 rounded-lg text-white/70 text-xs sm:text-sm hover:border-white/40 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Clear All
      </button>
      <button
        onClick={onTestAll}
        disabled={testing || isPending}
        className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 border border-white/30 rounded-lg text-white text-xs sm:text-sm hover:bg-white/20 hover:border-white/50 transition-all disabled:opacity-50"
      >
        {testing ? (
          <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
        ) : (
          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
        )}
        <span>{testing ? 'Testing...' : 'Test All'}</span>
      </button>
    </div>
  );
};
