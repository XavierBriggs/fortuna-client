'use client';

import { useState } from 'react';
import { useLiveGames } from '@/hooks/useLiveGames';
import { LiveGameCard } from '@/components/minerva/live-games/LiveGameCard';
import { BackfillControls } from '@/components/minerva/BackfillControls';
import { Calendar, Radio, Trophy, Settings2 } from 'lucide-react';
import { minervaAPI, Game } from '@/lib/minerva-api';

export default function MinervaPage() {
  const { games, loading, error, refresh, wsConnected } = useLiveGames();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [historicalGames, setHistoricalGames] = useState<Game[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [showBackfillPanel, setShowBackfillPanel] = useState(false);

  const liveGames = games.filter(g => g.game_status === 'in_progress');
  const upcomingGames = games.filter(g => g.game_status === 'scheduled');
  const finalGames = games.filter(g => g.game_status === 'final');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Radio className="h-10 w-10" />
                NBA Analytics
              </h1>
              <p className="text-blue-100 text-lg">
                Real-time scores, stats, and insights powered by Minerva
              </p>
            </div>
            <button
              onClick={() => setShowBackfillPanel(!showBackfillPanel)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all"
            >
              <Settings2 className="h-5 w-5" />
              <span className="hidden md:inline">Data Management</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                Connection
              </div>
              <div className="text-2xl font-bold">{wsConnected ? 'Live' : 'Offline'}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-blue-100 text-sm mb-1">Live Games</div>
              <div className="text-2xl font-bold">{liveGames.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-blue-100 text-sm mb-1">Upcoming</div>
              <div className="text-2xl font-bold">{upcomingGames.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-blue-100 text-sm mb-1">Completed</div>
              <div className="text-2xl font-bold">{finalGames.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Backfill Panel (collapsible) */}
            {showBackfillPanel && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Data Management
                  </h3>
                </div>
                <div className="p-6">
                  <BackfillControls onSuccess={refresh} />
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg p-4">
                <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && games.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Loading live games...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && games.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No games scheduled today
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Check historical games or backfill data to see past results
                </p>
                <button
                  onClick={() => setShowBackfillPanel(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Settings2 className="h-5 w-5" />
                  Load Historical Data
                </button>
              </div>
            )}

            {/* Live Games Section */}
            {liveGames.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Live Now
                  </h2>
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                    {liveGames.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {liveGames.map(game => (
                    <LiveGameCard key={game.game_id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Games Section */}
            {upcomingGames.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Upcoming Today
                  </h2>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                    {upcomingGames.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {upcomingGames.map(game => (
                    <LiveGameCard key={game.game_id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* Final Games Section */}
            {finalGames.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Final
                  </h2>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-full">
                    {finalGames.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {finalGames.map(game => (
                    <LiveGameCard key={game.game_id} game={game} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - Historical Games */}
          <div className="lg:w-96 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Historical Games
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {loadingHistorical ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : historicalGames.length > 0 ? (
                  <div className="space-y-3">
                    {historicalGames.map(game => (
                      <div
                        key={game.game_id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {game.game_status === 'final' ? 'FINAL' : 'LIVE'}
                          </span>
                          {game.period && (
                            <span className="text-xs text-gray-500">Q{game.period}</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Team {game.away_team_id}</span>
                            <span className="text-lg font-bold">{game.away_score ?? '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Team {game.home_team_id}</span>
                            <span className="text-lg font-bold">{game.home_score ?? '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No games on this date
                    </p>
                    <button
                      onClick={() => setShowBackfillPanel(true)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Load historical data
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Select a date to view games
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Refresh Live Games
                </button>
                <button
                  onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Today's Games
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

