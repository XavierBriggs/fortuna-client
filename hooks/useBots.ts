'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchBotStatus, fetchRecentBets, type BotStatus, type Bet } from '@/lib/bot-api';

const POLL_INTERVAL = 5000; // 5 seconds

export function useBots() {
  const [bots, setBots] = useState<BotStatus[]>([]);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const updateBots = useCallback(async () => {
    try {
      const statusResponse = await fetchBotStatus();
      setBots(statusResponse.bots);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bot status');
      console.error('Error updating bots:', err);
    }
  }, []);

  const updateRecentBets = useCallback(async () => {
    try {
      const betsResponse = await fetchRecentBets(undefined, 50);
      setRecentBets(betsResponse.bets);
      setError(null);
    } catch (err) {
      console.error('Error updating recent bets:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([updateBots(), updateRecentBets()]);
    setIsLoading(false);
  }, [updateBots, updateRecentBets]);

  useEffect(() => {
    // Initial load
    refresh();

    // Set up polling interval
    const interval = setInterval(() => {
      updateBots();
      updateRecentBets();
    }, POLL_INTERVAL);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - updateBots and updateRecentBets are stable callbacks

  return {
    bots,
    recentBets,
    isLoading,
    error,
    lastUpdate,
    refresh,
  };
}

