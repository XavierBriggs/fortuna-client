'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { EdgeBadge } from '@/components/shared/EdgeBadge';
import { formatAmericanOdds, formatPoint } from '@/lib/utils';
import type { NormalizedOdds } from '@/types';

interface BookCellProps {
  odds: NormalizedOdds | undefined;
  isSharp: boolean;
}

export const BookCell = memo(function BookCell({ odds, isSharp }: BookCellProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPrice = useRef<number | null>(null);

  useEffect(() => {
    if (odds?.price) {
      if (prevPrice.current !== null) {
        if (odds.price > prevPrice.current) {
          setFlash('up');
        } else if (odds.price < prevPrice.current) {
          setFlash('down');
        }

        // Reset flash after animation
        const timer = setTimeout(() => setFlash(null), 1000);
        return () => clearTimeout(timer);
      }
      prevPrice.current = odds.price;
    }
  }, [odds?.price]);

  if (!odds) {
    return (
      <td className="text-center align-top p-0">
        <div className="h-full min-h-[60px] flex items-center justify-center border-r border-border/50 bg-card/30">
          <span className="text-xs text-muted-foreground/30">-</span>
        </div>
      </td>
    );
  }

  return (
    <td className="text-center align-top p-0 relative group">
      <div className={`
        h-full min-h-[60px] flex flex-col justify-center gap-0.5 py-2 border-r border-border/50 transition-colors cursor-pointer
        ${flash === 'up' ? 'bg-green-500/20' : flash === 'down' ? 'bg-red-500/20' : 'hover:bg-accent/50 bg-card/30'}
      `}>
        {/* Point value (spread/total) */}
        {odds.point !== null && (
          <div className="text-[10px] text-muted-foreground font-medium">
            {formatPoint(odds.point)}
          </div>
        )}

        {/* American odds */}
        <div className={`text-sm font-mono font-bold ${flash === 'up' ? 'text-green-400' : flash === 'down' ? 'text-red-400' : 'text-foreground'
          }`}>
          {formatAmericanOdds(odds.price)}
        </div>

        {/* Edge or sharp indicator */}
        <div className="text-[10px] h-4 flex items-center justify-center">
          {isSharp ? (
            <span className="text-muted-foreground/50" title="Sharp book">
              ●
            </span>
          ) : (
            <EdgeBadge edge={odds.edge} />
          )}
        </div>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute hidden group-hover:block left-1/2 -translate-x-1/2 top-full mt-2 bg-popover/95 backdrop-blur-md text-popover-foreground border border-border/50 rounded-lg shadow-xl p-4 z-50 min-w-[220px] animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-2 text-left text-xs">
          <div className="font-bold text-sm border-b border-border/50 pb-2 mb-2 flex items-center justify-between">
            <span>{odds.book_key.toUpperCase()}</span>
            {isSharp && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">SHARP</span>}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">Price:</span>
            <span className="font-mono font-semibold text-right">{formatAmericanOdds(odds.price)}</span>

            {odds.point !== null && (
              <>
                <span className="text-muted-foreground">Point:</span>
                <span className="font-mono text-right">{formatPoint(odds.point)}</span>
              </>
            )}

            <span className="text-muted-foreground">Decimal:</span>
            <span className="font-mono text-right">{odds.decimal_odds.toFixed(2)}</span>

            <span className="text-muted-foreground">Implied:</span>
            <span className="font-mono text-right">{(odds.implied_probability * 100).toFixed(1)}%</span>
          </div>

          {(odds.fair_price !== null || odds.edge !== null) && (
            <div className="border-t border-border/50 pt-2 mt-2 space-y-1">
              {odds.fair_price !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fair Price:</span>
                  <span className="font-mono text-yellow-500">{formatAmericanOdds(odds.fair_price)}</span>
                </div>
              )}
              {odds.edge !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Edge:</span>
                  <EdgeBadge edge={odds.edge} />
                </div>
              )}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground/50 text-right pt-1">
            Updated: {new Date(odds.normalized_at).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </td>
  );
});

