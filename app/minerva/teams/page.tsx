'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { minervaAPI, Team } from '@/lib/minerva-api';
import { Loader2, Search, Users } from 'lucide-react';
import Link from 'next/link';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [conferenceFilter, setConferenceFilter] = useState<'all' | 'Eastern' | 'Western'>('all');

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    filterTeams();
  }, [teams, searchQuery, conferenceFilter]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await minervaAPI.getTeams();
      setTeams(data);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTeams = () => {
    let filtered = teams;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(team => 
        team.full_name.toLowerCase().includes(query) ||
        team.abbreviation.toLowerCase().includes(query) ||
        (typeof team.city === 'string' ? team.city.toLowerCase().includes(query) : false)
      );
    }

    // Filter by conference
    if (conferenceFilter !== 'all') {
      filtered = filtered.filter(team => {
        const conf = typeof team.conference === 'string' ? team.conference : team.conference?.String;
        return conf === conferenceFilter;
      });
    }

    setFilteredTeams(filtered);
  };

  const getConference = (team: Team): string => {
    if (typeof team.conference === 'string') return team.conference;
    if (team.conference && 'String' in team.conference && team.conference.Valid) {
      return team.conference.String;
    }
    return 'Unknown';
  };

  const getDivision = (team: Team): string => {
    if (typeof team.division === 'string') return team.division;
    if (team.division && 'String' in team.division && team.division.Valid) {
      return team.division.String;
    }
    return '';
  };

  const getCity = (team: Team): string => {
    if (typeof team.city === 'string') return team.city;
    if (team.city && 'String' in team.city && team.city.Valid) {
      return team.city.String;
    }
    return '';
  };

  // Group teams by conference
  const easternTeams = filteredTeams.filter(t => getConference(t) === 'Eastern');
  const westernTeams = filteredTeams.filter(t => getConference(t) === 'Western');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">NBA Teams</h1>
              <p className="text-muted-foreground text-lg">
                Browse all {teams.length} teams
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Conference Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setConferenceFilter('all')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  conferenceFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border hover:bg-muted'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setConferenceFilter('Eastern')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  conferenceFilter === 'Eastern'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border hover:bg-muted'
                }`}
              >
                Eastern
              </button>
              <button
                onClick={() => setConferenceFilter('Western')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  conferenceFilter === 'Western'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border hover:bg-muted'
                }`}
              >
                Western
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading teams...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Eastern Conference */}
            {(conferenceFilter === 'all' || conferenceFilter === 'Eastern') && easternTeams.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-blue-500">🏀</span>
                  Eastern Conference
                  <span className="text-sm text-muted-foreground font-normal">({easternTeams.length} teams)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {easternTeams.map(team => (
                    <Link
                      key={team.team_id}
                      href={`/minerva/teams/${team.team_id}`}
                      className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {team.full_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getCity(team)} • {team.abbreviation}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                          {getDivision(team) || 'NBA'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Western Conference */}
            {(conferenceFilter === 'all' || conferenceFilter === 'Western') && westernTeams.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-red-500">🏀</span>
                  Western Conference
                  <span className="text-sm text-muted-foreground font-normal">({westernTeams.length} teams)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {westernTeams.map(team => (
                    <Link
                      key={team.team_id}
                      href={`/minerva/teams/${team.team_id}`}
                      className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {team.full_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getCity(team)} • {team.abbreviation}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                          {getDivision(team) || 'NBA'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredTeams.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No teams found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



