'use client';

interface CompareButtonProps {
  count: number;
  minRequired?: number;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function CompareButton({ count, minRequired = 2, onClick, disabled, isLoading }: CompareButtonProps) {
  const canCompare = count >= minRequired && !disabled && !isLoading;
  
  return (
    <button
      onClick={onClick}
      disabled={!canCompare}
      className={`
        relative w-full py-3 rounded-xl font-medium text-sm
        transition-all duration-300 border
        ${canCompare 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50' 
          : isLoading
            ? 'bg-white/5 border-white/10 text-white/60'
            : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
            <span>Comparing nodes...</span>
          </>
        ) : (
          <span>
            {count < minRequired 
              ? `Select ${minRequired - count} more node${minRequired - count > 1 ? 's' : ''}`
              : `Compare ${count} Nodes`
            }
          </span>
        )}
      </div>
    </button>
  );
}
