import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  trailing?: ReactNode;
  compact?: boolean;
}

export default function SectionHeader({ title, trailing, compact = false }: SectionHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-100/70 ${
        compact ? 'px-3 py-2' : 'px-3.5 py-2.5'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="h-5 w-1 rounded-full bg-slate-400 flex-shrink-0" />
        <span className={`${compact ? 'text-[11px]' : 'text-xs'} font-bold text-slate-700 uppercase tracking-wider truncate`}>
          {title}
        </span>
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  );
}