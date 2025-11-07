'use client';

import { memo } from 'react';
import { BookCell } from './BookCell';
import { AgeBadge } from '@/components/shared/AgeBadge';
import { formatAmericanOdds, formatPoint, formatEdge, isSharpBook } from '@/lib/utils';
import type { Event, OutcomeGroup } from '@/types';

interface OutcomeRowProps {
  event: Event;
  outcome: OutcomeGroup;
  hold: number | null;
  dataAge: number | null;
  showGameInfo: boolean;
  timeDisplay?: string;
  dateDisplay?: string;
}

export const OutcomeRow = memo(function OutcomeRow({
  event,
  outcome,
  hold,
  dataAge,
  showGameInfo,
  timeDisplay,
  dateDisplay,
}: OutcomeRowProps) {
  const { outcome_name, point, oddsByBook, bestOdds, bestEdge } = outcome;
  
  // Get sharp consensus (Pinnacle preferred)
  const sharpOdds = oddsByBook['pinnacle'] || oddsByBook['circa'] || oddsByBook['bookmaker'];
  
  // Get soft books
  const fanduelOdds = oddsByBook['fanduel'];
  const draftkingsOdds = oddsByBook['draftkings'];
  const betmgmOdds = oddsByBook['betmgm'];
  const caesarsOdds = oddsByBook['caesars'];
  
  // Calculate row background color based on best edge
  let rowClass = '';
  if (bestEdge && bestEdge.edge) {
    if (bestEdge.edge > 0.05) {
      rowClass = 'edge-row-high';
    } else if (bestEdge.edge > 0.02) {
      rowClass = 'edge-row-good';
    }
  }
  
  return (
    <tr className={rowClass}>
      {/* Time Column */}
      <td className="text-left align-top">
        {showGameInfo && (
          <div className="flex flex-col gap-1">
            {timeDisplay && (
              <div className="text-sm font-semibold whitespace-nowrap">
                {timeDisplay}
              </div>
            )}
            {dateDisplay && (
              <div className="text-xs text-muted-foreground">
                {dateDisplay}
              </div>
            )}
          </div>
        )}
      </td>
      
      {/* Game Column */}
      <td className="text-left align-top">
        {showGameInfo && (
          <div className="text-sm font-medium">
            {event.away_team} @ {event.home_team}
          </div>
        )}
        <div className="text-sm text-muted-foreground mt-0.5">
          {outcome_name}
        </div>
      </td>
      
      {/* Best Line Column */}
      <td className="text-center align-top">
        {bestOdds && (
          <div className="flex flex-col gap-0.5">
            {point && (
              <div className="text-xs text-muted-foreground">
                {formatPoint(point)}
              </div>
            )}
            <div className="text-sm font-mono font-semibold">
              {formatAmericanOdds(bestOdds.price)}
            </div>
            <div className="text-xs text-muted-foreground">
              {bestOdds.book_key}
            </div>
          </div>
        )}
      </td>
      
      {/* Hold Column */}
      <td className="text-center align-top">
        {hold !== null && dataAge !== null && (
          <div className="flex flex-col gap-1 items-center">
            <div className="text-sm font-mono">
              {hold >= 0 ? '+' : ''}{(hold * 100).toFixed(1)}%
            </div>
            <AgeBadge seconds={dataAge} />
          </div>
        )}
      </td>
      
      {/* Sharp Consensus */}
      <BookCell odds={sharpOdds} isSharp={true} />
      
      {/* Soft Books */}
      <BookCell odds={fanduelOdds} isSharp={false} />
      <BookCell odds={draftkingsOdds} isSharp={false} />
      <BookCell odds={betmgmOdds} isSharp={false} />
      <BookCell odds={caesarsOdds} isSharp={false} />
      
      {/* More Column */}
      <td className="text-center align-top">
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          +
        </button>
      </td>
    </tr>
  );
});


