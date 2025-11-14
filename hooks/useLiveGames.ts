import { useState, useEffect, useCallback } from 'react';
import { minervaAPI, Game } from '@/lib/minerva-api';
import { useMinervaWebSocket } from './useMinervaWebSocket';

export function useLiveGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connected, liveGames: wsLiveGames } = useMinervaWebSocket();

  // Initial fetch
  const fetchLiveGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedGames = await minervaAPI.getLiveGames();
      setGames(fetchedGames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch live games');
      console.error('Error fetching live games:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveGames();
  }, [fetchLiveGames]);

  // Update games with WebSocket data
  useEffect(() => {
    if (wsLiveGames.length > 0) {
      setGames(prevGames => {
        const gamesMap = new Map(prevGames.map(g => [g.game_id, g]));
        
        // Update with WebSocket data
        wsLiveGames.forEach(wsGame => {
          const existing = gamesMap.get(wsGame.game_id);
          if (existing) {
            // Merge WebSocket data with existing game
            gamesMap.set(wsGame.game_id, {
              ...existing,
              game_status: wsGame.game_status as any,
              home_score: wsGame.home_score,
              away_score: wsGame.away_score,
              period: wsGame.period,
              time_remaining: wsGame.time_remaining,
            });
          } else {
            // Add new game from WebSocket
            gamesMap.set(wsGame.game_id, wsGame as unknown as Game);
          }
        });
        
        return Array.from(gamesMap.values());
      });
    }
  }, [wsLiveGames]);

  return {
    liveGames: games,
    loading,
    error,
    refetchLiveGames: fetchLiveGames,
    wsConnected: connected,
  };
}

