'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { minervaAPI, Team } from '@/lib/minerva-api';
import { Loader2, Search, Users, ChevronRight, ArrowLeft } from 'lucide-react';
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

  // Group teams by division
  const groupByDivision = (teamList: Team[]) => {
    const divisions: Record<string, Team[]> = {};
    teamList.forEach(team => {
      const division = getDivision(team) || 'Other';
      if (!divisions[division]) divisions[division] = [];
      divisions[division].push(team);
    });
    return divisions;
  };

  const easternTeams = filteredTeams.filter(t => getConference(t) === 'Eastern');
  const westernTeams = filteredTeams.filter(t => getConference(t) === 'Western');

  const easternDivisions = groupByDivision(easternTeams);
  const westernDivisions = groupByDivision(westernTeams);

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
          <span className="text-foreground">Teams</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">NBA Teams</h1>
              <p className="text-muted-foreground">
                Browse all {teams.length} teams · View rosters and schedules
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Conference Filter */}
            <div className="flex gap-2">
              {(['all', 'Eastern', 'Western'] as const).map((conf) => (
                <button
                  key={conf}
                  onClick={() => setConferenceFilter(conf)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    conferenceFilter === conf
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-background border border-border hover:bg-muted'
                  }`}
                >
                  {conf === 'all' ? 'All Teams' : `${conf} Conference`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading teams...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Eastern Conference */}
            {(conferenceFilter === 'all' || conferenceFilter === 'Eastern') && Object.keys(easternDivisions).length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <h2 className="text-xl font-bold">Eastern Conference</h2>
                  <span className="text-sm text-muted-foreground">({easternTeams.length} teams)</span>
                </div>

                {Object.entries(easternDivisions).sort().map(([division, divTeams]) => (
                  <div key={division} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-muted/50 border-b border-border">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        {division} Division
                      </h3>
                    </div>
                    <div className="divide-y divide-border">
                      {divTeams.map(team => (
                        <Link
                          key={team.team_id}
                          href={`/minerva/teams/${team.team_id}`}
                          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <span className="font-bold text-primary">{team.abbreviation}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold group-hover:text-primary transition-colors">
                                {team.full_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {getCity(team)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Western Conference */}
            {(conferenceFilter === 'all' || conferenceFilter === 'Western') && Object.keys(westernDivisions).length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <h2 className="text-xl font-bold">Western Conference</h2>
                  <span className="text-sm text-muted-foreground">({westernTeams.length} teams)</span>
                </div>

                {Object.entries(westernDivisions).sort().map(([division, divTeams]) => (
                  <div key={division} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-muted/50 border-b border-border">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        {division} Division
                      </h3>
                    </div>
                    <div className="divide-y divide-border">
                      {divTeams.map(team => (
                        <Link
                          key={team.team_id}
                          href={`/minerva/teams/${team.team_id}`}
                          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <span className="font-bold text-primary">{team.abbreviation}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold group-hover:text-primary transition-colors">
                                {team.full_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {getCity(team)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredTeams.length === 0 && (
          <div className="text-center py-20 bg-card border border-border rounded-xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearchQuery(''); setConferenceFilter('all'); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
