'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { fetchCurrentOdds, fetchEvents } from '@/lib/api';
import { formatAmericanOdds, formatTime, americanToDecimal, americanToImpliedProbability } from '@/lib/utils';
import { Loader2, AlertCircle, Info, Search, Filter, Clock } from 'lucide-react';
import type { RawOdds, Event } from '@/types';

interface RequestLog {
  id: number;
  timestamp: Date;
  type: 'events' | 'odds';
  status: 'success' | 'error';
  duration: number;
  count?: number;
  error?: string;
}

export default function RawOddsDebugPage() {
  const [rawOdds, setRawOdds] = useState<RawOdds[]>([]);
  const [events, setEvents] = useState<Map<string, Event>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sport, setSport] = useState('basketball_nba');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<string>('all');
  
  // Request tracker
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [showRequestTracker, setShowRequestTracker] = useState(false);
  
  const addRequestLog = (type: 'events' | 'odds', status: 'success' | 'error', duration: number, count?: number, error?: string) => {
    setRequestLogs(prev => [{
      id: Date.now(),
      timestamp: new Date(),
      type,
      status,
      duration,
      count,
      error
    }, ...prev].slice(0, 50)); // Keep last 50 requests
  };

  useEffect(() => {
    async function loadData() {
      const startTime = Date.now();
      
      try {
        setLoading(true);
        setError(null);

        // Fetch events
        const eventsStartTime = Date.now();
        const eventsData = await fetchEvents(sport);
        const eventsDuration = Date.now() - eventsStartTime;
        addRequestLog('events', 'success', eventsDuration, eventsData.length);

        // Fetch odds
        const oddsStartTime = Date.now();
        const oddsData = await fetchCurrentOdds({ sport, limit: 1000 });
        const oddsDuration = Date.now() - oddsStartTime;
        addRequestLog('odds', 'success', oddsDuration, oddsData.length);

        const eventsMap = new Map<string, Event>();
        eventsData.forEach((event: Event) => {
          eventsMap.set(event.event_id, event);
        });

        setEvents(eventsMap);
        setRawOdds(oddsData);
      } catch (err) {
        const duration = Date.now() - startTime;
        const errorMsg = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMsg);
        addRequestLog('odds', 'error', duration, 0, errorMsg);
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
  
  // Filter odds
  const filteredOdds = rawOdds.filter(odd => {
    // Search filter
    if (searchQuery) {
      const event = events.get(odd.event_id);
      const query = searchQuery.toLowerCase();
      const matchesTeam = event?.home_team?.toLowerCase().includes(query) || 
                         event?.away_team?.toLowerCase().includes(query);
      const matchesBook = odd.book_key.toLowerCase().includes(query);
      const matchesOutcome = odd.outcome_name.toLowerCase().includes(query);
      if (!matchesTeam && !matchesBook && !matchesOutcome) {
        return false;
      }
    }
    
    // Market filter
    if (selectedMarket !== 'all' && odd.market_key !== selectedMarket) {
      return false;
    }
    
    // Book filter
    if (selectedBook !== 'all' && odd.book_key !== selectedBook) {
      return false;
    }
    
    return true;
  });
  
  // Get unique markets and books
  const uniqueMarkets = Array.from(new Set(rawOdds.map(odd => odd.market_key))).sort();
  const uniqueBooks = Array.from(new Set(rawOdds.map(odd => odd.book_key))).sort();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
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
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
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
              
              <button
                onClick={() => setShowRequestTracker(!showRequestTracker)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Clock className="w-4 h-4" />
                Request Tracker ({requestLogs.length})
              </button>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredOdds.length}</span> of <span className="font-semibold text-foreground">{rawOdds.length}</span> raw odds
            </div>
          </div>
          
          {/* Filters & Search */}
          <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams, books, or outcomes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border rounded-md text-sm min-w-[120px]"
              >
                <option value="all">All Markets</option>
                {uniqueMarkets.map(market => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
              
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border rounded-md text-sm min-w-[120px]"
              >
                <option value="all">All Books</option>
                {uniqueBooks.map(book => (
                  <option key={book} value={book}>{book}</option>
                ))}
              </select>
              
              {(searchQuery || selectedMarket !== 'all' || selectedBook !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMarket('all');
                    setSelectedBook('all');
                  }}
                  className="px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Request Tracker */}
          {showRequestTracker && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Request History
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {requestLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No requests yet</p>
                ) : (
                  requestLogs.map(log => (
                    <div 
                      key={log.id}
                      className={`flex items-center justify-between text-xs p-2 rounded ${
                        log.status === 'success' ? 'bg-green-500/10' : 'bg-destructive/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded font-mono ${
                          log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground">{log.type}</span>
                        {log.count !== undefined && (
                          <span className="text-muted-foreground">({log.count} items)</span>
                        )}
                        <span className="text-muted-foreground">{log.duration}ms</span>
                      </div>
                      <span className="text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
                  {filteredOdds.map((odd, idx) => {
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
        
        {/* Filtered Empty State */}
        {!loading && !error && rawOdds.length > 0 && filteredOdds.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Matching Odds</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search query</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMarket('all');
                setSelectedBook('all');
              }}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

