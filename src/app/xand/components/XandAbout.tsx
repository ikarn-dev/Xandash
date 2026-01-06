import { CornerAccents } from '@/components/ui/CornerAccents';
import { XandData } from './types';
import { InfoIcon } from './XandIcons';

interface XandAboutProps {
  data: XandData;
}

export function XandAbout({ data }: XandAboutProps) {
  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
      <CornerAccents />
      <div className="flex items-center gap-2 mb-3">
        <InfoIcon className="w-4 h-4 text-emerald-400" />
        <span className="text-white/60 text-sm font-mono">// ABOUT {data.symbol.toUpperCase()}</span>
      </div>
      <p className="text-white/70 text-sm leading-relaxed">{data.description.en}</p>
    </div>
  );
}
