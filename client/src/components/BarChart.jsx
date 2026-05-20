export default function BarChart({ data, height = 160 }) {
  if (!data || data.length === 0) return (
    <div style={{ height }} className="flex items-center justify-center text-gray-400 text-sm">Pas encore de données</div>
  );

  const maxVal = Math.max(...data.map(d => Math.max(d.earned || 0, d.pending || 0)), 1);
  const barW = Math.min(32, Math.floor(320 / data.length) - 4);

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={height + 30} viewBox={`0 0 ${Math.max(data.length * (barW + 8), 400)} ${height + 30}`}>
        {data.map((d, i) => {
          const x = i * (barW + 8) + 4;
          const earnH = Math.round((d.earned / maxVal) * (height - 20));
          const pendH = Math.round((d.pending / maxVal) * (height - 20));
          return (
            <g key={i}>
              <rect x={x} y={height - earnH - 10} width={barW * 0.55} height={earnH || 1} rx="3" fill="#0284c7" opacity="0.9" />
              <rect x={x + barW * 0.55 + 2} y={height - pendH - 10} width={barW * 0.4} height={pendH || 1} rx="3" fill="#f59e0b" opacity="0.7" />
              <text x={x + barW / 2} y={height + 20} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">
                {d.month?.slice(5) || ''}
              </text>
            </g>
          );
        })}
        <line x1="0" y1={height - 10} x2="100%" y2={height - 10} stroke="currentColor" opacity="0.1" strokeWidth="1" />
      </svg>
      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-500 inline-block" />Encaissé</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" />En attente</span>
      </div>
    </div>
  );
}
