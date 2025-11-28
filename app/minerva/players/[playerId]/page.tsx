'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { minervaAPI, Player, PlayerStats, PlayerSeasonAverages, Team } from '@/lib/minerva-api';
import { ArrowLeft, TrendingUp, BarChart3, Activity, Award, ChevronRight, Calendar, Target } from 'lucide-react';
import Link from 'next/link';

// Helper to extract number from Go's sql.Null* types
function extractNum(val: number | { Int32?: number; Float64?: number; Valid: boolean } | undefined | null, defaultVal: number = 0): number {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && 'Valid' in val) {
    if (!val.Valid) return defaultVal;
    if ('Int32' in val && val.Int32 !== undefined) return val.Int32;
    if ('Float64' in val && val.Float64 !== undefined) return val.Float64;
    return defaultVal;
  }
  return defaultVal;
}

// Helper to extract string from Go's sql.Null* types  
function extractStr(val: string | { String?: string; Valid: boolean } | undefined | null, defaultVal: string = ''): string {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && 'Valid' in val) {
    if (!val.Valid) return defaultVal;
    if ('String' in val && val.String !== undefined) return val.String;
    return defaultVal;
  }
  return defaultVal;
}

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [recentStats, setRecentStats] = useState<PlayerStats[]>([]);
  const [seasonAverages, setSeasonAverages] = useState<PlayerSeasonAverages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'game-log' | 'advanced'>('overview');

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load player info and recent stats
      const [playerData, statsData] = await Promise.all([
        minervaAPI.getPlayer(parseInt(playerId)),
        minervaAPI.getPlayerStats(parseInt(playerId), 20)
      ]);

      setPlayer(playerData);
      setRecentStats(statsData);

      // Load team info if available
      if (playerData.current_team_id) {
        const teams = await minervaAPI.getTeams();
        const playerTeam = teams.find(t => t.team_id === playerData.current_team_id);
        setTeam(playerTeam || null);
      }

      // Load season averages
      try {
        const averages = await minervaAPI.getPlayerSeasonAverages(parseInt(playerId), '2025-26');
        setSeasonAverages(averages);
      } catch (err) {
        console.log('No season averages available');
      }
    } catch (err) {
      console.error('Failed to load player data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load player data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate advanced stats from recent games
  const calculateAdvancedStats = () => {
    if (recentStats.length === 0) return null;

    const totals = recentStats.reduce((acc, stat) => ({
      points: acc.points + extractNum(stat.points),
      rebounds: acc.rebounds + extractNum(stat.rebounds),
      assists: acc.assists + extractNum(stat.assists),
      steals: acc.steals + extractNum(stat.steals),
      blocks: acc.blocks + extractNum(stat.blocks),
      turnovers: acc.turnovers + extractNum(stat.turnovers),
      fgm: acc.fgm + extractNum(stat.field_goals_made),
      fga: acc.fga + extractNum(stat.field_goals_attempted),
      tpm: acc.tpm + extractNum(stat.three_pointers_made),
      tpa: acc.tpa + extractNum(stat.three_pointers_attempted),
      ftm: acc.ftm + extractNum(stat.free_throws_made),
      fta: acc.fta + extractNum(stat.free_throws_attempted),
      minutes: acc.minutes + extractNum(stat.minutes_played),
    }), { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, minutes: 0 });

    const games = recentStats.length;
    
    // True Shooting % = PTS / (2 * (FGA + 0.44 * FTA))
    const tsa = totals.fga + (0.44 * totals.fta);
    const ts = tsa > 0 ? (totals.points / (2 * tsa)) * 100 : 0;
    
    // Effective FG% = (FGM + 0.5 * 3PM) / FGA
    const efg = totals.fga > 0 ? ((totals.fgm + 0.5 * totals.tpm) / totals.fga) * 100 : 0;
    
    // Assist to Turnover Ratio
    const astToRatio = totals.turnovers > 0 ? totals.assists / totals.turnovers : totals.assists;
    
    // Stocks (Steals + Blocks)
    const stocks = (totals.steals + totals.blocks) / games;

    return {
      games,
      ts: ts.toFixed(1),
      efg: efg.toFixed(1),
      astToRatio: astToRatio.toFixed(2),
      stocks: stocks.toFixed(1),
      ppg: (totals.points / games).toFixed(1),
      rpg: (totals.rebounds / games).toFixed(1),
      apg: (totals.assists / games).toFixed(1),
      spg: (totals.steals / games).toFixed(1),
      bpg: (totals.blocks / games).toFixed(1),
      tpg: (totals.turnovers / games).toFixed(1),
      fgPct: totals.fga > 0 ? ((totals.fgm / totals.fga) * 100).toFixed(1) : '0.0',
      tpPct: totals.tpa > 0 ? ((totals.tpm / totals.tpa) * 100).toFixed(1) : '0.0',
      ftPct: totals.fta > 0 ? ((totals.ftm / totals.fta) * 100).toFixed(1) : '0.0',
      mpg: (totals.minutes / games).toFixed(1),
    };
  };

  const advancedStats = calculateAdvancedStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading player data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error || 'Player not found'}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const age = player.birth_date 
    ? new Date().getFullYear() - new Date(player.birth_date).getFullYear()
    : null;

  const displayName = player.display_name || player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/minerva" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            NBA Analytics
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{displayName}</span>
        </div>

        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Player Avatar */}
            <div className="w-28 h-28 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-primary/20">
              {displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                {player.jersey_number && (
                  <span className="text-2xl font-bold text-muted-foreground">#{player.jersey_number}</span>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-muted-foreground mb-4">
                {player.position && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {player.position}
                  </span>
                )}
                {team && (
                  <Link
                    href={`/minerva/teams/${team.team_id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {team.full_name}
                  </Link>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6">
                {player.height && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Height</div>
                    <div className="font-semibold">{player.height}</div>
                  </div>
                )}
                {player.weight && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Weight</div>
                    <div className="font-semibold">{player.weight} lbs</div>
                  </div>
                )}
                {age && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Age</div>
                    <div className="font-semibold">{age}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Season Averages Quick View */}
            {seasonAverages && (
              <div className="hidden lg:grid grid-cols-3 gap-4">
                <div className="text-center px-4">
                  <div className="text-3xl font-bold text-primary">{seasonAverages.points_avg?.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">PPG</div>
                </div>
                <div className="text-center px-4 border-x border-border">
                  <div className="text-3xl font-bold">{seasonAverages.rebounds_avg?.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">RPG</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-3xl font-bold">{seasonAverages.assists_avg?.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">APG</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-card border border-border rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Activity className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('game-log')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'game-log'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Game Log
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'advanced'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Target className="h-4 w-4" />
            Advanced
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Season Stats */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Season Averages
              </h2>
              {seasonAverages ? (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'PPG', value: seasonAverages.points_avg?.toFixed(1), highlight: true },
                    { label: 'RPG', value: seasonAverages.rebounds_avg?.toFixed(1) },
                    { label: 'APG', value: seasonAverages.assists_avg?.toFixed(1) },
                    { label: 'SPG', value: seasonAverages.steals_avg?.toFixed(1) },
                    { label: 'BPG', value: seasonAverages.blocks_avg?.toFixed(1) },
                    { label: 'MPG', value: seasonAverages.minutes_avg?.toFixed(1) },
                    { label: 'FG%', value: `${seasonAverages.fg_pct?.toFixed(1)}%` },
                    { label: '3P%', value: `${seasonAverages.three_pt_pct?.toFixed(1)}%` },
                    { label: 'FT%', value: `${seasonAverages.ft_pct?.toFixed(1)}%` },
                  ].map(stat => (
                    <div key={stat.label} className={`p-4 rounded-lg ${stat.highlight ? 'bg-primary/10' : 'bg-muted/50'}`}>
                      <div className={`text-2xl font-bold ${stat.highlight ? 'text-primary' : ''}`}>
                        {stat.value || '-'}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No season statistics available
                </div>
              )}
            </div>

            {/* Recent Performance */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Games
              </h2>
              {recentStats.length > 0 ? (
                <div className="space-y-3">
                  {recentStats.slice(0, 5).map((stat, idx) => {
                    // Format date
                    const gameDate = stat.game_date 
                      ? new Date(stat.game_date + 'T00:00:00').toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : null;
                    
                    // Format opponent
                    const opponent = stat.opponent_abbr 
                      ? `${stat.is_home ? 'vs' : '@'} ${stat.opponent_abbr}`
                      : null;
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-3">
                          {stat.result && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              stat.result === 'W' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            }`}>
                              {stat.result}
                            </span>
                          )}
                          <div>
                            <div className="font-medium">{opponent || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{gameDate || 'Unknown date'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-bold text-lg text-primary">{extractNum(stat.points)} PTS</span>
                          <span>{extractNum(stat.rebounds)} REB</span>
                          <span>{extractNum(stat.assists)} AST</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent games available
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'game-log' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">Game Log ({recentStats.length} games)</h2>
            </div>
            {recentStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Opponent</th>
                      <th className="px-4 py-3 text-center font-semibold">Result</th>
                      <th className="px-4 py-3 text-center font-semibold">MIN</th>
                      <th className="px-4 py-3 text-center font-semibold">PTS</th>
                      <th className="px-4 py-3 text-center font-semibold">REB</th>
                      <th className="px-4 py-3 text-center font-semibold">AST</th>
                      <th className="px-4 py-3 text-center font-semibold">STL</th>
                      <th className="px-4 py-3 text-center font-semibold">BLK</th>
                      <th className="px-4 py-3 text-center font-semibold">FG</th>
                      <th className="px-4 py-3 text-center font-semibold">3P</th>
                      <th className="px-4 py-3 text-center font-semibold">FT</th>
                      <th className="px-4 py-3 text-center font-semibold">+/-</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentStats.map((stat, idx) => {
                      // Extract values using helper
                      const mins = extractNum(stat.minutes_played);
                      const plusMinus = extractNum(stat.plus_minus);
                      const points = extractNum(stat.points);
                      const rebounds = extractNum(stat.rebounds);
                      const assists = extractNum(stat.assists);
                      const steals = extractNum(stat.steals);
                      const blocks = extractNum(stat.blocks);
                      const fgm = extractNum(stat.field_goals_made);
                      const fga = extractNum(stat.field_goals_attempted);
                      const tpm = extractNum(stat.three_pointers_made);
                      const tpa = extractNum(stat.three_pointers_attempted);
                      const ftm = extractNum(stat.free_throws_made);
                      const fta = extractNum(stat.free_throws_attempted);
                      
                      // Format date
                      const gameDate = stat.game_date 
                        ? new Date(stat.game_date + 'T00:00:00').toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : 'Unknown';
                      
                      // Format opponent with home/away indicator
                      const opponent = stat.opponent_abbr 
                        ? `${stat.is_home ? 'vs' : '@'} ${stat.opponent_abbr}`
                        : 'Unknown';
                      
                      // Format result with score
                      const homeScore = extractNum(stat.home_score);
                      const awayScore = extractNum(stat.away_score);
                      const resultDisplay = stat.result 
                        ? `${stat.result} ${stat.is_home ? homeScore : awayScore}-${stat.is_home ? awayScore : homeScore}`
                        : '-';

                      return (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-muted-foreground">{gameDate}</td>
                          <td className="px-4 py-3 font-medium">{opponent}</td>
                          <td className={`px-4 py-3 text-center font-semibold ${
                            stat.result === 'W' ? 'text-green-500' : stat.result === 'L' ? 'text-red-500' : ''
                          }`}>
                            {resultDisplay}
                          </td>
                          <td className="px-4 py-3 text-center">{typeof mins === 'number' ? mins.toFixed(0) : mins}</td>
                          <td className="px-4 py-3 text-center font-bold text-primary">{points}</td>
                          <td className="px-4 py-3 text-center">{rebounds}</td>
                          <td className="px-4 py-3 text-center">{assists}</td>
                          <td className="px-4 py-3 text-center">{steals}</td>
                          <td className="px-4 py-3 text-center">{blocks}</td>
                          <td className="px-4 py-3 text-center">{fgm}-{fga}</td>
                          <td className="px-4 py-3 text-center">{tpm}-{tpa}</td>
                          <td className="px-4 py-3 text-center">{ftm}-{fta}</td>
                          <td className={`px-4 py-3 text-center font-semibold ${
                            plusMinus > 0 ? 'text-green-500' : plusMinus < 0 ? 'text-red-500' : ''
                          }`}>
                            {plusMinus > 0 ? '+' : ''}{plusMinus}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No game log available
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {advancedStats ? (
              <>
                {/* Efficiency Metrics */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Efficiency Metrics
                    <span className="text-sm font-normal text-muted-foreground">(Last {advancedStats.games} games)</span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                      <div className="text-3xl font-bold text-primary">{advancedStats.ts}%</div>
                      <div className="text-sm text-muted-foreground mt-1">True Shooting %</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Measures scoring efficiency
                      </div>
                    </div>
                    <div className="p-5 bg-muted/50 rounded-xl">
                      <div className="text-3xl font-bold">{advancedStats.efg}%</div>
                      <div className="text-sm text-muted-foreground mt-1">Effective FG%</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Adjusts for 3-point value
                      </div>
                    </div>
                    <div className="p-5 bg-muted/50 rounded-xl">
                      <div className="text-3xl font-bold">{advancedStats.astToRatio}</div>
                      <div className="text-sm text-muted-foreground mt-1">AST/TO Ratio</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Ball security measure
                      </div>
                    </div>
                    <div className="p-5 bg-muted/50 rounded-xl">
                      <div className="text-3xl font-bold">{advancedStats.stocks}</div>
                      <div className="text-sm text-muted-foreground mt-1">Stocks/Game</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Steals + Blocks
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shooting Breakdown */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6">Shooting Breakdown</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Field Goals</span>
                        <span className="font-bold">{advancedStats.fgPct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, parseFloat(advancedStats.fgPct))}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">3-Pointers</span>
                        <span className="font-bold">{advancedStats.tpPct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, parseFloat(advancedStats.tpPct))}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Free Throws</span>
                        <span className="font-bold">{advancedStats.ftPct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, parseFloat(advancedStats.ftPct))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per Game Averages */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6">Per Game Averages (Last {advancedStats.games} games)</h2>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {[
                      { label: 'PPG', value: advancedStats.ppg },
                      { label: 'RPG', value: advancedStats.rpg },
                      { label: 'APG', value: advancedStats.apg },
                      { label: 'SPG', value: advancedStats.spg },
                      { label: 'BPG', value: advancedStats.bpg },
                      { label: 'MPG', value: advancedStats.mpg },
                    ].map(stat => (
                      <div key={stat.label} className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="text-center py-12">
                  <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Advanced Stats Available</h3>
                  <p className="text-muted-foreground">
                    Advanced statistics will appear once game data is loaded
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
