'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { minervaAPI, Team, Player, Game } from '@/lib/minerva-api';
import { ArrowLeft, Users, Calendar, TrendingUp, BarChart3 } from 'lucide-react';

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule' | 'stats'>('roster');

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load team info, roster, and schedule in parallel
      const [teamData, rosterData, scheduleData] = await Promise.all([
        minervaAPI.getTeams().then(teams => teams.find(t => t.team_id === parseInt(teamId))),
        minervaAPI.getTeamRoster(parseInt(teamId)),
        minervaAPI.getTeamSchedule(parseInt(teamId), '2025-26')
      ]);

      setTeam(teamData || null);
      setRoster(rosterData);
      setSchedule(scheduleData);
    } catch (err) {
      console.error('Failed to load team data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team data');
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
            <p className="mt-4 text-muted-foreground">Loading team data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8">
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error || 'Team not found'}</p>
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

  const upcomingGames = schedule.filter(g => g.status === 'scheduled' || g.game_status === 'scheduled');
  const recentGames = schedule.filter(g => g.status === 'final' || g.game_status === 'final').slice(0, 10);

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

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center text-4xl font-bold text-white">
              {team.abbreviation}
            </div>
            <div>
              <h1 className="text-4xl font-bold">{team.full_name}</h1>
              <p className="text-muted-foreground text-lg">
                {typeof team.conference === 'string' ? team.conference : team.conference?.String} Conference {team.division && `• ${typeof team.division === 'string' ? team.division : team.division?.String} Division`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Roster Size</div>
            <div className="text-3xl font-bold">{roster.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Games Played</div>
            <div className="text-3xl font-bold">{recentGames.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Upcoming</div>
            <div className="text-3xl font-bold">{upcomingGames.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
            <div className="text-3xl font-bold">-</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card border border-border rounded-lg mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'roster'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-5 w-5" />
              Roster ({roster.length})
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'schedule'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-5 w-5" />
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'stats'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              Team Stats
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'roster' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Current Roster</h2>
            {roster.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No roster data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">Player</th>
                      <th className="px-4 py-3 text-left font-semibold">Position</th>
                      <th className="px-4 py-3 text-left font-semibold">Height</th>
                      <th className="px-4 py-3 text-left font-semibold">Weight</th>
                      <th className="px-4 py-3 text-left font-semibold">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((player, idx) => {
                      const age = player.birth_date 
                        ? new Date().getFullYear() - new Date(player.birth_date).getFullYear()
                        : null;

                      return (
                        <tr 
                          key={player.player_id}
                          className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/minerva/players/${player.player_id}`)}
                        >
                          <td className="px-4 py-3 font-semibold">{player.jersey_number || '-'}</td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-semibold">{player.first_name} {player.last_name}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{player.position || '-'}</td>
                          <td className="px-4 py-3">{player.height || '-'}</td>
                          <td className="px-4 py-3">{player.weight ? `${player.weight} lbs` : '-'}</td>
                          <td className="px-4 py-3">{age || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Upcoming Games */}
            {upcomingGames.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Upcoming Games</h2>
                <div className="space-y-3">
                  {upcomingGames.map(game => {
                    const isHome = game.home_team_id === parseInt(teamId);
                    const opponent = isHome ? game.away_team : game.home_team;
                    
                    return (
                      <div
                        key={game.game_id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => router.push(`/minerva?game=${game.game_id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">
                            {new Date(game.game_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="font-semibold">
                            {isHome ? 'vs' : '@'} {opponent?.abbreviation || `Team ${isHome ? game.away_team_id : game.home_team_id}`}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(game.game_date).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Games */}
            {recentGames.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Recent Games</h2>
                <div className="space-y-3">
                  {recentGames.map(game => {
                    const isHome = game.home_team_id === parseInt(teamId);
                    const opponent = isHome ? game.away_team : game.home_team;
                    const teamScore = isHome ? game.home_score : game.away_score;
                    const oppScore = isHome ? game.away_score : game.home_score;
                    const won = (teamScore || 0) > (oppScore || 0);
                    
                    return (
                      <div
                        key={game.game_id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => router.push(`/minerva?game=${game.game_id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            won ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}>
                            {won ? 'W' : 'L'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(game.game_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="font-semibold">
                            {isHome ? 'vs' : '@'} {opponent?.abbreviation || `Team ${isHome ? game.away_team_id : game.home_team_id}`}
                          </div>
                        </div>
                        <div className="font-semibold">
                          {typeof teamScore === 'number' ? teamScore : teamScore?.Int32 ?? '-'} - {typeof oppScore === 'number' ? oppScore : oppScore?.Int32 ?? '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Team Statistics</h2>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Team statistics coming soon</p>
              <p className="text-sm mt-2">Advanced team metrics and analytics will be available here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

