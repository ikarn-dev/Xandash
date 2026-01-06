import { EndpointStats } from './types';

interface EndpointStatsCardsProps {
  stats: EndpointStats;
}

export const EndpointStatsCards = ({ stats }: EndpointStatsCardsProps) => {
  const statItems = [
    { label: 'Available', value: stats.totalMethods, color: 'white' },
    { label: 'Successful', value: stats.successfulTests, color: 'green' },
    { label: 'Failed', value: stats.failedTests, color: 'red' },
    { label: 'Avg Response', value: `${stats.avgResponseTime}ms`, color: 'white' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
      {statItems.map((stat, i) => (
        <div 
          key={i} 
          className="relative bg-black border border-white/10 p-3 sm:p-4 group hover:border-white/20 transition-all duration-300"
        >
          <div className="absolute top-0 left-0 w-4 h-4">
            <div className="absolute top-0 left-0 w-2 h-0.5 bg-white/20 group-hover:bg-white/50 transition-all"></div>
            <div className="absolute top-0 left-0 w-0.5 h-2 bg-white/20 group-hover:bg-white/50 transition-all"></div>
          </div>
          <div className="text-white/50 text-[10px] sm:text-xs uppercase tracking-wider mb-1">
            {stat.label}
          </div>
          <div className={`text-lg sm:text-2xl font-bold font-mono ${
            stat.color === 'green' ? 'text-green-400' : 
            stat.color === 'red' ? 'text-red-400' : 'text-white'
          }`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
};
