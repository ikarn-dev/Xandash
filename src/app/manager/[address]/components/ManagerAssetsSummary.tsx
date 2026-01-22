'use client';

import React, { useEffect, useState } from 'react';
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

export const ManagerAssetsSummary: React.FC<ManagerAssetsSummaryProps> = ({ managerAddress }) => {
  const [assets, setAssets] = useState<ManagerAssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/manager-assets?address=${managerAddress}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }
        
        const data = await response.json();
        setAssets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [managerAddress]);

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
    // Show cards with zero values instead of hiding completely
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
            0
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
            0
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
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400 font-mono">
            0
          </div>
          <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
            Xandeum NFTs
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

      {/* NFT Summary - Full width on mobile */}
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
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400 font-mono">
          {assets.nft_count ?? 0}
        </div>
        <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
          Xandeum NFTs
        </div>
      </div>

      {/* SBT Count - Only show if has SBTs */}
      {hasSbts && (
        <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
          <CornerAccents />
          <div className="flex items-center gap-2 text-emerald-400/70 text-[10px] sm:text-xs mb-2">
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
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-400 font-mono">
            {assets.sbt_count ?? 0}
          </div>
          <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
            Soul Bound Tokens
          </div>
        </div>
      )}
    </div>
  );
};
