'use client';

import { cn } from '@/lib/utils';

interface BotStatusCardProps {
  bot: {
    name: string;
    display_name: string;
    status: string;
    logged_in: boolean;
    balance: string | null;
    session_duration: {
      hours: number;
      minutes: number;
      seconds: number;
      total_seconds: number;
    } | null;
    error?: string;
  };
}

export function BotStatusCard({ bot }: BotStatusCardProps) {
  const getStatusColor = () => {
    if (bot.error) return 'text-destructive';
    if (bot.logged_in) return 'text-fresh';
    return 'text-stale';
  };

  const getStatusBadge = () => {
    if (bot.error) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          </span>
          Error
        </span>
      );
    }
    if (bot.logged_in) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fresh/10 text-fresh text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fresh opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-fresh"></span>
          </span>
          Online
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-stale opacity-75"></span>
        </span>
        Offline
      </span>
    );
  };

  const formatSessionDuration = () => {
    if (!bot.session_duration) return null;
    const { hours, minutes, seconds } = bot.session_duration;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatBalance = (balance: string | null) => {
    if (!balance) return 'N/A';
    // Handle formats like "$9.17" or "$ 9.17"
    return balance.replace(/\s+/g, '');
  };

  return (
    <div className={cn(
      "rounded-lg border bg-card p-6 transition-all duration-200 hover:shadow-lg",
      bot.logged_in && "ring-1 ring-fresh/20",
      bot.error && "ring-1 ring-destructive/20"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{bot.display_name}</h3>
        {getStatusBadge()}
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="text-sm text-muted-foreground mb-1">Balance</div>
        <div className={cn(
          "text-3xl font-bold tabular-nums",
          getStatusColor()
        )}>
          {formatBalance(bot.balance)}
        </div>
      </div>

      {/* Session Duration */}
      {bot.session_duration && (
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-1">Session Duration</div>
          <div className="text-lg font-medium">
            {formatSessionDuration()}
          </div>
        </div>
      )}

      {/* Error Message */}
      {bot.error && (
        <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <div className="text-sm text-destructive font-medium">Error</div>
          <div className="text-xs text-destructive/80 mt-1">{bot.error}</div>
        </div>
      )}
    </div>
  );
}

