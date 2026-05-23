interface AlertItemProps {
  id: string;
  issue: string;
  time: string;
  type: 'warning' | 'error';
}

export function AlertItem({ id, issue, time, type }: AlertItemProps) {
  const isError = type === 'error';
  return (
    <div className={`p-4 rounded-lg border flex items-center justify-between ${isError ? 'bg-error/10 border-error/30' : 'bg-warning/10 border-warning/30'}`}>
      <div>
        <div className="font-bold data-font text-sm">{id}</div>
        <div className={`text-xs ${isError ? 'text-error' : 'text-warning'}`}>{issue}</div>
      </div>
      <div className="text-xs text-[var(--text-secondary)]">{time}</div>
    </div>
  );
}
