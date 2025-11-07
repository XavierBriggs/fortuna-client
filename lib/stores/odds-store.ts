import { create } from 'zustand';
import type { NormalizedOdds, Event, OddsFilters, ConnectionStatus, Alert } from '@/types';

// Default filters
const defaultFilters: OddsFilters = {
  sport: 'basketball_nba',
  markets: ['spreads', 'totals', 'h2h'],
  books: [], // Empty = all books
  minEdge: null, // null = Show All
  searchQuery: '',
  eventStatus: 'all',
};

// Default connection status
const defaultConnectionStatus: ConnectionStatus = {
  status: 'disconnected',
  latency: 0,
  lastMessage: null,
  reconnectAttempts: 0,
};

interface OddsState {
  // Data
  odds: Map<string, NormalizedOdds>;
  events: Map<string, Event>;
  alerts: Alert[];
  
  // UI State
  filters: OddsFilters;
  connectionStatus: ConnectionStatus;
  expandedRows: Set<string>;
  
  // Actions - Odds
  updateOdds: (odds: NormalizedOdds) => void;
  batchUpdateOdds: (oddsList: NormalizedOdds[]) => void;
  clearOdds: () => void;
  
  // Actions - Events
  updateEvent: (event: Event) => void;
  batchUpdateEvents: (events: Event[]) => void;
  
  // Actions - Filters
  setFilters: (filters: Partial<OddsFilters>) => void;
  resetFilters: () => void;
  
  // Actions - Connection
  setConnectionStatus: (status: Partial<ConnectionStatus>) => void;
  
  // Actions - UI
  toggleRow: (eventId: string) => void;
  collapseAllRows: () => void;
  
  // Actions - Alerts
  addAlert: (alert: Alert) => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  
  // Selectors
  getFilteredOdds: () => NormalizedOdds[];
  getOddsByEvent: (eventId: string) => NormalizedOdds[];
  getEvent: (eventId: string) => Event | null;
}

export const useOddsStore = create<OddsState>((set, get) => ({
  // Initial state
  odds: new Map(),
  events: new Map(),
  alerts: [],
  filters: defaultFilters,
  connectionStatus: defaultConnectionStatus,
  expandedRows: new Set(),
  
  // Actions - Odds
  updateOdds: (newOdds) => {
    console.log('[Store] updateOdds called with:', newOdds);
    set((state) => {
      const key = generateOddsKey(newOdds);
      const updated = new Map(state.odds);
      updated.set(key, newOdds);
      console.log(`[Store] Updated odds. Total count: ${updated.size}`);
      return { odds: updated };
    });
  },
  
  batchUpdateOdds: (oddsList) => {
    set((state) => {
      const updated = new Map(state.odds);
      oddsList.forEach((odds) => {
        const key = generateOddsKey(odds);
        updated.set(key, odds);
      });
      return { odds: updated };
    });
  },
  
  clearOdds: () => {
    set({ odds: new Map() });
  },
  
  // Actions - Events
  updateEvent: (event) => {
    set((state) => {
      const updated = new Map(state.events);
      updated.set(event.event_id, event);
      return { events: updated };
    });
  },
  
  batchUpdateEvents: (events) => {
    set((state) => {
      const updated = new Map(state.events);
      events.forEach((event) => {
        updated.set(event.event_id, event);
      });
      return { events: updated };
    });
  },
  
  // Actions - Filters
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },
  
  resetFilters: () => {
    set({ filters: defaultFilters });
  },
  
  // Actions - Connection
  setConnectionStatus: (status) => {
    set((state) => ({
      connectionStatus: { ...state.connectionStatus, ...status },
    }));
  },
  
  // Actions - UI
  toggleRow: (eventId) => {
    set((state) => {
      const updated = new Set(state.expandedRows);
      if (updated.has(eventId)) {
        updated.delete(eventId);
      } else {
        updated.add(eventId);
      }
      return { expandedRows: updated };
    });
  },
  
  collapseAllRows: () => {
    set({ expandedRows: new Set() });
  },
  
  // Actions - Alerts
  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50), // Keep last 50 alerts
    }));
  },
  
  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      ),
    }));
  },
  
  clearAlerts: () => {
    set({ alerts: [] });
  },
  
  // Selectors
  getFilteredOdds: () => {
    const { odds, filters } = get();
    return Array.from(odds.values()).filter((odd) => {
      // Filter by sport
      if (filters.sport && odd.sport_key !== filters.sport) return false;
      
      // Filter by markets
      if (filters.markets.length > 0 && !filters.markets.includes(odd.market_key)) return false;
      
      // Filter by books
      if (filters.books.length > 0 && !filters.books.includes(odd.book_key)) return false;
      
      // Filter by minimum edge (null means show all)
      if (filters.minEdge !== null && odd.edge !== null && odd.edge < filters.minEdge) return false;
      
      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = `${odd.outcome_name} ${odd.book_key}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }
      
      return true;
    });
  },
  
  getOddsByEvent: (eventId) => {
    const { odds } = get();
    return Array.from(odds.values()).filter((odd) => odd.event_id === eventId);
  },
  
  getEvent: (eventId) => {
    const { events } = get();
    return events.get(eventId) || null;
  },
}));

// Helper function to generate unique key for odds
function generateOddsKey(odds: NormalizedOdds): string {
  return `${odds.event_id}-${odds.market_key}-${odds.book_key}-${odds.outcome_name}`;
}

// Selector hooks for convenience
export const useFilters = () => useOddsStore((state) => state.filters);
export const useConnectionStatus = () => useOddsStore((state) => state.connectionStatus);
export const useFilteredOdds = () => useOddsStore((state) => state.getFilteredOdds());

