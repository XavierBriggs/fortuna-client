'use client';

import { Game } from '@/lib/minerva-api';
import { useState } from 'react';
import { BoxScoreModal } from './BoxScoreModal';

interface LiveGameCardProps {
  game: Game;
}

export function LiveGameCard({ game }: LiveGameCardProps) {
  const [showBoxScore, setShowBoxScore] = useState(false);

  const status = game.game_status || game.status || 'scheduled';
  
  const getStatusBadge = () => {
    switch (status) {
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500 text-white animate-pulse">LIVE</span>;
      case 'final':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">FINAL</span>;
      case 'scheduled':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">UPCOMING</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-400 text-white">{status}</span>;
    }
  };

  const getGameDateTime = () => {
    if (status === 'scheduled') {
      const gameTime = typeof game.game_time === 'string' ? game.game_time : game.game_date;
      if (!gameTime) return 'TBD';
      
      // Parse the date string - it's stored in EST in the database
      // Format: "2025-11-14 20:00:00" or "2025-11-14T20:00:00"
      // We need to explicitly parse it as EST and display it as EST
      const dateStr = gameTime.replace(' ', 'T');
      
      // Create a date formatter for EST
      const estFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      // Parse as if it's EST by appending the timezone offset
      // EST is UTC-5, so we parse the string and then adjust
      const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})?/);
      if (!parts) {
        console.error('Invalid date format:', gameTime);
        return 'TBD';
      }
      
      const [, year, month, day, hour, minute] = parts;
      
      // Create date string in EST - treat the input as EST time
      const estDateStr = `${year}-${month}-${day}T${hour}:${minute}:00-05:00`; // EST is UTC-5
      const date = new Date(estDateStr);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', gameTime);
        return 'TBD';
      }
      
      // Get today and tomorrow in EST
      const now = new Date();
      const estNowStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
      const estNow = new Date(estNowStr);
      const estToday = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate());
      const estTomorrow = new Date(estToday.getTime() + 86400000);
      
      // Get game date in EST
      const gameDateStr = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
      const gameDate = new Date(gameDateStr);
      const gameDateOnly = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
      
      const time = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: 'America/New_York'
      });
      
      if (gameDateOnly.getTime() === estToday.getTime()) {
        return `Today ${time} EST`;
      } else if (gameDateOnly.getTime() === estTomorrow.getTime()) {
        return `Tomorrow ${time} EST`;
      } else {
        const dateDisplay = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          timeZone: 'America/New_York'
        });
        return `${dateDisplay} ${time} EST`;
      }
    }
    
    const timeRemaining = game.time_remaining || game.clock;
    if (timeRemaining) {
      return `Q${game.period} ${timeRemaining}`;
    }
    if (game.period) {
      return `Q${game.period}`;
    }
    return '';
  };

  const isLive = status === 'in_progress';
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
            {getGameDateTime()}
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
                {game.away_team?.abbreviation || `Team ${game.away_team_id}`}
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
                {game.home_team?.abbreviation || `Team ${game.home_team_id}`}
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

