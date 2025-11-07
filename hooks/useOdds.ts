'use client';

import { useEffect, useState } from 'react';
import { useOddsStore } from '@/lib/stores/odds-store';
import { fetchCurrentOdds } from '@/lib/api';
import type { NormalizedOdds } from '@/types';

export function useOdds() {
  const { odds, filters } = useOddsStore();
  const updateOdds = useOddsStore((state) => state.updateOdds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial odds from API
  useEffect(() => {
    let isCancelled = false;
    
    async function loadInitialOdds() {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching initial odds with filters:', filters);
        
        const initialOdds = await fetchCurrentOdds({
          sport: filters.sport,
          market: filters.markets.length === 1 ? filters.markets[0] : undefined,
          book: filters.books.length === 1 ? filters.books[0] : undefined,
          limit: 1000,
        });
        
        if (!isCancelled) {
          console.log(`Loaded ${initialOdds.length} initial odds`);
          
          // Update store with all fetched odds
          initialOdds.forEach((odd: NormalizedOdds) => {
            updateOdds(odd);
          });
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error loading initial odds:', err);
          setError(err instanceof Error ? err.message : 'Failed to load odds');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialOdds();
    
    return () => {
      isCancelled = true;
    };
  }, [filters.sport, filters.markets, filters.books, updateOdds]);

  // Filter odds based on current filters
  const filteredOdds = odds.filter((odd) => {
    // Sport filter (required)
    if (odd.sport_key !== filters.sport) return false;
    
    // Market filter (optional)
    if (filters.markets.length > 0 && !filters.markets.includes(odd.market_key)) {
      return false;
    }
    
    // Book filter (optional) - show if no books selected OR if book matches
    // Note: This filters the odds array, but each odd might have multiple books
    // We'll handle per-book filtering in the display component
    
    // Edge filter (optional, null means show all)
    if (filters.minEdge !== null) {
      if (!odd.edge_vs_consensus || odd.edge_vs_consensus < filters.minEdge) {
        return false;
      }
    }
    
    // Search filter (optional)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTeam = odd.home_team?.toLowerCase().includes(query) || 
                         odd.away_team?.toLowerCase().includes(query);
      const matchesOutcome = odd.outcome_name?.toLowerCase().includes(query);
      if (!matchesTeam && !matchesOutcome) {
        return false;
      }
    }
    
    return true;
  });

  return {
    odds: filteredOdds,
    loading,
    error,
    total: odds.length,
  };
}

