'use client';

import { Game } from '@/lib/minerva-api';
import { useState, useEffect, useRef } from 'react';
import { BoxScoreModal } from './BoxScoreModal';
import { Clock, MapPin, BarChart3 } from 'lucide-react';

interface LiveGameCardProps {
  game: Game;
}

export function LiveGameCard({ game }: LiveGameCardProps) {
  const [showBoxScore, setShowBoxScore] = useState(false);
  const [scoreFlash, setScoreFlash] = useState<'home' | 'away' | null>(null);
  const prevScores = useRef({ home: game.home_score, away: game.away_score });

  // Detect score changes for animation
  useEffect(() => {
    const prevHome = prevScores.current.home;
    const prevAway = prevScores.current.away;
    
    if (game.home_score !== prevHome && game.home_score != null) {
      setScoreFlash('home');
      setTimeout(() => setScoreFlash(null), 1000);
    }
    if (game.away_score !== prevAway && game.away_score != null) {
      setScoreFlash('away');
      setTimeout(() => setScoreFlash(null), 1000);
    }
    
    prevScores.current = { home: game.home_score, away: game.away_score };
  }, [game.home_score, game.away_score]);

  const status = game.game_status || game.status || 'scheduled';
  const isLive = status === 'in_progress';
  const isFinal = status === 'final';
  const isScheduled = status === 'scheduled';
  
  const homeScore = typeof game.home_score === 'number' ? game.home_score : 
    (game.home_score as any)?.Int32 ?? null;
  const awayScore = typeof game.away_score === 'number' ? game.away_score : 
    (game.away_score as any)?.Int32 ?? null;
  
  const homeWinning = homeScore != null && awayScore != null && homeScore > awayScore;
  const awayWinning = homeScore != null && awayScore != null && awayScore > homeScore;
  
  const getStatusBadge = () => {
    if (isLive) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wide">Live</span>
        </div>
      );
    }
    if (isFinal) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30 uppercase tracking-wide">
          Final
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
        Upcoming
      </span>
    );
  };

  const getGameInfo = () => {
    if (isLive) {
      const timeRemaining = game.time_remaining || game.clock;
      const period = typeof game.period === 'number' ? game.period : 
        (game.period as any)?.Int32 ?? null;
      
      if (period && timeRemaining) {
        const periodLabel = period <= 4 ? `Q${period}` : `OT${period - 4}`;
        return (
          <div className="flex items-center gap-1.5 text-red-400">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono font-bold">{periodLabel} · {timeRemaining}</span>
          </div>
        );
      }
      if (period) {
        return <span className="text-red-400 font-bold">Q{period}</span>;
      }
      return <span className="text-red-400 font-bold">In Progress</span>;
    }
    
    if (isScheduled) {
      return formatGameTime();
    }
    
    return null;
  };

  const formatGameTime = () => {
      const gameTime = typeof game.game_time === 'string' ? game.game_time : game.game_date;
    if (!gameTime) return <span className="text-muted-foreground">TBD</span>;
    
    try {
      const dateStr = gameTime.replace(' ', 'T');
      const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):?(\d{2})?/);
      if (!parts) return <span className="text-muted-foreground">TBD</span>;
      
      const [, year, month, day, hour, minute] = parts;
      const estDateStr = `${year}-${month}-${day}T${hour}:${minute}:00-05:00`;
      const date = new Date(estDateStr);
      
      if (isNaN(date.getTime())) return <span className="text-muted-foreground">TBD</span>;
      
      // Get today/tomorrow in EST
      const now = new Date();
      const estNowStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
      const estNow = new Date(estNowStr);
      const estToday = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate());
      const estTomorrow = new Date(estToday.getTime() + 86400000);
      
      const gameDateStr = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
      const gameDate = new Date(gameDateStr);
      const gameDateOnly = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
      
      const time = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: 'America/New_York'
      });
      
      let dateLabel = '';
      if (gameDateOnly.getTime() === estToday.getTime()) {
        dateLabel = 'Today';
      } else if (gameDateOnly.getTime() === estTomorrow.getTime()) {
        dateLabel = 'Tomorrow';
      } else {
        dateLabel = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          timeZone: 'America/New_York'
        });
      }
      
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{dateLabel} · {time} ET</span>
        </div>
      );
    } catch (e) {
      return <span className="text-muted-foreground">TBD</span>;
    }
  };

  const venue = typeof game.venue === 'string' ? game.venue : 
    (game.venue as any)?.String ?? null;

  return (
    <>
      <div 
        className={`relative bg-card border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg group ${
          isLive 
            ? 'border-red-500/30 hover:border-red-500/50 shadow-red-500/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setShowBoxScore(true)}
      >
        {/* Live indicator bar */}
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
        )}

        <div className="p-4">
        {/* Header */}
          <div className="flex justify-between items-start mb-4">
          {getStatusBadge()}
            {getGameInfo()}
        </div>

        {/* Teams and Scores */}
          <div className="space-y-3">
          {/* Away Team */}
            <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-all ${
              awayWinning && (isLive || isFinal) ? 'bg-primary/5' : ''
            }`}>
              <div className="flex items-center gap-3">
                {awayWinning && (isLive || isFinal) && (
                  <div className="w-1 h-8 bg-primary rounded-full" />
                )}
                <div>
                  <span className={`font-bold text-lg ${
                    awayWinning ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                {game.away_team?.abbreviation || `Team ${game.away_team_id}`}
              </span>
                  {game.away_team?.full_name && (
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {game.away_team.full_name}
                    </p>
                  )}
                </div>
            </div>
              <span className={`text-2xl font-bold tabular-nums transition-all ${
                awayWinning ? 'text-foreground' : 'text-muted-foreground'
              } ${scoreFlash === 'away' ? 'text-green-400 scale-110' : ''}`}>
                {awayScore ?? '-'}
            </span>
          </div>

          {/* Home Team */}
            <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-all ${
              homeWinning && (isLive || isFinal) ? 'bg-primary/5' : ''
            }`}>
              <div className="flex items-center gap-3">
                {homeWinning && (isLive || isFinal) && (
                  <div className="w-1 h-8 bg-primary rounded-full" />
                )}
                <div>
                  <span className={`font-bold text-lg ${
                    homeWinning ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                {game.home_team?.abbreviation || `Team ${game.home_team_id}`}
              </span>
                  {game.home_team?.full_name && (
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {game.home_team.full_name}
                    </p>
                  )}
                </div>
            </div>
              <span className={`text-2xl font-bold tabular-nums transition-all ${
                homeWinning ? 'text-foreground' : 'text-muted-foreground'
              } ${scoreFlash === 'home' ? 'text-green-400 scale-110' : ''}`}>
                {homeScore ?? '-'}
            </span>
          </div>
        </div>

        {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            {venue && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{venue}</span>
              </div>
            )}
            <button 
              className="flex items-center gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setShowBoxScore(true);
              }}
            >
              <BarChart3 className="h-3 w-3" />
              Box Score
            </button>
          </div>
        </div>
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
