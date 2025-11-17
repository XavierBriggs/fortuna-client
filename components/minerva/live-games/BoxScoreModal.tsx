'use client';

import { useEffect, useState } from 'react';
import { minervaAPI, Game, PlayerStats } from '@/lib/minerva-api';
import { X } from 'lucide-react';

interface BoxScoreModalProps {
  gameId: string | number;
  onClose: () => void;
}

export function BoxScoreModal({ gameId, onClose }: BoxScoreModalProps) {
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [homeStats, setHomeStats] = useState<PlayerStats[]>([]);
  const [awayStats, setAwayStats] = useState<PlayerStats[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'box-score' | 'team-stats'>('box-score');

  useEffect(() => {
    const fetchBoxScore = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await minervaAPI.getGameBoxScore(String(gameId));
        setGame(data.game);
        setHomeStats(data.home_stats || []);
        setAwayStats(data.away_stats || []);
      } catch (err) {
        console.error('Box score fetch error:', err);
        // For scheduled games, just show game info without stats
        setError(null);
        setHomeStats([]);
        setAwayStats([]);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchBoxScore();
    }
  }, [gameId]);

  // If we couldn't fetch the game from box score API, try to get it from the game ID
  useEffect(() => {
    if (!loading && !game && gameId) {
      minervaAPI.getGame(String(gameId))
        .then(fetchedGame => setGame(fetchedGame))
        .catch(err => console.error('Failed to fetch game details:', err));
    }
  }, [loading, game, gameId]);

  const renderStatsTable = (stats: PlayerStats[], title: string, teamAbbr: string) => {
    // Sort by starter status and minutes played
    const sortedStats = [...stats].sort((a, b) => {
      if (a.starter !== b.starter) return a.starter ? -1 : 1;
      return (b.minutes_played || 0) - (a.minutes_played || 0);
    });

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          {teamAbbr}
          <span className="text-sm font-normal text-gray-500">({stats.length} players)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">Player</th>
                <th className="px-3 py-3 text-center font-semibold">MIN</th>
                <th className="px-3 py-3 text-center font-semibold">PTS</th>
                <th className="px-3 py-3 text-center font-semibold">REB</th>
                <th className="px-3 py-3 text-center font-semibold">AST</th>
                <th className="px-3 py-3 text-center font-semibold">FG</th>
                <th className="px-3 py-3 text-center font-semibold">FG%</th>
                <th className="px-3 py-3 text-center font-semibold">3P</th>
                <th className="px-3 py-3 text-center font-semibold">3P%</th>
                <th className="px-3 py-3 text-center font-semibold">FT</th>
                <th className="px-3 py-3 text-center font-semibold">FT%</th>
                <th className="px-3 py-3 text-center font-semibold">STL</th>
                <th className="px-3 py-3 text-center font-semibold">BLK</th>
                <th className="px-3 py-3 text-center font-semibold">TO</th>
                <th className="px-3 py-3 text-center font-semibold">+/-</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-8 text-gray-500">
                    No stats available
                  </td>
                </tr>
              ) : (
                sortedStats.map((stat, idx) => {
                  const fgPct = stat.field_goals_attempted && stat.field_goals_attempted > 0
                    ? ((stat.field_goals_made || 0) / stat.field_goals_attempted * 100).toFixed(1)
                    : '-';
                  const threePct = stat.three_pointers_attempted && stat.three_pointers_attempted > 0
                    ? ((stat.three_pointers_made || 0) / stat.three_pointers_attempted * 100).toFixed(1)
                    : '-';
                  const ftPct = stat.free_throws_attempted && stat.free_throws_attempted > 0
                    ? ((stat.free_throws_made || 0) / stat.free_throws_attempted * 100).toFixed(1)
                    : '-';

                  return (
                    <tr 
                      key={idx} 
                      className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        stat.starter ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {stat.starter && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Starter"></span>
                          )}
                          <span className="font-semibold">Player {stat.player_id}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">{stat.minutes_played?.toFixed(0) || 0}</td>
                      <td className="px-3 py-3 text-center font-bold">{stat.points || 0}</td>
                      <td className="px-3 py-3 text-center">{stat.rebounds || 0}</td>
                      <td className="px-3 py-3 text-center">{stat.assists || 0}</td>
                      <td className="px-3 py-3 text-center">
                        {stat.field_goals_made || 0}-{stat.field_goals_attempted || 0}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{fgPct}</td>
                      <td className="px-3 py-3 text-center">
                        {stat.three_pointers_made || 0}-{stat.three_pointers_attempted || 0}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{threePct}</td>
                      <td className="px-3 py-3 text-center">
                        {stat.free_throws_made || 0}-{stat.free_throws_attempted || 0}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{ftPct}</td>
                      <td className="px-3 py-3 text-center">{stat.steals || 0}</td>
                      <td className="px-3 py-3 text-center">{stat.blocks || 0}</td>
                      <td className="px-3 py-3 text-center">{stat.turnovers || 0}</td>
                      <td className={`px-3 py-3 text-center font-semibold ${
                        (stat.plus_minus || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stat.plus_minus && stat.plus_minus >= 0 ? '+' : ''}{stat.plus_minus || 0}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {sortedStats.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-800 font-semibold">
                <tr>
                  <td className="px-3 py-3">TOTALS</td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.minutes_played || 0), 0).toFixed(0)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.points || 0), 0)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.rebounds || 0), 0)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.assists || 0), 0)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.field_goals_made || 0), 0)}-
                    {sortedStats.reduce((sum, s) => sum + (s.field_goals_attempted || 0), 0)}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">
                    {(() => {
                      const made = sortedStats.reduce((sum, s) => sum + (s.field_goals_made || 0), 0);
                      const att = sortedStats.reduce((sum, s) => sum + (s.field_goals_attempted || 0), 0);
                      return att > 0 ? ((made / att) * 100).toFixed(1) : '-';
                    })()}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.three_pointers_made || 0), 0)}-
                    {sortedStats.reduce((sum, s) => sum + (s.three_pointers_attempted || 0), 0)}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">
                    {(() => {
                      const made = sortedStats.reduce((sum, s) => sum + (s.three_pointers_made || 0), 0);
                      const att = sortedStats.reduce((sum, s) => sum + (s.three_pointers_attempted || 0), 0);
                      return att > 0 ? ((made / att) * 100).toFixed(1) : '-';
                    })()}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.free_throws_made || 0), 0)}-
                    {sortedStats.reduce((sum, s) => sum + (s.free_throws_attempted || 0), 0)}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">
                    {(() => {
                      const made = sortedStats.reduce((sum, s) => sum + (s.free_throws_made || 0), 0);
                      const att = sortedStats.reduce((sum, s) => sum + (s.free_throws_attempted || 0), 0);
                      return att > 0 ? ((made / att) * 100).toFixed(1) : '-';
                    })()}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.steals || 0), 0)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.blocks || 0), 0)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {sortedStats.reduce((sum, s) => sum + (s.turnovers || 0), 0)}
                  </td>
                  <td className="px-3 py-3 text-center">-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  if (!game) return null;

  const status = game.game_status || game.status || 'scheduled';
  const isScheduled = status === 'scheduled';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {game.away_team?.abbreviation || `Team ${game.away_team_id}`} @ {game.home_team?.abbreviation || `Team ${game.home_team_id}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
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

          {!loading && game && (
            <>
              {/* Game Info */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {new Date(game.game_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    {game.venue && <p className="text-sm text-gray-600 dark:text-gray-400">📍 {game.venue}</p>}
                  </div>
                  <div className="text-center">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      status === 'in_progress' ? 'bg-red-500 animate-pulse' : 
                      status === 'final' ? 'bg-gray-500' : 
                      'bg-blue-500'
                    } text-white`}>
                      {status.toUpperCase()}
                    </span>
                    {game.period && (
                      <p className="mt-2 text-sm font-semibold">
                        Q{game.period} {game.time_remaining || game.clock}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Score */}
                <div className="mt-6 grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-lg font-semibold mb-2">{game.away_team?.full_name || game.away_team?.abbreviation || `Team ${game.away_team_id}`}</p>
                    <p className="text-5xl font-bold">{game.away_score ?? '-'}</p>
                  </div>
                  <div className="text-center text-3xl font-bold text-gray-400">@</div>
                  <div className="text-center">
                    <p className="text-lg font-semibold mb-2">{game.home_team?.full_name || game.home_team?.abbreviation || `Team ${game.home_team_id}`}</p>
                    <p className="text-5xl font-bold">{game.home_score ?? '-'}</p>
                  </div>
                </div>
              </div>

              {/* Stats Tables - only show if we have stats */}
              {(homeStats.length > 0 || awayStats.length > 0) ? (
                <div className="space-y-6">
                  {awayStats.length > 0 && renderStatsTable(
                    awayStats, 
                    'Away Team Stats',
                    game.away_team?.abbreviation || `Team ${game.away_team_id}`
                  )}
                  {homeStats.length > 0 && renderStatsTable(
                    homeStats, 
                    'Home Team Stats',
                    game.home_team?.abbreviation || `Team ${game.home_team_id}`
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-6xl mb-4">
                    {isScheduled ? '📅' : '📊'}
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                    {isScheduled 
                      ? 'Game has not started yet' 
                      : 'No stats available for this game'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {isScheduled 
                      ? 'Stats will be available once the game begins' 
                      : 'Check back later for updated statistics'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
