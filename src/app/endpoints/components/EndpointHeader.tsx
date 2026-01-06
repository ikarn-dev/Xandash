import { CornerAccents } from '@/components/ui';

export const EndpointHeader = () => {
  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
      <CornerAccents />

      <div className="space-y-2 sm:space-y-4 relative z-10">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/90 font-mono">
          // <span className="text-white">ENDPOINTS</span>
        </h1>
        <div className="flex items-center space-x-2 text-white/60">
          <span className="text-xs sm:text-sm">›</span>
          <span className="text-xs sm:text-sm">API endpoint testing with 1-minute cooldown</span>
        </div>
      </div>
    </div>
  );
};
