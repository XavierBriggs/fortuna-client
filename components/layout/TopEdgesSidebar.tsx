'use client';

import { useMemo } from 'react';
import { useFilteredOdds } from '@/lib/stores/odds-store';
import { EdgeBadge } from '@/components/shared/EdgeBadge';
import { AgeBadge } from '@/components/shared/AgeBadge';
import { formatAmericanOdds, formatPoint, getDataAgeSeconds, getBookDisplayName } from '@/lib/utils';
import { TrendingUp, Flame } from 'lucide-react';

export function TopEdgesSidebar() {
  const filteredOdds = useFilteredOdds();
  
  // Get top edges
  const topEdges = useMemo(() => {
    return filteredOdds
      .filter((odd) => odd.edge !== null && odd.edge > 0)
      .sort((a, b) => (b.edge || 0) - (a.edge || 0))
      .slice(0, 10);
  }, [filteredOdds]);
  
  return (
    <div className="sticky top-32 space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-edge-high" />
          <h2 className="text-lg font-bold">Top Edges</h2>
        </div>
        
        {topEdges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No positive edges found</p>
            <p className="text-xs mt-1">Waiting for +EV opportunities...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topEdges.map((odd, index) => {
              const dataAge = getDataAgeSeconds(odd);
              const pointPart = odd.point !== null ? `-${odd.point}` : '';
              
              return (
                <div
                  key={`${odd.event_id}-${odd.market_key}-${odd.book_key}-${odd.outcome_name}${pointPart}`}
                  className="p-3 rounded-md border border-border hover:border-primary bg-background hover:bg-accent/50 transition-all cursor-pointer"
                >
                  {/* Rank and Edge */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                      </span>
                      <EdgeBadge edge={odd.edge} className="text-sm" />
                    </div>
                    <AgeBadge seconds={dataAge} />
                  </div>
                  
                  {/* Outcome */}
                  <div className="text-sm font-medium mb-1">
                    {odd.outcome_name}
                    {odd.point && (
                      <span className="text-muted-foreground ml-1">
                        {formatPoint(odd.point)}
                      </span>
                    )}
                  </div>
                  
                  {/* Odds and Book */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-base">
                      {formatAmericanOdds(odd.price)}
                    </span>
                    <span className="text-muted-foreground">
                      {getBookDisplayName(odd.book_key)}
                    </span>
                  </div>
                  
                  {/* Fair Price */}
                  {odd.fair_price && (
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      Fair: {formatAmericanOdds(odd.fair_price)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Odds:</span>
            <span className="font-semibold">{filteredOdds.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">+EV Opportunities:</span>
            <span className="font-semibold text-edge-positive">
              {filteredOdds.filter((o) => o.edge && o.edge > 0).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Significant (>2%):</span>
            <span className="font-semibold text-edge-good">
              {filteredOdds.filter((o) => o.edge && o.edge > 0.02).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rare (>5%):</span>
            <span className="font-semibold text-edge-high">
              {filteredOdds.filter((o) => o.edge && o.edge > 0.05).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


