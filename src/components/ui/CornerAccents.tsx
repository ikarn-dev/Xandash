'use client';

import React from 'react';

interface CornerAccentsProps {
  color?: 'white' | 'emerald' | 'blue' | 'cyan';
}

export const CornerAccents: React.FC<CornerAccentsProps> = ({ color = "white" }) => {
  const colorClasses: Record<string, string> = {
    white: "group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)]",
    emerald: "group-hover:bg-emerald-400 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.8)]",
    blue: "group-hover:bg-blue-400 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.8)]",
    cyan: "group-hover:bg-cyan-400 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.8)]",
  };
  
  const colorClass = colorClasses[color] || colorClasses.white;
  
  return (
    <>
      <div className="absolute top-0 left-0 w-6 h-6 z-20">
        <div className={`absolute top-0 left-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 left-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute top-0 right-0 w-6 h-6 z-20">
        <div className={`absolute top-0 right-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 right-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 left-0 w-6 h-6 z-20">
        <div className={`absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 right-0 w-6 h-6 z-20">
        <div className={`absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
    </>
  );
};
