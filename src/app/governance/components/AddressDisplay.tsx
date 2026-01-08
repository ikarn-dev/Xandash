'use client';

import { CopyIcon, ExternalLinkIcon } from './Icons';
import { shortenAddress, copyToClipboard, getSolscanUrl } from '../utils/helpers';

interface AddressDisplayProps {
  address: string;
  label?: string;
  chars?: number;
}

export function AddressDisplay({ address, label = 'Address', chars = 4 }: AddressDisplayProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <span className="text-white/60 font-mono text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[140px]">
        {shortenAddress(address, chars)}
      </span>
      <button 
        onClick={() => copyToClipboard(address, label)} 
        className="p-1 hover:bg-white/10 rounded transition-colors" 
        title="Copy"
      >
        <CopyIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/40 hover:text-white/60" />
      </button>
      <a 
        href={getSolscanUrl(address)} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="p-1 hover:bg-white/10 rounded transition-colors" 
        title="Solscan"
      >
        <ExternalLinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/40 hover:text-white/60" />
      </a>
    </div>
  );
}
