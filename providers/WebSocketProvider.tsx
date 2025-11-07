'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { FortunaWebSocket } from '@/lib/websocket';
import { useOddsStore } from '@/lib/stores/odds-store';
import type { WebSocketMessage, OddsUpdateMessage } from '@/types';

interface WebSocketContextValue {
  ws: FortunaWebSocket | null;
  isConnected: boolean;
  latency: number;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  ws: null,
  isConnected: false,
  latency: 0,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<FortunaWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const lastPingTime = useRef<number>(0);
  
  const updateOdds = useOddsStore((state) => state.updateOdds);
  const setConnectionStatus = useOddsStore((state) => state.setConnectionStatus);
  const filters = useOddsStore((state) => state.filters);
  
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8082/ws';
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new FortunaWebSocket(wsUrl);
    wsRef.current = ws;
    
    // Setup callbacks
    ws.onMessage((message: WebSocketMessage) => {
      handleMessage(message);
    });
    
    ws.onConnectionChange((connected: boolean) => {
      console.log('WebSocket connection changed:', connected);
      setIsConnected(connected);
      setConnectionStatus({
        status: connected ? 'connected' : 'disconnected',
        reconnectAttempts: 0,
      });
      
      // Subscribe to odds when connected
      if (connected) {
        const subscribePayload = {
          sports: [filters.sport],
          markets: filters.markets.length > 0 ? filters.markets : undefined,
          books: filters.books.length > 0 ? filters.books : undefined,
        };
        console.log('Subscribing with:', subscribePayload);
        ws.subscribe(subscribePayload);
      }
    });
    
    ws.onError((error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus({ status: 'error' });
    });
    
    // Connect
    ws.connect();
    
    // Cleanup
    return () => {
      ws.disconnect();
    };
  }, []); // Only run once on mount
  
  // Resubscribe when filters change
  useEffect(() => {
    if (wsRef.current?.isConnected()) {
      wsRef.current.subscribe({
        sports: [filters.sport],
        markets: filters.markets.length > 0 ? filters.markets : undefined,
        books: filters.books.length > 0 ? filters.books : undefined,
      });
    }
  }, [filters.sport, filters.markets, filters.books]);
  
  function handleMessage(message: WebSocketMessage) {
    const now = Date.now();
    
    switch (message.type) {
      case 'odds_update':
        const oddsMessage = message as OddsUpdateMessage;
        console.log('Received odds_update:', oddsMessage.payload);
        updateOdds(oddsMessage.payload);
        setConnectionStatus({ lastMessage: now.toString() });
        break;
        
      case 'heartbeat':
        // Calculate latency
        if (lastPingTime.current > 0) {
          const roundTrip = now - lastPingTime.current;
          setLatency(roundTrip);
          setConnectionStatus({ latency: roundTrip });
        }
        lastPingTime.current = now;
        break;
        
      case 'error':
        console.error('WebSocket error message:', message.payload);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }
  
  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, isConnected, latency }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}

