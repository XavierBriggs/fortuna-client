'use client';

import { useState, useEffect, useRef } from 'react';
import { minervaAPI } from '@/lib/minerva-api';
import { Search, Loader2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlayerSearchResult {
  player_id: number;
  full_name: string;
  display_name?: { String: string; Valid: boolean } | string;
  position?: { String: string; Valid: boolean } | string;
  jersey_number?: { String: string; Valid: boolean } | string;
  current_team_id?: number;
}

export function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
        setShowResults(false);
        return;
      }

      try {
        setLoading(true);
        const data = await minervaAPI.searchPlayers(query);
        setResults(data);
        setShowResults(true);
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

  const handleSelectPlayer = (playerId: number) => {
    router.push(`/minerva/players/${playerId}`);
    setQuery('');
    setShowResults(false);
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

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search for a player..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((player) => (
            <button
              key={player.player_id}
              onClick={() => handleSelectPlayer(player.player_id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left border-b border-border last:border-b-0"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {getDisplayName(player)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {getJerseyNumber(player) && (
                    <span>#{getJerseyNumber(player)}</span>
                  )}
                  {getPosition(player) && (
                    <span>{getPosition(player)}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
          No players found for "{query}"
        </div>
      )}

      {/* Hint */}
      {query.length > 0 && query.length < 2 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg p-3 text-sm text-muted-foreground">
          Type at least 2 characters to search
        </div>
      )}
    </div>
  );
}

