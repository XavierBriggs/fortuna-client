'use client';

import { useState } from 'react';
import { minervaAPI, Player, PlayerStats, Game } from '@/lib/minerva-api';
import { Search, Calendar, TrendingUp, X, Filter } from 'lucide-react';

export function PlayerStatsLookup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerGames, setPlayerGames] = useState<(PlayerStats & { game?: Game })[]>([]);
  const [filteredGames, setFilteredGames] = useState<(PlayerStats & { game?: Game })[]>([]);
  const [selectedGame, setSelectedGame] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeStatsTab, setActiveStatsTab] = useState<'basic' | 'shooting' | 'advanced'>('basic');

  // Helper to extract string from SQL nullable
  const getString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'String' in value && value.Valid) {
      return value.String;
    }
    return '';
  };

  // Helper to safely convert to number
  const getNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'Float64' in value && value.Valid) {
      return value.Float64;
    }
    if (value && typeof value === 'object' && 'Int32' in value && value.Valid) {
      return value.Int32;
    }
    return 0;
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await minervaAPI.searchPlayers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPlayer = async (player: Player) => {
    setSelectedPlayer(player);
    setSearchResults([]);
    setSearchQuery('');
    setLoading(true);
    setStartDate('');
    setEndDate('');

    try {
      // Get player's recent games (last 50)
      const stats = await minervaAPI.getPlayerStats(player.player_id, 50);
      
      // Get game details for each stat
      const statsWithGames = await Promise.all(
        stats.map(async (stat) => {
          try {
            const game = await minervaAPI.getGame(stat.game_id.toString());
            return { ...stat, game };
          } catch (error) {
            console.error(`Failed to fetch game ${stat.game_id}:`, error);
            return stat;
          }
        })
      );

      setPlayerGames(statsWithGames);
      setFilteredGames(statsWithGames);
    } catch (error) {
      console.error('Failed to load player games:', error);
      setPlayerGames([]);
      setFilteredGames([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedPlayer(null);
    setPlayerGames([]);
    setFilteredGames([]);
    setSelectedGame(null);
    setStartDate('');
    setEndDate('');
  };

  const applyDateFilter = () => {
    if (!startDate && !endDate) {
      setFilteredGames(playerGames);
      return;
    }

    const filtered = playerGames.filter(stat => {
      if (!stat.game?.game_date) return false;
      const gameDate = new Date(stat.game.game_date);
      
      if (startDate && endDate) {
        return gameDate >= new Date(startDate) && gameDate <= new Date(endDate);
      } else if (startDate) {
        return gameDate >= new Date(startDate);
      } else if (endDate) {
        return gameDate <= new Date(endDate);
      }
      return true;
    });

    setFilteredGames(filtered);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredGames(playerGames);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getOpponent = (game: Game | undefined, playerTeamId: number) => {
    if (!game) return 'Unknown';
    const isHome = game.home_team_id === playerTeamId;
    const opponent = isHome ? game.away_team : game.home_team;
    return `${isHome ? 'vs' : '@'} ${opponent?.abbreviation || 'Unknown'}`;
  };

  const calculateAverages = (games: (PlayerStats & { game?: Game })[]) => {
    if (games.length === 0) return null;
    
    const totals = games.reduce((acc, stat) => ({
      points: acc.points + (stat.points || 0),
      rebounds: acc.rebounds + (stat.rebounds || 0),
      assists: acc.assists + (stat.assists || 0),
      steals: acc.steals + (stat.steals || 0),
      blocks: acc.blocks + (stat.blocks || 0),
      turnovers: acc.turnovers + (stat.turnovers || 0),
      fgm: acc.fgm + (stat.field_goals_made || 0),
      fga: acc.fga + (stat.field_goals_attempted || 0),
      tpm: acc.tpm + (stat.three_pointers_made || 0),
      tpa: acc.tpa + (stat.three_pointers_attempted || 0),
      ftm: acc.ftm + (stat.free_throws_made || 0),
      fta: acc.fta + (stat.free_throws_attempted || 0),
      minutes: acc.minutes + (getNumber(stat.minutes_played) || 0),
    }), { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, minutes: 0 });

    const count = games.length;
    return {
      games: count,
      ppg: (totals.points / count).toFixed(1),
      rpg: (totals.rebounds / count).toFixed(1),
      apg: (totals.assists / count).toFixed(1),
      spg: (totals.steals / count).toFixed(1),
      bpg: (totals.blocks / count).toFixed(1),
      tpg: (totals.turnovers / count).toFixed(1),
      mpg: (totals.minutes / count).toFixed(1),
      fgPct: totals.fga > 0 ? ((totals.fgm / totals.fga) * 100).toFixed(1) : '0.0',
      tpPct: totals.tpa > 0 ? ((totals.tpm / totals.tpa) * 100).toFixed(1) : '0.0',
      ftPct: totals.fta > 0 ? ((totals.ftm / totals.fta) * 100).toFixed(1) : '0.0',
    };
  };

  const averages = calculateAverages(filteredGames);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Search className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Player Stats Lookup</h2>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a player (e.g., LeBron James, Steph Curry)..."
          className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {searching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {searchResults.map((player) => (
              <button
                key={player.player_id}
                onClick={() => handleSelectPlayer(player)}
                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0"
              >
                <div className="font-semibold">{getString(player.display_name) || player.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  {getString(player.position) && `${getString(player.position)} • `}
                  {getString(player.jersey_number) && `#${getString(player.jersey_number)}`}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Player */}
      {selectedPlayer && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                {getString(selectedPlayer.first_name)?.[0] || selectedPlayer.full_name?.[0] || '?'}
                {selectedPlayer.last_name?.[0] || selectedPlayer.full_name?.split(' ')[1]?.[0] || ''}
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {getString(selectedPlayer.display_name) || selectedPlayer.full_name}
                </h3>
                <p className="text-muted-foreground">
                  {getString(selectedPlayer.position) && `${getString(selectedPlayer.position)} • `}
                  {getString(selectedPlayer.jersey_number) && `#${getString(selectedPlayer.jersey_number)}`}
                </p>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : playerGames.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No game stats found for this player
            </div>
          ) : (
            <>
              {/* Date Filter */}
              <div className="bg-accent/50 border border-border rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4" />
                  <span className="font-semibold">Filter by Date</span>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm text-muted-foreground mb-1 block">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm text-muted-foreground mb-1 block">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={applyDateFilter}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  >
                    Apply
                  </button>
                  <button
                    onClick={clearDateFilter}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Averages Summary */}
              {averages && (
                <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold mb-3">
                    Averages ({filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">PPG</div>
                      <div className="text-xl font-bold">{averages.ppg}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">RPG</div>
                      <div className="text-xl font-bold">{averages.rpg}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">APG</div>
                      <div className="text-xl font-bold">{averages.apg}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">FG%</div>
                      <div className="text-xl font-bold">{averages.fgPct}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">MPG</div>
                      <div className="text-xl font-bold">{averages.mpg}</div>
                    </div>
                  </div>
                </div>
              )}

              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Game Log ({filteredGames.length})
              </h4>

              {/* Games List */}
              <div className="space-y-2 mb-6">
                {filteredGames.map((stat, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedGame(stat)}
                    className={`w-full p-4 rounded-lg border transition-colors text-left ${
                      selectedGame === stat
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {stat.game?.game_date ? formatDate(stat.game.game_date) : 'Unknown Date'}
                        </span>
                        <span className="font-semibold">
                          {getOpponent(stat.game, stat.team_id)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          stat.game?.status === 'final' 
                            ? 'bg-gray-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          {stat.game?.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold text-lg">{stat.points} PTS</span>
                        <span>{stat.rebounds} REB</span>
                        <span>{stat.assists} AST</span>
                      </div>
                    </div>
                    {stat.game && (
                      <div className="text-xs text-muted-foreground">
                        Final: {stat.game.away_team?.abbreviation} {stat.game.away_score} - {stat.game.home_score} {stat.game.home_team?.abbreviation}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Detailed Stats for Selected Game */}
              {selectedGame && (
                <div className="bg-accent/50 border border-border rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Game Details - {selectedGame.game?.game_date ? formatDate(selectedGame.game.game_date) : 'Unknown Date'}
                  </h4>

                  {/* Stats Tabs */}
                  <div className="flex gap-2 mb-4 border-b border-border">
                    <button
                      onClick={() => setActiveStatsTab('basic')}
                      className={`px-4 py-2 font-semibold transition-colors ${
                        activeStatsTab === 'basic'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Basic Stats
                    </button>
                    <button
                      onClick={() => setActiveStatsTab('shooting')}
                      className={`px-4 py-2 font-semibold transition-colors ${
                        activeStatsTab === 'shooting'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Shooting
                    </button>
                    <button
                      onClick={() => setActiveStatsTab('advanced')}
                      className={`px-4 py-2 font-semibold transition-colors ${
                        activeStatsTab === 'advanced'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Advanced
                    </button>
                  </div>

                  {/* Basic Stats */}
                  {activeStatsTab === 'basic' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Points</div>
                        <div className="text-2xl font-bold">{selectedGame.points}</div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Rebounds</div>
                        <div className="text-2xl font-bold">{selectedGame.rebounds}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedGame.offensive_rebounds} OR • {selectedGame.defensive_rebounds} DR
                        </div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Assists</div>
                        <div className="text-2xl font-bold">{selectedGame.assists}</div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Steals</div>
                        <div className="text-2xl font-bold">{selectedGame.steals}</div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Blocks</div>
                        <div className="text-2xl font-bold">{selectedGame.blocks}</div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Turnovers</div>
                        <div className="text-2xl font-bold">{selectedGame.turnovers}</div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Fouls</div>
                        <div className="text-2xl font-bold">{selectedGame.personal_fouls}</div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Minutes</div>
                        <div className="text-2xl font-bold">{getNumber(selectedGame.minutes_played).toFixed(0)}</div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">+/-</div>
                        <div className={`text-2xl font-bold ${
                          (selectedGame.plus_minus || 0) > 0 ? 'text-green-500' : 
                          (selectedGame.plus_minus || 0) < 0 ? 'text-red-500' : ''
                        }`}>
                          {selectedGame.plus_minus > 0 ? '+' : ''}{selectedGame.plus_minus || 0}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shooting Stats */}
                  {activeStatsTab === 'shooting' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Field Goals</div>
                        <div className="text-2xl font-bold">
                          {selectedGame.field_goals_made}-{selectedGame.field_goals_attempted}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedGame.field_goals_attempted > 0 
                            ? ((selectedGame.field_goals_made / selectedGame.field_goals_attempted) * 100).toFixed(1) 
                            : '0.0'}%
                        </div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">3-Pointers</div>
                        <div className="text-2xl font-bold">
                          {selectedGame.three_pointers_made}-{selectedGame.three_pointers_attempted}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedGame.three_pointers_attempted > 0 
                            ? ((selectedGame.three_pointers_made / selectedGame.three_pointers_attempted) * 100).toFixed(1) 
                            : '0.0'}%
                        </div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Free Throws</div>
                        <div className="text-2xl font-bold">
                          {selectedGame.free_throws_made}-{selectedGame.free_throws_attempted}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedGame.free_throws_attempted > 0 
                            ? ((selectedGame.free_throws_made / selectedGame.free_throws_attempted) * 100).toFixed(1) 
                            : '0.0'}%
                        </div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">2-Pointers</div>
                        <div className="text-2xl font-bold">
                          {selectedGame.field_goals_made - selectedGame.three_pointers_made}-{selectedGame.field_goals_attempted - selectedGame.three_pointers_attempted}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(selectedGame.field_goals_attempted - selectedGame.three_pointers_attempted) > 0 
                            ? (((selectedGame.field_goals_made - selectedGame.three_pointers_made) / (selectedGame.field_goals_attempted - selectedGame.three_pointers_attempted)) * 100).toFixed(1) 
                            : '0.0'}%
                        </div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Off Rebounds</div>
                        <div className="text-2xl font-bold">{selectedGame.offensive_rebounds}</div>
                      </div>
                      <div className="bg-card p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Def Rebounds</div>
                        <div className="text-2xl font-bold">{selectedGame.defensive_rebounds}</div>
                      </div>
                    </div>
                  )}

                  {/* Advanced Stats */}
                  {activeStatsTab === 'advanced' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {getNumber(selectedGame.true_shooting_pct) > 0 && (
                        <div className="bg-card p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">TS%</div>
                          <div className="text-2xl font-bold">
                            {(getNumber(selectedGame.true_shooting_pct) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">True Shooting</div>
                        </div>
                      )}
                      {getNumber(selectedGame.effective_fg_pct) > 0 && (
                        <div className="bg-card p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">eFG%</div>
                          <div className="text-2xl font-bold">
                            {(getNumber(selectedGame.effective_fg_pct) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Effective FG</div>
                        </div>
                      )}
                      {getNumber(selectedGame.usage_rate) > 0 && (
                        <div className="bg-card p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">USG%</div>
                          <div className="text-2xl font-bold">
                            {(getNumber(selectedGame.usage_rate) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Usage Rate</div>
                        </div>
                      )}
                      {getNumber(selectedGame.player_efficiency_rating) > 0 && (
                        <div className="bg-card p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">PER</div>
                          <div className="text-2xl font-bold">
                            {getNumber(selectedGame.player_efficiency_rating).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">Efficiency</div>
                        </div>
                      )}
                      {getNumber(selectedGame.game_score) > 0 && (
                        <div className="bg-card p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Game Score</div>
                          <div className="text-2xl font-bold">
                            {getNumber(selectedGame.game_score).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">Overall Impact</div>
                        </div>
                      )}
                      {getNumber(selectedGame.offensive_rating) > 0 && (
                        <div className="bg-card p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">ORtg</div>
                          <div className="text-2xl font-bold">
                            {getNumber(selectedGame.offensive_rating).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">Offensive Rating</div>
                        </div>
                      )}
                      {getNumber(selectedGame.defensive_rating) > 0 && (
                        <div className="bg-card p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">DRtg</div>
                          <div className="text-2xl font-bold">
                            {getNumber(selectedGame.defensive_rating).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">Defensive Rating</div>
                        </div>
                      )}
                      {getNumber(selectedGame.net_rating) !== 0 && (
                        <div className="bg-card p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Net Rating</div>
                          <div className={`text-2xl font-bold ${
                            getNumber(selectedGame.net_rating) > 0 ? 'text-green-500' : 
                            getNumber(selectedGame.net_rating) < 0 ? 'text-red-500' : ''
                          }`}>
                            {getNumber(selectedGame.net_rating) > 0 ? '+' : ''}{getNumber(selectedGame.net_rating).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">ORtg - DRtg</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedPlayer && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Search for a player to view their game-by-game stats</p>
          <p className="text-sm mt-2">Filter by date range and view detailed statistics</p>
        </div>
      )}
    </div>
  );
}
