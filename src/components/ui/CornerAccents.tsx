'use client';

import React from 'react';

interface CornerAccentsProps {
  color?: 'white' | 'emerald' | 'blue' | 'cyan';
}

export const CornerAccents: React.FC<CornerAccentsProps> = ({ color = "white" }) => {
  const colorClasses: Record<string, string> = {
    white: "group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)]",
    emerald: "group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    blue: "group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    cyan: "group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)]",
  };

  const colorClass = colorClasses[color] || colorClasses.white;

  return (
    <>
      <div className="absolute top-0 left-0 w-4 h-4 z-20 pointer-events-none">
        <div className={`absolute top-0 left-0 w-2 h-px bg-white/20 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 left-0 w-px h-2 bg-white/20 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute top-0 right-0 w-4 h-4 z-20 pointer-events-none">
        <div className={`absolute top-0 right-0 w-2 h-px bg-white/20 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 right-0 w-px h-2 bg-white/20 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4 z-20 pointer-events-none">
        <div className={`absolute bottom-0 left-0 w-2 h-px bg-white/20 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 left-0 w-px h-2 bg-white/20 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4 z-20 pointer-events-none">
        <div className={`absolute bottom-0 right-0 w-2 h-px bg-white/20 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 right-0 w-px h-2 bg-white/20 ${colorClass} transition-all duration-300`}></div>
      </div>
    </>
  );
};
