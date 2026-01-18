'use client';

interface CompareButtonProps {
  count: number;
  minRequired?: number;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  itemType?: 'nodes' | 'countries';
}

export function CompareButton({ count, minRequired = 2, onClick, disabled, isLoading, itemType = 'nodes' }: CompareButtonProps) {
  const canCompare = count >= minRequired && !disabled && !isLoading;
  const itemLabel = itemType === 'countries' ? 'country' : 'node';
  const itemLabelPlural = itemType === 'countries' ? 'Countries' : 'Nodes';
  const accentColor = itemType === 'countries' ? 'purple' : 'emerald';
  
  return (
    <button
      onClick={onClick}
      disabled={!canCompare}
      className={`
        relative w-full py-4 font-medium text-base
        transition-all duration-300 ease-out
        overflow-hidden
        ${canCompare 
          ? `text-white cursor-pointer bg-black border ${accentColor === 'purple' ? 'border-purple-500/50 hover:border-purple-500' : 'border-emerald-500/50 hover:border-emerald-500'}` 
          : isLoading
            ? 'text-white/70 cursor-wait bg-black border border-white/10'
            : 'text-white/40 cursor-not-allowed bg-black border border-white/10'
        }
      `}
    >
      <div className="relative flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
            <span>Comparing {itemLabelPlural.toLowerCase()}...</span>
          </>
        ) : (
          <span className="tracking-wide">
            {count < minRequired 
              ? `Select ${minRequired - count} more ${itemLabel}${minRequired - count > 1 ? 's' : ''}`
              : `Compare ${count} ${itemLabelPlural}`
            }
          </span>
        )}
      </div>
    </button>
  );
}
