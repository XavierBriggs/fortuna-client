'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { DollarSign, Filter, Calendar, TrendingUp, Trophy, Activity, BarChart3 } from 'lucide-react';

interface BetWithPerformance {
  id: number;
  sport_key: string;
  event_id: string;
  market_key: string;
  book_key: string;
  outcome_name: string;
  bet_type: string;
  stake_amount: number;
  bet_price: number;
  placed_at: string;
  result: string;
  payout_amount?: number;
  clv_cents?: number;
  closing_line_price?: number;
}

interface BetSummary {
  total_bets: number;
  total_wagered: number;
  total_returned: number;
  net_profit: number;
  roi_pct: number;
  avg_clv_cents: number;
  win_rate_pct: number;
  by_sport: { [key: string]: SportSummary };
  by_book: { [key: string]: BookSummary };
}

interface SportSummary {
  count: number;
  wagered: number;
  returned: number;
  net_profit: number;
  roi_pct: number;
}

interface BookSummary {
  count: number;
  wagered: number;
  returned: number;
  net_profit: number;
  roi_pct: number;
  win_rate_pct: number;
}

export default function BetsPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'analytics'>('history');
  
  // History state
  const [bets, setBets] = useState<BetWithPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [sportFilter, setSportFilter] = useState<string>('');
  const [bookFilter, setBookFilter] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');

  // Analytics state
  const [summary, setSummary] = useState<BetSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    loadBets();
  }, [sportFilter, bookFilter, resultFilter]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadSummary();
    }
  }, [activeTab]);

  const loadBets = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (sportFilter) params.append('sport', sportFilter);
      if (bookFilter) params.append('book', bookFilter);
      if (resultFilter) params.append('result', resultFilter);
      params.append('limit', '50');

      const response = await fetch(`http://localhost:8081/api/v1/bets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bets');

      const data = await response.json();
      setBets(data.bets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bets');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const response = await fetch('http://localhost:8081/api/v1/bets/summary');
      if (!response.ok) throw new Error('Failed to fetch summary');
      
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const getCLVColor = (clv?: number) => {
    if (clv === undefined || clv === null) return 'text-muted-foreground';
    if (clv > 2) return 'text-green-500';
    if (clv > 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultBadge = (result: string) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      win: 'bg-green-500/10 text-green-500 border-green-500/20',
      loss: 'bg-red-500/10 text-red-500 border-red-500/20',
      push: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      void: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    };
    return colors[result as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Betting Dashboard</h1>
            <p className="text-muted-foreground">Track your bets, CLV performance, and profitability</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'history'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            History
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'analytics'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
            {activeTab === 'analytics' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* History Tab */}
        {activeTab === 'history' && (
          <>
            {/* Filters */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    value={sportFilter}
                    onChange={(e) => setSportFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">All Sports</option>
                    <option value="basketball_nba">NBA</option>
                    <option value="american_football_nfl">NFL</option>
                    <option value="baseball_mlb">MLB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Book</label>
                  <input
                    type="text"
                    value={bookFilter}
                    onChange={(e) => setBookFilter(e.target.value)}
                    placeholder="e.g., fanduel"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Result</label>
                  <select
                    value={resultFilter}
                    onChange={(e) => setResultFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">All Results</option>
                    <option value="pending">Pending</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="push">Push</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Total Bets</label>
                  <div className="px-3 py-2 bg-background border border-border rounded-lg text-center">
                    <span className="text-2xl font-bold text-primary">{bets.length}</span>
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

            {/* Bets Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Event</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Market</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Book</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Outcome</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Stake</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Odds</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">CLV</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                          Loading bets...
                        </td>
                      </tr>
                    ) : bets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                          No bets found. Place your first bet from the opportunities page!
                        </td>
                      </tr>
                    ) : (
                      bets.map((bet) => (
                        <tr key={bet.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-sm">
                            {formatDate(bet.placed_at)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="max-w-[150px] truncate" title={bet.event_id}>
                              {bet.event_id.substring(0, 20)}...
                            </div>
                            <div className="text-xs text-muted-foreground">{bet.sport_key}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {bet.market_key}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {bet.book_key}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {bet.outcome_name}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold">
                            ${bet.stake_amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono">
                            {formatOdds(bet.bet_price)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {bet.clv_cents !== undefined && bet.clv_cents !== null ? (
                              <span className={`text-sm font-semibold ${getCLVColor(bet.clv_cents)}`}>
                                {bet.clv_cents > 0 ? '+' : ''}{bet.clv_cents.toFixed(2)}¢
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase border ${getResultBadge(bet.result)}`}>
                              {bet.result}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CLV Legend */}
            {bets.length > 0 && (
              <div className="mt-6 bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">CLV (Closing Line Value)</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-500 font-semibold">&gt;2¢:</span> Excellent (sharp bet)
                  </div>
                  <div>
                    <span className="text-yellow-500 font-semibold">0-2¢:</span> Good (beat the close)
                  </div>
                  <div>
                    <span className="text-red-500 font-semibold">&lt;0¢:</span> Poor (missed value)
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            {analyticsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            ) : analyticsError || !summary ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4">
                {analyticsError || 'No data available'}
              </div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-blue-500" />
                      <p className="text-sm text-muted-foreground">Total Wagered</p>
                    </div>
                    <p className="text-3xl font-bold">${summary.total_wagered.toFixed(2)}</p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                    </div>
                    <p className={`text-3xl font-bold ${summary.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {summary.net_profit >= 0 ? '+' : ''}${summary.net_profit.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <p className="text-sm text-muted-foreground">ROI</p>
                    </div>
                    <p className={`text-3xl font-bold ${summary.roi_pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {summary.roi_pct >= 0 ? '+' : ''}{summary.roi_pct.toFixed(2)}%
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      <p className="text-sm text-muted-foreground">Avg CLV</p>
                    </div>
                    <p className={`text-3xl font-bold ${summary.avg_clv_cents >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {summary.avg_clv_cents >= 0 ? '+' : ''}{summary.avg_clv_cents.toFixed(2)}¢
                    </p>
                  </div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Bets</span>
                        <span className="font-semibold">{summary.total_bets}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Returned</span>
                        <span className="font-semibold">${summary.total_returned.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Win Rate</span>
                        <span className="font-semibold">{summary.win_rate_pct.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Stake</span>
                        <span className="font-semibold">
                          ${summary.total_bets > 0 ? (summary.total_wagered / summary.total_bets).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Performance Indicators</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">CLV Quality</span>
                          <span className="text-sm font-semibold">{summary.avg_clv_cents.toFixed(2)}¢</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${summary.avg_clv_cents > 2 ? 'bg-green-500' : summary.avg_clv_cents > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, (summary.avg_clv_cents + 5) * 10))}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Profitability</span>
                          <span className="text-sm font-semibold">{summary.roi_pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${summary.roi_pct > 5 ? 'bg-green-500' : summary.roi_pct > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, summary.roi_pct * 2 + 50))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* By Sport */}
                {summary.by_sport && Object.keys(summary.by_sport).length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">Performance by Sport</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Sport</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Bets</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Wagered</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Returned</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Profit</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">ROI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {Object.entries(summary.by_sport).map(([sport, data]) => (
                            <tr key={sport}>
                              <td className="px-4 py-3 text-sm font-medium">{sport}</td>
                              <td className="px-4 py-3 text-right text-sm">{data.count}</td>
                              <td className="px-4 py-3 text-right text-sm">${data.wagered.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-sm">${data.returned.toFixed(2)}</td>
                              <td className={`px-4 py-3 text-right text-sm font-semibold ${data.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data.net_profit >= 0 ? '+' : ''}${data.net_profit.toFixed(2)}
                              </td>
                              <td className={`px-4 py-3 text-right text-sm font-semibold ${data.roi_pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data.roi_pct >= 0 ? '+' : ''}{data.roi_pct.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* By Book */}
                {summary.by_book && Object.keys(summary.by_book).length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Performance by Book</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Book</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Bets</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Win Rate</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Wagered</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Profit</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">ROI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {Object.entries(summary.by_book).map(([book, data]) => (
                            <tr key={book}>
                              <td className="px-4 py-3 text-sm font-medium">{book}</td>
                              <td className="px-4 py-3 text-right text-sm">{data.count}</td>
                              <td className="px-4 py-3 text-right text-sm">{data.win_rate_pct.toFixed(1)}%</td>
                              <td className="px-4 py-3 text-right text-sm">${data.wagered.toFixed(2)}</td>
                              <td className={`px-4 py-3 text-right text-sm font-semibold ${data.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data.net_profit >= 0 ? '+' : ''}${data.net_profit.toFixed(2)}
                              </td>
                              <td className={`px-4 py-3 text-right text-sm font-semibold ${data.roi_pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data.roi_pct >= 0 ? '+' : ''}{data.roi_pct.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
