'use client';

import { useConnectionStatus } from '@/lib/stores/odds-store';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const { status, latency } = useConnectionStatus();
  
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-fresh';
      case 'connecting':
        return 'text-warning';
      case 'disconnected':
      case 'error':
        return 'text-stale';
      default:
        return 'text-muted-foreground';
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return latency > 0 ? `${latency}ms` : 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md border', getStatusColor())}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      {status === 'connected' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fresh opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-fresh"></span>
        </span>
      )}
    </div>
  );
}












