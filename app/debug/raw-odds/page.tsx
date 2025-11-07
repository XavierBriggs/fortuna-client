'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { fetchCurrentOdds, fetchEvents } from '@/lib/api';
import { formatAmericanOdds, formatTime, americanToDecimal, americanToImpliedProbability } from '@/lib/utils';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import type { RawOdds, Event } from '@/types';

export default function RawOddsDebugPage() {
  const [rawOdds, setRawOdds] = useState<RawOdds[]>([]);
  const [events, setEvents] = useState<Map<string, Event>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sport, setSport] = useState('basketball_nba');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [eventsData, oddsData] = await Promise.all([
          fetchEvents(sport),
          fetchCurrentOdds({ sport, limit: 100 })
        ]);

        const eventsMap = new Map<string, Event>();
        eventsData.forEach((event: Event) => {
          eventsMap.set(event.event_id, event);
        });

        setEvents(eventsMap);
        setRawOdds(oddsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Auto-refresh every 10 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [sport, autoRefresh]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Debug Info Banner */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-yellow-500 mb-1">Debug Mode: Raw Odds</h2>
              <p className="text-sm text-muted-foreground">
                This page displays <strong>raw odds</strong> directly from the API Gateway (no normalization or edge calculations).
                Use this for debugging the Mercury → API Gateway pipeline. The main odds view uses <strong>normalized odds</strong> 
                from the WebSocket (Mercury → Normalizer → WS Broadcaster).
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mr-2">Sport:</label>
              <select 
                value={sport} 
                onChange={(e) => setSport(e.target.value)}
                className="px-3 py-1.5 bg-card border border-border rounded-md text-sm"
              >
                <option value="basketball_nba">NBA</option>
                <option value="basketball_ncaab">NCAAB</option>
                <option value="americanfootball_nfl">NFL</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              Auto-refresh (10s)
            </label>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{rawOdds.length}</span> raw odds
          </div>
        </div>

        {/* Loading State */}
        {loading && rawOdds.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading raw odds...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center h-96">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive">Error</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        )}

        {/* Odds Table */}
        {!loading && !error && rawOdds.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Event</th>
                    <th className="text-left p-3 text-sm font-semibold">Market</th>
                    <th className="text-left p-3 text-sm font-semibold">Book</th>
                    <th className="text-left p-3 text-sm font-semibold">Outcome</th>
                    <th className="text-center p-3 text-sm font-semibold">Point</th>
                    <th className="text-center p-3 text-sm font-semibold">Price</th>
                    <th className="text-center p-3 text-sm font-semibold">Decimal</th>
                    <th className="text-center p-3 text-sm font-semibold">Implied %</th>
                    <th className="text-right p-3 text-sm font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rawOdds.map((odd, idx) => {
                    const event = events.get(odd.event_id);
                    const decimal = americanToDecimal(odd.price);
                    const implied = americanToImpliedProbability(odd.price);
                    
                    return (
                      <tr key={idx} className="border-t border-border hover:bg-accent/50">
                        <td className="p-3 text-sm">
                          {event ? (
                            <div>
                              <div className="font-medium">{event.away_team} @ {event.home_team}</div>
                              <div className="text-xs text-muted-foreground">{formatTime(event.commence_time)}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{odd.event_id.slice(0, 8)}...</span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                            {odd.market_key}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-medium">{odd.book_key}</td>
                        <td className="p-3 text-sm">{odd.outcome_name}</td>
                        <td className="p-3 text-sm text-center">
                          {odd.point !== null ? (
                            <span className="font-mono">{odd.point > 0 ? `+${odd.point}` : odd.point}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-center font-mono font-semibold">
                          {formatAmericanOdds(odd.price)}
                        </td>
                        <td className="p-3 text-sm text-center font-mono text-muted-foreground">
                          {decimal.toFixed(2)}
                        </td>
                        <td className="p-3 text-sm text-center font-mono text-muted-foreground">
                          {(implied * 100).toFixed(1)}%
                        </td>
                        <td className="p-3 text-sm text-right text-muted-foreground">
                          {formatTime(odd.vendor_last_update)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && rawOdds.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96">
            <p className="text-lg font-medium">No Raw Odds Found</p>
            <p className="text-sm text-muted-foreground mt-2">No data available for {sport}</p>
          </div>
        )}
      </main>
    </div>
  );
}

