'use client';

import { useMemo, useEffect, useState } from 'react';
import { useOddsStore, useFilteredOdds } from '@/lib/stores/odds-store';
import { groupOddsByEvent } from '@/lib/utils';
import { GameRow } from './GameRow';
import { Loader2, AlertCircle } from 'lucide-react';
import { fetchEvents } from '@/lib/api';

export function OddsTable() {
  const filteredOdds = useFilteredOdds();
  const events = useOddsStore((state) => state.events);
  const connectionStatus = useOddsStore((state) => state.connectionStatus);
  const filters = useOddsStore((state) => state.filters);
  const updateOdds = useOddsStore((state) => state.updateOdds);
  const updateEvent = useOddsStore((state) => state.updateEvent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial events only - odds come from WebSocket (normalized with edge calculations)
  useEffect(() => {
    let isCancelled = false;
    
    async function loadInitialEvents() {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching initial events for sport:', filters.sport);
        
        const eventsData = await fetchEvents(filters.sport);
        
        if (!isCancelled) {
          console.log(`Loaded ${eventsData.length} events. Waiting for normalized odds from WebSocket...`);
          
          // Update store with events
          eventsData.forEach((event: any) => {
            updateEvent(event);
          });
          
          // Give WebSocket a moment to start streaming odds
          setTimeout(() => {
            if (!isCancelled) {
              setLoading(false);
            }
          }, 2000);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error loading initial events:', err);
          setError(err instanceof Error ? err.message : 'Failed to load events');
          setLoading(false);
        }
      }
    }

    loadInitialEvents();
    
    return () => {
      isCancelled = true;
    };
  }, [filters.sport, updateEvent]);
  
  // Group odds by event
  const eventGroups = useMemo(() => {
    return groupOddsByEvent(filteredOdds, events);
  }, [filteredOdds, events]);
  
  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium text-foreground">Error Loading Odds</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }
  
  // Show loading state (only while initially loading AND not connected)
  if (loading && connectionStatus.status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-foreground">Connecting to live odds...</p>
        <p className="text-sm text-muted-foreground mt-2">Establishing WebSocket connection</p>
      </div>
    );
  }
  
  if (connectionStatus.status === 'disconnected' || connectionStatus.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-6xl mb-4">🔌</div>
        <p className="text-lg font-medium text-foreground">Connection Lost</p>
        <p className="text-sm text-muted-foreground mt-2">
          Unable to connect to odds feed. Attempting to reconnect...
        </p>
      </div>
    );
  }
  
  if (eventGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-lg font-medium text-foreground">No Odds Found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or wait for new odds to arrive
        </p>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="odds-table w-full">
          <thead>
            <tr>
              <th className="text-left w-32">Time</th>
              <th className="text-left w-48">Game</th>
              <th className="text-center w-24">Best Line</th>
              <th className="text-center w-24">Hold</th>
              <th className="text-center w-32">Sharp</th>
              <th className="text-center w-32">FanDuel</th>
              <th className="text-center w-32">DraftKings</th>
              <th className="text-center w-32">BetMGM</th>
              <th className="text-center w-32">Caesars</th>
              <th className="text-center w-24">More</th>
            </tr>
          </thead>
          <tbody>
            {eventGroups.map((eventGroup) => (
              <GameRow key={eventGroup.event.event_id} eventGroup={eventGroup} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

