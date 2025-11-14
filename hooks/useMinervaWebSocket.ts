import { useEffect, useState, useCallback, useRef } from 'react';
import { Game } from '@/lib/minerva-api';

const WS_URL = process.env.NEXT_PUBLIC_WS_BROADCASTER_URL || 'ws://localhost:8082/ws';

export interface MinervaLiveGameMessage {
  message_type: 'minerva_live_game';
  source: 'minerva';
  game_id: string;
  game_status: string;
  home_score?: number;
  away_score?: number;
  period?: number;
  time_remaining?: string;
  [key: string]: any;
}

export interface MinervaGameStatsMessage {
  message_type: 'minerva_game_stats';
  source: 'minerva';
  game_id: string;
  game_status: 'final';
  home_score: number;
  away_score: number;
  [key: string]: any;
}

export type MinervaMessage = MinervaLiveGameMessage | MinervaGameStatsMessage;

export function useMinervaWebSocket() {
  const [connected, setConnected] = useState(false);
  const [liveGames, setLiveGames] = useState<Map<string, MinervaLiveGameMessage>>(new Map());
  const [finalGames, setFinalGames] = useState<Map<string, MinervaGameStatsMessage>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('[Minerva WS] Connecting to', WS_URL);
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[Minerva WS] Connected');
      setConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as MinervaMessage;

        if (message.message_type === 'minerva_live_game') {
          setLiveGames(prev => {
            const next = new Map(prev);
            next.set(message.game_id, message);
            return next;
          });
        } else if (message.message_type === 'minerva_game_stats') {
          // Move from live to final
          setLiveGames(prev => {
            const next = new Map(prev);
            next.delete(message.game_id);
            return next;
          });
          setFinalGames(prev => {
            const next = new Map(prev);
            next.set(message.game_id, message);
            return next;
          });
        }
      } catch (error) {
        console.error('[Minerva WS] Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[Minerva WS] Error:', error);
    };

    ws.onclose = () => {
      console.log('[Minerva WS] Disconnected');
      setConnected(false);
      wsRef.current = null;

      // Attempt reconnect with exponential backoff
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`[Minerva WS] Reconnecting in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      }
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    liveGames: Array.from(liveGames.values()),
    finalGames: Array.from(finalGames.values()),
    reconnect: connect,
    disconnect,
  };
}

