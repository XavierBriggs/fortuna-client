'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Settings, DollarSign, TrendingUp, Shield, Save, AlertCircle, CheckCircle2, Bot } from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/api-settings';
import { UserSettings, UserSettingsUpdate } from '@/types/settings';

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

interface BotStatus {
  available: boolean;
  logged_in: boolean;
  browser_mode?: string;
  error?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [bankrolls, setBankrolls] = useState<Record<string, number>>({});
  const [kellyFraction, setKellyFraction] = useState(0.25);
  const [minEdge, setMinEdge] = useState(1.0);
  const [maxStake, setMaxStake] = useState(10.0);
  
  // Bot settings
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [checkingBot, setCheckingBot] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
    checkBotStatus();
  }, []);

  // Auto-reload settings when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSettings();
      }
    };

    const handleFocus = () => {
      loadSettings();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSettings();
      setSettings(data);
      setBankrolls(data.bankrolls || {});
      setKellyFraction(data.kelly_fraction);
      setMinEdge(data.min_edge_threshold);
      setMaxStake(data.max_stake_pct);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const checkBotStatus = async () => {
    try {
      setCheckingBot(true);
      const response = await fetch('http://localhost:8085/api/v1/status');
      if (response.ok) {
        const data = await response.json();
        setBotStatus({
          available: data.available,
          logged_in: data.logged_in,
          browser_mode: data.automation_enabled ? 'auto' : 'manual'
        });
      } else {
        setBotStatus({ available: false, logged_in: false, error: 'Service unavailable' });
      }
    } catch (err) {
      setBotStatus({ available: false, logged_in: false, error: 'Cannot connect to bot service' });
    } finally {
      setCheckingBot(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const update: UserSettingsUpdate = {
        bankrolls,
        kelly_fraction: kellyFraction,
        min_edge_threshold: minEdge,
        max_stake_pct: maxStake,
      };

      const response = await updateSettings(update);
      setSettings(response.settings);
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure your bankroll and betting parameters</p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3 mb-6">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
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
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-sm font-medium">Bankroll Status</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(settings.updated_at).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Page automatically refreshes when you return from placing bets
                </p>
              </div>
            )}

            {/* Per-Book Bankrolls */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
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

            {/* Bot Configuration */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Automated Bot Configuration</h2>
              </div>
              
              {/* Bot Status */}
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1">Bot Service Status</p>
                    {checkingBot ? (
                      <p className="text-sm text-muted-foreground">Checking...</p>
                    ) : botStatus ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${botStatus.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <p className="text-sm">
                            {botStatus.available ? 'Connected' : 'Disconnected'}
                          </p>
                        </div>
                        {botStatus.available && (
                          <p className="text-xs text-muted-foreground">
                            Login Status: {botStatus.logged_in ? '✓ Logged in to BetOnline' : '✗ Not logged in'}
                          </p>
                        )}
                        {botStatus.error && (
                          <p className="text-xs text-red-500">{botStatus.error}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Unknown</p>
                    )}
                  </div>
                  <button
                    onClick={checkBotStatus}
                    disabled={checkingBot}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Configuration Info */}
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-500">
                  <strong>How it works:</strong> When you click "Place with Bot" in the bet modal, the bot service automatically places bets on BetOnline.ag using browser automation.
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded text-sm">
                  <p className="font-semibold text-purple-500 mb-2">Browser Modes:</p>
                  <ul className="space-y-1 text-purple-500">
                    <li>• <strong>Local</strong> (Default): Free, runs on your machine</li>
                    <li>• <strong>Bright Data</strong>: Cloud-based, $0.02-0.10/bet, includes anti-detection & CAPTCHA solving</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Browser mode is configured via environment variables in the bet-bot service
                  </p>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-500">
                  <strong>Note:</strong> Bot credentials for BetOnline must be configured on the bet-bot service. See the service documentation for setup instructions.
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
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
                  Save Settings
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

