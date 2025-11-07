// Core data types matching backend models

export interface Event {
  event_id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string; // ISO 8601
  event_status: 'upcoming' | 'live' | 'completed';
  discovered_at: string;
  last_seen_at: string;
}

export interface RawOdds {
  event_id: string;
  sport_key: string;
  market_key: string;
  book_key: string;
  outcome_name: string;
  price: number; // American odds
  point: number | null; // For spreads/totals
  vendor_last_update: string;
  received_at: string;
}

export interface NormalizedOdds extends RawOdds {
  // Normalized values (required - from Normalizer service)
  decimal_odds: number;
  implied_probability: number;
  novig_probability: number | null;
  fair_price: number | null; // American odds
  edge: number | null; // Percentage (0.024 = 2.4%)
  
  // Sharp consensus
  sharp_consensus: number | null;
  
  // Market classification
  market_type: MarketType;
  vig_method: VigMethod;
  
  // Metadata
  normalized_at: string;
  processing_latency_ms: number;
}

export type MarketType = 'two_way' | 'three_way' | 'props';
export type VigMethod = 'multiplicative' | 'additive' | 'none';
export type BookType = 'sharp' | 'soft';

export interface Book {
  book_key: string;
  display_name: string;
  book_type: BookType;
  active: boolean;
  regions: string[];
  supported_sports: string[];
}

export interface Market {
  market_key: string;
  market_family: 'featured' | 'props';
  display_name: string;
  outcome_count: number;
  sport_key: string;
}

export interface Sport {
  sport_key: string;
  display_name: string;
  active: boolean;
  config: Record<string, any>;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'odds_update' | 'heartbeat' | 'error' | 'subscribe' | 'unsubscribe';
  payload?: any;
  timestamp?: string;
}

export interface OddsUpdateMessage extends WebSocketMessage {
  type: 'odds_update';
  payload: NormalizedOdds;
}

export interface HeartbeatMessage extends WebSocketMessage {
  type: 'heartbeat';
  payload: {
    client_id: string;
    connected_at: string;
    messages_sent: number;
    messages_received: number;
    last_message_at: string;
    buffer_size: number;
    buffer_utilization: number;
  };
}

export interface SubscribeMessage extends WebSocketMessage {
  type: 'subscribe';
  payload: {
    sports: string[];
    events?: string[];
    markets?: string[];
    books?: string[];
  };
}

// UI State types
export interface OddsFilters {
  sport: string;
  markets: string[];
  books: string[];
  minEdge: number | null;
  searchQuery: string;
  eventStatus: 'all' | 'live' | 'upcoming';
}

export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  latency: number;
  lastMessage: string | null;
  reconnectAttempts: number;
}

// Grouped data for display
export interface EventGroup {
  event: Event;
  outcomes: OutcomeGroup[];
  hold: number; // No-vig percentage
  dataAge: number; // Seconds
}

export interface OutcomeGroup {
  outcome_name: string;
  point: number | null;
  oddsByBook: Record<string, NormalizedOdds>;
  bestOdds: NormalizedOdds | null;
  bestEdge: NormalizedOdds | null;
}

// API Response types
export interface EventsResponse {
  events: Event[];
  count: number;
  limit: number;
  offset: number;
}

export interface CurrentOddsResponse {
  odds: NormalizedOdds[];
  count: number;
  limit: number;
  offset: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  active_clients?: number;
}

// Alert types
export interface Alert {
  id: string;
  odds: NormalizedOdds;
  edge: number;
  timestamp: string;
  dismissed: boolean;
}

export interface AlertSettings {
  minEdge: number;
  maxDataAge: number;
  enableInApp: boolean;
  enableSlack: boolean;
  enableSound: boolean;
}

