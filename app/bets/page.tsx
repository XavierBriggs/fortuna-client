'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { DollarSign, Filter, Calendar, TrendingUp, Trophy, Activity, BarChart3, Wallet, Shield, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/api-settings';
import { UserSettings, UserSettingsUpdate } from '@/types/settings';
import { useGamesStore } from '@/lib/stores/games-store';
import { fetchEvents } from '@/lib/api';
import type { Event } from '@/types';

// All available sportsbooks (from Alexandria database)
const ALL_BOOKS = [
  { key: 'fanduel', name: 'FanDuel' },
  { key: 'draftkings', name: 'DraftKings' },
  { key: 'betmgm', name: 'BetMGM' },
  { key: 'caesars', name: 'Caesars Sportsbook' },
  { key: 'pointsbet', name: 'PointsBet' },
  { key: 'betrivers', name: 'BetRivers' },
  { key: 'hardrockbet', name: 'Hard Rock Bet' },
  { key: 'espnbet', name: 'ESPN BET' },
  { key: 'betonlineag', name: 'BetOnline.ag' },
  { key: 'bovada', name: 'Bovada' },
  { key: 'mybookieag', name: 'MyBookie.ag' },
  { key: 'betus', name: 'BetUS' },
  { key: 'pinnacle', name: 'Pinnacle' },
  { key: 'bookmaker', name: 'Bookmaker' },
  { key: 'circa', name: 'Circa Sports' },
  { key: 'wynnbet', name: 'WynnBET' },
  { key: 'fanatics', name: 'Fanatics' },
  { key: 'unibet', name: 'Unibet' },
  { key: 'williamhill_us', name: 'William Hill US' },
  { key: 'ballybet', name: 'Bally Bet' },
  { key: 'betparx', name: 'BetParx' },
  { key: 'fliff', name: 'Fliff' },
  { key: 'rebet', name: 'Rebet' },
  { key: 'betanysports', name: 'BetAnySports' },
  { key: 'gtbets', name: 'GTBets' },
  { key: 'lowvig', name: 'LowVig' },
  { key: 'sport888', name: '888 Sport' },
  { key: 'williamhill', name: 'William Hill' },
].sort((a, b) => a.name.localeCompare(b.name));

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
  const [activeTab, setActiveTab] = useState<'history' | 'analytics' | 'bankroll'>('history');

  // Get game data for enriching history
  const { getGameById } = useGamesStore();

  // History state
  const [bets, setBets] = useState<BetWithPerformance[]>([]);
  const [events, setEvents] = useState<Map<string, Event>>(new Map());
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

  // Bankroll state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [bankrolls, setBankrolls] = useState<Record<string, number>>({});
  const [kellyFraction, setKellyFraction] = useState(0.25);
  const [minEdge, setMinEdge] = useState(1.0);
  const [maxStake, setMaxStake] = useState(10.0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadBets();
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportFilter, bookFilter, resultFilter]);

  useEffect(() => {
    if (activeTab === 'bankroll') {
      loadSettings();
    }
  }, [activeTab]);

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

  const loadEvents = async () => {
    try {
      // Fetch events for the current sport filter (or default to basketball_nba)
      const sport = sportFilter || 'basketball_nba';
      const eventsData = await fetchEvents(sport);

      // Create a map of event_id -> Event
      const eventsMap = new Map<string, Event>();
      eventsData.forEach((event: Event) => {
        eventsMap.set(event.event_id, event);
      });

      setEvents(eventsMap);
    } catch (err) {
      console.error('Failed to load events:', err);
      // Don't show error to user, just log it - we can fall back to showing IDs
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

  const loadSettings = async () => {
    try {
      setLoading(true);
      setSaveError(null);
      const data = await getSettings();
      setSettings(data);
      setBankrolls(data.bankrolls || {});
      setKellyFraction(data.kelly_fraction);
      setMinEdge(data.min_edge_threshold);
      setMaxStake(data.max_stake_pct);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const update: UserSettingsUpdate = {
        bankrolls,
        kelly_fraction: kellyFraction,
        min_edge_threshold: minEdge,
        max_stake_pct: maxStake,
      };

      const response = await updateSettings(update);
      setSettings(response.settings);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getTotalBankroll = () => {
    return Object.values(bankrolls).reduce((sum, amount) => sum + amount, 0);
  };

  const getKellyLabel = () => {
    const fraction = 1 / kellyFraction;
    return `1/${Math.round(fraction)} Kelly`;
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
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors relative ${activeTab === 'history'
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
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors relative ${activeTab === 'analytics'
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

          <button
            onClick={() => setActiveTab('bankroll')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors relative ${activeTab === 'bankroll'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Wallet className="h-4 w-4" />
            Bankroll
            {activeTab === 'bankroll' && (
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
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card/50 backdrop-blur-sm border-b border-border text-xs uppercase text-muted-foreground font-medium">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Game</th>
                      <th className="px-4 py-3 text-left font-semibold">Market</th>
                      <th className="px-4 py-3 text-left font-semibold">Book</th>
                      <th className="px-4 py-3 text-left font-semibold">Outcome</th>
                      <th className="px-4 py-3 text-right font-semibold">Stake</th>
                      <th className="px-4 py-3 text-right font-semibold">Odds</th>
                      <th className="px-4 py-3 text-center font-semibold">CLV</th>
                      <th className="px-4 py-3 text-center font-semibold">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <p>Loading bets...</p>
                          </div>
                        </td>
                      </tr>
                    ) : bets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                            <p>No bets found. Place your first bet from the opportunities page!</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      bets.map((bet) => {
                        // Try to get event data first (from API), then fall back to game data (from game store)
                        const event = events.get(bet.event_id);
                        const game = getGameById(bet.event_id);

                        return (
                          <tr key={bet.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatDate(bet.placed_at)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {event || game ? (
                                <div>
                                  <div className="flex items-center gap-2">
                                    {game?.status === 'live' && (
                                      <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                      </div>
                                    )}
                                    <div className="font-medium text-foreground">
                                      {game ? (
                                        `${game.away_team_abbr} @ ${game.home_team_abbr}`
                                      ) : event ? (
                                        `${event.away_team} @ ${event.home_team}`
                                      ) : ''}
                                    </div>
                                  </div>
                                  {game?.status === 'live' && (
                                    <div className="text-[10px] text-red-500 font-bold mt-0.5 uppercase tracking-wider">
                                      LIVE {game.away_score}-{game.home_score} • {game.period_label}
                                    </div>
                                  )}
                                  {game?.status === 'final' && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                                      Final: {game.away_score}-{game.home_score}
                                    </div>
                                  )}
                                  {game?.status === 'upcoming' && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                                      {new Date(game.commence_time).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  )}
                                  {!game && event && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                                      {new Date(event.commence_time).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <div className="max-w-[150px] truncate text-muted-foreground" title={bet.event_id}>
                                    {bet.event_id.substring(0, 20)}...
                                  </div>
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{bet.sport_key}</div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {bet.market_key}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground">
                              {bet.book_key}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="bg-accent/50 px-2 py-0.5 rounded text-accent-foreground font-medium text-xs">
                                {bet.outcome_name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                              ${bet.stake_amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-mono text-primary font-bold">
                              {formatOdds(bet.bet_price)}
                            </td>
                            <td className="px-4 py-3 text-center relative group/clv">
                              {bet.clv_cents !== undefined && bet.clv_cents !== null ? (
                                <>
                                  <span className={`text-sm font-bold cursor-help border-b border-dotted border-current ${getCLVColor(bet.clv_cents)}`}>
                                    {bet.clv_cents > 0 ? '+' : ''}{bet.clv_cents.toFixed(2)}¢
                                  </span>

                                  {/* CLV Tooltip */}
                                  <div className="absolute hidden group-hover/clv:block right-0 top-full mt-2 bg-popover/95 backdrop-blur-md text-popover-foreground border border-border/50 rounded-lg shadow-xl p-3 z-50 min-w-[180px] animate-in fade-in zoom-in-95 duration-200 text-left">
                                    <div className="text-xs space-y-2">
                                      <div className="font-bold border-b border-border/50 pb-1 mb-1">CLV Calculation</div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bet Price:</span>
                                        <span className="font-mono font-semibold">{formatOdds(bet.bet_price)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Closing Line:</span>
                                        <span className="font-mono font-semibold">
                                          {bet.closing_line_price ? formatOdds(bet.closing_line_price) : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between pt-1 border-t border-border/50 mt-1">
                                        <span className="text-muted-foreground">Diff:</span>
                                        <span className={`font-mono font-bold ${getCLVColor(bet.clv_cents)}`}>
                                          {bet.clv_cents > 0 ? '+' : ''}{bet.clv_cents.toFixed(2)}¢
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Pending</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getResultBadge(bet.result)}`}>
                                {bet.result}
                              </span>
                            </td>
                          </tr>
                        );
                      })
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

        {/* Bankroll Tab */}
        {activeTab === 'bankroll' && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading bankroll settings...</p>
              </div>
            ) : (
              <>
                {/* Error Message */}
                {saveError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3 mb-6">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Error</p>
                      <p className="text-sm mt-1">{saveError}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {saveSuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg flex items-center gap-3 mb-6">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-semibold">Settings saved successfully!</p>
                  </div>
                )}

                {/* Total Bankroll Summary */}
                <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Bankroll Across All Books</p>
                      <p className="text-4xl font-bold text-primary">${getTotalBankroll().toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-12 w-12 text-primary/50" />
                  </div>
                </div>

                {/* Recent Activity Indicator */}
                {settings && (
                  <div className="bg-card border border-border rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Bankroll Status</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You&apos;re currently tracking {Object.keys(bankrolls).length} sportsbooks.
                      Your total bankroll is <span className="font-semibold text-foreground">${getTotalBankroll().toLocaleString()}</span>.
                    </p>
                  </div>
                )}
                {/* Per-Book Bankrolls */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Per-Book Bankrolls</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Set your current bankroll for each sportsbook. Kelly sizing will use the specific book's bankroll.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                    {ALL_BOOKS.map((book) => (
                      <div key={book.key}>
                        <label className="block text-sm font-medium mb-2">{book.name}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={bankrolls[book.key] || 0}
                            onChange={(e) => setBankrolls({ ...bankrolls, [book.key]: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kelly Fraction */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Kelly Criterion Settings</h2>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Kelly Fraction</label>
                      <span className="text-lg font-bold text-primary">{getKellyLabel()}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={kellyFraction}
                      onChange={(e) => setKellyFraction(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1/10 (Very Conservative)</span>
                      <span>1/4 (Recommended)</span>
                      <span>1/2 (Moderate)</span>
                      <span>Full Kelly (Aggressive)</span>
                    </div>
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-500">
                      <strong>Recommendation:</strong> 1/4 Kelly (0.25) balances growth and risk. Full Kelly is too aggressive even with perfect edge estimates.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Minimum Edge Threshold (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={minEdge}
                        onChange={(e) => setMinEdge(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Only show opportunities above this edge</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Maximum Stake (% of bankroll)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={maxStake}
                        onChange={(e) => setMaxStake(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Safety cap to limit variance</p>
                    </div>
                  </div>
                </div>

                {/* Best Practices */}
                <div className="bg-card border border-yellow-500/20 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold text-yellow-500">Best Practices</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Keep separate bankrolls for each book - this matches your real account structure</li>
                    <li>• Use 1/4 Kelly for conservative bankroll growth (recommended for most bettors)</li>
                    <li>• Set minimum edge at 1-2% to account for estimation uncertainty</li>
                    <li>• Never bet more than 10% of your bankroll on a single bet (5% is safer)</li>
                    <li>• Rebalance your bankrolls periodically by withdrawing profits or adding funds</li>
                    <li>• Track your CLV (Closing Line Value) - if consistently negative, recalibrate your edge estimates</li>
                  </ul>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Bankroll Settings
                    </>
                  )}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
