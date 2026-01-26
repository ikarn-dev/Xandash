'use client';

import { useRouter } from 'next/navigation';
import { useNetwork } from '@/libs/context/network-context';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface NodeNotFoundProps {
  ip?: string;
  pubkey?: string;
  showSwitchNetwork?: boolean;
  onRetry?: () => void;
}

export function NodeNotFound({ ip, pubkey, showSwitchNetwork = true, onRetry }: NodeNotFoundProps) {
  const router = useRouter();
  const { network, setNetwork } = useNetwork();

  const otherNetwork = network === 'mainnet' ? 'devnet' : 'mainnet';
  const identifier = ip || pubkey;
  const truncatedId = identifier
    ? identifier.length > 16
      ? `${identifier.slice(0, 8)}...${identifier.slice(-6)}`
      : identifier
    : null;

  const handleSwitchNetwork = () => {
    setNetwork(otherNetwork);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] py-8 px-4">
      {/* Lottie Animation in contained box with dark border */}
      <div className="relative w-full max-w-md mb-6 rounded-lg overflow-hidden border border-white/10 bg-black">
        {/* Dark overlay to blend edges */}
        <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]" />

        {/* Animation container with inverted colors */}
        <div className="relative" style={{ filter: 'invert(1) hue-rotate(180deg)', opacity: 0.9 }}>
          <DotLottieReact
            src="https://lottie.host/258f92e2-8e20-4b40-8ceb-4a168bd0081c/odaTfIB90w.lottie"
            loop
            autoplay
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-base font-mono text-white/80 tracking-widest mb-3">
        // NODE_NOT_FOUND
      </h2>

      {/* Error message */}
      <div className="text-center mb-5">
        {truncatedId ? (
          <p className="text-white/50 text-xs mb-1">
            Unable to locate node{' '}
            <span className="font-mono text-red-400/80">
              {truncatedId}
            </span>
          </p>
        ) : (
          <p className="text-white/50 text-xs mb-1">
            The requested node could not be found
          </p>
        )}
        <p className="text-white/30 text-[10px]">
          on <span className={network === 'mainnet' ? 'text-blue-400/70' : 'text-green-400/70'}>
            {network.toUpperCase()}
          </span> network
        </p>
        {showSwitchNetwork && (
          <p className="text-white/20 text-[10px] mt-1">
            This node may exist on {otherNetwork}
          </p>
        )}
      </div>

      {/* Compact action buttons */}
      <div className="flex items-center gap-2">
        {/* Go Back */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white/60 hover:text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        {/* Switch Network */}
        {showSwitchNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all duration-200 ${otherNetwork === 'mainnet'
                ? 'text-blue-400/70 hover:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40'
                : 'text-green-400/70 hover:text-green-400 bg-green-500/5 hover:bg-green-500/10 border border-green-500/20 hover:border-green-500/40'
              }`}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />
            </svg>
            <span>{otherNetwork.charAt(0).toUpperCase() + otherNetwork.slice(1)}</span>
          </button>
        )}

        {/* Retry */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="group flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-cyan-400/70 hover:text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5" />
            </svg>
            <span>Retry</span>
          </button>
        )}
      </div>

      {/* Network indicator */}
      <div className="mt-5 flex items-center gap-1.5 text-[10px] text-white/30 font-mono">
        <svg className={`w-3 h-3 ${network === 'mainnet' ? 'text-blue-400/50' : 'text-green-400/50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
        <span>NETWORK:</span>
        <span className={network === 'mainnet' ? 'text-blue-400/60' : 'text-green-400/60'}>
          {network.toUpperCase()}
        </span>
        <div className={`w-1 h-1 rounded-full animate-pulse ${network === 'mainnet' ? 'bg-blue-400/60' : 'bg-green-400/60'}`} />
      </div>
    </div>
  );
}
