// Analytics API Client for Opportunity Statistics

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// ============================================================================
// Types
// ============================================================================

export interface BookStats {
  opportunity_count: number;
  avg_edge_pct: number;
  total_bets: number;
  wins: number;
  losses: number;
  net_profit: number;
  roi: number;
  avg_clv: number;
  // Enhanced metrics
  avg_hold_time_seconds?: number;
  execution_rate?: number;
  min_edge_pct?: number;
  max_edge_pct?: number;
  median_edge_pct?: number;
}

export interface StatsSummary {
  total_opportunities: number;
  total_bets: number;
  net_profit: number;
  roi: number;
  win_rate: number;
  avg_clv: number;
  avg_edge_pct: number;
  // Enhanced metrics
  avg_hold_time_seconds: number;
  execution_rate: number;
  opps_per_minute: number;
  min_edge_pct: number;
  max_edge_pct: number;
  median_edge_pct: number;
  // Breakdowns
  by_book: Record<string, BookStats>;
  by_type: Record<string, BookStats>;
  by_sport?: Record<string, BookStats>;
  by_market?: Record<string, BookStats>;
}

export interface TimeSeriesPoint {
  timestamp: string;
  book_key: string;
  opportunity_type: string;
  game_status?: string;
  opportunity_count: number;
  avg_edge_pct: number;
  total_bets: number;
  net_profit: number;
  roi: number;
  avg_hold_time_seconds?: number;
  execution_rate?: number;
  min_edge_pct?: number;
  max_edge_pct?: number;
}

export interface TimeSeriesResponse {
  points: TimeSeriesPoint[];
  count: number;
}

export interface EdgeDistribution {
  buckets: EdgeBucket[];
  stats: EdgeStats;
}

export interface EdgeBucket {
  range_start: number;
  range_end: number;
  count: number;
  percentage: number;
}

export interface EdgeStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stddev: number;
  total: number;
}

export interface ExecutionStats {
  avg_hold_time_seconds: number;
  min_hold_time_seconds: number;
  max_hold_time_seconds: number;
  total_opportunities: number;
  total_bets_placed: number;
  execution_rate: number;
  conversion_by_book?: Record<string, number>;
}

export interface BookPairSummary {
  pair_name: string;
  book_key_1: string;
  book_key_2: string;
  opportunity_type: string;
  total_opportunities: number;
  avg_edge_pct: number;
  best_edge_pct: number;
  total_bets: number;
  total_profit: number;
  roi: number;
  avg_hold_time_seconds: number;
  execution_rate: number;
}

export interface PairPerformance {
  book_key_1: string;
  book_key_2: string;
  pair_name: string;
  opportunity_type: string;
  total_opportunities: number;
  total_bets_placed: number;
  total_handle: number;
  realized_profit: number;
  roi_pct: number;
  win_count: number;
  loss_count: number;
  push_count: number;
  pending_count: number;
  execution_rate: number;
  updated_at: string;
}

// ============================================================================
// Opportunity CLV Types (Edge Detector Validation)
// ============================================================================

export interface OpportunityCLVStats {
  total_opportunities: number;
  avg_clv: number;
  min_clv: number;
  max_clv: number;
  avg_edge_at_detection: number;
  positive_clv_count: number;
  negative_clv_count: number;
  edge_accuracy: number;
}

export interface OpportunityCLVSummary {
  total_opportunities: number;
  avg_clv: number;
  min_clv: number;
  max_clv: number;
  avg_edge_at_detection: number;
  avg_edge_decay: number;
  positive_clv_count: number;
  negative_clv_count: number;
  edge_accuracy: number;
  false_positive_rate: number;
  by_book?: Record<string, OpportunityCLVStats>;
  by_type?: Record<string, OpportunityCLVStats>;
}

export interface EdgeAccuracyPoint {
  timestamp: string;
  total_opportunities: number;
  avg_clv: number;
  avg_edge_at_detection: number;
  edge_accuracy: number;
}

export interface OpportunityCLVResponse {
  opportunity_clv: {
    summary: OpportunityCLVSummary;
    time_series?: EdgeAccuracyPoint[];
    message?: string;
  };
  start_time: string;
  end_time: string;
  book_filter: string;
  type_filter: string;
  description: string;
  metrics_explained: Record<string, string>;
}

interface FetchOptions {
  startTime?: string;
  endTime?: string;
  hours?: number;
  days?: number;
  book?: string;
  type?: string;
  limit?: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetches stats summary from the analytics service
 */
export async function fetchStatsSummary(options: FetchOptions = {}): Promise<StatsSummary> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  } else {
    if (options.startTime) params.append('start_time', options.startTime);
    if (options.endTime) params.append('end_time', options.endTime);
  }
  
  if (options.book) params.append('book', options.book);
  if (options.type) params.append('type', options.type);

  const url = `${API_BASE}/api/v1/analytics/stats/summary?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch stats summary: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetches time series data from the analytics service
 */
export async function fetchTimeSeries(options: FetchOptions = {}): Promise<TimeSeriesResponse> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  } else {
    if (options.startTime) params.append('start_time', options.startTime);
    if (options.endTime) params.append('end_time', options.endTime);
  }
  
  if (options.book) params.append('book', options.book);
  if (options.type) params.append('type', options.type);

  const url = `${API_BASE}/api/v1/analytics/stats/timeseries?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch time series: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetches profitability metrics from the analytics service
 */
export async function fetchProfitability(options: FetchOptions = {}): Promise<any> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  } else {
    if (options.startTime) params.append('start_time', options.startTime);
    if (options.endTime) params.append('end_time', options.endTime);
  }
  
  if (options.book) params.append('book', options.book);
  if (options.type) params.append('type', options.type);

  const url = `${API_BASE}/api/v1/analytics/stats/profitability?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch profitability: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetches book-level statistics from the analytics service
 */
export async function fetchBookStats(options: FetchOptions = {}): Promise<Record<string, BookStats>> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  } else {
    if (options.startTime) params.append('start_time', options.startTime);
    if (options.endTime) params.append('end_time', options.endTime);
  }
  
  if (options.type) params.append('type', options.type);

  const url = `${API_BASE}/api/v1/analytics/stats/books?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch book stats: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.books;
}

/**
 * Fetches edge distribution data for histograms
 */
export async function fetchEdgeDistribution(options: FetchOptions = {}): Promise<EdgeDistribution> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  }
  
  if (options.book) params.append('book', options.book);
  if (options.type) params.append('type', options.type);

  const url = `${API_BASE}/api/v1/analytics/edge-distribution?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch edge distribution: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.distribution;
}

/**
 * Fetches execution/hold time statistics
 */
export async function fetchExecutionStats(options: FetchOptions = {}): Promise<ExecutionStats> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  }
  
  if (options.book) params.append('book', options.book);

  const url = `${API_BASE}/api/v1/analytics/stats/execution?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch execution stats: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.execution_stats;
}

/**
 * Fetches best book pairs for scalps
 */
export async function fetchScalpPairs(options: FetchOptions = {}): Promise<BookPairSummary[]> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  }
  
  if (options.limit) params.append('limit', options.limit.toString());

  const url = `${API_BASE}/api/v1/analytics/stats/scalp-pairs?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch scalp pairs: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.scalp_pairs || [];
}

/**
 * Fetches best book pairs for middles
 */
export async function fetchMiddlePairs(options: FetchOptions = {}): Promise<BookPairSummary[]> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  }
  
  if (options.limit) params.append('limit', options.limit.toString());

  const url = `${API_BASE}/api/v1/analytics/stats/middle-pairs?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch middle pairs: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.middle_pairs || [];
}

/**
 * Fetches hold time statistics
 */
export async function fetchHoldTimeStats(options: FetchOptions = {}): Promise<any> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  }
  
  if (options.book) params.append('book', options.book);

  const url = `${API_BASE}/api/v1/analytics/stats/hold-time?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch hold time stats: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetches pair performance (handle, profit, ROI per book pair)
 */
export async function fetchPairPerformance(options: FetchOptions = {}): Promise<{
  pairs: PairPerformance[];
  count: number;
  recommendations: string[];
}> {
  const params = new URLSearchParams();
  
  if (options.type) params.append('type', options.type);
  if (options.limit) params.append('limit', options.limit.toString());

  const url = `${API_BASE}/api/v1/analytics/stats/pair-performance?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch pair performance: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Refreshes pair performance metrics (recalculates from source data)
 */
export async function refreshPairPerformance(): Promise<{ status: string; message: string; duration_ms: number }> {
  const url = `${API_BASE}/api/v1/analytics/stats/pair-performance/refresh`;
  
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to refresh pair performance: ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================================================
// Opportunity CLV API Functions (Edge Detector Validation)
// ============================================================================

interface OpportunityCLVOptions extends FetchOptions {
  timeseries?: boolean;
  interval?: string;
}

/**
 * Fetches opportunity CLV summary (validates edge detector accuracy)
 */
export async function fetchOpportunityCLV(options: OpportunityCLVOptions = {}): Promise<OpportunityCLVResponse> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  }
  
  if (options.book) params.append('book', options.book);
  if (options.type) params.append('type', options.type);
  if (options.timeseries) params.append('timeseries', 'true');
  if (options.interval) params.append('interval', options.interval);

  const url = `${API_BASE}/api/v1/analytics/stats/opportunity-clv?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch opportunity CLV: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetches edge accuracy time series
 */
export async function fetchEdgeAccuracy(options: OpportunityCLVOptions = {}): Promise<{
  time_series: EdgeAccuracyPoint[];
  summary: {
    overall_edge_accuracy: number;
    avg_clv_cents: number;
    total_opportunities: number;
    avg_edge_at_detection: number;
    avg_edge_decay: number;
    positive_clv_count: number;
    negative_clv_count: number;
  };
  interpretation: Record<string, string>;
}> {
  const params = new URLSearchParams();
  
  if (options.days) {
    params.append('days', options.days.toString());
  } else if (options.hours) {
    params.append('hours', options.hours.toString());
  }
  
  if (options.interval) params.append('interval', options.interval);

  const url = `${API_BASE}/api/v1/analytics/stats/edge-accuracy?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch edge accuracy: ${response.statusText}`);
  }
  
  return response.json();
}
