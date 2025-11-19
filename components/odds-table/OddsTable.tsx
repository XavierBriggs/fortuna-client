'use client';

import { useMemo, useEffect, useState } from 'react';
import { useOddsStore, useFilteredOdds } from '@/lib/stores/odds-store';
import { groupOddsByEvent } from '@/lib/utils';
import { GameRow } from './GameRow';
import { Loader2, AlertCircle } from 'lucide-react';
import { fetchEvents, fetchBooks, type Book } from '@/lib/api';

export function OddsTable() {
  const filteredOdds = useFilteredOdds();
  const events = useOddsStore((state) => state.events);
  const connectionStatus = useOddsStore((state) => state.connectionStatus);
  const filters = useOddsStore((state) => state.filters);
  const updateOdds = useOddsStore((state) => state.updateOdds);
  const updateEvent = useOddsStore((state) => state.updateEvent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);

  // Fetch available books from Alexandria
  useEffect(() => {
    fetchBooks().then(books => {
      setAvailableBooks(books);
    });
  }, []);

  // Determine which books to show based on filters
  useEffect(() => {
    if (filters.books.length === 0) {
      // Empty = show all books
      setSelectedBooks(availableBooks);
    } else {
      // Show only selected books
      const selected = availableBooks.filter(b => filters.books.includes(b.book_key));
      setSelectedBooks(selected);
    }
  }, [filters.books, availableBooks]);

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

  // Use selectedBooks or fallback to all available books if none selected
  const booksToDisplay = selectedBooks.length > 0 ? selectedBooks : availableBooks;

  // Calculate column span for "Show More" button
  // 4 base columns (Time, Game, Best Line, Hold) + book columns + More column
  const totalColumns = 4 + booksToDisplay.length + 1;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="odds-table w-full table-auto min-w-full">
          <thead className="bg-card/50 backdrop-blur-sm text-xs uppercase text-muted-foreground font-medium">
            <tr>
              <th className="text-left sticky left-0 z-20 bg-background/95 backdrop-blur-sm border-r border-border/50 border-b border-border/50 min-w-[80px] px-4 py-3 font-semibold text-foreground/80 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.2)]">Time</th>
              <th className="text-left sticky left-[80px] z-20 bg-background/95 backdrop-blur-sm border-r border-border/50 border-b border-border/50 min-w-[180px] px-4 py-3 font-semibold text-foreground/80 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.2)]">Game</th>
              <th className="text-center border-b border-border/50 min-w-[100px] px-2 py-3">Best Line</th>
              <th className="text-center border-b border-border/50 min-w-[80px] px-2 py-3">Hold</th>
              {/* Dynamically generate book columns */}
              {booksToDisplay.map((book) => (
                <th key={book.book_key} className="text-center border-b border-border/50 min-w-[110px] px-2 py-3">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-xs font-semibold ${book.book_type === 'sharp' ? 'text-primary' : 'text-foreground'}`}>
                      {book.display_name}
                    </span>
                    {book.book_type === 'sharp' && (
                      <span className="text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Sharp
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="text-center border-b border-border/50 min-w-[60px] px-2 py-3">More</th>
            </tr>
          </thead>
          <tbody>
            {eventGroups.map((eventGroup) => (
              <GameRow
                key={eventGroup.event.event_id}
                eventGroup={eventGroup}
                selectedBooks={booksToDisplay}
                totalColumns={totalColumns}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

