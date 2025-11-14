'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Settings, Bot } from 'lucide-react';

interface BotStatus {
  available: boolean;
  logged_in: boolean;
  browser_mode?: string;
  error?: string;
}

export default function SettingsPage() {
  // Bot settings
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [checkingBot, setCheckingBot] = useState(false);

  useEffect(() => {
    checkBotStatus();
  }, []);

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


  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure automated betting bot</p>
          </div>
        </div>

        {/* Quick Link to Bankroll */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-500">
            💡 <strong>Looking for bankroll and Kelly settings?</strong> They've moved to the{' '}
            <a href="/bets" className="underline font-semibold hover:text-blue-400">
              Betting Dashboard → Bankroll tab
            </a>
          </p>
        </div>

        {/* Bot Configuration */}
        <div className="bg-card border border-border rounded-lg p-6">
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
      </div>
    </div>
  );
}

