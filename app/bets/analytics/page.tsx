'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { TrendingUp, DollarSign, Trophy, Activity } from 'lucide-react';

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

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<BetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8081/api/v1/bets/summary');
      if (!response.ok) throw new Error('Failed to fetch summary');
      
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8 text-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8">
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4">
            {error || 'No data available'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">P&L Analytics</h1>
            <p className="text-muted-foreground">Performance metrics and profitability analysis</p>
          </div>
        </div>

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
      </div>
    </div>
  );
}




