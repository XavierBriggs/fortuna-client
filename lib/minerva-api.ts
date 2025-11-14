/**
 * Minerva API Client
 * Handles all requests to the Minerva sports analytics service
 */

const MINERVA_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';
const MINERVA_PREFIX = '/api/v1/minerva';

export interface Game {
  game_id: string;
  season_id: string;
  game_date: string;
  game_time?: string;
  home_team_id: number;
  away_team_id: number;
  home_score?: number;
  away_score?: number;
  game_status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'cancelled';
  period?: number;
  time_remaining?: string;
  venue?: string;
  attendance?: number;
}

export interface Player {
  player_id: number;
  espn_player_id?: string;
  first_name: string;
  last_name: string;
  position?: string;
  jersey_number?: string;
  height?: string;
  weight?: number;
  birth_date?: string;
  current_team_id?: number;
}

export interface PlayerStats {
  game_id: string;
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
  minutes_played?: number;
  plus_minus?: number;
  starter: boolean;
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
  season_id?: number;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
}

export interface BackfillStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  message: string;
  progress?: number;
  total?: number;
}

class MinervaAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${MINERVA_BASE_URL}${MINERVA_PREFIX}`;
  }

  /**
   * GAMES
   */
  async getLiveGames(): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/games/live`);
    if (!response.ok) throw new Error('Failed to fetch live games');
    const data = await response.json();
    return data.games || [];
  }

  async getUpcomingGames(): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/games/upcoming`);
    if (!response.ok) throw new Error('Failed to fetch upcoming games');
    const data = await response.json();
    return data.games || [];
  }

  async getGamesByDate(date: string): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/games?date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch games by date');
    const data = await response.json();
    return data.games || [];
  }

  async getGame(gameId: string): Promise<Game> {
    const response = await fetch(`${this.baseUrl}/games/${gameId}`);
    if (!response.ok) throw new Error('Failed to fetch game');
    return response.json();
  }

  async getGameBoxScore(gameId: string): Promise<{
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
    return data.players || [];
  }

  async getPlayer(playerId: number): Promise<Player> {
    const response = await fetch(`${this.baseUrl}/players/${playerId}`);
    if (!response.ok) throw new Error('Failed to fetch player');
    return response.json();
  }

  async getPlayerStats(playerId: number, seasonId: string): Promise<PlayerStats[]> {
    const response = await fetch(`${this.baseUrl}/players/${playerId}/stats?season=${seasonId}`);
    if (!response.ok) throw new Error('Failed to fetch player stats');
    const data = await response.json();
    return data.stats || [];
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
    return data.games || [];
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
    return data.players || [];
  }

  async getTeamSchedule(teamId: number, seasonId: string): Promise<Game[]> {
    const response = await fetch(`${this.baseUrl}/teams/${teamId}/schedule?season=${seasonId}`);
    if (!response.ok) throw new Error('Failed to fetch team schedule');
    const data = await response.json();
    return data.games || [];
  }

  /**
   * BACKFILL (Admin)
   */
  async triggerBackfill(request: BackfillRequest): Promise<{ message: string; status_url: string }> {
    const response = await fetch(`${this.baseUrl}/backfill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to trigger backfill');
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

