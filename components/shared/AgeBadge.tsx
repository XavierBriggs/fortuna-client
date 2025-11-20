import { cn, formatDataAge, getAgeColor } from '@/lib/utils';

interface AgeBadgeProps {
  seconds: number;
  className?: string;
  showIcon?: boolean;
}

export function AgeBadge({ seconds, className, showIcon = true }: AgeBadgeProps) {
  const { bg, text, badge } = getAgeColor(seconds);
  const formatted = formatDataAge(seconds);
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        bg,
        text,
        className
      )}
      title={`Data age: ${seconds} seconds`}
    >
      {showIcon && <span className="text-[10px]">{badge}</span>}
      <span className="tabular-nums">{formatted}</span>
    </span>
  );
}






