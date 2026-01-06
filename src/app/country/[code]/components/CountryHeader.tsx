'use client';

import { useRouter } from 'next/navigation';
import { getCountryFlagUrl } from '@/libs/services/geolocation';
import { CornerAccents } from '@/components/ui';
import { ArrowLeftIcon } from './CountryIcons';

interface CountryHeaderProps {
  countryCode: string;
  countryName: string;
  totalNodes: number;
  onlineNodes: number;
  syncingNodes: number;
  offlineNodes: number;
}

export const CountryHeader = ({
  countryCode,
  countryName,
  totalNodes,
  onlineNodes,
  syncingNodes,
  offlineNodes
}: CountryHeaderProps) => {
  const router = useRouter();

  return (
    <div className="relative bg-black border border-white/10 p-3 sm:p-4 md:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
      <CornerAccents />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => router.push('/network')}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            {countryCode && (
              <img 
                src={getCountryFlagUrl(countryCode)} 
                alt={countryName}
                className="w-8 h-5 sm:w-12 sm:h-8 object-cover rounded shadow-lg"
              />
            )}
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-mono">
                {countryName || countryCode.toUpperCase()}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-white/60 text-[10px] sm:text-xs md:text-sm">
                <span>{totalNodes} nodes</span>
                <span className="text-white/30">•</span>
                <span className="text-emerald-400">{onlineNodes} online</span>
                {syncingNodes > 0 && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="text-amber-400">{syncingNodes} syncing</span>
                  </>
                )}
                <span className="text-white/30">•</span>
                <span className="text-red-400">{offlineNodes} offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
