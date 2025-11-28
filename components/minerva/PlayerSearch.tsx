'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { minervaAPI } from '@/lib/minerva-api';
import { Search, Loader2, User, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlayerSearchResult {
  player_id: number;
  full_name: string;
  display_name?: { String: string; Valid: boolean } | string;
  position?: { String: string; Valid: boolean } | string;
  jersey_number?: { String: string; Valid: boolean } | string;
  current_team_id?: number;
}

// Popular players for suggestions
const POPULAR_PLAYERS = [
  { name: 'LeBron James', hint: 'LAL' },
  { name: 'Stephen Curry', hint: 'GSW' },
  { name: 'Giannis Antetokounmpo', hint: 'MIL' },
  { name: 'Luka Doncic', hint: 'DAL' },
  { name: 'Nikola Jokic', hint: 'DEN' },
];

// Storage key for recent searches
const RECENT_SEARCHES_KEY = 'minerva_recent_player_searches';

export function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<{ id: number; name: string }[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (playerId: number, name: string) => {
    try {
      const newSearch = { id: playerId, name };
      const updated = [newSearch, ...recentSearches.filter(s => s.id !== playerId)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search:', e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchPlayers = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const data = await minervaAPI.searchPlayers(query);
        setResults(data);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Failed to search players:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelectPlayer = useCallback((playerId: number, name: string) => {
    saveRecentSearch(playerId, name);
    router.push(`/minerva/players/${playerId}`);
    setQuery('');
    setShowResults(false);
  }, [router, recentSearches]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length > 0 ? results.length : 
      (query.length < 2 ? recentSearches.length + POPULAR_PLAYERS.length : 0);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (results.length > 0 && selectedIndex < results.length) {
        const player = results[selectedIndex];
        handleSelectPlayer(player.player_id, getDisplayName(player));
      } else if (query.length < 2) {
        // Handle recent/popular selection
        if (selectedIndex < recentSearches.length) {
          const recent = recentSearches[selectedIndex];
          handleSelectPlayer(recent.id, recent.name);
        } else {
          const popularIndex = selectedIndex - recentSearches.length;
          if (popularIndex < POPULAR_PLAYERS.length) {
            setQuery(POPULAR_PLAYERS[popularIndex].name);
          }
        }
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  const handlePopularClick = (name: string) => {
    setQuery(name);
    inputRef.current?.focus();
  };

  const getDisplayName = (player: PlayerSearchResult): string => {
    if (typeof player.display_name === 'string') return player.display_name;
    if (player.display_name && 'String' in player.display_name && player.display_name.Valid) {
      return player.display_name.String;
    }
    return player.full_name;
  };

  const getPosition = (player: PlayerSearchResult): string => {
    if (typeof player.position === 'string') return player.position;
    if (player.position && 'String' in player.position && player.position.Valid) {
      return player.position.String;
    }
    return '';
  };

  const getJerseyNumber = (player: PlayerSearchResult): string => {
    if (typeof player.jersey_number === 'string') return player.jersey_number;
    if (player.jersey_number && 'String' in player.jersey_number && player.jersey_number.Valid) {
      return player.jersey_number.String;
    }
    return '';
  };

  const showSuggestions = showResults && query.length < 2;
  const showSearchResults = showResults && results.length > 0 && query.length >= 2;
  const showNoResults = showResults && !loading && query.length >= 2 && results.length === 0;

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search players..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Suggestions (Recent + Popular) */}
      {showSuggestions && (recentSearches.length > 0 || POPULAR_PLAYERS.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Recent
              </div>
              {recentSearches.map((recent, idx) => (
                <button
                  key={recent.id}
                  onClick={() => handleSelectPlayer(recent.id, recent.name)}
                  className={`w-full px-3 py-2 flex items-center gap-3 rounded-md text-left transition-colors text-sm ${
                    selectedIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{recent.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Players */}
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Popular
            </div>
            {POPULAR_PLAYERS.map((player, idx) => {
              const itemIndex = recentSearches.length + idx;
              return (
                <button
                  key={player.name}
                  onClick={() => handlePopularClick(player.name)}
                  className={`w-full px-3 py-2 flex items-center justify-between rounded-md text-left transition-colors text-sm ${
                    selectedIndex === itemIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <span>{player.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{player.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground border-t border-border">
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">↑↓</kbd> navigate
            <span className="mx-2">·</span>
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">Enter</kbd> select
            <span className="mx-2">·</span>
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">Esc</kbd> close
          </div>
        </div>
      )}

      {/* Search Results */}
      {showSearchResults && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {results.map((player, idx) => (
            <button
              key={player.player_id}
              onClick={() => handleSelectPlayer(player.player_id, getDisplayName(player))}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors border-b border-border last:border-b-0 ${
                selectedIndex === idx ? 'bg-primary/10' : 'hover:bg-muted'
              }`}
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {getDisplayName(player).charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate ${selectedIndex === idx ? 'text-primary' : ''}`}>
                  {getDisplayName(player)}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {getJerseyNumber(player) && (
                    <span className="font-mono">#{getJerseyNumber(player)}</span>
                  )}
                  {getPosition(player) && (
                    <span className="px-1.5 py-0.5 bg-muted rounded">{getPosition(player)}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showNoResults && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg p-4 text-center">
          <div className="text-muted-foreground text-sm">No players found for "{query}"</div>
          <div className="text-xs text-muted-foreground mt-1">Try a different spelling or player name</div>
        </div>
      )}
    </div>
  );
}
