import { Game } from '@/types';
import { cn } from '@/lib/utils';

interface GameCardProps {
  game: Game;
  onViewBoxScore: (gameId: string) => void;
  onViewOdds: (gameId: string) => void;
}

export function GameCard({ game, onViewBoxScore, onViewOdds }: GameCardProps) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isUpcoming = game.status === 'upcoming';

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getWinner = () => {
    if (!isFinal) return null;
    if (game.home_score > game.away_score) return 'home';
    if (game.away_score > game.home_score) return 'away';
    return null;
  };

  const winner = getWinner();

  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
      isLive && "ring-2 ring-red-500 shadow-lg shadow-red-500/20",
      isFinal && "opacity-90"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Status Badge */}
        {isLive && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-semibold animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            LIVE {game.period_label}
          </span>
        )}
        {isFinal && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
            FINAL
          </span>
        )}
        {isUpcoming && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium">
            🕐 {formatTime(game.commence_time)}
          </span>
        )}
        
        {/* Time Remaining */}
        {isLive && game.time_remaining && (
          <span className="text-xs text-muted-foreground font-medium">{game.time_remaining}</span>
        )}
      </div>

      {/* Teams and Scores */}
      <div className="space-y-2 mb-4">
        {/* Away Team */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg transition-colors",
          winner === 'away' ? "bg-primary/10" : "bg-muted/30"
        )}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn(
              "text-xl font-bold shrink-0",
              winner === 'away' && "text-primary"
            )}>
              {game.away_team_abbr}
            </div>
            <div className="text-sm text-muted-foreground truncate">{game.away_team}</div>
          </div>
          <div className={cn(
            "text-3xl font-bold tabular-nums shrink-0 ml-2",
            winner === 'away' && "text-primary"
          )}>
            {game.away_score}
          </div>
        </div>

        {/* Home Team */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg transition-colors",
          winner === 'home' ? "bg-primary/10" : "bg-muted/30"
        )}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn(
              "text-xl font-bold shrink-0",
              winner === 'home' && "text-primary"
            )}>
              {game.home_team_abbr}
            </div>
            <div className="text-sm text-muted-foreground truncate">{game.home_team}</div>
          </div>
          <div className={cn(
            "text-3xl font-bold tabular-nums shrink-0 ml-2",
            winner === 'home' && "text-primary"
          )}>
            {game.home_score}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewBoxScore(game.game_id)}
          disabled={isUpcoming}
          className="flex-1 px-4 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Box Score
        </button>
        {game.has_linked_odds && (
          <button
            onClick={() => onViewOdds(game.game_id)}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            📈 Live Odds
          </button>
        )}
      </div>
    </div>
  );
}
