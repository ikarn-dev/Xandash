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
  const [isHidden, setIsHidden] = useState(true); // Start hidden to prevent flash
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    setIsHidden(stored === 'true');
  }, []);

  const toggleVisibility = () => {
    const newValue = !isHidden;
    setIsHidden(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  if (!mounted) return null;

  const announcements = [
    { text: 'MAINNET IS LIVE', color: 'text-blue-400', dot: 'bg-blue-400' },
    { text: '•', color: 'text-white/20', dot: '' },
    { text: 'DEVNET IS LIVE', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    { text: '•', color: 'text-white/20', dot: '' },
    { text: 'REAL-TIME MONITORING', color: 'text-white/60', dot: 'bg-white/40' },
    { text: '•', color: 'text-white/20', dot: '' },
    { text: 'TRACK YOUR PNODES', color: 'text-amber-400', dot: 'bg-amber-400' },
    { text: '•', color: 'text-white/20', dot: '' },
    { text: 'EARN STOINC REWARDS', color: 'text-purple-400', dot: 'bg-purple-400' },
    { text: '•', color: 'text-white/20', dot: '' },
  ];

  // Show toggle button when hidden
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
      {/* Hide button */}
      <button
        onClick={toggleVisibility}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded hover:bg-white/10 transition-colors group"
        aria-label="Hide announcements"
      >
        <XIcon className="w-3 h-3 text-white/30 group-hover:text-white/60" />
      </button>

      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/80 to-transparent z-[1] pointer-events-none" />
      <div className="absolute right-8 top-0 bottom-0 w-12 bg-gradient-to-l from-black/80 to-transparent z-[1] pointer-events-none" />

      {/* Marquee content */}
      <div className="flex animate-marquee py-2">
        {/* Duplicate content for seamless loop */}
        {[...Array(4)].map((_, repeatIndex) => (
          <div key={repeatIndex} className="flex items-center gap-4 px-4 shrink-0">
            {announcements.map((item, i) => (
              <div key={`${repeatIndex}-${i}`} className="flex items-center gap-2 shrink-0">
                {item.dot && (
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dot} animate-pulse`} />
                )}
                <span className={`text-xs font-mono font-medium tracking-wider whitespace-nowrap ${item.color}`}>
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
            transform: translateX(-25%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
