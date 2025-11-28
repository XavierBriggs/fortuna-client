'use client';

interface ActiveBetProgressProps {
  requestId: string;
  team1: string;
  team2: string;
  betTeam: string;
  betType: string;
  betAmount: string;
  progress: number;
  stage: string;
}

export function ActiveBetProgress({
  requestId,
  team1,
  team2,
  betTeam,
  betType,
  betAmount,
  progress,
  stage,
}: ActiveBetProgressProps) {
  const getBetTypeDisplay = (betType: string) => {
    const typeMap: Record<string, string> = {
      moneyline: 'Moneyline',
      spread: 'Spread',
      total_over: 'Total Over',
      total_under: 'Total Under',
    };
    return typeMap[betType] || betType;
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Placing Bet: {team1} vs {team2}</h3>
        <div className="text-sm text-muted-foreground">
          {betTeam} • {getBetTypeDisplay(betType)} • ${betAmount}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{stage}</span>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Request ID */}
      <div className="text-xs text-muted-foreground font-mono">
        ID: {requestId}
      </div>
    </div>
  );
}








