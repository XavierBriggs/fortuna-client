'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useLiveGames } from '@/hooks/useLiveGames';
import { LiveGameCard } from '@/components/minerva/live-games/LiveGameCard';
import { BoxScoreModal } from '@/components/minerva/live-games/BoxScoreModal';
import { minervaAPI, BackfillRequest, BackfillStatus, Game } from '@/lib/minerva-api';
import { RefreshCw, Calendar, Database, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function MinervaPage() {
  const { liveGames, loading, error, wsConnected, refetchLiveGames } = useLiveGames();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [showBoxScore, setShowBoxScore] = useState(false);
  
  // Historical games
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [historicalGames, setHistoricalGames] = useState<Game[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  
  // Backfill
  const [backfillStatus, setBackfillStatus] = useState<BackfillStatus | null>(null);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [showBackfill, setShowBackfill] = useState(false);

  const liveNow = liveGames.filter(g => g.game_status === 'in_progress' || g.game_status === 'Live');
  const upcoming = liveGames.filter(g => g.game_status === 'scheduled' || g.game_status === 'Scheduled');
  const final = liveGames.filter(g => g.game_status === 'final' || g.game_status === 'Final');

  useEffect(() => {
    if (showBackfill) {
      fetchBackfillStatus();
      const interval = setInterval(fetchBackfillStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [showBackfill]);

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
        season_id: parseInt(seasonId.replace('-', '')),
      };
      await minervaAPI.triggerBackfill(request);
      setTimeout(() => {
        fetchBackfillStatus();
        refetchLiveGames();
      }, 2000);
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

  const handleViewDetails = (gameId: string) => {
    setSelectedGameId(gameId);
    setShowBoxScore(true);
  };

  const isBackfillRunning = backfillStatus?.status === 'running';

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

        {/* Data Management Section */}
        <div className="bg-card border border-border rounded-lg mb-8">
          <button
            onClick={() => setShowBackfill(!showBackfill)}
            className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div className="text-left">
                <h2 className="text-lg font-semibold">Data Management</h2>
                <p className="text-sm text-muted-foreground">Load historical seasons and manage data backfill</p>
              </div>
            </div>
            <span className="text-2xl text-muted-foreground">{showBackfill ? '−' : '+'}</span>
          </button>

          {showBackfill && (
            <div className="border-t border-border p-6 space-y-4">
              {/* Status Banner */}
              {backfillStatus && (
                <div className={`rounded-lg p-4 border ${
                  backfillStatus.status === 'running' 
                    ? 'bg-blue-500/10 border-blue-500/20' 
                    : backfillStatus.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/20'
                    : backfillStatus.status === 'error'
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-muted border-border'
                }`}>
                  <div className="flex items-center gap-3">
                    {backfillStatus.status === 'running' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                    {backfillStatus.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {backfillStatus.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    <div className="flex-1">
                      <div className="font-semibold capitalize">{backfillStatus.status}</div>
                      <div className="text-sm text-muted-foreground">{backfillStatus.message}</div>
                    </div>
                  </div>
                  {backfillStatus.progress && backfillStatus.total && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{Math.round((backfillStatus.progress / backfillStatus.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(backfillStatus.progress / backfillStatus.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Load Buttons */}
              <div>
                <label className="block text-sm font-medium mb-3">Load Season Data</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['2024-25', '2023-24', '2022-23', '2021-22'].map(season => (
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

        {/* Historical Games Lookup */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Historical Games</h2>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg"
              />
            </div>
            <button
              onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
            >
              Today
            </button>
          </div>

          {loadingHistorical ? (
            <div className="mt-4 text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading games...
            </div>
          ) : historicalGames.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historicalGames.map(game => (
                <div
                  key={game.game_id}
                  className="p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(game.game_id)}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {game.game_status}
                    </span>
                    {game.period && <span className="text-xs text-muted-foreground">Q{game.period}</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Team {game.away_team_id}</span>
                      <span className="text-xl font-bold">{game.away_score ?? '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Team {game.home_team_id}</span>
                      <span className="text-xl font-bold">{game.home_score ?? '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedDate ? (
            <div className="mt-4 text-center py-8">
              <p className="text-muted-foreground">No games found for this date</p>
              <button
                onClick={() => setShowBackfill(true)}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Load historical data
              </button>
            </div>
          ) : null}
        </div>

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
                    <LiveGameCard key={game.game_id} game={game} onViewDetails={handleViewDetails} />
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
                    <LiveGameCard key={game.game_id} game={game} onViewDetails={handleViewDetails} />
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
                    <LiveGameCard key={game.game_id} game={game} onViewDetails={handleViewDetails} />
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
                  onClick={() => setShowBackfill(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  Load Historical Data
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Box Score Modal */}
      <BoxScoreModal
        gameId={selectedGameId}
        isOpen={showBoxScore}
        onClose={() => {
          setShowBoxScore(false);
          setSelectedGameId(null);
        }}
      />
    </div>
  );
}
