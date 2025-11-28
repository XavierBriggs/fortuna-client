import { useState, useEffect, useCallback } from 'react';
import { minervaAPI, Game } from '@/lib/minerva-api';
import { useMinervaWebSocket } from './useMinervaWebSocket';

export function useLiveGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connected, liveGames: wsLiveGames } = useMinervaWebSocket();

  // Initial fetch - get all of today's games (live, scheduled, final)
  const fetchLiveGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try the new getTodaysGames endpoint first for a complete view
      try {
        const todaysGames = await minervaAPI.getTodaysGames();
        if (todaysGames.length > 0) {
          setGames(todaysGames);
          return;
        }
      } catch (e) {
        console.log('getTodaysGames not available, falling back to live + upcoming');
      }
      
      // Fallback: get live games first, then upcoming
      const liveGames = await minervaAPI.getLiveGames();
      
      if (liveGames.length > 0) {
        // If there are live games, also fetch upcoming to show full picture
        const upcomingGames = await minervaAPI.getUpcomingGames();
        const allGames = [...liveGames, ...upcomingGames];
        
        // Deduplicate by game_id
        const uniqueGames = allGames.reduce((acc, game) => {
          if (!acc.find(g => g.game_id === game.game_id)) {
            acc.push(game);
          }
          return acc;
        }, [] as Game[]);
        
        setGames(uniqueGames);
      } else {
        // No live games, fetch upcoming
        const upcomingGames = await minervaAPI.getUpcomingGames();
        setGames(upcomingGames);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveGames();
    
    // Set up polling for updates every 30 seconds
    const pollInterval = setInterval(() => {
      fetchLiveGames();
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, [fetchLiveGames]);

  // Update games with WebSocket data in real-time
  useEffect(() => {
    if (wsLiveGames.length > 0) {
      setGames(prevGames => {
        const gamesMap = new Map(prevGames.map(g => [String(g.game_id), g]));
        
        // Update with WebSocket data
        wsLiveGames.forEach(wsGame => {
          const gameId = String(wsGame.game_id);
          const existing = gamesMap.get(gameId);
          
          if (existing) {
            // Merge WebSocket data with existing game
            gamesMap.set(gameId, {
              ...existing,
              game_status: wsGame.game_status as any,
              status: wsGame.game_status,
              home_score: wsGame.home_score ?? existing.home_score,
              away_score: wsGame.away_score ?? existing.away_score,
              period: wsGame.period ?? existing.period,
              time_remaining: wsGame.time_remaining,
              clock: wsGame.time_remaining,
            });
          } else {
            // Add new game from WebSocket
            gamesMap.set(gameId, wsGame as unknown as Game);
          }
        });
        
        // Sort games: live first, then scheduled, then final
        const sortedGames = Array.from(gamesMap.values()).sort((a, b) => {
          const statusOrder = { 'in_progress': 0, 'scheduled': 1, 'final': 2 };
          const statusA = (a.game_status || a.status || 'scheduled') as keyof typeof statusOrder;
          const statusB = (b.game_status || b.status || 'scheduled') as keyof typeof statusOrder;
          return (statusOrder[statusA] ?? 3) - (statusOrder[statusB] ?? 3);
        });
        
        return sortedGames;
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
