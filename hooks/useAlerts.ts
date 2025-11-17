'use client';

import { useEffect, useRef } from 'react';
import { useOddsStore } from '@/lib/stores/odds-store';
import { shouldAlert, markAsAlerted, createAlert, sendSlackAlert, showBrowserNotification } from '@/lib/alerts';

interface AlertOptions {
  minEdge?: number;
  maxDataAge?: number;
  enableInApp?: boolean;
  enableSlack?: boolean;
  enableBrowser?: boolean;
}

export function useAlerts(options: AlertOptions = {}) {
  const {
    minEdge = 0,
    maxDataAge = 10,
    enableInApp = true,
    enableSlack = true,
    enableBrowser = false,
  } = options;
  
  const odds = useOddsStore((state) => state.odds);
  const addAlert = useOddsStore((state) => state.addAlert);
  const lastCheckTime = useRef<number>(Date.now());
  
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      
      // Only check odds that were added/updated since last check
      Array.from(odds.values()).forEach((odd) => {
        const oddTimestamp = new Date(odd.normalized_at).getTime();
        
        // Only check recent odds
        if (oddTimestamp < lastCheckTime.current) {
          return;
        }
        
        if (shouldAlert(odd, minEdge, maxDataAge)) {
          // Create alert
          const alert = createAlert(odd);
          
          // Add to in-app alerts
          if (enableInApp) {
            addAlert(alert);
          }
          
          // Send to Slack
          if (enableSlack) {
            sendSlackAlert(odd).catch((error) => {
              console.error('Failed to send Slack alert:', error);
            });
          }
          
          // Show browser notification
          if (enableBrowser) {
            showBrowserNotification(odd);
          }
          
          // Mark as alerted
          markAsAlerted(odd);
          
          console.log(`Alert triggered: +${((odd.edge || 0) * 100).toFixed(1)}% edge on ${odd.outcome_name} @ ${odd.book_key}`);
        }
      });
      
      lastCheckTime.current = now;
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(checkInterval);
  }, [odds, minEdge, maxDataAge, enableInApp, enableSlack, enableBrowser, addAlert]);
}





