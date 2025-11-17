'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { minervaAPI, Player, PlayerStats, PlayerSeasonAverages, Team } from '@/lib/minerva-api';
import { ArrowLeft, TrendingUp, BarChart3, Activity, Award } from 'lucide-react';

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
        minervaAPI.getPlayerStats(parseInt(playerId), 10)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8">
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
        <div className="max-w-7xl mx-auto p-8">
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-start gap-6">
            {/* Player Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center text-5xl font-bold text-white">
              {player.first_name?.[0] || player.full_name?.[0] || '?'}{player.last_name?.[0] || player.full_name?.split(' ')[1]?.[0] || ''}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                {player.display_name || player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player'}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                {player.jersey_number && (
                  <span className="text-lg font-semibold">#{player.jersey_number}</span>
                )}
                {player.position && (
                  <span>{player.position}</span>
                )}
                {team && (
                  <button
                    onClick={() => router.push(`/minerva/teams/${team.team_id}`)}
                    className="text-primary hover:underline"
                  >
                    {team.full_name}
                  </button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {player.height && (
                  <div>
                    <div className="text-sm text-muted-foreground">Height</div>
                    <div className="font-semibold">{player.height}</div>
                  </div>
                )}
                {player.weight && (
                  <div>
                    <div className="text-sm text-muted-foreground">Weight</div>
                    <div className="font-semibold">{player.weight} lbs</div>
                  </div>
                )}
                {age && (
                  <div>
                    <div className="text-sm text-muted-foreground">Age</div>
                    <div className="font-semibold">{age}</div>
                  </div>
                )}
                {player.birth_date && (
                  <div>
                    <div className="text-sm text-muted-foreground">Born</div>
                    <div className="font-semibold">
                      {new Date(player.birth_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Season Averages Cards */}
        {seasonAverages && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">PPG</div>
              <div className="text-3xl font-bold">{seasonAverages.points_avg?.toFixed(1) || '0.0'}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">RPG</div>
              <div className="text-3xl font-bold">{seasonAverages.rebounds_avg?.toFixed(1) || '0.0'}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">APG</div>
              <div className="text-3xl font-bold">{seasonAverages.assists_avg?.toFixed(1) || '0.0'}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">FG%</div>
              <div className="text-3xl font-bold">{seasonAverages.fg_pct?.toFixed(1) || '0.0'}%</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">MPG</div>
              <div className="text-3xl font-bold">{seasonAverages.minutes_avg?.toFixed(1) || '0.0'}</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-card border border-border rounded-lg mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-5 w-5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('game-log')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'game-log'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              Game Log
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'advanced'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              Advanced Stats
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Season Overview</h2>
            {seasonAverages ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Points Per Game</div>
                  <div className="text-2xl font-bold">{seasonAverages.points_avg?.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Rebounds Per Game</div>
                  <div className="text-2xl font-bold">{seasonAverages.rebounds_avg?.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Assists Per Game</div>
                  <div className="text-2xl font-bold">{seasonAverages.assists_avg?.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Steals Per Game</div>
                  <div className="text-2xl font-bold">{seasonAverages.steals_avg?.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Blocks Per Game</div>
                  <div className="text-2xl font-bold">{seasonAverages.blocks_avg?.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Turnovers Per Game</div>
                  <div className="text-2xl font-bold">{seasonAverages.turnovers_avg?.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Field Goal %</div>
                  <div className="text-2xl font-bold">{seasonAverages.fg_pct?.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">3-Point %</div>
                  <div className="text-2xl font-bold">{seasonAverages.three_pt_pct?.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Free Throw %</div>
                  <div className="text-2xl font-bold">{seasonAverages.ft_pct?.toFixed(1)}%</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No season statistics available yet
              </div>
            )}
          </div>
        )}

        {activeTab === 'game-log' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Recent Games</h2>
            {recentStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold">Date</th>
                      <th className="px-3 py-3 text-center font-semibold">MIN</th>
                      <th className="px-3 py-3 text-center font-semibold">PTS</th>
                      <th className="px-3 py-3 text-center font-semibold">REB</th>
                      <th className="px-3 py-3 text-center font-semibold">AST</th>
                      <th className="px-3 py-3 text-center font-semibold">FG</th>
                      <th className="px-3 py-3 text-center font-semibold">3P</th>
                      <th className="px-3 py-3 text-center font-semibold">FT</th>
                      <th className="px-3 py-3 text-center font-semibold">+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStats.map((stat, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50">
                        <td className="px-3 py-3">Game {stat.game_id}</td>
                        <td className="px-3 py-3 text-center">{stat.minutes_played?.toFixed(0) || 0}</td>
                        <td className="px-3 py-3 text-center font-bold">{stat.points || 0}</td>
                        <td className="px-3 py-3 text-center">{stat.rebounds || 0}</td>
                        <td className="px-3 py-3 text-center">{stat.assists || 0}</td>
                        <td className="px-3 py-3 text-center">
                          {stat.field_goals_made || 0}-{stat.field_goals_attempted || 0}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {stat.three_pointers_made || 0}-{stat.three_pointers_attempted || 0}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {stat.free_throws_made || 0}-{stat.free_throws_attempted || 0}
                        </td>
                        <td className={`px-3 py-3 text-center font-semibold ${
                          (stat.plus_minus || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.plus_minus && stat.plus_minus >= 0 ? '+' : ''}{stat.plus_minus || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No game log available yet
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Advanced Statistics</h2>
            <div className="text-center py-12 text-muted-foreground">
              <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Advanced statistics coming soon</p>
              <p className="text-sm mt-2">
                PER, TS%, USG%, ORtg, DRtg, and more advanced metrics will be available here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

