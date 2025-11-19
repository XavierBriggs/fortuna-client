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
    if (bot.logged_in) return 'text-primary';
    return 'text-muted-foreground';
  };

  const getStatusBadge = () => {
    if (bot.error) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_-3px_rgba(239,68,68,0.5)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
          </span>
          Error
        </div>
      );
    }
    if (bot.logged_in) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_-3px_rgba(59,130,246,0.5)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Online
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50"></span>
        Offline
      </div>
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
    return balance.replace(/\s+/g, '');
  };

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-glow hover:border-primary/50",
      bot.error && "hover:border-destructive/50 hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]"
    )}>
      {/* Background Gradient */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br",
        bot.error ? "from-destructive via-transparent to-transparent" : "from-primary via-transparent to-transparent"
      )} />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold tracking-tight">{bot.display_name}</h3>
        {getStatusBadge()}
      </div>

      {/* Balance */}
      <div className="relative mb-6">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Balance</div>
        <div className={cn(
          "text-3xl font-mono font-bold tracking-tight",
          getStatusColor()
        )}>
          {formatBalance(bot.balance)}
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative flex items-center justify-between pt-4 border-t border-border/50">
        {bot.session_duration ? (
          <div>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Uptime</div>
            <div className="text-sm font-mono font-medium text-foreground">
              {formatSessionDuration()}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">No active session</div>
        )}

        {/* Status Dot for visual balance */}
        <div className={cn(
          "h-1.5 w-1.5 rounded-full",
          bot.error ? "bg-destructive" : bot.logged_in ? "bg-primary" : "bg-muted-foreground/30"
        )} />
      </div>

      {/* Error Message */}
      {bot.error && (
        <div className="relative mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-2">
            <div className="text-xs font-bold text-destructive uppercase tracking-wider mt-0.5">Error</div>
          </div>
          <div className="text-xs text-destructive/90 mt-1 font-medium leading-relaxed">{bot.error}</div>
        </div>
      )}
    </div>
  );
}

