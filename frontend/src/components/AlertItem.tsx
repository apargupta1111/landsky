interface AlertItemProps {
  id: string;
  issue: string;
  time: string;
  type: 'warning' | 'error' | 'info';
}

export function AlertItem({ id, issue, time, type }: AlertItemProps) {
  const colorClass =
    type === 'error'   ? 'bg-error/10 border-error/30 text-error'
    : type === 'info'  ? 'bg-primary/10 border-primary/30 text-primary'
    : 'bg-warning/10 border-warning/30 text-warning';

  return (
    <div className={`p-4 rounded-lg border flex items-center justify-between ${colorClass}`}>
      <div>
        <div className="font-bold data-font text-sm text-[var(--text-primary)]">{id}</div>
        <div className={`text-xs ${colorClass.split(' ').pop()}`}>{issue}</div>
      </div>
      <div className="text-xs text-[var(--text-secondary)]">{time}</div>
    </div>
  );
}
