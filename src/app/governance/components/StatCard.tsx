'use client';

import { CornerAccents } from '@/components/ui';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  onClick?: () => void;
}

export function StatCard({ icon, label, value, subValue, onClick }: StatCardProps) {
  return (
    <div 
      className={`relative bg-black border border-white/10 p-3 sm:p-4 group hover:border-white/20 transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CornerAccents />
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        {icon}
        <span className="text-white/50 text-[10px] sm:text-xs uppercase">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-mono truncate">{value}</p>
      {subValue && <p className="text-white/40 text-[10px] sm:text-xs mt-0.5">{subValue}</p>}
    </div>
  );
}
