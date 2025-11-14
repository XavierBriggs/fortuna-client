'use client';

import { useState, useEffect } from 'react';
import { minervaAPI, BackfillRequest, BackfillStatus } from '@/lib/minerva-api';
import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

interface BackfillControlsProps {
  onSuccess?: () => void;
}

export function BackfillControls({ onSuccess }: BackfillControlsProps) {
  const [status, setStatus] = useState<BackfillStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const statusData = await minervaAPI.getBackfillStatus();
      setStatus(statusData);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const triggerBackfill = async (seasonId: string) => {
    try {
      setLoading(true);
      setError(null);

      const request: BackfillRequest = {
        sport: 'basketball_nba',
        season_id: parseInt(seasonId.replace('-', '')),
      };

      await minervaAPI.triggerBackfill(request);
      setTimeout(() => {
        fetchStatus();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start backfill');
    } finally {
      setLoading(false);
    }
  };

  const isRunning = status?.status === 'running';

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {status && (
        <div className={`rounded-lg p-4 ${
          status.status === 'running' 
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
            : status.status === 'completed'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : status.status === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
        }`}>
          <div className="flex items-center gap-3">
            {status.status === 'running' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
            {status.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {status.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white capitalize">
                {status.status}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {status.message}
              </div>
            </div>
          </div>
          {status.progress && status.total && (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{Math.round((status.progress / status.total) * 100)}%</span>
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
      )}

      {/* Quick Backfill Buttons */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Quick Load Season
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['2024-25', '2023-24', '2022-23', '2021-22'].map(season => (
            <button
              key={season}
              onClick={() => triggerBackfill(season)}
              disabled={loading || isRunning}
              className="relative overflow-hidden px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
            >
              {season}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg p-4">
          <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h5 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">
          ℹ️ About Data Loading
        </h5>
        <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Loads complete season data from ESPN</li>
          <li>• Takes 2-5 minutes depending on season size</li>
          <li>• Only one operation can run at a time</li>
          <li>• Progress updates automatically every 3 seconds</li>
        </ul>
      </div>
    </div>
  );
}

