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
        relative w-full py-4 font-medium text-base
        transition-all duration-300 ease-out
        rounded-2xl overflow-hidden
        ${canCompare 
          ? 'text-white cursor-pointer' 
          : isLoading
            ? 'text-white/70 cursor-wait'
            : 'text-white/40 cursor-not-allowed'
        }
      `}
      style={{
        background: canCompare 
          ? 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)'
          : isLoading
            ? 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)'
            : '#0a0a0a',
        boxShadow: canCompare 
          ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.3)'
          : 'none',
        border: canCompare 
          ? '1px solid rgba(255,255,255,0.15)'
          : '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {/* Subtle gradient overlay on hover */}
      {canCompare && (
        <div 
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)'
          }}
        />
      )}
      
      {/* Top edge highlight */}
      {canCompare && (
        <div 
          className="absolute top-0 left-4 right-4 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
          }}
        />
      )}
      
      <div className="relative flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
            <span>Comparing nodes...</span>
          </>
        ) : (
          <span className="tracking-wide">
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
