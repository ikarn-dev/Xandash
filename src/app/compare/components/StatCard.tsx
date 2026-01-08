'use client';

interface StatValue {
  label: string;
  value: string | number;
  color: string;
  isWinner?: boolean;
}

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  values: StatValue[];
  unit?: string;
}

export function StatCard({ title, icon, values, unit }: StatCardProps) {
  return (
    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-white/40">{icon}</div>
        <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider">{title}</h3>
      </div>
      
      <div className="space-y-2">
        {values.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-between p-2 rounded ${item.isWinner ? 'bg-white/5' : ''}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-white/60 truncate max-w-[80px] sm:max-w-[120px]">{item.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm text-white font-medium">{item.value}</span>
              {unit && <span className="text-[10px] text-white/40">{unit}</span>}
              {item.isWinner && (
                <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">BEST</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
