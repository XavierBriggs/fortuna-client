'use client';

import { memo } from 'react';
import { EdgeBadge } from '@/components/shared/EdgeBadge';
import { formatAmericanOdds, formatPoint } from '@/lib/utils';
import type { NormalizedOdds } from '@/types';

interface BookCellProps {
  odds: NormalizedOdds | undefined;
  isSharp: boolean;
}

export const BookCell = memo(function BookCell({ odds, isSharp }: BookCellProps) {
  if (!odds) {
    return (
      <td className="text-center align-top">
        <span className="text-xs text-muted-foreground">-</span>
      </td>
    );
  }
  
  return (
    <td className="text-center align-top hover:bg-accent/50 transition-colors cursor-pointer group">
      <div className="flex flex-col gap-0.5 py-1">
        {/* Point value (spread/total) */}
        {odds.point !== null && (
          <div className="text-xs text-muted-foreground">
            {formatPoint(odds.point)}
          </div>
        )}
        
        {/* American odds */}
        <div className="text-sm font-mono font-semibold">
          {formatAmericanOdds(odds.price)}
        </div>
        
        {/* Edge or sharp indicator */}
        <div className="text-xs">
          {isSharp ? (
            <span className="text-muted-foreground" title="Sharp book">
              ✓
            </span>
          ) : (
            <EdgeBadge edge={odds.edge} />
          )}
        </div>
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute hidden group-hover:block bg-popover text-popover-foreground border border-border rounded-md shadow-lg p-3 z-50 min-w-[200px] mt-2">
        <div className="space-y-1.5 text-left text-xs">
          <div className="font-semibold border-b border-border pb-1">
            {odds.book_key.toUpperCase()}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price:</span>
            <span className="font-mono font-semibold">{formatAmericanOdds(odds.price)}</span>
          </div>
          {odds.point !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Point:</span>
              <span className="font-mono">{formatPoint(odds.point)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Decimal:</span>
            <span className="font-mono">{odds.decimal_odds.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Implied:</span>
            <span className="font-mono">{(odds.implied_probability * 100).toFixed(1)}%</span>
          </div>
          {odds.fair_price !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fair Price:</span>
              <span className="font-mono">{formatAmericanOdds(odds.fair_price)}</span>
            </div>
          )}
          {odds.edge !== null && (
            <div className="flex justify-between border-t border-border pt-1 mt-1">
              <span className="text-muted-foreground">Edge:</span>
              <EdgeBadge edge={odds.edge} />
            </div>
          )}
        </div>
      </div>
    </td>
  );
});

