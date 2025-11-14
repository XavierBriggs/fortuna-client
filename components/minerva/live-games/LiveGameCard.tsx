'use client';

import { Game } from '@/lib/minerva-api';
import { useState } from 'react';
import { BoxScoreModal } from './BoxScoreModal';

interface LiveGameCardProps {
  game: Game;
}

export function LiveGameCard({ game }: LiveGameCardProps) {
  const [showBoxScore, setShowBoxScore] = useState(false);

  const getStatusBadge = () => {
    switch (game.game_status) {
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500 text-white animate-pulse">LIVE</span>;
      case 'final':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">FINAL</span>;
      case 'scheduled':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">UPCOMING</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-400 text-white">{game.game_status}</span>;
    }
  };

  const getGameTime = () => {
    if (game.game_status === 'scheduled') {
      const date = new Date(game.game_date);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (game.time_remaining) {
      return `Q${game.period} ${game.time_remaining}`;
    }
    if (game.period) {
      return `Q${game.period}`;
    }
    return '';
  };

  const isLive = game.game_status === 'in_progress';
  const homeWinning = (game.home_score || 0) > (game.away_score || 0);
  const awayWinning = (game.away_score || 0) > (game.home_score || 0);

  return (
    <>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
        onClick={() => setShowBoxScore(true)}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          {getStatusBadge()}
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {getGameTime()}
          </span>
        </div>

        {/* Teams and Scores */}
        <div className="space-y-2">
          {/* Away Team */}
          <div className={`flex justify-between items-center py-2 px-3 rounded ${awayWinning && isLive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
            <div className="flex items-center space-x-2">
              {awayWinning && isLive && (
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              )}
              <span className={`font-semibold ${awayWinning ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                Team {game.away_team_id}
              </span>
            </div>
            <span className={`text-2xl font-bold ${awayWinning ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
              {game.away_score ?? '-'}
            </span>
          </div>

          {/* Home Team */}
          <div className={`flex justify-between items-center py-2 px-3 rounded ${homeWinning && isLive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
            <div className="flex items-center space-x-2">
              {homeWinning && isLive && (
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              )}
              <span className={`font-semibold ${homeWinning ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                Team {game.home_team_id}
              </span>
            </div>
            <span className={`text-2xl font-bold ${homeWinning ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
              {game.home_score ?? '-'}
            </span>
          </div>
        </div>

        {/* Footer */}
        {game.venue && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              📍 {game.venue}
            </p>
          </div>
        )}
      </div>

      {showBoxScore && (
        <BoxScoreModal 
          gameId={game.game_id} 
          onClose={() => setShowBoxScore(false)} 
        />
      )}
    </>
  );
}

