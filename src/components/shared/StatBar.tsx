interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

export function StatBar({ label, value, maxValue = 100, color = 'bg-red-500' }: StatBarProps) {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-xs text-slate-400 text-right">{Math.round(value)}</span>
    </div>
  );
}
