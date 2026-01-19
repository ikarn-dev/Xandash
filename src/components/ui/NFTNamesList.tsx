'use client';

import React from 'react';

interface NFTNamesListProps {
  nftNames?: string[];
  sbtNames?: string[];
  nftCount?: number;
  sbtCount?: number;
  maxDisplay?: number;
  showType?: boolean;
  showCounts?: boolean;
  className?: string;
}

export const NFTNamesList: React.FC<NFTNamesListProps> = ({
  nftNames = [],
  sbtNames = [],
  nftCount,
  sbtCount,
  maxDisplay = 3,
  showType = true,
  showCounts = true,
  className = ''
}) => {
  // Use provided counts or fallback to array lengths
  const totalNfts = nftCount ?? nftNames.length;
  const totalSbts = sbtCount ?? sbtNames.length;

  const allAssets = [
    ...nftNames.map(name => ({ name, type: 'NFT' as const })),
    ...sbtNames.map(name => ({ name, type: 'SBT' as const }))
  ];

  if (allAssets.length === 0 && totalNfts === 0 && totalSbts === 0) {
    return <span className={`text-white/40 text-[9px] sm:text-[10px] ${className}`}>No assets</span>;
  }

  const displayAssets = allAssets.slice(0, maxDisplay);
  const remainingCount = allAssets.length - maxDisplay;

  return (
    <div className={`flex flex-col gap-0.5 sm:gap-1 ${className}`}>
      {displayAssets.map((asset, index) => (
        <div key={index} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          {showType && (
            <span className={`text-[7px] sm:text-[8px] md:text-[9px] px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0 font-medium whitespace-nowrap ${asset.type === 'NFT'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
              {showCounts && (
                <span className="mr-0.5">
                  {asset.type === 'NFT' ? totalNfts : totalSbts}
                </span>
              )}
              {asset.type}
            </span>
          )}
          <span
            className="text-[8px] sm:text-[9px] md:text-[10px] text-white/80 truncate flex-1 min-w-0"
            title={asset.name}
          >
            {asset.name}
          </span>
        </div>
      ))}

      {remainingCount > 0 && (
        <div className="text-[7px] sm:text-[8px] text-white/50 pl-0.5">
          +{remainingCount} more asset{remainingCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default NFTNamesList;