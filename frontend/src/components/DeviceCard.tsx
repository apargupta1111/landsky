interface DeviceCardProps {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'error';
  brightness: number;
  power: number;
  onClick?: () => void;
}

export function DeviceCard({ id, name, status, brightness, power, onClick }: DeviceCardProps) {
  const statusColors = {
    online: 'var(--accent-primary)',
    warning: 'var(--accent-warning)',
    error: 'var(--accent-error)',
  };
  const color = statusColors[status as keyof typeof statusColors];

  return (
    <div 
      onClick={onClick}
      className={`glass-panel rounded-xl p-5 border glowing-border group relative overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    >
      {/* Glow background */}
      <div className="absolute -inset-10 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl" style={{ backgroundColor: color }} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="font-bold data-font text-lg">{id}</div>
          <div className="text-xs text-[var(--text-secondary)]">{name}</div>
        </div>
        <div className="relative flex h-3 w-3">
          {status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }}></span>}
          <span className="relative inline-flex rounded-full h-3 w-3 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color }}></span>
        </div>
      </div>
      
      <div className="space-y-3 relative z-10">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--text-secondary)]">Brightness</span>
          <span className="data-font font-bold">{brightness}%</span>
        </div>
        <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full shadow-[0_0_10px_currentColor]" style={{ width: `${brightness}%`, backgroundColor: color, color }} />
        </div>
        
        <div className="flex justify-between items-center text-sm pt-2 border-t border-[var(--panel-border)]">
          <span className="text-[var(--text-secondary)]">Power</span>
          <span className="data-font font-bold">{power} W</span>
        </div>
      </div>
    </div>
  );
}
