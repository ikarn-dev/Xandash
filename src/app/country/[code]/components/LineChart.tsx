interface LineChartProps {
  data: { time: number; value: number }[];
  color?: string;
  height?: number;
  showArea?: boolean;
  label?: string;
  valueFormatter?: (v: number) => string;
}

export const LineChart = ({ 
  data, 
  color = '#10b981', 
  height = 120,
  showArea = true,
  label = '',
  valueFormatter = (v: number) => v.toFixed(2)
}: LineChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-sm">
        No data available
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  
  const width = 100;
  const padding = 2;
  
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {showArea && (
          <polygon points={areaPoints} fill={`${color}20`} />
        )}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute top-1 left-2 text-xs text-white/60">{label}</div>
      <div className="absolute top-1 right-2 text-xs font-mono" style={{ color }}>
        {valueFormatter(values[values.length - 1] || 0)}
      </div>
      <div className="absolute bottom-1 left-2 text-xs text-white/40">
        {valueFormatter(minValue)}
      </div>
      <div className="absolute bottom-1 right-2 text-xs text-white/40">
        {valueFormatter(maxValue)}
      </div>
    </div>
  );
};
