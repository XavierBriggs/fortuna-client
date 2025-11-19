'use client';

import { useState, useEffect, useRef } from 'react';
import { useOddsStore } from '@/lib/stores/odds-store';
import { Search, ChevronDown, Check } from 'lucide-react';
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
  const [isBooksDropdownOpen, setIsBooksDropdownOpen] = useState(false);
  const booksDropdownRef = useRef<HTMLDivElement>(null);
  
  // Fetch available books on mount - show ALL books from Alexandria
  useEffect(() => {
    fetchBooks().then(books => {
      setAvailableBooks(books); // Show all books, not just active ones
    });
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (booksDropdownRef.current && !booksDropdownRef.current.contains(event.target as Node)) {
        setIsBooksDropdownOpen(false);
      }
    };
    
    if (isBooksDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isBooksDropdownOpen]);
  
  const toggleMarket = (market: string) => {
    const newMarkets = filters.markets.includes(market)
      ? filters.markets.filter(m => m !== market)
      : [...filters.markets, market];
    setFilters({ markets: newMarkets });
  };
  
  const toggleBook = (bookKey: string) => {
    // If books array is empty, all books are shown
    // If books array has items, only those books are shown
    if (filters.books.length === 0) {
      // Currently showing all books, select only this one
      setFilters({ books: [bookKey] });
    } else if (filters.books.includes(bookKey)) {
      // Book is selected, remove it
      const newBooks = filters.books.filter(b => b !== bookKey);
      // If no books left, show all (empty array)
      setFilters({ books: newBooks.length === 0 ? [] : newBooks });
    } else {
      // Book is not selected, add it
      setFilters({ books: [...filters.books, bookKey] });
    }
  };
  
  const selectAllBooks = () => {
    setFilters({ books: [] }); // Empty = all books shown
    setIsBooksDropdownOpen(false); // Close dropdown after selection
  };
  
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      setFilters({ searchQuery: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  };
  
  // Get selected book names for display
  const getSelectedBooksDisplay = () => {
    if (filters.books.length === 0) {
      return 'All Books';
    } else if (filters.books.length === 1) {
      return availableBooks.find(b => b.book_key === filters.books[0])?.display_name || '1 Book';
    } else if (filters.books.length === availableBooks.length) {
      return 'All Books';
    } else {
      return `${filters.books.length} Books`;
    }
  };
  
  const selectedBooksDisplay = getSelectedBooksDisplay();
  
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
          {/* Books Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Books:</span>
            <div className="relative" ref={booksDropdownRef}>
              <button
                onClick={() => setIsBooksDropdownOpen(!isBooksDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors min-w-[180px] justify-between"
              >
                <span className="truncate">{selectedBooksDisplay}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isBooksDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isBooksDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-96 overflow-y-auto bg-card border border-border rounded-md shadow-lg z-50">
                  {filters.books.length > 0 && (
                    <div className="p-2 border-b border-border sticky top-0 bg-card">
                      <button
                        onClick={selectAllBooks}
                        className="w-full px-2 py-1 text-xs font-medium rounded border border-border hover:bg-accent transition-colors"
                      >
                        Show All Books
                      </button>
                    </div>
                  )}
                  
                  <div className="py-1">
                    {availableBooks.map((book) => {
                      // Book is selected (shown) if:
                      // - filters.books is empty (show all), OR
                      // - book is in the filters.books array
                      const isSelected = filters.books.length === 0 || filters.books.includes(book.book_key);
                      return (
                        <button
                          key={book.book_key}
                          onClick={() => {
                            toggleBook(book.book_key);
                            // Keep dropdown open for multi-select
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                        >
                          <div className={`flex-shrink-0 w-4 h-4 border rounded flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary' : 'border-border'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className="flex-1">{book.display_name}</span>
                          {book.book_type === 'sharp' && (
                            <span className="text-xs text-muted-foreground">Sharp</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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

