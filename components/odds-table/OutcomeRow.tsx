'use client';

import { memo } from 'react';
import { BookCell } from './BookCell';
import { AgeBadge } from '@/components/shared/AgeBadge';
import { formatAmericanOdds, formatPoint, formatEdge, isSharpBook } from '@/lib/utils';
import type { Event, OutcomeGroup } from '@/types';
import type { Book } from '@/lib/api';

interface OutcomeRowProps {
  event: Event;
  outcome: OutcomeGroup;
  hold: number | null;
  dataAge: number | null;
  showGameInfo: boolean;
  timeDisplay?: string;
  dateDisplay?: string;
  selectedBooks: Book[];
}

export const OutcomeRow = memo(function OutcomeRow({
  event,
  outcome,
  hold,
  dataAge,
  showGameInfo,
  timeDisplay,
  dateDisplay,
  selectedBooks,
}: OutcomeRowProps) {
  const { outcome_name, point, oddsByBook, bestOdds, bestEdge } = outcome;

  // Calculate row background color based on best edge
  let rowClass = 'border-b border-border/50 hover:bg-accent/5 transition-colors';
  if (bestEdge && bestEdge.edge) {
    if (bestEdge.edge > 0.05) {
      rowClass += ' bg-edge-high/10 hover:bg-edge-high/20';
    } else if (bestEdge.edge > 0.02) {
      rowClass += ' bg-edge-good/10 hover:bg-edge-good/20';
    }
  }

  return (
    <tr className={rowClass}>
      {/* Time Column */}
      <td className="text-left align-top px-4 py-3 border-r border-border/50 bg-card/30 backdrop-blur-[2px]">
        {showGameInfo && (
          <div className="flex flex-col gap-1">
            {timeDisplay && (
              <div className={`text-xs font-bold whitespace-nowrap ${timeDisplay.includes('LIVE') ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                {timeDisplay}
              </div>
            )}
            {dateDisplay && (
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {dateDisplay}
              </div>
            )}
          </div>
        )}
      </td>

      {/* Game Column */}
      <td className="text-left align-top px-4 py-3 border-r border-border/50 bg-card/30 backdrop-blur-[2px]">
        {showGameInfo && (
          <div className="text-sm font-semibold text-foreground">
            {event.away_team} <span className="text-muted-foreground font-normal">@</span> {event.home_team}
          </div>
        )}
        <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-2">
          <span className="bg-accent/50 px-1.5 py-0.5 rounded text-accent-foreground">
            {outcome_name}
          </span>
        </div>
      </td>

      {/* Best Line Column */}
      <td className="text-center align-top px-2 py-3 border-r border-border/50 bg-accent/5">
        {bestOdds && (
          <div className="flex flex-col gap-0.5 items-center">
            {point && (
              <div className="text-[10px] text-muted-foreground font-medium">
                {formatPoint(point)}
              </div>
            )}
            <div className="text-sm font-mono font-bold text-primary">
              {formatAmericanOdds(bestOdds.price)}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {bestOdds.book_key}
            </div>
          </div>
        )}
      </td>

      {/* Hold Column */}
      <td className="text-center align-top px-2 py-3 border-r border-border/50">
        {hold !== null && dataAge !== null && (
          <div className="flex flex-col gap-1 items-center">
            <div className={`text-sm font-mono font-medium ${hold < 0.02 ? 'text-green-400' : 'text-muted-foreground'}`}>
              {hold >= 0 ? '+' : ''}{(hold * 100).toFixed(1)}%
            </div>
            <AgeBadge seconds={dataAge} />
          </div>
        )}
      </td>

      {/* Dynamically render book cells based on selectedBooks */}
      {selectedBooks.map((book) => (
        <BookCell
          key={book.book_key}
          odds={oddsByBook[book.book_key]}
          isSharp={book.book_type === 'sharp'}
        />
      ))}

      {/* More Column */}
      <td className="text-center align-middle px-2 py-3">
        <button className="h-6 w-6 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          +
        </button>
      </td>
    </tr>
  );
});


