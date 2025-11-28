'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useLiveGames } from '@/hooks/useLiveGames';
import { LiveGameCard } from '@/components/minerva/live-games/LiveGameCard';
import { PlayerSearch } from '@/components/minerva/PlayerSearch';
import { PlayerStatsLookup } from '@/components/minerva/PlayerStatsLookup';
import { minervaAPI, BackfillRequest, BackfillStatus, Game, Team } from '@/lib/minerva-api';
import { 
  RefreshCw, Calendar, Database, CheckCircle2, Loader2, AlertCircle, 
  History, BarChart3, Activity, Search, Users, TrendingUp, Clock,
  ChevronRight, Zap
} from 'lucide-react';
import Link from 'next/link';

// Simple date range component for backfill
function DateRangeBackfill({ onSubmit, disabled }: { 
  onSubmit: (start: string, end: string) => void; 
  disabled: boolean;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Quick presets
  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 14 days', days: 14 },
    { label: 'Last 30 days', days: 30 },
  ];
  
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };
  
  const handleSubmit = () => {
    if (startDate && endDate) {
      onSubmit(startDate, endDate);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset.days)}
            disabled={disabled}
            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg disabled:opacity-50 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {/* Custom range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
        </div>
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={disabled || !startDate || !endDate}
        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        Load Date Range
      </button>
    </div>
  );
}

export default function MinervaPage() {
  const { liveGames, loading, error, wsConnected, refetchLiveGames } = useLiveGames();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lookup' | 'data'>('dashboard');
  
  // Teams for quick links
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  
  // Historical games
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [historicalGames, setHistoricalGames] = useState<Game[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  
  // Backfill
  const [backfillStatus, setBackfillStatus] = useState<BackfillStatus | null>(null);
  const [backfillLoading, setBackfillLoading] = useState(false);

  // Categorize games
  const liveNow = liveGames.filter(g => g.game_status === 'in_progress' || g.status === 'in_progress');
  const upcoming = liveGames.filter(g => g.game_status === 'scheduled' || g.status === 'scheduled');
  const final = liveGames.filter(g => g.game_status === 'final' || g.status === 'final');

  // Load teams on mount
  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (activeTab === 'data') {
      fetchBackfillStatus();
      const interval = setInterval(fetchBackfillStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      const data = await minervaAPI.getTeams();
      setTeams(data);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchBackfillStatus = async () => {
    try {
      const status = await minervaAPI.getBackfillStatus();
      setBackfillStatus(status);
    } catch (err) {
      console.error('Failed to fetch backfill status:', err);
    }
  };

  const triggerBackfill = async (seasonId: string) => {
    try {
      setBackfillLoading(true);
      const request: BackfillRequest = {
        sport: 'basketball_nba',
        season_id: seasonId,
      };
      await minervaAPI.triggerBackfill(request);
      await fetchBackfillStatus();
      refetchLiveGames();
    } catch (err) {
      console.error('Failed to trigger backfill:', err);
    } finally {
      setBackfillLoading(false);
    }
  };

  const loadHistoricalGames = async (date: string) => {
    try {
      setLoadingHistorical(true);
      const games = await minervaAPI.getGamesByDate(date);
      setHistoricalGames(games);
    } catch (err) {
      console.error('Failed to load historical games:', err);
    } finally {
      setLoadingHistorical(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadHistoricalGames(date);
  };

  const activeJob = backfillStatus?.active_job;
  const isBackfillRunning = activeJob?.status === 'running';
  const progressPct =
    activeJob && activeJob.progress_total > 0
      ? Math.min(100, Math.round((activeJob.progress_current / activeJob.progress_total) * 100))
      : null;

  // Get conference teams - database uses "East"/"West" not "Eastern"/"Western"
  const easternTeams = teams.filter(t => {
    const conf = typeof t.conference === 'string' ? t.conference : t.conference?.String;
    return conf === 'East' || conf === 'Eastern';
  }).slice(0, 5);
  
  const westernTeams = teams.filter(t => {
    const conf = typeof t.conference === 'string' ? t.conference : t.conference?.String;
    return conf === 'West' || conf === 'Western';
  }).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-3xl">🏀</span>
              </div>
              {wsConnected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">NBA Analytics</h1>
              <p className="text-muted-foreground">
                Live scores, player stats, and game insights
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              wsConnected 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">{wsConnected ? 'Live' : 'Offline'}</span>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={refetchLiveGames}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all font-medium"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 hover:border-red-500/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{liveNow.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Live Now</div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{upcoming.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Upcoming</div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 hover:border-gray-500/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{final.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Completed</div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teams.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Teams</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-card border border-border rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Activity className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('lookup')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'lookup'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Search className="h-4 w-4" />
            Player Lookup
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'data'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Database className="h-4 w-4" />
            Data
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State */}
              {loading && liveGames.length === 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-[200px] rounded-xl border border-border bg-card animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Live Games - Hero Section */}
                  {liveNow.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="relative">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                        </div>
                        <h2 className="text-xl font-bold text-red-400">Live Now</h2>
                        <span className="text-sm text-muted-foreground bg-red-500/10 px-2 py-0.5 rounded-full">
                          {liveNow.length} {liveNow.length === 1 ? 'game' : 'games'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {liveNow.map(game => (
                          <LiveGameCard key={game.game_id} game={game} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Games */}
                  {upcoming.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <h2 className="text-xl font-bold">Upcoming Games</h2>
                        <span className="text-sm text-muted-foreground bg-blue-500/10 px-2 py-0.5 rounded-full">
                          {upcoming.length} {upcoming.length === 1 ? 'game' : 'games'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {upcoming.map(game => (
                          <LiveGameCard key={game.game_id} game={game} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final Games */}
                  {final.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="h-5 w-5 text-gray-400" />
                        <h2 className="text-xl font-bold">Completed</h2>
                        <span className="text-sm text-muted-foreground bg-gray-500/10 px-2 py-0.5 rounded-full">
                          {final.length} {final.length === 1 ? 'game' : 'games'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {final.map(game => (
                          <LiveGameCard key={game.game_id} game={game} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Games Today */}
                  {!loading && liveGames.length === 0 && (
                    <div className="text-center py-16 bg-card border border-border rounded-xl">
                      <div className="text-6xl mb-4">🏀</div>
                      <h3 className="text-xl font-semibold mb-2">No games scheduled today</h3>
                      <p className="text-muted-foreground mb-6">Check back later or browse historical games</p>
                      <button
                        onClick={() => setActiveTab('data')}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                      >
                        Load Historical Data
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Historical Games Section */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">Browse by Date</h2>
                  </div>
                  {historicalGames.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {historicalGames.length} game{historicalGames.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Date Navigation */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  {/* Previous Day */}
                  <button
                    onClick={() => {
                      const d = new Date(selectedDate);
                      d.setDate(d.getDate() - 1);
                      handleDateChange(d.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    title="Previous day"
                  >
                    ←
                  </button>
                  
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="flex-1 min-w-[160px] px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  
                  {/* Next Day */}
                  <button
                    onClick={() => {
                      const d = new Date(selectedDate);
                      d.setDate(d.getDate() + 1);
                      handleDateChange(d.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    title="Next day"
                  >
                    →
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        handleDateChange(d.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>

                {/* Display current date nicely */}
                {selectedDate && (
                  <div className="text-center mb-4">
                    <span className="text-lg font-semibold">
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {loadingHistorical ? (
                  <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading games...</p>
                  </div>
                ) : historicalGames.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {historicalGames.map(game => (
                      <LiveGameCard key={game.game_id} game={game} />
                    ))}
                  </div>
                ) : selectedDate ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="font-medium">No games found for this date</p>
                    <p className="text-sm mt-1">Try loading historical data in the Data tab, or navigate to a different date</p>
                    <button
                      onClick={() => setActiveTab('data')}
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Load Historical Data
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Quick Player Search */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Quick Search</h3>
                </div>
                <PlayerSearch />
              </div>

              {/* Quick Team Links */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-bold">Teams</h3>
                  </div>
                  <Link 
                    href="/minerva/teams"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                {loadingTeams ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Eastern Conference */}
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Eastern
                      </div>
                      <div className="space-y-1">
                        {easternTeams.map(team => (
                          <Link
                            key={team.team_id}
                            href={`/minerva/teams/${team.team_id}`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                          >
                            <span className="font-mono text-xs text-muted-foreground w-8">{team.abbreviation}</span>
                            <span className="truncate">{team.full_name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Western Conference */}
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Western
                      </div>
                      <div className="space-y-1">
                        {westernTeams.map(team => (
                          <Link
                            key={team.team_id}
                            href={`/minerva/teams/${team.team_id}`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                          >
                            <span className="font-mono text-xs text-muted-foreground w-8">{team.abbreviation}</span>
                            <span className="truncate">{team.full_name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Quick Actions</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('lookup')}
                    className="w-full text-left px-4 py-3 bg-background/50 rounded-lg hover:bg-background transition-colors text-sm flex items-center gap-3"
                  >
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Player Stats Lookup</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('data')}
                    className="w-full text-left px-4 py-3 bg-background/50 rounded-lg hover:bg-background transition-colors text-sm flex items-center gap-3"
                  >
                    <Database className="h-4 w-4 text-primary" />
                    <span>Load Historical Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player Lookup Tab */}
        {activeTab === 'lookup' && (
          <div>
            <PlayerStatsLookup />
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="max-w-4xl space-y-6">
            {/* Status Banner */}
            {backfillStatus && (
              <div className={`rounded-xl p-5 border ${
                activeJob?.status === 'running' 
                  ? 'bg-blue-500/10 border-blue-500/20' 
                  : activeJob?.status === 'completed'
                  ? 'bg-green-500/10 border-green-500/20'
                  : activeJob?.status === 'failed'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-card border-border'
              }`}>
                <div className="flex items-center gap-4">
                  {activeJob?.status === 'running' && <Loader2 className="h-6 w-6 animate-spin text-blue-400" />}
                  {activeJob?.status === 'completed' && <CheckCircle2 className="h-6 w-6 text-green-400" />}
                  {activeJob?.status === 'failed' && <AlertCircle className="h-6 w-6 text-red-400" />}
                  {!activeJob && <Database className="h-6 w-6 text-muted-foreground" />}
                  <div className="flex-1">
                    <div className="font-semibold capitalize">{activeJob?.status || 'Idle'}</div>
                    <div className="text-sm text-muted-foreground">{activeJob?.status_message || 'No active jobs'}</div>
                    {activeJob?.season_id && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Season {activeJob.season_id}
                      </div>
                    )}
                  </div>
                </div>
                {progressPct !== null && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* Quick Load Buttons */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4">Load Season Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Backfill complete season data from ESPN. This includes all games, player stats, and box scores.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['2025-26', '2024-25', '2023-24', '2022-23'].map(season => (
                  <button
                    key={season}
                    onClick={() => triggerBackfill(season)}
                    disabled={backfillLoading || isBackfillRunning}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Date Range Picker */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4">Load Date Range</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Load games for a specific date range. Great for loading recent weeks or specific periods.
              </p>
              <DateRangeBackfill onSubmit={(start, end) => {
                minervaAPI.triggerBackfill({
                  sport: 'basketball_nba',
                  start_date: start,
                  end_date: end,
                }).then(() => {
                  fetchBackfillStatus();
                }).catch(console.error);
              }} disabled={backfillLoading || isBackfillRunning} />
            </div>

            {/* History */}
            {backfillStatus?.history?.length ? (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-bold">Recent Jobs</h3>
                </div>
                <div className="space-y-2">
                  {backfillStatus.history.slice(0, 5).map((job) => {
                    const pct =
                      job.progress_total > 0
                        ? Math.min(100, Math.round((job.progress_current / job.progress_total) * 100))
                        : null;
                    return (
                      <div
                        key={job.job_id}
                        className="flex items-center justify-between border border-border rounded-lg p-4 bg-muted/30"
                      >
                        <div>
                          <div className="font-medium">
                            {job.job_type} · {job.season_id || 'Custom Range'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {job.status_message || job.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            job.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                            job.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {job.status}
                          </span>
                          {pct !== null && (
                            <div className="w-20 bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  job.status === 'completed' ? 'bg-green-500' :
                                  job.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">About Data Loading</p>
                <p className="text-blue-400/80">
                  Loads complete season data from ESPN including all games and player statistics. 
                  This process takes 2-5 minutes per season. Only one operation can run at a time.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
