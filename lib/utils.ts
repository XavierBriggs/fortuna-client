import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { NormalizedOdds, Event, EventGroup, OutcomeGroup } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date/Time utilities
export function getDataAgeSeconds(odds: NormalizedOdds): number {
  const now = new Date();
  const normalizedAt = new Date(odds.normalized_at);
  return Math.floor((now.getTime() - normalizedAt.getTime()) / 1000);
}

export function formatDataAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Odds conversions
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

export function americanToImpliedProbability(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  } else {
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
}

// Odds formatting
export function formatAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function formatDecimalOdds(odds: number): string {
  return odds.toFixed(2);
}

export function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`;
}

export function formatEdge(edge: number | null): string {
  if (edge === null) return 'N/A';
  const edgePercent = edge * 100;
  return `${edgePercent > 0 ? '+' : ''}${edgePercent.toFixed(1)}%`;
}

export function formatPoint(point: number | null): string {
  if (point === null) return '';
  return point > 0 ? `+${point}` : `${point}`;
}

// Data grouping
export function groupOddsByEvent(odds: NormalizedOdds[], events: Map<string, Event>): EventGroup[] {
  console.log(`[groupOddsByEvent] Input: ${odds.length} odds, ${events.size} events`);
  
  const grouped = new Map<string, NormalizedOdds[]>();
  
  odds.forEach((odd) => {
    if (!grouped.has(odd.event_id)) {
      grouped.set(odd.event_id, []);
    }
    grouped.get(odd.event_id)!.push(odd);
  });
  
  console.log(`[groupOddsByEvent] Grouped into ${grouped.size} events`);
  
  return Array.from(grouped.entries())
    .map(([eventId, eventOdds]) => {
      const event = events.get(eventId);
      if (!event) {
        console.log(`[groupOddsByEvent] No event found for event_id: ${eventId}`);
        return null;
      }
      
      const outcomes = groupOddsByOutcome(eventOdds);
      const hold = calculateHold(outcomes);
      const dataAge = Math.max(...eventOdds.map(getDataAgeSeconds));
      
      return {
        event,
        outcomes,
        hold,
        dataAge,
      };
    })
    .filter((group): group is EventGroup => group !== null)
    .sort((a, b) => {
      // Sort by event status (live first) then by commence time
      if (a.event.event_status === 'live' && b.event.event_status !== 'live') return -1;
      if (a.event.event_status !== 'live' && b.event.event_status === 'live') return 1;
      return new Date(a.event.commence_time).getTime() - new Date(b.event.commence_time).getTime();
    });
}

export function groupOddsByOutcome(odds: NormalizedOdds[]): OutcomeGroup[] {
  const grouped = new Map<string, NormalizedOdds[]>();
  
  odds.forEach((odd) => {
    const key = `${odd.outcome_name}-${odd.point || 'null'}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(odd);
  });
  
  return Array.from(grouped.values()).map((outcomeOdds) => {
    const oddsByBook: Record<string, NormalizedOdds> = {};
    outcomeOdds.forEach((odd) => {
      oddsByBook[odd.book_key] = odd;
    });
    
    const bestOdds = findBestOdds(outcomeOdds);
    const bestEdge = findBestEdge(outcomeOdds);
    
    return {
      outcome_name: outcomeOdds[0].outcome_name,
      point: outcomeOdds[0].point,
      oddsByBook,
      bestOdds,
      bestEdge,
    };
  });
}

function findBestOdds(odds: NormalizedOdds[]): NormalizedOdds | null {
  if (odds.length === 0) return null;
  
  // Best odds = highest value (most positive or least negative)
  return odds.reduce((best, current) => {
    if (!best) return current;
    if (current.price > best.price) return current;
    return best;
  });
}

function findBestEdge(odds: NormalizedOdds[]): NormalizedOdds | null {
  if (odds.length === 0) return null;
  
  const withEdge = odds.filter((odd) => odd.edge !== null);
  if (withEdge.length === 0) return null;
  
  return withEdge.reduce((best, current) => {
    if (!best || (current.edge || 0) > (best.edge || 0)) {
      return current;
    }
    return best;
  });
}

function calculateHold(outcomes: OutcomeGroup[]): number {
  if (outcomes.length !== 2) return 0;
  
  // Get best odds from sharp books for each outcome
  const outcome1Odds = Object.values(outcomes[0].oddsByBook)
    .filter((odd) => isSharpBook(odd.book_key));
  const outcome2Odds = Object.values(outcomes[1].oddsByBook)
    .filter((odd) => isSharpBook(odd.book_key));
  
  if (outcome1Odds.length === 0 || outcome2Odds.length === 0) return 0;
  
  const prob1 = outcome1Odds[0].implied_probability;
  const prob2 = outcome2Odds[0].implied_probability;
  
  return prob1 + prob2 - 1; // Negative is better than fair
}

// Book utilities
const SHARP_BOOKS = ['pinnacle', 'circa', 'bookmaker'];

export function isSharpBook(bookKey: string): boolean {
  return SHARP_BOOKS.includes(bookKey.toLowerCase());
}

export function getBookDisplayName(bookKey: string): string {
  const names: Record<string, string> = {
    pinnacle: 'Pinnacle',
    circa: 'Circa',
    bookmaker: 'Bookmaker',
    fanduel: 'FanDuel',
    draftkings: 'DraftKings',
    betmgm: 'BetMGM',
    caesars: 'Caesars',
    pointsbet: 'PointsBet',
    betrivers: 'BetRivers',
    wynnbet: 'WynnBET',
    unibet: 'Unibet',
    bovada: 'Bovada',
    mybookieag: 'MyBookie',
  };
  
  return names[bookKey] || bookKey;
}

// Market utilities
export function getMarketDisplayName(marketKey: string): string {
  const names: Record<string, string> = {
    h2h: 'Moneyline',
    spreads: 'Spread',
    totals: 'Total',
    player_points: 'Player Points',
    player_rebounds: 'Player Rebounds',
    player_assists: 'Player Assists',
    player_threes: 'Player 3PM',
    player_points_rebounds_assists: 'Player PRA',
    player_points_rebounds: 'Player PR',
    player_points_assists: 'Player PA',
    player_rebounds_assists: 'Player RA',
    player_steals: 'Player Steals',
    player_blocks: 'Player Blocks',
    player_turnovers: 'Player Turnovers',
    player_double_double: 'Double Double',
    player_triple_double: 'Triple Double',
  };
  
  return names[marketKey] || marketKey;
}

// Edge utilities
export function getEdgeColor(edge: number | null): string {
  if (edge === null) return 'text-muted-foreground';
  if (edge > 0.05) return 'text-edge-high'; // >5%
  if (edge > 0.02) return 'text-edge-good'; // 2-5%
  if (edge > 0) return 'text-edge-positive'; // 0-2%
  return 'text-edge-negative'; // <0%
}

export function getEdgeBackgroundColor(edge: number | null): string {
  if (edge === null || edge <= 0) return '';
  if (edge > 0.05) return 'bg-yellow-400/10'; // >5%
  if (edge > 0.02) return 'bg-green-400/10'; // 2-5%
  return ''; // 0-2%
}

export function getAgeColor(seconds: number): {
  bg: string;
  text: string;
  badge: string;
} {
  if (seconds < 5) {
    return {
      bg: 'bg-fresh',
      text: 'text-white',
      badge: '🟢',
    };
  }
  if (seconds < 10) {
    return {
      bg: 'bg-warning',
      text: 'text-black',
      badge: '🟡',
    };
  }
  return {
    bg: 'bg-stale',
    text: 'text-white',
    badge: '🔴',
  };
}

