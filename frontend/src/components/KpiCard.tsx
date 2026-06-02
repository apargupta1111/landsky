interface KpiCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
  sub?: string;
}

export function KpiCard({ title, value, trend, trendUp, onClick, sub }: KpiCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`glass-panel rounded-xl p-6 border flex flex-col relative overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform glowing-border' : 'glowing-border'}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-[100px] blur-xl pointer-events-none" />
      <div className="text-[var(--text-secondary)] text-sm font-medium mb-2">{title}</div>
      <div className="text-3xl font-bold data-font mb-4 text-glow">{value}</div>
      {trend && (
        <div className={`text-sm font-bold ${trendUp ? 'text-[#10b981]' : 'text-error'}`}>
          {trend} vs last week
        </div>
      )}
      {sub && !trend && (
        <div className="text-sm text-[var(--text-secondary)]">{sub}</div>
      )}
    </div>
  );
}
