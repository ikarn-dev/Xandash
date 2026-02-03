'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CornerAccents } from '@/components/ui';

interface ManagerAssetData {
  manager_pubkey: string;
  nft_count: number;
  sbt_count: number;
  xand_balance: number;
  xeno_balance: number;
  last_updated: number;
  nft_names: string[];
  sbt_names: string[];
  nft_previews: Array<{ name: string; image: string | null }>;
  sbt_previews: Array<{ name: string; image: string | null }>;
}

interface ManagerAssetsSummaryProps {
  managerAddress: string;
}

interface FetchError {
  message: string;
  isRateLimit: boolean;
}

export const ManagerAssetsSummary: React.FC<ManagerAssetsSummaryProps> = ({ managerAddress }) => {
  const [assets, setAssets] = useState<ManagerAssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FetchError | null>(null);

  // Track in-flight request to prevent duplicates (React StrictMode, re-renders)
  const fetchingRef = React.useRef<string | null>(null);
  const mountedRef = React.useRef(true);

  const fetchAssets = useCallback(async () => {
    // Deduplicate: skip if already fetching this address
    if (fetchingRef.current === managerAddress) {
      return;
    }

    fetchingRef.current = managerAddress;
    setError(null);

    try {
      setLoading(true);
      const response = await fetch(`/api/manager-assets?address=${managerAddress}`);

      if (!response.ok) {
        // Check for rate limit
        if (response.status === 429) {
          throw new Error('RATE_LIMIT');
        }
        throw new Error('Failed to fetch assets');
      }

      const data = await response.json();

      // Check for error in response
      if (data.error) {
        const isRateLimit = data.error.toLowerCase().includes('rate') || data.error.toLowerCase().includes('limit');
        if (mountedRef.current && fetchingRef.current === managerAddress) {
          setError({ message: data.error, isRateLimit });
        }
        return;
      }

      // Only update state if still mounted and still fetching same address
      if (mountedRef.current && fetchingRef.current === managerAddress) {
        setAssets(data);
      }
    } catch (err) {
      if (mountedRef.current && fetchingRef.current === managerAddress) {
        const message = err instanceof Error ? err.message : 'Failed to load assets';
        const isRateLimit = message === 'RATE_LIMIT' || message.toLowerCase().includes('rate');
        setError({
          message: isRateLimit ? 'Rate limit reached' : message,
          isRateLimit
        });
      }
    } finally {
      if (mountedRef.current && fetchingRef.current === managerAddress) {
        setLoading(false);
        fetchingRef.current = null;
      }
    }
  }, [managerAddress]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAssets();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchAssets]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="relative group bg-black border border-white/10 p-3 sm:p-4 animate-pulse">
            <CornerAccents />
            <div className="w-16 h-4 bg-white/10 mb-3 rounded" />
            <div className="w-24 h-8 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !assets) {
    // Show cards with zero values and error message
    return (
      <div className="space-y-3">
        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-center gap-2 text-amber-400/80 text-[10px] sm:text-xs">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{error.isRateLimit ? 'Rate limited - showing default values' : error.message}</span>
            </div>
            <button
              onClick={() => fetchAssets()}
              className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[10px] transition-colors cursor-pointer"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Retry</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* XAND Balance */}
          <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
            <CornerAccents />
            <div className="flex items-center gap-2 text-purple-400/70 text-[10px] sm:text-xs mb-2">
              <img
                src="/logo/XandToken.png"
                alt="XAND"
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span>XAND Balance</span>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400/50 font-mono">
              --
            </div>
            <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
              Xandeum Token
            </div>
          </div>

          {/* XENO Balance */}
          <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
            <CornerAccents />
            <div className="flex items-center gap-2 text-cyan-400/70 text-[10px] sm:text-xs mb-2">
              <img
                src="/logo/XandToken.png"
                alt="XENO"
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span>XENO Balance</span>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-400/50 font-mono">
              --
            </div>
            <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
              XENO Token
            </div>
          </div>

          {/* NFT Summary */}
          <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4 col-span-2 sm:col-span-1">
            <CornerAccents />
            <div className="flex items-center gap-2 text-orange-400/70 text-[10px] sm:text-xs mb-2">
              <img
                src="/logo/XandToken.png"
                alt="NFTs"
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span>NFTs</span>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400/50 font-mono">
              --
            </div>
            <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
              Xandeum NFTs
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasXand = (assets.xand_balance ?? 0) > 0;
  const hasXeno = (assets.xeno_balance ?? 0) > 0;
  const hasSbts = (assets.sbt_count ?? 0) > 0;
  const hasNfts = (assets.nft_count ?? 0) > 0;

  // Always show the cards section
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* XAND Balance */}
      <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
        <CornerAccents />
        <div className="flex items-center gap-2 text-purple-400/70 text-[10px] sm:text-xs mb-2">
          <img
            src="/logo/XandToken.png"
            alt="XAND"
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span>XAND Balance</span>
        </div>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400 font-mono">
          {(assets.xand_balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
          Xandeum Token
        </div>
      </div>

      {/* XENO Balance */}
      <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
        <CornerAccents />
        <div className="flex items-center gap-2 text-cyan-400/70 text-[10px] sm:text-xs mb-2">
          <img
            src="/logo/XandToken.png"
            alt="XENO"
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span>XENO Balance</span>
        </div>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-400 font-mono">
          {(assets.xeno_balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
          XENO Token
        </div>
      </div>

      {/* NFT Summary with Image Previews - Full width on mobile */}
      <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4 col-span-2 sm:col-span-1">
        <CornerAccents />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-orange-400/70 text-[10px] sm:text-xs">
            <img
              src="/logo/XandToken.png"
              alt="NFTs"
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span>NFTs</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-orange-400 font-mono">
            {assets.nft_count ?? 0}
          </div>
        </div>

        {/* NFT Image Previews Grid */}
        {assets.nft_previews && assets.nft_previews.length > 0 ? (
          <div className="grid grid-cols-5 gap-1 mt-2">
            {assets.nft_previews.slice(0, 5).map((nft, index) => (
              <div
                key={index}
                className="aspect-square bg-white/5 border border-orange-500/30 overflow-hidden relative group/nft"
                title={nft.name}
              >
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <span className="text-sm">🖼️</span>
                  </div>
                )}
              </div>
            ))}
            {/* Show more indicator if there are more than 5 NFTs */}
            {assets.nft_count > 5 && (
              <div className="absolute bottom-2 right-2 text-[8px] sm:text-[10px] text-orange-400/70">
                +{assets.nft_count - 5} more
              </div>
            )}
          </div>
        ) : (
          <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
            Xandeum NFTs
          </div>
        )}
      </div>

      {/* SBT Count with Image Previews - Only show if has SBTs */}
      {hasSbts && (
        <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
          <CornerAccents />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-400/70 text-[10px] sm:text-xs">
              <img
                src="/logo/XandToken.png"
                alt="SBTs"
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span>SBTs</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
              {assets.sbt_count ?? 0}
            </div>
          </div>

          {/* SBT Image Previews Grid */}
          {assets.sbt_previews && assets.sbt_previews.length > 0 ? (
            <div className="grid grid-cols-4 gap-1 mt-2">
              {assets.sbt_previews.slice(0, 4).map((sbt, index) => (
                <div
                  key={index}
                  className="aspect-square bg-white/5 border border-emerald-500/30 overflow-hidden"
                  title={sbt.name}
                >
                  {sbt.image ? (
                    <img
                      src={sbt.image}
                      alt={sbt.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <span className="text-xs">🏅</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
              Soul Bound Tokens
            </div>
          )}
        </div>
      )}
    </div>
  );
};
