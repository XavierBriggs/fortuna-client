'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { minervaAPI, Team, Player, Game } from '@/lib/minerva-api';
import { ArrowLeft, Users, Calendar, BarChart3, ChevronRight, MapPin, Trophy, Activity } from 'lucide-react';
import Link from 'next/link';

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

  const getConference = (t: Team): string => {
    if (typeof t.conference === 'string') return t.conference;
    if (t.conference && 'String' in t.conference && t.conference.Valid) return t.conference.String;
    return '';
  };

  const getDivision = (t: Team): string => {
    if (typeof t.division === 'string') return t.division;
    if (t.division && 'String' in t.division && t.division.Valid) return t.division.String;
    return '';
  };

  const getCity = (t: Team): string => {
    if (typeof t.city === 'string') return t.city;
    if (t.city && 'String' in t.city && t.city.Valid) return t.city.String;
    return '';
  };

  const getVenue = (t: Team): string => {
    if (typeof t.venue_name === 'string') return t.venue_name;
    if (t.venue_name && 'String' in t.venue_name && t.venue_name.Valid) return t.venue_name.String;
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
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
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-20 bg-card border border-border rounded-xl">
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
  
  // Calculate record from recent games
  const wins = recentGames.filter(g => {
    const isHome = g.home_team_id === parseInt(teamId);
    const teamScore = isHome ? (typeof g.home_score === 'number' ? g.home_score : 0) : (typeof g.away_score === 'number' ? g.away_score : 0);
    const oppScore = isHome ? (typeof g.away_score === 'number' ? g.away_score : 0) : (typeof g.home_score === 'number' ? g.home_score : 0);
    return teamScore > oppScore;
  }).length;
  const losses = recentGames.length - wins;

  const conference = getConference(team);
  const isEastern = conference === 'Eastern';

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
          <Link href="/minerva/teams" className="hover:text-foreground transition-colors">
            Teams
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{team.full_name}</span>
        </div>

        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Team Logo/Abbreviation */}
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl ${
              isEastern 
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/20' 
                : 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/20'
            }`}>
              {team.abbreviation}
            </div>

            {/* Team Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{team.full_name}</h1>
              
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isEastern ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {conference} Conference
                </span>
                {getDivision(team) && (
                  <span className="px-3 py-1 bg-muted rounded-full text-sm">
                    {getDivision(team)} Division
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                {getCity(team) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{getCity(team)}</span>
                  </div>
                )}
                {getVenue(team) && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>{getVenue(team)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{wins}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{losses}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Losses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{roster.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Players</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-card border border-border rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'roster'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Users className="h-4 w-4" />
            Roster
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'schedule'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'stats'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Stats
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'roster' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">Current Roster ({roster.length} players)</h2>
            </div>
            {roster.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No roster data available. Try loading historical data first.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">Player</th>
                      <th className="px-4 py-3 text-left font-semibold">Position</th>
                      <th className="px-4 py-3 text-left font-semibold">Height</th>
                      <th className="px-4 py-3 text-left font-semibold">Weight</th>
                      <th className="px-4 py-3 text-left font-semibold">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {roster.map((player) => {
                      const age = player.birth_date 
                        ? new Date().getFullYear() - new Date(player.birth_date).getFullYear()
                        : null;

                      return (
                        <tr 
                          key={player.player_id}
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => router.push(`/minerva/players/${player.player_id}`)}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-primary">{player.jersey_number || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold hover:text-primary transition-colors">
                              {player.display_name || player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim()}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {player.position && (
                              <span className="px-2 py-1 bg-muted rounded text-sm">{player.position}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{player.height || '-'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{player.weight ? `${player.weight} lbs` : '-'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{age || '-'}</td>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Games */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                <h2 className="font-bold">Upcoming Games ({upcomingGames.length})</h2>
              </div>
              {upcomingGames.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No upcoming games scheduled
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {upcomingGames.slice(0, 10).map(game => {
                    const isHome = game.home_team_id === parseInt(teamId);
                    const opponent = isHome ? game.away_team : game.home_team;
                    
                    return (
                      <div
                        key={game.game_id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground w-16">
                            {new Date(game.game_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isHome ? 'vs' : '@'}</span>
                            {' '}
                            <span className="font-semibold">
                              {opponent?.abbreviation || `Team ${isHome ? game.away_team_id : game.home_team_id}`}
                            </span>
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
              )}
            </div>

            {/* Recent Games */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <h2 className="font-bold">Recent Results ({recentGames.length})</h2>
              </div>
              {recentGames.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No recent games. Try loading historical data.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentGames.map(game => {
                    const isHome = game.home_team_id === parseInt(teamId);
                    const opponent = isHome ? game.away_team : game.home_team;
                    const teamScore = isHome 
                      ? (typeof game.home_score === 'number' ? game.home_score : 0) 
                      : (typeof game.away_score === 'number' ? game.away_score : 0);
                    const oppScore = isHome 
                      ? (typeof game.away_score === 'number' ? game.away_score : 0) 
                      : (typeof game.home_score === 'number' ? game.home_score : 0);
                    const won = teamScore > oppScore;
                    
                    return (
                      <div
                        key={game.game_id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {won ? 'W' : 'L'}
                          </div>
                          <div className="text-sm text-muted-foreground w-12">
                            {new Date(game.game_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isHome ? 'vs' : '@'}</span>
                            {' '}
                            <span className="font-semibold">
                              {opponent?.abbreviation || `Team ${isHome ? game.away_team_id : game.home_team_id}`}
                            </span>
                          </div>
                        </div>
                        <div className="font-bold font-mono">
                          {teamScore} - {oppScore}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Team Statistics Coming Soon</h3>
              <p className="text-muted-foreground">
                Advanced team metrics, offensive/defensive ratings, and analytics will be available here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
