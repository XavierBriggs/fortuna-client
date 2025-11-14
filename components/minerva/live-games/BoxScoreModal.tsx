'use client';

import { useEffect, useState } from 'react';
import { minervaAPI, Game, PlayerStats } from '@/lib/minerva-api';

interface BoxScoreModalProps {
  gameId: string;
  onClose: () => void;
}

export function BoxScoreModal({ gameId, onClose }: BoxScoreModalProps) {
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [homeStats, setHomeStats] = useState<PlayerStats[]>([]);
  const [awayStats, setAwayStats] = useState<PlayerStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoxScore = async () => {
      try {
        setLoading(true);
        const data = await minervaAPI.getGameBoxScore(gameId);
        setGame(data.game);
        setHomeStats(data.home_stats);
        setAwayStats(data.away_stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load box score');
      } finally {
        setLoading(false);
      }
    };

    fetchBoxScore();
  }, [gameId]);

  const renderStatsTable = (stats: PlayerStats[], title: string) => (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-center">MIN</th>
              <th className="px-3 py-2 text-center">PTS</th>
              <th className="px-3 py-2 text-center">REB</th>
              <th className="px-3 py-2 text-center">AST</th>
              <th className="px-3 py-2 text-center">FG</th>
              <th className="px-3 py-2 text-center">3PT</th>
              <th className="px-3 py-2 text-center">FT</th>
              <th className="px-3 py-2 text-center">+/-</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  No stats available
                </td>
              </tr>
            ) : (
              stats.map((stat, idx) => (
                <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2">
                    <div>
                      <span className="font-semibold">Player {stat.player_id}</span>
                      {stat.starter && <span className="ml-2 text-xs text-gray-500">(S)</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">{stat.minutes_played || 0}</td>
                  <td className="px-3 py-2 text-center font-semibold">{stat.points || 0}</td>
                  <td className="px-3 py-2 text-center">{stat.rebounds || 0}</td>
                  <td className="px-3 py-2 text-center">{stat.assists || 0}</td>
                  <td className="px-3 py-2 text-center">
                    {stat.field_goals_made || 0}/{stat.field_goals_attempted || 0}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {stat.three_pointers_made || 0}/{stat.three_pointers_attempted || 0}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {stat.free_throws_made || 0}/{stat.free_throws_attempted || 0}
                  </td>
                  <td className={`px-3 py-2 text-center ${(stat.plus_minus || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.plus_minus >= 0 ? '+' : ''}{stat.plus_minus || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Box Score
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading box score...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && game && (
            <>
              {/* Game Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(game.game_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    {game.venue && <p className="text-sm text-gray-600 dark:text-gray-400">📍 {game.venue}</p>}
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-500 text-white">
                      {game.game_status.toUpperCase()}
                    </span>
                    {game.period && (
                      <p className="mt-1 text-sm font-semibold">
                        Q{game.period} {game.time_remaining}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Score */}
                <div className="mt-4 grid grid-cols-3 gap-4 items-center">
                  <div className="text-right">
                    <p className="text-lg font-semibold">Team {game.away_team_id}</p>
                    <p className="text-4xl font-bold">{game.away_score ?? 0}</p>
                  </div>
                  <div className="text-center text-2xl font-bold text-gray-400">vs</div>
                  <div className="text-left">
                    <p className="text-lg font-semibold">Team {game.home_team_id}</p>
                    <p className="text-4xl font-bold">{game.home_score ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Stats Tables */}
              {renderStatsTable(awayStats, `Team ${game.away_team_id} Stats`)}
              {renderStatsTable(homeStats, `Team ${game.home_team_id} Stats`)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

