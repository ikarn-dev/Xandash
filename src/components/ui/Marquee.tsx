'use client';

import { useState, useEffect } from 'react';

interface MarqueeProps {
  className?: string;
}

const XIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronUpIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const STORAGE_KEY = 'xandash_marquee_hidden';

export const Marquee = ({ className = '' }: MarqueeProps) => {
  // Default to hidden to match most common state and reduce CLS
  const [isHidden, setIsHidden] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage immediately on mount
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    // Only show if explicitly NOT hidden
    setIsHidden(stored !== 'false');
  }, []);

  const toggleVisibility = () => {
    const newValue = !isHidden;
    setIsHidden(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  // Server-side and initial render: show minimal placeholder to avoid CLS
  // This placeholder has the same height as the actual component
  if (!mounted) {
    return (
      <div className={`relative h-[28px] bg-black/30 border-b border-white/5 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-white/20 font-mono">Loading...</span>
        </div>
      </div>
    );
  }

  const announcements = [
    { text: 'MAINNET + DEVNET SUPPORT', dot: true },
    { text: '•', dot: false },
    { text: 'REAL-TIME NODE MONITORING', dot: true },
    { text: '•', dot: false },
    { text: 'NODE COMPARE (UP TO 4)', dot: true },
    { text: '•', dot: false },
    { text: 'COUNTRY COMPARISON', dot: true },
    { text: '•', dot: false },
    { text: 'AI-POWERED ANALYSIS', dot: true },
    { text: '•', dot: false },
    { text: 'INTERACTIVE NETWORK MAP', dot: true },
    { text: '•', dot: false },
    { text: 'MULTI-LEADERBOARDS', dot: true },
    { text: '•', dot: false },
    { text: 'GOVERNANCE TRACKING', dot: true },
    { text: '•', dot: false },
    { text: 'HISTORICAL CHARTS', dot: true },
    { text: '•', dot: false },
    { text: 'NODE PROFILES', dot: true },
    { text: '•', dot: false },
    { text: 'MANAGER PROFILES', dot: true },
    { text: '•', dot: false },
    { text: 'ONCHAIN DATA', dot: true },
    { text: '•', dot: false },
    { text: 'NFT/SBT TRACKING', dot: true },
    { text: '•', dot: false },
    { text: 'XAND BALANCE DISPLAY', dot: true },
    { text: '•', dot: false },
    { text: 'COUNTRY ANALYTICS', dot: true },
    { text: '•', dot: false },
    { text: 'VPS PROVIDER STATS', dot: true },
    { text: '•', dot: false },
    { text: 'CREDITS TRACKING', dot: true },
    { text: '•', dot: false },
    { text: 'STORAGE ANALYTICS', dot: true },
    { text: '•', dot: false },
    { text: 'UPTIME MONITORING', dot: true },
    { text: '•', dot: false },
    { text: 'VERSION DISTRIBUTION', dot: true },
    { text: '•', dot: false },
    { text: 'XAND TOKEN INFO', dot: true },
    { text: '•', dot: false },
    { text: 'STOINC CALCULATOR', dot: true },
    { text: '•', dot: false },
    { text: 'RPC ENDPOINT TESTER', dot: true },
    { text: '•', dot: false },
    { text: 'API UPTIME GRAPHS', dot: true },
    { text: '•', dot: false },
    { text: 'SERVICE HEALTH MONITOR', dot: true },
    { text: '•', dot: false },
    { text: 'QUICK TABLE COMPARE', dot: true },
    { text: '•', dot: false },
    { text: 'NODE EVENT LOGS', dot: true },
    { text: '•', dot: false },
    { text: 'AUTO-REFRESH (30s)', dot: true },
    { text: '•', dot: false },
  ];

  if (isHidden) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={toggleVisibility}
          className="w-full flex items-center justify-center gap-2 py-1 bg-white/5 hover:bg-white/10 border-b border-white/5 transition-colors group"
          aria-label="Show announcements"
        >
          <ChevronUpIcon className="w-3 h-3 text-white/30 group-hover:text-white/50 rotate-180 transition-colors" />
          <span className="text-[10px] text-white/30 group-hover:text-white/50 font-mono transition-colors">Show announcements</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-black/60 border-b border-white/10 ${className}`}>
      <button
        onClick={toggleVisibility}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded hover:bg-white/10 transition-colors group"
        aria-label="Hide announcements"
      >
        <XIcon className="w-3 h-3 text-white/30 group-hover:text-white/60" />
      </button>

      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/80 to-transparent z-[1] pointer-events-none" />
      <div className="absolute right-8 top-0 bottom-0 w-12 bg-gradient-to-l from-black/80 to-transparent z-[1] pointer-events-none" />

      <div className="flex animate-marquee py-2">
        {/* Repeat content twice for seamless infinite scroll - translating -50% shows full content then loops */}
        {[...Array(2)].map((_, repeatIndex) => (
          <div key={repeatIndex} className="flex items-center gap-4 px-4 shrink-0">
            {announcements.map((item, i) => (
              <div key={`${repeatIndex}-${i}`} className="flex items-center gap-2 shrink-0">
                {item.dot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                )}
                <span className={`text-xs font-mono font-medium tracking-wider whitespace-nowrap ${item.dot ? 'text-white/80' : 'text-white/30'}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @media (max-width: 640px) {
          .animate-marquee {
            animation: marquee 20s linear infinite;
          }
        }
      `}</style>
    </div>
  );
};
