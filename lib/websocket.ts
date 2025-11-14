import type { WebSocketMessage, OddsUpdateMessage, SubscribeMessage } from '@/types';

export class FortunaWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  // Callbacks
  private onMessageCallback: ((message: WebSocketMessage) => void) | null = null;
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;
  private onErrorCallback: ((error: Event) => void) | null = null;
  
  constructor(url: string) {
    this.url = url;
  }
  
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }
  
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }
  
  subscribe(filters: SubscribeMessage['payload']): void {
    this.send({
      type: 'subscribe',
      payload: filters,
    });
  }
  
  unsubscribe(): void {
    this.send({
      type: 'unsubscribe',
      payload: {},
    });
  }
  
  // Callbacks
  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.onMessageCallback = callback;
  }
  
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionChangeCallback = callback;
  }
  
  onError(callback: (error: Event) => void): void {
    this.onErrorCallback = callback;
  }
  
  // Private handlers
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    
    this.startHeartbeat();
    
    if (this.onConnectionChangeCallback) {
      this.onConnectionChangeCallback(true);
    }
  }
  
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }
  
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    
    if (this.onErrorCallback) {
      this.onErrorCallback(event);
    }
  }
  
  private handleClose(): void {
    console.log('WebSocket disconnected');
    this.stopHeartbeat();
    
    if (this.onConnectionChangeCallback) {
      this.onConnectionChangeCallback(false);
    }
    
    this.scheduleReconnect();
  }
  
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat' });
    }, 30000);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000;
    const totalDelay = Math.min(delay + jitter, 30000); // Max 30s
    
    console.log(`Reconnecting in ${totalDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, totalDelay);
  }
  
  // Getters
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }
}




