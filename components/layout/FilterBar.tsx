'use client';

import { useState, useEffect } from 'react';
import { useOddsStore } from '@/lib/stores/odds-store';
import { Search, SlidersHorizontal } from 'lucide-react';
import { getMarketDisplayName } from '@/lib/utils';
import { fetchBooks, type Book } from '@/lib/api';

const MARKETS = [
  { key: 'spreads', label: 'Spread' },
  { key: 'totals', label: 'Total' },
  { key: 'h2h', label: 'Moneyline' },
];

const EDGE_PRESETS = [
  { label: 'Show All', value: null },
  { label: 'Any +EV', value: 0 },
  { label: 'Significant (>2%)', value: 0.02 },
  { label: 'Rare (>5%)', value: 0.05 },
];

export function FilterBar() {
  const { filters, setFilters } = useOddsStore();
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  
  // Fetch available books on mount
  useEffect(() => {
    fetchBooks().then(books => {
      setAvailableBooks(books.filter(b => b.active));
    });
  }, []);
  
  const toggleMarket = (market: string) => {
    const newMarkets = filters.markets.includes(market)
      ? filters.markets.filter(m => m !== market)
      : [...filters.markets, market];
    setFilters({ markets: newMarkets });
  };
  
  const toggleBook = (book: string) => {
    const newBooks = filters.books.includes(book)
      ? filters.books.filter(b => b !== book)
      : [...filters.books, book];
    setFilters({ books: newBooks });
  };
  
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      setFilters({ searchQuery: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  };
  
  return (
    <div className="sticky top-16 z-40 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container px-4 py-3 space-y-3">
        {/* Top row: Markets and Search */}
        <div className="flex items-center gap-4">
          {/* Markets */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Markets:</span>
            <div className="flex gap-2">
              {MARKETS.map((market) => (
                <button
                  key={market.key}
                  onClick={() => toggleMarket(market.key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                    filters.markets.includes(market.key) || filters.markets.length === 0
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                >
                  {market.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-6 w-px bg-border" />
          
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams or players..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
        
        {/* Bottom row: Books and Edge */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Books */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Books:</span>
            <div className="flex gap-2 flex-wrap">
              {availableBooks.map((book) => (
                <button
                  key={book.book_key}
                  onClick={() => toggleBook(book.book_key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                    filters.books.includes(book.book_key) || filters.books.length === 0
                      ? 'bg-primary/10 text-primary border-primary/50'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                  title={book.book_type === 'sharp' ? 'Sharp Book' : 'Soft Book'}
                >
                  {book.display_name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-6 w-px bg-border" />
          
          {/* Edge Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Min Edge:</span>
            <div className="flex gap-2">
              {EDGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setFilters({ minEdge: preset.value })}
                  className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                    filters.minEdge === preset.value || (filters.minEdge === null && preset.value === null)
                      ? 'bg-primary/10 text-primary border-primary/50'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

