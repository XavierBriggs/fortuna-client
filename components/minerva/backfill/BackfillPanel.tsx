'use client';

import { useState, useEffect } from 'react';
import { minervaAPI, BackfillRequest, BackfillStatus } from '@/lib/minerva-api';

export function BackfillPanel() {
  const [status, setStatus] = useState<BackfillStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [sport, setSport] = useState('basketball_nba');
  const [seasonId, setSeasonId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch status on mount and periodically
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const statusData = await minervaAPI.getBackfillStatus();
      setStatus(statusData);
    } catch (err) {
      console.error('Failed to fetch backfill status:', err);
    }
  };

  const handleQuickBackfill = async (season: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const request: BackfillRequest = {
        sport: 'basketball_nba',
        season_id: parseInt(season.replace('-', '')), // Convert "2024-25" to 202425
      };

      const response = await minervaAPI.triggerBackfill(request);
      setSuccessMessage(`Backfill started for ${season} season!`);
      
      // Refresh status
      setTimeout(fetchStatus, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start backfill');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomBackfill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const request: BackfillRequest = {
        sport,
        ...(seasonId && { season_id: parseInt(seasonId) }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      };

      const response = await minervaAPI.triggerBackfill(request);
      setSuccessMessage('Backfill job submitted successfully!');
      
      // Reset form
      setSeasonId('');
      setStartDate('');
      setEndDate('');
      
      // Refresh status
      setTimeout(fetchStatus, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start backfill');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Backfill Status</h3>
        {status ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)} ${status.status === 'running' ? 'animate-pulse' : ''}`}></div>
              <span className="font-semibold text-gray-900 dark:text-white capitalize">{status.status}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{status.message}</p>
            {status.progress && status.total && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{status.progress} / {status.total}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(status.progress / status.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">Loading status...</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Quick Backfill</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Backfill an entire NBA season with one click
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['2024-25', '2023-24', '2022-23', '2021-22'].map(season => (
            <button
              key={season}
              onClick={() => handleQuickBackfill(season)}
              disabled={loading || status?.status === 'running'}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {season}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Backfill Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Custom Backfill</h3>
        <form onSubmit={handleCustomBackfill} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sport
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="basketball_nba">NBA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Season ID (Optional)
            </label>
            <input
              type="text"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              placeholder="e.g., 202425"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || status?.status === 'running'}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? 'Starting Backfill...' : 'Start Custom Backfill'}
          </button>
        </form>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">ℹ️ About Backfilling</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Backfill jobs run in the background and may take several minutes</li>
          <li>• Only one backfill job can run at a time</li>
          <li>• Historical data is fetched from ESPN's API</li>
          <li>• Progress updates refresh automatically every 5 seconds</li>
        </ul>
      </div>
    </div>
  );
}

