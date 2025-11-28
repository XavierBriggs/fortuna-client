'use client';

import { BotStatusCard } from './BotStatusCard';
import { RecentBets } from './RecentBets';
import { useBots } from '@/hooks/useBots';
import { cn } from '@/lib/utils';

export function BotDashboard() {
  const { bots, recentBets, isLoading, error, lastUpdate } = useBots();

  if (error && bots.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto bg-card border border-border rounded-xl shadow-2xl">
          <div className="text-6xl mb-6 animate-bounce">⚠️</div>
          <h3 className="text-2xl font-bold mb-3 text-foreground">Connection Failed</h3>
          <p className="text-muted-foreground text-lg mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <div className="container px-4 py-8 max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl animate-pulse">🤖</span>
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  Bot Monitoring
                </h1>
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Real-time status, performance metrics, and automated betting activity.
              </p>
            </div>

            {lastUpdate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/50 px-3 py-1.5 rounded-full border border-border/50 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Updates • {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Bot Status Cards */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Active Bots
            </h2>
          </div>

          {isLoading && bots.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-xl border border-border/50 bg-card/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map((bot) => (
                <BotStatusCard key={bot.name} bot={bot} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Bets */}
        <section className="relative">
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 bg-card/30 border border-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-sm">
            <RecentBets bets={recentBets} isLoading={isLoading} />
          </div>
        </section>
      </div>
    </div>
  );
}








