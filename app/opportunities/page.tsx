'use client';

import { useState, useEffect } from 'react';
import { Opportunity, OpportunityType } from '@/types/opportunity';
import { getOpportunities, createOpportunityAction } from '@/lib/api-opportunities';
import { Activity, TrendingUp, Target, Zap, Filter, RefreshCw, Settings } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import QuickBetModal from '@/components/bet/QuickBetModal';
import ConfigModal from '@/components/opportunities/ConfigModal';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sportFilter, setSportFilter] = useState<string>('basketball_nba');
  const [minEdge, setMinEdge] = useState<number>(1.0);

  // Load opportunities
  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        sport: sportFilter,
        limit: 50,
      };

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      const data = await getOpportunities(params);

      // Filter by min edge on client side
      const filtered = data.filter(opp => opp.edge_pct >= minEdge);

      // Deduplicate opportunities based on key characteristics
      const deduplicated = filtered.reduce((acc, opp) => {
        // Create a unique key based on event, market, legs, and edge
        const legsKey = opp.legs
          .map(leg => `${leg.book_key}-${leg.outcome_name}-${leg.price}`)
          .sort()
          .join('|');
        const uniqueKey = `${opp.event_id}-${opp.market_key}-${opp.edge_pct.toFixed(2)}-${legsKey}`;

        // Only keep the first occurrence (with lowest ID, assuming older is more relevant)
        const existing = acc.find(o => {
          const existingLegsKey = o.legs
            .map(leg => `${leg.book_key}-${leg.outcome_name}-${leg.price}`)
            .sort()
            .join('|');
          const existingKey = `${o.event_id}-${o.market_key}-${o.edge_pct.toFixed(2)}-${existingLegsKey}`;
          return existingKey === uniqueKey;
        });

        if (!existing) {
          acc.push(opp);
        } else {
          console.log(`[Opportunities] Filtered duplicate: ID ${opp.id} (keeping ID ${existing.id})`);
        }

        return acc;
      }, [] as Opportunity[]);

      setOpportunities(deduplicated);

      if (deduplicated.length < filtered.length) {
        console.log(`[Opportunities] Removed ${filtered.length - deduplicated.length} duplicates`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadOpportunities, 10000);

    return () => clearInterval(interval);
  }, [typeFilter, sportFilter, minEdge]);

  // Handle Bet button click
  const handleBetClick = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setShowBetModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowBetModal(false);
    setSelectedOpportunity(null);
  };

  // Handle successful bet placement
  const handleBetSuccess = () => {
    loadOpportunities(); // Refresh opportunities
  };

  // Handle Dismiss action
  const handleDismiss = async (opportunityId: number) => {
    try {
      await createOpportunityAction(opportunityId, {
        action_type: 'dismissed',
        operator: 'User',
      });
      loadOpportunities();
    } catch (err) {
      console.error('Failed to dismiss:', err);
    }
  };

  const getTypeIcon = (type: OpportunityType) => {
    switch (type) {
      case 'edge':
        return <TrendingUp className="h-4 w-4" />;
      case 'middle':
        return <Target className="h-4 w-4" />;
      case 'scalp':
        return <Zap className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: OpportunityType) => {
    switch (type) {
      case 'edge':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'middle':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'scalp':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getAgeBadge = (ageSeconds: number) => {
    if (ageSeconds < 5) return { color: 'bg-green-500', emoji: '🟢' };
    if (ageSeconds < 10) return { color: 'bg-yellow-500', emoji: '🟡' };
    return { color: 'bg-red-500', emoji: '🔴' };
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Betting Opportunities</h1>
              <p className="text-muted-foreground">Real-time edge detection from Fortuna</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={loadOpportunities}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
              >
                <option value="all">All Types</option>
                <option value="edge">Edge</option>
                <option value="middle">Middle</option>
                <option value="scalp">Scalp</option>
              </select>
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Sport</label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
              >
                <option value="basketball_nba">NBA</option>
                <option value="american_football_nfl">NFL</option>
                <option value="baseball_mlb">MLB</option>
              </select>
            </div>

            {/* Min Edge Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Min Edge %</label>
              <input
                type="number"
                value={minEdge}
                onChange={(e) => setMinEdge(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
              />
            </div>

            {/* Stats */}
            <div>
              <label className="block text-sm font-medium mb-2">Results</label>
              <div className="px-3 py-2 bg-background border border-border rounded-lg text-center">
                <span className="text-2xl font-bold text-primary">{opportunities.length}</span>
                <span className="text-sm text-muted-foreground ml-2">found</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Opportunities Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Event</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Market</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Edge %</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Sharp Line</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Legs</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Age</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Loading opportunities...
                    </td>
                  </tr>
                ) : opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No opportunities found. Adjust filters or wait for new detections.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp) => {
                    const ageBadge = getAgeBadge(opp.data_age_seconds);

                    return (
                      <tr key={opp.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getTypeColor(opp.opportunity_type)}`}>
                            {getTypeIcon(opp.opportunity_type)}
                            <span className="text-sm font-semibold uppercase">{opp.opportunity_type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold">
                            {opp.event_name || `${opp.event_id.substring(0, 12)}...`}
                          </div>
                          {opp.event_name && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {opp.sport_key}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{opp.market_key}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-lg font-bold text-primary">
                            {opp.edge_pct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {opp.fair_price ? (
                            <div>
                              <span className="text-sm font-mono text-muted-foreground">
                                {formatOdds(opp.fair_price)}
                              </span>
                              <div className="text-xs text-muted-foreground/70">
                                (sharp consensus)
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {opp.legs.map((leg, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{leg.book_key}</span>
                                {' | '}
                                <span>{leg.outcome_name}</span>
                                {' @ '}
                                <span className="font-mono">{formatOdds(leg.price)}</span>
                                {leg.leg_edge_pct && (
                                  <span className="text-primary ml-2">
                                    ({leg.leg_edge_pct.toFixed(1)}%)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{ageBadge.emoji}</span>
                            <span className="text-sm">{opp.data_age_seconds}s</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBetClick(opp)}
                              className="px-4 py-2 text-sm bg-green-500/10 text-green-500 border border-green-500/20 rounded hover:bg-green-500/20 font-semibold transition-colors"
                            >
                              💰 Bet
                            </button>
                            <button
                              onClick={() => handleDismiss(opp.id)}
                              className="px-3 py-1 text-sm bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500/20"
                            >
                              Dismiss
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        {opportunities.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Avg Edge</div>
              <div className="text-2xl font-bold text-primary">
                {(opportunities.reduce((sum, opp) => sum + opp.edge_pct, 0) / opportunities.length).toFixed(2)}%
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Best Edge</div>
              <div className="text-2xl font-bold text-primary">
                {Math.max(...opportunities.map(opp => opp.edge_pct)).toFixed(2)}%
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Fresh Data</div>
              <div className="text-2xl font-bold text-green-500">
                {opportunities.filter(opp => opp.data_age_seconds < 5).length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Bet Modal */}
      {showBetModal && selectedOpportunity && (
        <QuickBetModal
          opportunity={selectedOpportunity}
          bankroll={10000} // TODO: Get from user settings
          onClose={handleModalClose}
          onSuccess={handleBetSuccess}
        />
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <ConfigModal onClose={() => setShowConfigModal(false)} />
      )}
    </div>
  );
}
