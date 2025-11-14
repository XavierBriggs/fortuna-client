'use client';

import { useState, useEffect } from 'react';
import { Opportunity } from '@/types/opportunity';
import { UserSettings } from '@/types/settings';
import { getSettings } from '@/lib/api-settings';
import { X, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuickBetModalProps {
  opportunity: Opportunity;
  bankroll: number;  // Deprecated: kept for backwards compatibility
  onClose: () => void;
  onSuccess?: () => void;
}

interface KellyLeg {
  book: string;
  outcome: string;
  stake: number;
  potential_return?: number;
  full_kelly?: number;
  fractional_kelly?: number;
  edge_pct?: number;
  ev_per_dollar?: number;
  explanation: string;
}

interface KellyCalculation {
  type: string;
  total_stake: number;
  guaranteed_profit?: number;
  profit_pct?: number;
  legs: KellyLeg[];
  best_case?: string;
  worst_case?: string;
  instructions?: string;
  confidence?: string;
  warnings: string[];
}

export default function QuickBetModal({ opportunity, bankroll, onClose, onSuccess }: QuickBetModalProps) {
  const [kellyCalc, setKellyCalc] = useState<KellyCalculation | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [placingWithBot, setPlacingWithBot] = useState(false);
  const [botResult, setBotResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stakeEditMode, setStakeEditMode] = useState<'suggested' | 'manual'>('suggested');
  const [manualStakes, setManualStakes] = useState<Record<string, number>>({});

  // Load settings and calculate stakes on mount
  useEffect(() => {
    loadSettingsAndCalculate();
  }, [opportunity]);

  const loadSettingsAndCalculate = async () => {
    try {
      const userSettings = await getSettings();
      setSettings(userSettings);
      await calculateStakes(userSettings);
    } catch (err) {
      // Fallback to default values if settings fail to load
      console.error('Failed to load settings:', err);
      setError('Failed to load settings. Using defaults.');
      await calculateStakes(null);
    }
  };

  const calculateStakes = async (userSettings: UserSettings | null) => {
    try {
      setLoading(true);
      setError(null);

      // Determine which bankroll to use
      // For multi-leg opportunities, use the first leg's book bankroll
      const bookKey = opportunity.legs[0]?.book_key || '';
      const bookBankroll = userSettings?.bankrolls[bookKey] || bankroll || 10000;
      const kellyFraction = userSettings?.kelly_fraction || 0.25;

      // Debug logging
      console.log('[QuickBetModal] Book Key:', bookKey);
      console.log('[QuickBetModal] User Settings:', userSettings);
      console.log('[QuickBetModal] Book Bankroll:', bookBankroll);
      console.log('[QuickBetModal] Kelly Fraction:', kellyFraction);

      // Warn if book has zero bankroll
      if (bookBankroll === 0 && userSettings) {
        setError(`Warning: ${bookKey} bankroll is $0. Please update in Settings.`);
      }

      const response = await fetch('http://localhost:8084/api/v1/calculate-from-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity: {
            id: opportunity.id,
            opportunity_type: opportunity.opportunity_type,
            edge_pct: opportunity.edge_pct,
            legs: opportunity.legs.map(leg => ({
              book_key: leg.book_key,
              outcome_name: leg.outcome_name,
              price: leg.price,
              point: leg.point,
              leg_edge_pct: leg.leg_edge_pct
            }))
          },
          bankroll: bookBankroll,
          kelly_fraction: kellyFraction
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to calculate stakes');
      }

      const data = await response.json();
      setKellyCalc(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate stakes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log bets manually (user places them on the sportsbook website)
   */
  const logBetsManually = async () => {
    if (!kellyCalc || !settings) return;

    try {
      setPlacing(true);
      setError(null);

      // Map opportunity type to bet type
      // edge -> straight (single bet with +EV)
      // middle, scalp -> keep as is
      const getBetType = (oppType: string): string => {
        if (oppType === 'edge') return 'straight';
        return oppType; // middle, scalp
      };

      // Create bet entries for each leg
      for (const leg of kellyCalc.legs) {
        const bookKey = leg.book;
        const stakeAmount = stakeEditMode === 'manual' 
          ? (manualStakes[bookKey] ?? leg.stake)
          : leg.stake;

        // Validate stake doesn't exceed bankroll
        const bookBankroll = settings.bankrolls[bookKey] || 0;
        if (stakeAmount > bookBankroll) {
          throw new Error(
            `Stake $${stakeAmount.toFixed(2)} exceeds ${bookKey} bankroll ($${bookBankroll.toFixed(2)})`
          );
        }

        if (stakeAmount <= 0) {
          throw new Error(`Stake amount must be positive for ${bookKey}`);
        }

        // Extract price from outcome string (format: "OutcomeName @ +110")
        const priceMatch = leg.outcome.match(/@\s*([-+]?\d+)/);
        const price = priceMatch ? parseInt(priceMatch[1]) : opportunity.legs[0].price;

        // Get the point value from the opportunity leg (for spreads/totals)
        const oppLeg = opportunity.legs.find(l => l.book_key === bookKey);
        const point = oppLeg?.point || null;

        const response = await fetch('http://localhost:8081/api/v1/bets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunity_id: opportunity.id,
            sport_key: opportunity.sport_key,
            event_id: opportunity.event_id,
            market_key: opportunity.market_key,
            book_key: bookKey,
            outcome_name: leg.outcome.split(' @ ')[0],
            bet_type: getBetType(opportunity.opportunity_type),
            stake_amount: stakeAmount,
            bet_price: price,
            point: point,
            placed_at: new Date().toISOString()
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to create bet');
        }

        const result = await response.json();
        
        // Update local settings with new bankrolls from backend
        if (result.updated_bankrolls) {
          setSettings({
            ...settings,
            bankrolls: result.updated_bankrolls
          });
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log bets');
    } finally {
      setPlacing(false);
    }
  };

  /**
   * Place bets using the automated bot
   */
  const placeBetsWithBot = async () => {
    if (!kellyCalc || !settings) return;

    try {
      setPlacingWithBot(true);
      setError(null);
      setBotResult(null);

      // Build legs array for bot API
      const legs = kellyCalc.legs.map(leg => {
        const bookKey = leg.book;
        const stakeAmount = stakeEditMode === 'manual' 
          ? (manualStakes[bookKey] ?? leg.stake)
          : leg.stake;

        // Validate stake doesn't exceed bankroll
        const bookBankroll = settings.bankrolls[bookKey] || 0;
        if (stakeAmount > bookBankroll) {
          throw new Error(
            `Stake $${stakeAmount.toFixed(2)} exceeds ${bookKey} bankroll ($${bookBankroll.toFixed(2)})`
          );
        }

        if (stakeAmount <= 0) {
          throw new Error(`Stake amount must be positive for ${bookKey}`);
        }

        // Extract outcome name (before @ sign)
        const outcomeName = leg.outcome.split(' @ ')[0];
        
        // Extract odds from outcome string
        const priceMatch = leg.outcome.match(/@\s*([-+]?\d+)/);
        const expectedOdds = priceMatch ? parseInt(priceMatch[1]) : opportunity.legs[0]?.price || -110;

        return {
          book_key: bookKey,
          outcome_name: outcomeName,
          stake: stakeAmount,
          expected_odds: expectedOdds
        };
      });

      // Call bet-bot service
      const response = await fetch('http://localhost:8085/api/v1/place-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: opportunity.id,
          legs
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.reason || errData.error || 'Failed to place bets with bot');
      }

      const result = await response.json();
      
      if (result.success) {
        const ticketInfo = result.ticket_numbers && result.ticket_numbers.length > 0
          ? `Tickets: ${result.ticket_numbers.join(', ')}`
          : '';
        const latencyInfo = result.avg_latency_ms
          ? `Placed in ${(result.avg_latency_ms / 1000).toFixed(1)}s`
          : '';
        
        setBotResult(`✅ Bets placed successfully! ${ticketInfo} ${latencyInfo}`.trim());
        
        // Wait a moment to show success message, then close
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        throw new Error(result.reason || 'Bot placement failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bets with bot');
    } finally {
      setPlacingWithBot(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'edge':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'middle':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'scalp':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full border text-sm uppercase ${getTypeColor(opportunity.opportunity_type)}`}>
                {opportunity.opportunity_type}
              </span>
              Opportunity
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {opportunity.event_id.substring(0, 30)}...
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Opportunity Details */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Market</p>
                <p className="font-semibold">{opportunity.market_key}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Edge</p>
                <p className="font-semibold text-primary">{opportunity.edge_pct.toFixed(2)}%</p>
              </div>
              {settings && opportunity.legs[0] && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Book</p>
                    <p className="font-semibold">{opportunity.legs[0].book_key}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bankroll (this book)</p>
                    <p className="font-semibold">${(settings.bankrolls[opportunity.legs[0].book_key] || 0).toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-muted-foreground">Calculating optimal stakes...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Calculation Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Kelly Recommendations */}
          {kellyCalc && !loading && (
            <>
              {/* Stake Entry Mode Toggle */}
              <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Stake Entry Mode</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStakeEditMode('suggested')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      stakeEditMode === 'suggested' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-background hover:bg-muted border border-border'
                    }`}
                  >
                    Kelly Suggested
                  </button>
                  <button
                    onClick={() => setStakeEditMode('manual')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      stakeEditMode === 'manual' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-background hover:bg-muted border border-border'
                    }`}
                  >
                    Manual Entry
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Recommended Stakes</h3>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-primary">${kellyCalc.total_stake.toFixed(2)}</p>
                  </div>
                </div>

                {/* Scalp-specific: Show guaranteed profit */}
                {kellyCalc.guaranteed_profit !== undefined && (
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg mb-4">
                    <p className="text-sm text-green-500 font-semibold">Guaranteed Profit</p>
                    <p className="text-2xl font-bold text-green-500">
                      ${kellyCalc.guaranteed_profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kellyCalc.profit_pct?.toFixed(2)}% return
                    </p>
                  </div>
                )}

                {/* Legs */}
                <div className="space-y-3">
                  {kellyCalc.legs.map((leg, idx) => {
                    const bookKey = leg.book;
                    const suggestedStake = leg.stake;
                    const currentStake = stakeEditMode === 'manual' 
                      ? (manualStakes[bookKey] ?? suggestedStake)
                      : suggestedStake;
                    const bookBankroll = settings?.bankrolls[bookKey] || 0;
                    const isOverBankroll = currentStake > bookBankroll;
                    
                    return (
                      <div key={idx} className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{leg.book}</p>
                            <p className="text-sm text-muted-foreground">{leg.outcome}</p>
                          </div>
                          
                          {stakeEditMode === 'manual' ? (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  max={bookBankroll}
                                  step="5"
                                  value={currentStake.toFixed(2)}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setManualStakes({
                                      ...manualStakes,
                                      [bookKey]: value
                                    });
                                  }}
                                  className={`w-28 px-3 py-1.5 bg-background border rounded text-right font-semibold ${
                                    isOverBankroll 
                                      ? 'border-red-500 focus:ring-red-500' 
                                      : 'border-border focus:ring-primary'
                                  } focus:ring-2 focus:border-transparent`}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Suggested: ${suggestedStake.toFixed(2)}
                              </p>
                              {isOverBankroll && (
                                <p className="text-xs text-red-500 font-semibold">
                                  Exceeds bankroll!
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xl font-bold text-primary">
                              ${currentStake.toFixed(2)}
                            </p>
                          )}
                        </div>
                        
                        {/* Bankroll Impact Preview */}
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Current Bankroll:</span>
                            <span className="font-semibold">${bookBankroll.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-muted-foreground">After Bet:</span>
                            <span className={`font-semibold ${
                              isOverBankroll ? 'text-red-500' : 'text-primary'
                            }`}>
                              ${(bookBankroll - currentStake).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Leg-specific details */}
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-muted-foreground">{leg.explanation}</p>
                          
                          {leg.potential_return && (
                            <p className="text-xs">Return: <span className="font-semibold">${leg.potential_return.toFixed(2)}</span></p>
                          )}
                          
                          {leg.full_kelly && (
                            <p className="text-xs">
                              Full Kelly: ${leg.full_kelly.toFixed(2)} | 
                              Using: ${leg.fractional_kelly?.toFixed(2)}
                            </p>
                          )}
                          
                          {leg.edge_pct && (
                            <p className="text-xs">
                              Edge: <span className="text-primary font-semibold">{leg.edge_pct.toFixed(2)}%</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Middle-specific: Best/Worst case */}
              {(kellyCalc.best_case || kellyCalc.worst_case) && (
                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
                  <p className="font-semibold text-purple-500 mb-2">Middle Scenarios</p>
                  {kellyCalc.best_case && (
                    <p className="text-sm mb-1">
                      <span className="text-green-500 font-semibold">Best:</span> {kellyCalc.best_case}
                    </p>
                  )}
                  {kellyCalc.worst_case && (
                    <p className="text-sm">
                      <span className="text-yellow-500 font-semibold">Worst:</span> {kellyCalc.worst_case}
                    </p>
                  )}
                </div>
              )}

              {/* Instructions */}
              {kellyCalc.instructions && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-500">{kellyCalc.instructions}</p>
                </div>
              )}

              {/* Warnings */}
              {kellyCalc.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-500 mb-2">Warnings</p>
                      <ul className="space-y-1">
                        {kellyCalc.warnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-yellow-500">• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bot Success Message */}
        {botResult && (
          <div className="px-6 pb-4">
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm">
              {botResult}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {kellyCalc && !loading && (
          <div className="flex gap-3 p-6 border-t border-border">
            <button
              onClick={onClose}
              disabled={placing || placingWithBot}
              className="px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={logBetsManually}
              disabled={placing || placingWithBot}
              className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {placing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Logging...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Log Manually
                </>
              )}
            </button>
            <button
              onClick={placeBetsWithBot}
              disabled={placing || placingWithBot}
              className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {placingWithBot ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Placing with Bot...
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Place with Bot
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


