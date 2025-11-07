'use client';

import { useState, memo } from 'react';
import { OutcomeRow } from './OutcomeRow';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { EventGroup } from '@/types';
import { formatTime, formatDate } from '@/lib/utils';

interface GameRowProps {
  eventGroup: EventGroup;
}

export const GameRow = memo(function GameRow({ eventGroup }: GameRowProps) {
  const { event, outcomes, hold, dataAge } = eventGroup;
  const [expanded, setExpanded] = useState(false);
  
  const isLive = event.event_status === 'live';
  const timeDisplay = isLive ? '🔴 LIVE' : formatTime(event.commence_time);
  const dateDisplay = formatDate(event.commence_time);
  
  // Show first two outcomes by default (both sides of the market)
  const visibleOutcomes = outcomes.slice(0, 2);
  const hasMoreOutcomes = outcomes.length > 2;
  
  return (
    <>
      {visibleOutcomes.map((outcome, index) => (
        <OutcomeRow
          key={`${event.event_id}-${outcome.outcome_name}-${outcome.point}`}
          event={event}
          outcome={outcome}
          hold={index === 0 ? hold : null}
          dataAge={index === 0 ? dataAge : null}
          showGameInfo={index === 0}
          timeDisplay={timeDisplay}
          dateDisplay={dateDisplay}
        />
      ))}
      
      {hasMoreOutcomes && (
        <tr>
          <td colSpan={10} className="p-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2"
            >
              {expanded ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Show Less</span>
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span>Show {outcomes.length - 2} More</span>
                </>
              )}
            </button>
          </td>
        </tr>
      )}
      
      {expanded && outcomes.slice(2).map((outcome) => (
        <OutcomeRow
          key={`${event.event_id}-${outcome.outcome_name}-${outcome.point}`}
          event={event}
          outcome={outcome}
          hold={null}
          dataAge={null}
          showGameInfo={false}
        />
      ))}
    </>
  );
});

