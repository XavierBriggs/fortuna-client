'use client';

import { Bet } from '@/lib/bot-api';
import { cn } from '@/lib/utils';

interface RecentBetsProps {
  bets: Bet[];
  isLoading?: boolean;
}

export function RecentBets({ bets, isLoading }: RecentBetsProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatOdds = (price: number) => {
    if (price > 0) {
      return `+${price}`;
    }
    return price.toString();
  };

  const getBetTypeDisplay = (betType: string) => {
    const typeMap: Record<string, string> = {
      moneyline: 'Moneyline',
      spread: 'Spread',
      total_over: 'Total Over',
      total_under: 'Total Under',
    };
    return typeMap[betType] || betType;
  };

  const getStatusBadge = (result?: string) => {
    if (!result || result === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted/50 border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
          Pending
        </span>
      );
    }
    if (result === 'win') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_8px_-2px_rgba(34,197,94,0.3)]">
          Win
        </span>
      );
    }
    if (result === 'loss') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold uppercase tracking-wider">
          Loss
        </span>
      );
    }
    if (result === 'push') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
          Push
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
        {result}
      </span>
    );
  };

  const getBotDisplayName = (bookKey: string) => {
    const nameMap: Record<string, string> = {
      betus: 'BetUS',
      betonline: 'BetOnline',
      bovada: 'Bovada',
    };
    return nameMap[bookKey.toLowerCase()] || bookKey;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg border border-border/50 bg-card/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card/30 backdrop-blur-sm text-center">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold mb-1">No bets placed yet</h3>
          <p className="text-muted-foreground text-sm">Recent betting activity will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
          {bets.length} Bets
        </span>
      </div>

      <div className="space-y-3">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className={cn(
              "group relative overflow-hidden rounded-lg border border-border bg-card/30 backdrop-blur-sm p-4 transition-all duration-200 hover:bg-card/50 hover:border-primary/30 hover:shadow-lg",
              bet.result === 'win' && "border-green-500/20 bg-green-500/5",
              bet.result === 'loss' && "border-destructive/20 bg-destructive/5"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">
                    {getBotDisplayName(bet.book_key)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDate(bet.placed_at)} at {formatTime(bet.placed_at)}
                  </span>
                </div>

                {/* Bet Details */}
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {bet.outcome_name}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{getBetTypeDisplay(bet.bet_type)}</span>
                    {bet.point && (
                      <>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="font-mono font-medium">{bet.point > 0 ? '+' : ''}{bet.point}</span>
                      </>
                    )}
                    <span className="text-muted-foreground/30">•</span>
                    <span className="font-mono font-medium text-foreground">${bet.stake_amount.toFixed(2)}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="font-mono font-bold text-primary">{formatOdds(bet.bet_price)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="shrink-0 flex flex-col items-end gap-2">
                {getStatusBadge(bet.result)}

                {/* Payout (if settled) */}
                {bet.result === 'win' && bet.payout_amount && (
                  <div className="text-xs font-mono font-bold text-green-500 animate-in fade-in slide-in-from-right-2">
                    +${bet.payout_amount.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


