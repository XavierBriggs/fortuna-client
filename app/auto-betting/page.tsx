'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  getAutoBettingSettings, 
  updateAutoBettingSettings, 
  getAutoBettingState,
  pauseAutoBetting,
  resumeAutoBetting,
  type AutoBettingSettings,
  type AutoBettingState 
} from '@/lib/auto-betting-api';

export default function AutoBettingPage() {
  const [settings, setSettings] = useState<AutoBettingSettings | null>(null);
  const [state, setState] = useState<AutoBettingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  useEffect(() => {
    loadData();
    
    // Refresh state every 10 seconds
    const interval = setInterval(loadState, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, stateData] = await Promise.all([
        getAutoBettingSettings(),
        getAutoBettingState(),
      ]);
      setSettings(settingsData);
      setState(stateData);
    } catch (error) {
      console.error('Failed to load auto-betting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadState = async () => {
    try {
      const stateData = await getAutoBettingState();
      setState(stateData);
    } catch (error) {
      console.error('Failed to refresh state:', error);
    }
  };

  const handleToggle = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      await updateAutoBettingSettings({
        user_id: settings.user_id,
        auto_betting_enabled: !settings.auto_betting_enabled,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle auto-betting:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePauseResume = async () => {
    if (!state) return;
    
    try {
      if (state.is_paused) {
        await resumeAutoBetting();
      } else {
        await pauseAutoBetting('default', 'manual pause via dashboard');
      }
      await loadState();
    } catch (error) {
      console.error('Failed to pause/resume:', error);
    }
  };

  const handleUpdateSettings = async (updates: Partial<AutoBettingSettings>) => {
    if (!settings) return;
    
    try {
      setSaving(true);
      await updateAutoBettingSettings({ ...updates, user_id: settings.user_id });
      await loadData();
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-950 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-gray-400">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  const winRate = state && state.total_bets_placed > 0 
    ? ((state.total_bets_won / state.total_bets_placed) * 100).toFixed(1)
    : '0.0';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">🤖 Auto-Betting</h1>
            <p className="text-gray-400 mt-1">Automated betting system with risk management</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/auto-betting/decisions"
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              View Decisions
            </Link>
            
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                settings?.auto_betting_enabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {settings?.auto_betting_enabled ? '✓ Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {state?.is_paused && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">⚠️</span>
                <span className="text-yellow-200 font-medium">Auto-betting is paused</span>
                <span className="text-yellow-300/70">• {state.pause_reason}</span>
              </div>
              <button
                onClick={handlePauseResume}
                className="px-4 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded transition-colors"
              >
                Resume
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && state && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Total Exposure</div>
              <div className="text-3xl font-bold text-white">${state.total_exposure.toFixed(2)}</div>
              <div className="text-gray-500 text-sm mt-2">
                Limit: ${settings?.auto_max_exposure_total.toFixed(2)}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Today's P&L</div>
              <div className={`text-3xl font-bold ${state.todays_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {state.todays_pnl >= 0 ? '+' : ''} ${state.todays_pnl.toFixed(2)}
              </div>
              <div className="text-gray-500 text-sm mt-2">
                {state.bets_placed_today} bets placed
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Win Rate</div>
              <div className="text-3xl font-bold text-white">{winRate}%</div>
              <div className="text-gray-500 text-sm mt-2">
                {state.total_bets_won}W / {state.total_bets_lost}L
              </div>
            </div>

            {/* Rate Limits */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Hourly Rate</div>
              <div className="text-2xl font-bold text-white">
                {state.bets_placed_last_hour} / {settings?.auto_max_bets_per_hour}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((state.bets_placed_last_hour / (settings?.auto_max_bets_per_hour || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Daily Rate</div>
              <div className="text-2xl font-bold text-white">
                {state.bets_placed_today} / {settings?.auto_max_bets_per_day}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((state.bets_placed_today / (settings?.auto_max_bets_per_day || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Loss Streak</div>
              <div className={`text-2xl font-bold ${state.current_loss_streak >= (settings?.auto_pause_on_loss_streak || 5) ? 'text-red-400' : 'text-white'}`}>
                {state.current_loss_streak}
              </div>
              <div className="text-gray-500 text-sm mt-2">
                Pause at {settings?.auto_pause_on_loss_streak}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && settings && (
          <div className="space-y-6">
            {/* Opportunity Types */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Opportunity Types</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Edge Betting</div>
                    <div className="text-gray-400 text-sm">Single bets with positive expected value</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auto_enabled_opportunity_types.includes('edge')}
                    onChange={(e) => {
                      const types = e.target.checked 
                        ? [...settings.auto_enabled_opportunity_types, 'edge']
                        : settings.auto_enabled_opportunity_types.filter(t => t !== 'edge');
                      handleUpdateSettings({ auto_enabled_opportunity_types: types });
                    }}
                    className="w-5 h-5"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Middle Betting</div>
                    <div className="text-gray-400 text-sm">Two-leg opportunities with win-win potential</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auto_middle_enabled}
                    onChange={(e) => handleUpdateSettings({ auto_middle_enabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Scalp (Arbitrage) Betting</div>
                    <div className="text-gray-400 text-sm">Multi-leg guaranteed profit opportunities</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auto_scalp_enabled}
                    onChange={(e) => handleUpdateSettings({ auto_scalp_enabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                </label>
              </div>
            </div>

            {/* Risk Management */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Risk Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Min Edge %</label>
                  <input
                    type="number"
                    value={settings.auto_min_edge_pct}
                    onChange={(e) => handleUpdateSettings({ auto_min_edge_pct: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Max Stake Per Bet ($)</label>
                  <input
                    type="number"
                    value={settings.auto_max_stake_per_bet}
                    onChange={(e) => handleUpdateSettings({ auto_max_stake_per_bet: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Max Total Exposure ($)</label>
                  <input
                    type="number"
                    value={settings.auto_max_exposure_total}
                    onChange={(e) => handleUpdateSettings({ auto_max_exposure_total: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Kelly Fraction</label>
                  <input
                    type="number"
                    value={settings.kelly_fraction}
                    onChange={(e) => handleUpdateSettings({ kelly_fraction: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                    step="0.1"
                    min="0"
                    max="1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

