// Auto-betting API client functions

export interface AutoBettingSettings {
  user_id: string;
  auto_betting_enabled: boolean;
  auto_min_edge_pct: number;
  auto_enabled_opportunity_types: string[];
  auto_enabled_markets: string[];
  auto_enabled_books: string[];
  auto_disabled_books: string[];
  auto_max_stake_per_bet: number;
  auto_max_exposure_per_event: number;
  auto_max_exposure_total: number;
  auto_max_bets_per_hour: number;
  auto_max_bets_per_day: number;
  kelly_fraction: number;
  auto_max_kelly_pct: number;
  auto_min_stake: number;
  auto_max_data_age_seconds: number;
  auto_min_time_to_start_hours: number;
  auto_max_time_to_start_hours: number;
  auto_pause_on_loss_streak: number;
  auto_pause_on_daily_loss: number;
  auto_correlation_discount: number;
  auto_middle_enabled: boolean;
  auto_middle_execution_strategy: string;
  auto_middle_required_legs: number;
  auto_scalp_enabled: boolean;
  auto_scalp_bankroll_pct: number;
  auto_scalp_min_profit_pct: number;
  auto_edge_allow_live_games: boolean;
}

export interface AutoBettingState {
  user_id: string;
  total_exposure: number;
  exposure_by_event: Record<string, number>;
  exposure_by_book: Record<string, number>;
  bets_placed_last_hour: number;
  bets_placed_today: number;
  last_bet_placed_at: string;
  todays_pnl: number;
  current_loss_streak: number;
  total_bets_placed: number;
  total_bets_won: number;
  total_bets_lost: number;
  is_paused: boolean;
  pause_reason: string;
  last_updated: string;
}

export interface AutoBettingDecision {
  id: number;
  opportunity_id: number;
  decision: string;
  decision_reason: string;
  calculated_stake?: number;
  calculated_edge?: number;
  execution_time_ms?: number;
  current_exposure: number;
  current_bankroll: number;
  bets_placed_today: number;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function getAutoBettingSettings(userId: string = 'default'): Promise<AutoBettingSettings> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auto-betting/settings?user_id=${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch auto-betting settings');
  }
  
  return response.json();
}

export async function updateAutoBettingSettings(settings: Partial<AutoBettingSettings>): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auto-betting/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update auto-betting settings');
  }
}

export async function getAutoBettingState(userId: string = 'default'): Promise<AutoBettingState> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auto-betting/state?user_id=${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch auto-betting state');
  }
  
  return response.json();
}

export async function pauseAutoBetting(userId: string = 'default', reason: string = 'manual pause'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auto-betting/pause`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, reason }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to pause auto-betting');
  }
}

export async function resumeAutoBetting(userId: string = 'default'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auto-betting/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to resume auto-betting');
  }
}

export async function getAutoBettingDecisions(userId: string = 'default', limit: number = 50): Promise<{ decisions: AutoBettingDecision[], total: number }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auto-betting/decisions?user_id=${userId}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch auto-betting decisions');
  }
  
  return response.json();
}

