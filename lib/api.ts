// API client for Fortuna API Gateway

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface Book {
  book_key: string;
  display_name: string;
  book_type: 'sharp' | 'soft';
  active: boolean;
  regions: string[];
  supported_sports: string[];
}

export interface Market {
  market_key: string;
  market_family: 'featured' | 'props';
  display_name: string;
  outcome_count: number;
  sport_key: string;
}

export interface Sport {
  sport_key: string;
  display_name: string;
  active: boolean;
}

// Fetch available books from the backend
export async function fetchBooks(): Promise<Book[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/books`);
    if (!response.ok) {
      console.warn('Failed to fetch books, using defaults');
      return getDefaultBooks();
    }
    const data = await response.json();
    return data.books || getDefaultBooks();
  } catch (error) {
    console.warn('Error fetching books:', error);
    return getDefaultBooks();
  }
}

// Fetch available markets
export async function fetchMarkets(sportKey: string): Promise<Market[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/markets?sport=${sportKey}`);
    if (!response.ok) {
      console.warn('Failed to fetch markets, using defaults');
      return getDefaultMarkets();
    }
    const data = await response.json();
    return data.markets || getDefaultMarkets();
  } catch (error) {
    console.warn('Error fetching markets:', error);
    return getDefaultMarkets();
  }
}

// Fetch events (for initial load)
export async function fetchEvents(sportKey: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/events?sport=${sportKey}&limit=100`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// Fetch current odds (for initial load)
export async function fetchCurrentOdds(filters: {
  sport?: string;
  market?: string;
  book?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.sport) params.set('sport', filters.sport);
  if (filters.market) params.set('market', filters.market);
  if (filters.book) params.set('book', filters.book);
  params.set('limit', (filters.limit || 1000).toString());
  
  const url = `${API_BASE_URL}/api/v1/odds/current?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.odds || [];
  } catch (error) {
    console.error('Error fetching current odds:', error);
    return [];
  }
}

// Default books (fallback if API fails)
function getDefaultBooks(): Book[] {
  return [
    { book_key: 'pinnacle', display_name: 'Pinnacle', book_type: 'sharp', active: true, regions: ['us'], supported_sports: ['basketball_nba'] },
    { book_key: 'circa', display_name: 'Circa', book_type: 'sharp', active: true, regions: ['us'], supported_sports: ['basketball_nba'] },
    { book_key: 'bookmaker', display_name: 'Bookmaker', book_type: 'sharp', active: true, regions: ['us'], supported_sports: ['basketball_nba'] },
    { book_key: 'fanduel', display_name: 'FanDuel', book_type: 'soft', active: true, regions: ['us', 'us2'], supported_sports: ['basketball_nba'] },
    { book_key: 'draftkings', display_name: 'DraftKings', book_type: 'soft', active: true, regions: ['us', 'us2'], supported_sports: ['basketball_nba'] },
    { book_key: 'betmgm', display_name: 'BetMGM', book_type: 'soft', active: true, regions: ['us', 'us2'], supported_sports: ['basketball_nba'] },
    { book_key: 'caesars', display_name: 'Caesars', book_type: 'soft', active: true, regions: ['us', 'us2'], supported_sports: ['basketball_nba'] },
    { book_key: 'pointsbet', display_name: 'PointsBet', book_type: 'soft', active: true, regions: ['us', 'us2'], supported_sports: ['basketball_nba'] },
    { book_key: 'betrivers', display_name: 'BetRivers', book_type: 'soft', active: true, regions: ['us', 'us2'], supported_sports: ['basketball_nba'] },
    { book_key: 'wynnbet', display_name: 'WynnBET', book_type: 'soft', active: true, regions: ['us'], supported_sports: ['basketball_nba'] },
  ];
}

// Default markets (fallback if API fails)
function getDefaultMarkets(): Market[] {
  return [
    { market_key: 'spreads', market_family: 'featured', display_name: 'Spread', outcome_count: 2, sport_key: 'basketball_nba' },
    { market_key: 'totals', market_family: 'featured', display_name: 'Total', outcome_count: 2, sport_key: 'basketball_nba' },
    { market_key: 'h2h', market_family: 'featured', display_name: 'Moneyline', outcome_count: 2, sport_key: 'basketball_nba' },
  ];
}

