// Bot API client for bot monitoring dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface BotStatus {
  name: string;
  display_name: string;
  status: string;
  logged_in: boolean;
  balance: string | null;
  session_duration: {
    hours: number;
    minutes: number;
    seconds: number;
    total_seconds: number;
  } | null;
  error?: string;
}

export interface BotStatusResponse {
  bots: BotStatus[];
}

export interface Bet {
  id: number;
  opportunity_id?: number;
  sport_key: string;
  event_id: string;
  market_key: string;
  book_key: string;
  outcome_name: string;
  bet_type: string;
  stake_amount: number;
  bet_price: number;
  point?: number;
  placed_at: string;
  settled_at?: string;
  result?: string;
  payout_amount?: number;
}

export interface RecentBetsResponse {
  bets: Bet[];
  count: number;
}

// Fetch all bot statuses with balance
export async function fetchBotStatus(): Promise<BotStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/bots/status`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bot status:', error);
    // Return empty response on error
    return { bots: [] };
  }
}

// Fetch individual bot balance (can be used for specific checks)
export async function fetchBotBalance(botName: string): Promise<BotStatus | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/bots/status`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: BotStatusResponse = await response.json();
    return data.bots.find(bot => bot.name === botName) || null;
  } catch (error) {
    console.error('Error fetching bot balance:', error);
    return null;
  }
}

// Fetch recent bets
export async function fetchRecentBets(botName?: string, limit: number = 50): Promise<RecentBetsResponse> {
  try {
    const params = new URLSearchParams();
    if (botName) {
      params.set('bot', botName);
    }
    params.set('limit', limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/v1/bots/bets/recent?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recent bets:', error);
    return { bets: [], count: 0 };
  }
}

