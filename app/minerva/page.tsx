'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useLiveGames } from '@/hooks/useLiveGames';
import { LiveGameCard } from '@/components/minerva/live-games/LiveGameCard';
import { PlayerSearch } from '@/components/minerva/PlayerSearch';
import { PlayerStatsLookup } from '@/components/minerva/PlayerStatsLookup';
import { minervaAPI, BackfillRequest, BackfillStatus, Game } from '@/lib/minerva-api';
import { RefreshCw, Calendar, Database, CheckCircle2, Loader2, AlertCircle, History, BarChart3, Activity, Search } from 'lucide-react';

export default function MinervaPage() {
  const { liveGames, loading, error, wsConnected, refetchLiveGames } = useLiveGames();
  const [activeTab, setActiveTab] = useState<'games' | 'stats' | 'lookup' | 'data'>('games');
  
  // Historical games
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [historicalGames, setHistoricalGames] = useState<Game[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  
  // Backfill
  const [backfillStatus, setBackfillStatus] = useState<BackfillStatus | null>(null);
  const [backfillLoading, setBackfillLoading] = useState(false);

  const liveNow = liveGames.filter(g => g.game_status === 'in_progress' || g.status === 'in_progress');
  const upcoming = liveGames.filter(g => g.game_status === 'scheduled' || g.status === 'scheduled');
  const final = liveGames.filter(g => g.game_status === 'final' || g.status === 'final');

  useEffect(() => {
    if (activeTab === 'data') {
      fetchBackfillStatus();
      const interval = setInterval(fetchBackfillStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

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
  const statusLabel = activeJob?.status ?? backfillStatus?.status ?? 'idle';
  const statusMessage = activeJob?.status_message ?? backfillStatus?.message ?? 'No active jobs';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏀</span>
            <div>
              <h1 className="text-4xl font-bold">NBA Analytics</h1>
              <p className="text-muted-foreground text-lg">
                Live scores, stats, and game data powered by Minerva
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{wsConnected ? 'Live' : 'Offline'}</span>
            </div>
            <button
              onClick={refetchLiveGames}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Live Now</div>
            <div className="text-3xl font-bold text-red-500">{liveNow.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Upcoming Today</div>
            <div className="text-3xl font-bold">{upcoming.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Completed</div>
            <div className="text-3xl font-bold">{final.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Connection</div>
            <div className="text-3xl font-bold text-green-500">{wsConnected ? '✓' : '✗'}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card border border-border rounded-lg mb-6">
          <div className="flex border-b border-border overflow-x-auto">
            <button
              onClick={() => setActiveTab('games')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'games'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-5 w-5" />
              Live & Upcoming Games
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              Stats & History
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'lookup'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Search className="h-5 w-5" />
              Player Lookup
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'data'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="h-5 w-5" />
              Data Management
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'games' && (
          <div>
            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && liveGames.length === 0 ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Loading games...</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-[200px] rounded-lg border bg-card animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Live Games */}
                {liveNow.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </div>
                      <h2 className="text-2xl font-semibold text-red-500">Live Now</h2>
                      <span className="text-sm text-muted-foreground">({liveNow.length} {liveNow.length === 1 ? 'game' : 'games'})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {liveNow.map(game => (
                        <LiveGameCard key={game.game_id} game={game} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Games */}
                {upcoming.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-2xl">📅</span>
                      <h2 className="text-2xl font-semibold">Upcoming Today</h2>
                      <span className="text-sm text-muted-foreground">({upcoming.length} {upcoming.length === 1 ? 'game' : 'games'})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {upcoming.map(game => (
                        <LiveGameCard key={game.game_id} game={game} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Games */}
                {final.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-2xl">✅</span>
                      <h2 className="text-2xl font-semibold">Final Scores</h2>
                      <span className="text-sm text-muted-foreground">({final.length} {final.length === 1 ? 'game' : 'games'})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {final.map(game => (
                        <LiveGameCard key={game.game_id} game={game} />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Games */}
                {!loading && liveGames.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-8xl mb-6">🏀</div>
                    <h3 className="text-2xl font-semibold mb-3">No games scheduled today</h3>
                    <p className="text-muted-foreground text-lg mb-6">Check back later or load historical data</p>
                    <button
                      onClick={() => setActiveTab('data')}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                    >
                      Load Historical Data
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Quick Links Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Teams */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Teams</h2>
                  <span className="text-sm text-muted-foreground">Browse all NBA teams</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  View team rosters, schedules, and statistics
                </p>
                <button
                  onClick={async () => {
                    const teams = await minervaAPI.getTeams();
                    if (teams.length > 0) {
                      window.location.href = `/minerva/teams/${teams[0].team_id}`;
                    }
                  }}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  Browse Teams →
                </button>
              </div>

              {/* Players */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Players</h2>
                  <span className="text-sm text-muted-foreground">Search player stats</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  View player profiles, game logs, and advanced statistics
                </p>
                <PlayerSearch />
              </div>
            </div>

            {/* Historical Games Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Historical Games</h2>
              </div>

              <div className="flex gap-3 mb-6">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  Today
                </button>
              </div>

              {loadingHistorical ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading games...</p>
                </div>
              ) : historicalGames.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {historicalGames.map(game => (
                    <LiveGameCard key={game.game_id} game={game} />
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">No games found for this date</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try a different date or load historical data
                  </p>
                  <button
                    onClick={() => setActiveTab('data')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Load Historical Data
                  </button>
                </div>
              ) : null}
            </div>

            {/* Quick Stats Info */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
              <h3 className="font-semibold mb-2">💡 Pro Tip</h3>
              <p className="text-sm text-muted-foreground">
                Click on any game card to view detailed box scores with player statistics. 
                Click on team names to view rosters and schedules. 
                Click on player names (in box scores or rosters) to view their profiles and game logs.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'lookup' && (
          <div>
            <PlayerStatsLookup />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            {/* Status Banner */}
            {backfillStatus && (
              <div className={`rounded-lg p-4 border ${
                statusLabel === 'running' 
                  ? 'bg-blue-500/10 border-blue-500/20' 
                  : statusLabel === 'completed'
                  ? 'bg-green-500/10 border-green-500/20'
                  : statusLabel === 'failed' || statusLabel === 'error'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-muted border-border'
              }`}>
                <div className="flex items-center gap-3">
                  {statusLabel === 'running' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                  {statusLabel === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {statusLabel === 'failed' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  <div className="flex-1">
                    <div className="font-semibold capitalize">{statusLabel}</div>
                    <div className="text-sm text-muted-foreground">{statusMessage}</div>
                    {activeJob?.season_id && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Season {activeJob.season_id}
                        {activeJob.start_date && activeJob.end_date && (
                          <> · {activeJob.start_date} → {activeJob.end_date}</>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {progressPct !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {backfillStatus?.history?.length ? (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Recent Jobs</span>
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
                        className="flex flex-col md:flex-row md:items-center md:justify-between border border-border rounded-lg p-3 text-sm bg-muted/40"
                      >
                        <div>
                          <div className="font-medium">
                            {job.job_type} · {job.season_id || 'Custom Range'}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {job.status_message || job.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 md:mt-0">
                          <span className="text-xs text-muted-foreground uppercase">
                            {job.status}
                          </span>
                          {pct !== null && (
                            <div className="w-24 bg-background rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  job.status === 'completed'
                                    ? 'bg-green-500'
                                    : job.status === 'failed'
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
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

            {/* Quick Load Buttons */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="block text-sm font-medium mb-3">Load Season Data</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['2025-26', '2024-25', '2023-24', '2022-23'].map(season => (
                  <button
                    key={season}
                    onClick={() => triggerBackfill(season)}
                    disabled={backfillLoading || isBackfillRunning}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="text-sm text-blue-400">
                ℹ️ Loads complete season data from ESPN • Takes 2-5 minutes • Only one operation at a time
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
