'use client';

import { BotStatusCard } from './BotStatusCard';
import { RecentBets } from './RecentBets';
import { useBots } from '@/hooks/useBots';
import { cn } from '@/lib/utils';

export function BotDashboard() {
  const { bots, recentBets, isLoading, error, lastUpdate } = useBots();

  if (error && bots.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="text-6xl mb-6">⚠️</div>
            <h3 className="text-2xl font-semibold mb-3">Failed to load bot status</h3>
            <p className="text-muted-foreground text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🤖</span>
            <h1 className="text-4xl font-bold">Bot Monitoring Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Real-time bot status and balance monitoring
            {lastUpdate && (
              <span className="ml-2 text-sm">
                • Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Bot Status Cards */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Bot Status</h2>
          {isLoading && bots.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bots.map((bot) => (
                <BotStatusCard key={bot.name} bot={bot} />
              ))}
            </div>
          )}
        </div>

        {/* Active Bets Placeholder */}
        {/* TODO: Implement active bet tracking when bet placement is in progress */}
        
        {/* Recent Bets */}
        <div className="mb-10">
          <RecentBets bets={recentBets} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

