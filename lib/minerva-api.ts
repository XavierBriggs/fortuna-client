/**
 * Minerva API Client
 * Handles all requests to the Minerva sports analytics service
 */

const MINERVA_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8081';
const MINERVA_PREFIX = '/api/v1/minerva';

export interface Team {
  team_id: number;
  sport?: string;
  external_id?: string;
  abbreviation: string;
  full_name: string;
  short_name: string;
  city?: string | { String: string; Valid: boolean };
  state?: string | { String: string; Valid: boolean };
  conference?: string | { String: string; Valid: boolean };
  division?: string | { String: string; Valid: boolean };
  venue_name?: string | { String: string; Valid: boolean };
  venue_capacity?: number | { Int32: number; Valid: boolean };
  founded_year?: number | { Int32: number; Valid: boolean };
  logo_url?: string | { String: string; Valid: boolean };
  colors?: any;
  social_media?: any;
  metadata?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Game {
  game_id: string | number;
  sport?: string;
  season_id: string | number;
  external_id?: string;
  game_date: string;
  game_time?: string | { Time: string; Valid: boolean };
  home_team_id: number;
  away_team_id: number;
  home_team?: Team;
  away_team?: Team;
  home_score?: number | { Int32: number; Valid: boolean };
  away_score?: number | { Int32: number; Valid: boolean };
  status?: string;
  game_status?: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'cancelled';
  period?: number | { Int32: number; Valid: boolean };
  clock?: string | { String: string; Valid: boolean };
  time_remaining?: string;
  venue?: string | { String: string; Valid: boolean };
  attendance?: number | { Int32: number; Valid: boolean };
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface GameSummary {
  game: Game;
  home_team: Team;
  away_team: Team;
}

export interface Player {
  player_id: number;
  espn_player_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  position?: string;
  jersey_number?: string;
  height?: string;
  weight?: number;
  birth_date?: string;
  current_team_id?: number;
}

export interface PlayerStats {
  id?: number;
  game_id: string | number;
  player_id: number;
  team_id: number;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  field_goals_made?: number;
  field_goals_attempted?: number;
  three_pointers_made?: number;
  three_pointers_attempted?: number;
  free_throws_made?: number;
  free_throws_attempted?: number;
  offensive_rebounds?: number;
  defensive_rebounds?: number;
  personal_fouls?: number;
  minutes_played?: number | { Float64: number; Valid: boolean };
  plus_minus?: number | { Int32: number; Valid: boolean };
  starter: boolean;
  // Advanced stats (may be nullable objects)
  true_shooting_pct?: number | { Float64: number; Valid: boolean };
  effective_fg_pct?: number | { Float64: number; Valid: boolean };
  usage_rate?: number | { Float64: number; Valid: boolean };
  player_efficiency_rating?: number | { Float64: number; Valid: boolean };
  game_score?: number | { Float64: number; Valid: boolean };
  offensive_rating?: number | { Float64: number; Valid: boolean };
  defensive_rating?: number | { Float64: number; Valid: boolean };
  net_rating?: number | { Float64: number; Valid: boolean };
  // Enriched game context fields
  game_date?: string;
  opponent_team_id?: number;
  opponent_abbr?: string;
  opponent_name?: string;
  is_home?: boolean;
  home_score?: number;
  away_score?: number;
  result?: 'W' | 'L';
  // For PlayerStatsLookup component
  game?: Game;
}

export interface PlayerSeasonAverages {
  player_id: number;
  season_id: string;
  games_played: number;
  points_avg: number;
  rebounds_avg: number;
  assists_avg: number;
  steals_avg: number;
  blocks_avg: number;
  turnovers_avg: number;
  fg_pct: number;
  three_pt_pct: number;
  ft_pct: number;
  minutes_avg: number;
}

export interface BackfillRequest {
  sport: string;
  season_id?: string;  // e.g., "2024-25" or "2024"
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  game_id?: string;    // For single game backfill
  game_ids?: string[]; // For multiple game backfill
  dry_run?: boolean;   // Test mode
}

export interface BackfillJob {
  job_id: string;
  job_type: string;
  status: string;
  status_message?: string;
  progress_current: number;
  progress_total: number;
  season_id?: string;
  start_date?: string;
  end_date?: string;
  game_id?: string;
  created_at?: string;
  updated_at?: string;
  started_at?: string;
  completed_at?: string;
  last_error?: string;
}

export interface BackfillStatus {
  status: string;
  message: string;
  active_job?: BackfillJob;
  history: BackfillJob[];
}

class MinervaAPI {
  private baseUrl: string;
  private teamsCache: Map<number, Team> = new Map();
  private teamsCacheTime: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = `${MINERVA_BASE_URL}${MINERVA_PREFIX}`;
  }

  /**
   * TEAMS
   */
  async getTeams(): Promise<Team[]> {
    const response = await fetch(`${this.baseUrl}/teams`);
    if (!response.ok) throw new Error('Failed to fetch teams');
    const data = await response.json();
    const teams = normalizeArray<Team>(data, 'teams');
    
    // Update cache
    this.teamsCache.clear();
    teams.forEach(team => this.teamsCache.set(team.team_id, team));
    this.teamsCacheTime = Date.now();
    
    return teams;
  }

  private async ensureTeamsCache(): Promise<void> {
    if (this.teamsCache.size === 0 || Date.now() - this.teamsCacheTime > this.CACHE_TTL) {
      await this.getTeams();
    }
  }

  private flattenGameSummary(summary: GameSummary): Game {
    // Helper to extract value from SQL nullable types
    const extractValue = (val: any): any => {
      if (val && typeof val === 'object' && ('Valid' in val || 'Int32' in val || 'String' in val || 'Time' in val)) {
        if ('Int32' in val) return val.Valid ? val.Int32 : undefined;
        if ('String' in val) return val.Valid ? val.String : undefined;
        if ('Time' in val) return val.Valid ? val.Time : undefined;
        return val.Valid ? val : undefined;
      }
      return val;
    };

    const game = summary.game;
    return {
      game_id: game.game_id,
      sport: game.sport,
      season_id: game.season_id,
      external_id: game.external_id,
      game_date: game.game_date,
      game_time: extractValue(game.game_time),
      home_team_id: game.home_team_id,
      away_team_id: game.away_team_id,
      home_team: summary.home_team,
      away_team: summary.away_team,
      home_score: extractValue(game.home_score),
      away_score: extractValue(game.away_score),
      status: game.status,
      game_status: game.status as any,
      period: extractValue(game.period),
      clock: extractValue(game.clock),
      time_remaining: extractValue(game.clock),
      venue: extractValue(game.venue),
      attendance: extractValue(game.attendance),
      metadata: game.metadata,
      created_at: game.created_at,
      updated_at: game.updated_at,
    };
  }

  private async enrichGamesWithTeams(games: Game[]): Promise<Game[]> {
    await this.ensureTeamsCache();
    return games.map(game => ({
      ...game,
      home_team: this.teamsCache.get(game.home_team_id),
      away_team: this.teamsCache.get(game.away_team_id),
    }));
  }

  /**
   * GAMES
   */
  async getLiveGames(): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/games/live`);
    if (!response.ok) throw new Error('Failed to fetch live games');
    const data = await response.json();
    const summaries = normalizeArray<GameSummary>(data, 'games');
    return summaries.map(s => this.flattenGameSummary(s));
  }

  async getTodaysGames(): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/games/today`);
    if (!response.ok) throw new Error('Failed to fetch today\'s games');
    const data = await response.json();
    const summaries = normalizeArray<GameSummary>(data, 'games');
    return summaries.map(s => this.flattenGameSummary(s));
  }

  async getUpcomingGames(): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/games/upcoming`);
    if (!response.ok) throw new Error('Failed to fetch upcoming games');
    const data = await response.json();
    const summaries = normalizeArray<GameSummary>(data, 'games');
    return summaries.map(s => this.flattenGameSummary(s));
  }

  async getGamesByDate(date: string): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/games?date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch games by date');
    const data = await response.json();
    const summaries = normalizeArray<GameSummary>(data, 'games');
    return summaries.map(s => this.flattenGameSummary(s));
  }

  async getGame(gameId: string): Promise<Game> {
    const response = await fetch(`${this.baseUrl}/games/${gameId}`);
    if (!response.ok) throw new Error('Failed to fetch game');
    return response.json();
  }

  async getGameBoxScore(gameId: string | number): Promise<{
    game: Game;
    home_stats: PlayerStats[];
    away_stats: PlayerStats[];
  }> {
    const response = await fetch(`${this.baseUrl}/games/${gameId}/boxscore`);
    if (!response.ok) throw new Error('Failed to fetch box score');
    return response.json();
  }

  /**
   * PLAYERS
   */
  async searchPlayers(query: string): Promise<Player[]> {
    const response = await fetch(`${this.baseUrl}/players/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search players');
    const data = await response.json();
    return normalizeArray<Player>(data, 'players');
  }

  async getPlayer(playerId: number): Promise<Player> {
    const response = await fetch(`${this.baseUrl}/players/${playerId}`);
    if (!response.ok) throw new Error('Failed to fetch player');
    return response.json();
  }

  async getPlayerStats(playerId: number, limit: number = 10): Promise<PlayerStats[]> {
    const response = await fetch(`${this.baseUrl}/players/${playerId}/stats?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch player stats');
    const data = await response.json();
    return normalizeArray<PlayerStats>(data, 'stats');
  }

  async getPlayerSeasonAverages(playerId: number, seasonId: string): Promise<PlayerSeasonAverages> {
    const response = await fetch(`${this.baseUrl}/players/${playerId}/averages?season=${seasonId}`);
    if (!response.ok) throw new Error('Failed to fetch player averages');
    return response.json();
  }

  async getPlayerTrend(playerId: number, lastN: number = 10): Promise<PlayerStats[]> {
    const response = await fetch(`${this.baseUrl}/players/${playerId}/trend?last=${lastN}`);
    if (!response.ok) throw new Error('Failed to fetch player trend');
    const data = await response.json();
    return normalizeArray<PlayerStats>(data, 'games');
  }

  async getPlayerMLFeatures(playerId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/players/${playerId}/ml-features`);
    if (!response.ok) throw new Error('Failed to fetch ML features');
    return response.json();
  }

  /**
   * TEAMS
   */
  async getTeamRoster(teamId: number): Promise<Player[]> {
    const response = await fetch(`${this.baseUrl}/teams/${teamId}/roster`);
    if (!response.ok) throw new Error('Failed to fetch team roster');
    const data = await response.json();
    return normalizeArray<Player>(data, 'players');
  }

  async getTeamSchedule(teamId: number, seasonId: string): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/teams/${teamId}/schedule?season=${seasonId}`);
    if (!response.ok) throw new Error('Failed to fetch team schedule');
    const data = await response.json();
    return normalizeArray<Game>(data, 'games');
  }

  /**
   * BACKFILL (Admin)
   */
  async triggerBackfill(request: BackfillRequest): Promise<{ job: BackfillJob }> {
    const response = await fetch(`${this.baseUrl}/backfill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to trigger backfill');
    }
    return response.json();
  }

  async getBackfillStatus(): Promise<BackfillStatus> {
    const response = await fetch(`${this.baseUrl}/backfill/status`);
    if (!response.ok) throw new Error('Failed to fetch backfill status');
    return response.json();
  }
}

export const minervaAPI = new MinervaAPI();

function normalizeArray<T>(payload: any, key: string): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (Array.isArray(payload[key])) {
    return payload[key] as T[];
  }
  return [];
}

