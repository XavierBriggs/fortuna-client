import { cn } from '@/lib/utils';
import type { NormalizedOdds } from '@/types';

interface EdgeBadgeProps {
  edge: number | null;
  className?: string;
}

export function EdgeBadge({ edge, className }: EdgeBadgeProps) {
  if (edge === null) {
    return <span className={cn('text-xs text-muted-foreground', className)}>-</span>;
  }
  
  const edgePercent = (edge * 100).toFixed(1);
  const isPositive = edge > 0;
  
  // Determine styling based on edge magnitude
  let colorClass = 'text-muted-foreground';
  let bgClass = '';
  let fontWeight = 'font-normal';
  
  if (isPositive) {
    if (edge > 0.05) {
      // >5% - Rare and highly valuable
      colorClass = 'text-edge-high';
      bgClass = 'bg-yellow-400/15';
      fontWeight = 'font-bold';
    } else if (edge > 0.02) {
      // 2-5% - Significant edge
      colorClass = 'text-edge-good';
      bgClass = 'bg-green-400/10';
      fontWeight = 'font-semibold';
    } else {
      // 0-2% - Positive edge
      colorClass = 'text-edge-positive';
    }
  } else {
    // Negative edge
    colorClass = 'text-edge-negative';
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs tabular-nums px-1 rounded',
        colorClass,
        bgClass,
        fontWeight,
        className
      )}
      title={`Edge: ${isPositive ? '+' : ''}${edgePercent}%`}
    >
      {isPositive ? '+' : ''}{edgePercent}%
    </span>
  );
}












