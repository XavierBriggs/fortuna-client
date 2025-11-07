import type { NormalizedOdds, Alert } from '@/types';
import { getDataAgeSeconds, formatAmericanOdds, formatPoint } from '@/lib/utils';

// Track which odds have been alerted on (in-memory for now)
const alertedOdds = new Set<string>();

function generateAlertKey(odds: NormalizedOdds): string {
  return `${odds.event_id}-${odds.book_key}-${odds.outcome_name}-${odds.point || 'null'}`;
}

export function shouldAlert(odds: NormalizedOdds, minEdge: number = 0, maxDataAge: number = 10): boolean {
  // Check if edge meets minimum
  if (!odds.edge || odds.edge < minEdge) return false;
  
  // Check data freshness
  const dataAge = getDataAgeSeconds(odds);
  if (dataAge > maxDataAge) return false;
  
  // Check if already alerted
  const key = generateAlertKey(odds);
  if (alertedOdds.has(key)) return false;
  
  return true;
}

export function markAsAlerted(odds: NormalizedOdds): void {
  const key = generateAlertKey(odds);
  alertedOdds.add(key);
  
  // Remove from set after 5 minutes to allow re-alerting
  setTimeout(() => {
    alertedOdds.delete(key);
  }, 5 * 60 * 1000);
}

export function createAlert(odds: NormalizedOdds): Alert {
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    odds,
    edge: odds.edge || 0,
    timestamp: new Date().toISOString(),
    dismissed: false,
  };
}

export async function sendSlackAlert(odds: NormalizedOdds): Promise<void> {
  const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('Slack webhook URL not configured');
    return;
  }
  
  const edgePercent = ((odds.edge || 0) * 100).toFixed(1);
  const dataAge = getDataAgeSeconds(odds);
  const ageBadge = dataAge < 5 ? '🟢' : dataAge < 10 ? '🟡' : '🔴';
  
  const pointDisplay = odds.point ? ` ${formatPoint(odds.point)}` : '';
  const fairPriceDisplay = odds.fair_price ? ` | Fair: ${formatAmericanOdds(odds.fair_price)}` : '';
  
  const message = {
    text: `⚡ +${edgePercent}% Edge Alert`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⚡ +${edgePercent}% Edge Detected`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Outcome:*\n${odds.outcome_name}${pointDisplay}`,
          },
          {
            type: 'mrkdwn',
            text: `*Odds:*\n${formatAmericanOdds(odds.price)}`,
          },
          {
            type: 'mrkdwn',
            text: `*Book:*\n${odds.book_key.toUpperCase()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Freshness:*\n${ageBadge} ${dataAge}s ago`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Market: ${odds.market_key} | Implied: ${(odds.implied_probability * 100).toFixed(1)}%${fairPriceDisplay}`,
          },
        ],
      },
    ],
  };
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    console.log('Slack alert sent successfully');
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

// In-app notification (using browser Notification API)
export function showBrowserNotification(odds: NormalizedOdds): void {
  if (!('Notification' in window)) {
    console.warn('Browser notifications not supported');
    return;
  }
  
  if (Notification.permission === 'granted') {
    const edgePercent = ((odds.edge || 0) * 100).toFixed(1);
    const pointDisplay = odds.point ? ` ${formatPoint(odds.point)}` : '';
    
    new Notification(`⚡ +${edgePercent}% Edge Alert`, {
      body: `${odds.outcome_name}${pointDisplay} @ ${formatAmericanOdds(odds.price)} (${odds.book_key.toUpperCase()})`,
      icon: '/favicon.ico',
      tag: generateAlertKey(odds),
    });
  }
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.reject('Notifications not supported');
  }
  
  return Notification.requestPermission();
}


