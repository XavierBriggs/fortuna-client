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
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          Pending
        </span>
      );
    }
    if (result === 'win') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-fresh/10 text-fresh text-xs font-medium">
          ✓ Win
        </span>
      );
    }
    if (result === 'loss') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
          ✗ Loss
        </span>
      );
    }
    if (result === 'push') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
          Push
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
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
        <h2 className="text-2xl font-semibold">Recent Bets</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Bets</h2>
        <div className="text-center py-12 rounded-lg border bg-card">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">No bets placed yet</h3>
          <p className="text-muted-foreground text-sm">Recent bets will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Recent Bets</h2>
        <span className="text-sm text-muted-foreground">{bets.length} bets</span>
      </div>

      <div className="space-y-3">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className={cn(
              "rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-md",
              bet.result === 'win' && "ring-1 ring-fresh/20",
              bet.result === 'loss' && "ring-1 ring-destructive/20"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-primary">
                    {getBotDisplayName(bet.book_key)}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(bet.placed_at)} {formatTime(bet.placed_at)}
                  </span>
                </div>

                {/* Bet Details */}
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {bet.outcome_name}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{getBetTypeDisplay(bet.bet_type)}</span>
                    {bet.point && (
                      <>
                        <span>•</span>
                        <span>{bet.point > 0 ? '+' : ''}{bet.point}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>${bet.stake_amount.toFixed(2)}</span>
                    <span>•</span>
                    <span>{formatOdds(bet.bet_price)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="shrink-0">
                {getStatusBadge(bet.result)}
              </div>
            </div>

            {/* Payout (if settled) */}
            {bet.result === 'win' && bet.payout_amount && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payout:</span>
                  <span className="font-semibold text-fresh">
                    +${bet.payout_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

