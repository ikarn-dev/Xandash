'use client';

import React, { useState, useRef, useEffect } from 'react';

// Basic interface matching the data structure
interface NFTPreview {
  name: string;
  image: string | null;
}

interface ManagerBadgeProps {
  managerPubkey?: string;
  nftCount?: number;
  sbtCount?: number;
  xandBalance?: number;
  xenoBalance?: number;
  lastUpdated?: number;
  nftNames?: string[];
  sbtNames?: string[];
  nftPreviews?: NFTPreview[];
  sbtPreviews?: NFTPreview[];
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const ManagerBadge: React.FC<ManagerBadgeProps> = ({
  managerPubkey,
  nftCount = 0,
  sbtCount = 0,
  xandBalance = 0,
  xenoBalance = 0,
  lastUpdated,
  nftNames = [],
  sbtNames = [],
  nftPreviews = [],
  sbtPreviews = [],
  size = 'sm',
  showDetails = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (badgeRef.current && !badgeRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTooltip]);

  if (!managerPubkey) {
    return null;
  }

  // Normalize data: Use previews if available, otherwise map names to previews
  const allNftPreviews: NFTPreview[] = nftPreviews.length > 0
    ? nftPreviews
    : nftNames.map(name => ({ name, image: null }));

  const allSbtPreviews: NFTPreview[] = sbtPreviews.length > 0
    ? sbtPreviews
    : sbtNames.map(name => ({ name, image: null }));

  const hasNfts = nftCount > 0 || allNftPreviews.length > 0;
  const hasSbts = sbtCount > 0 || allSbtPreviews.length > 0;
  const hasXeno = xenoBalance > 0;
  const hasAssets = hasNfts || hasSbts || hasXeno;

  const actualNftCount = nftCount || allNftPreviews.length;
  const actualSbtCount = sbtCount || allSbtPreviews.length;

  // Get first NFT/SBT name for display
  const firstNftName = allNftPreviews[0]?.name || '';
  const firstSbtName = allSbtPreviews[0]?.name || '';

  // Truncate name for display
  const truncateName = (name: string, maxLength: number = 20) => {
    if (!name) return '';
    return name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
  };

  // Toggle tooltip for mobile
  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (allNftPreviews.length > 0 || allSbtPreviews.length > 0 || hasXeno) {
      setShowTooltip(!showTooltip);
    }
  };

  // If manager is registered but has no assets, show "Registered • 0 NFTs"
  if (!hasAssets) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] sm:text-[10px] whitespace-nowrap w-[110px] justify-center">
        <span className="text-emerald-400 font-medium">Registered</span>
        <span className="text-emerald-500/40">•</span>
        <span className="text-emerald-400/60">0 NFTs</span>
      </div>
    );
  }

  // Render compact badges with detailed tooltips
  return (
    <div ref={badgeRef} className="flex flex-col gap-1">
      {/* Combined NFT + XENO Badge */}
      {hasNfts && (
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div
            onClick={handleBadgeClick}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-[9px] sm:text-[10px] cursor-pointer hover:bg-orange-500/20 transition-colors whitespace-nowrap w-[110px] justify-center"
          >
            <span className="text-orange-400 font-bold">{actualNftCount}</span>
            <span className="text-orange-400/80">NFT</span>
            {hasXeno && (
              <>
                <span className="text-orange-500/40">•</span>
                <span className="text-purple-400 font-bold">{xenoBalance.toLocaleString()}</span>
                <span className="text-purple-400/80">XENO</span>
              </>
            )}
          </div>

          {/* Tooltip */}
          <div className={`absolute top-full left-0 mt-1 z-[100] bg-gray-900 border border-orange-500/30 rounded-lg p-2 shadow-xl min-w-[180px] max-w-[260px] ${showTooltip ? 'block' : 'hidden'}`}>
            {/* XENO Info in Tooltip */}
            {xenoBalance > 0 && (
              <div className="mb-2 pb-2 border-b border-white/10">
                <div className="text-[9px] text-purple-400 font-mono uppercase tracking-wider mb-0.5">XENO Balance</div>
                <div className="text-xs text-white font-mono">{xenoBalance.toLocaleString()} XENO</div>
              </div>
            )}

            <div className="font-medium text-orange-400 text-[9px] mb-1.5 border-b border-orange-500/20 pb-1">
              Xandeum NFTs ({actualNftCount})
            </div>
            <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
              {allNftPreviews.slice(0, 8).map((nft, i) => (
                <div key={i} className="text-[8px] text-gray-300 truncate flex items-center gap-1">
                  {nft.name}
                </div>
              ))}
              {allNftPreviews.length > 8 && (
                <div className="text-[7px] text-orange-400/60 pt-1">
                  +{allNftPreviews.length - 8} more
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SBT Badge */}
      {hasSbts && (
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div
            onClick={handleBadgeClick}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[9px] sm:text-[10px] cursor-pointer hover:bg-blue-500/20 transition-colors whitespace-nowrap w-[110px] justify-center"
          >
            <span className="text-blue-400 font-bold">{actualSbtCount}</span>
            <span className="text-blue-400/80">SBT{actualSbtCount !== 1 ? 's' : ''}</span>
            {actualSbtCount > 1 && (
              <>
                <span className="text-blue-500/40">•</span>
                <span className="text-blue-400/60 text-[8px]">+{actualSbtCount - 1}</span>
              </>
            )}
          </div>

          {/* Tooltip */}
          <div className={`absolute top-full left-0 mt-1 z-[100] bg-gray-900 border border-blue-500/30 rounded-lg p-2 shadow-xl min-w-[180px] max-w-[260px] ${showTooltip ? 'block' : 'hidden'}`}>
            {/* XENO Info in Tooltip - Show here too if hovered on SBT */}
            {xenoBalance > 0 && (
              <div className="mb-2 pb-2 border-b border-white/10">
                <div className="text-[9px] text-purple-400 font-mono uppercase tracking-wider mb-0.5">XENO Balance</div>
                <div className="text-xs text-white font-mono">{xenoBalance.toLocaleString()} XENO</div>
              </div>
            )}

            <div className="font-medium text-blue-400 text-[9px] mb-1.5 border-b border-blue-500/20 pb-1">
              Xandeum SBTs ({actualSbtCount})
            </div>
            <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
              {allSbtPreviews.slice(0, 8).map((sbt, i) => (
                <div key={i} className="text-[8px] text-gray-300 truncate">
                  {sbt.name}
                </div>
              ))}
              {allSbtPreviews.length > 8 && (
                <div className="text-[7px] text-blue-400/60 pt-1">
                  +{allSbtPreviews.length - 8} more
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fallback: Only XENO, no NFTs/SBTs */}
      {!hasNfts && !hasSbts && hasXeno && (
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] sm:text-[10px] font-mono cursor-help w-[110px] justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>{xenoBalance.toLocaleString()} XENO</span>
          </div>
          {/* Tooltip for Just XENO */}
          <div className={`absolute top-full left-0 mt-1 z-[100] bg-gray-900 border border-purple-500/30 rounded-lg p-2 shadow-xl min-w-[160px] ${showTooltip ? 'block' : 'hidden'}`}>
            <div className="text-[9px] text-purple-400 font-mono uppercase tracking-wider mb-0.5">XENO Balance</div>
            <div className="text-xs text-white font-mono">{xenoBalance.toLocaleString()} XENO</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerBadge;