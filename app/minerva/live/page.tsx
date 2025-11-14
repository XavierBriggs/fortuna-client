'use client';

import { useLiveGames } from '@/hooks/useLiveGames';
import { LiveGameCard } from '@/components/minerva/live-games/LiveGameCard';

export default function MinervaLivePage() {
  const { games, loading, error, refresh, wsConnected } = useLiveGames();

  const liveGames = games.filter(g => g.game_status === 'in_progress');
  const upcomingGames = games.filter(g => g.game_status === 'scheduled');
  const finalGames = games.filter(g => g.game_status === 'final');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live NBA Games</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time scores powered by Minerva
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* WebSocket Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {wsConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && games.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading games...</p>
        </div>
      )}

      {/* Games Grid */}
      {!loading && games.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            No games scheduled today
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Check back later for upcoming games
          </p>
        </div>
      )}

      {/* Live Games Section */}
      {liveGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            Live Now ({liveGames.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveGames.map(game => (
              <LiveGameCard key={game.game_id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Games Section */}
      {upcomingGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Upcoming ({upcomingGames.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map(game => (
              <LiveGameCard key={game.game_id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Final Games Section */}
      {finalGames.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Final ({finalGames.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {finalGames.map(game => (
              <LiveGameCard key={game.game_id} game={game} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

