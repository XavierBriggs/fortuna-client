'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useGames } from '@/hooks/useGames';
import { GameCard } from '@/components/games/GameCard';
import { BoxScoreModal } from '@/components/games/BoxScoreModal';
import { useRouter } from 'next/navigation';

export default function GamesPage() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('basketball_nba');
  const { sports, games, boxScores, selectedGameId, selectGame, isLoading, error } = useGames(selectedSport);

  // Update selectedSport when sports are loaded
  useEffect(() => {
    if (!selectedSport && sports.length > 0) {
      setSelectedSport(sports[0].sport_key);
    }
  }, [sports, selectedSport]);

  const liveGames = games.filter(g => g.status === 'live');
  const upcomingGames = games.filter(g => g.status === 'upcoming');
  const finalGames = games.filter(g => g.status === 'final');

  const selectedBoxScore = selectedGameId ? boxScores.get(selectedGameId) : undefined;

  const handleViewBoxScore = (gameId: string) => {
    selectGame(gameId);
  };

  const handleViewOdds = (gameId: string) => {
    const game = games.find(g => g.game_id === gameId);
    if (game?.sport_key) {
      router.push(`/odds/${game.sport_key}?gameId=${gameId}`);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-6">
          <div className="text-center text-red-500">Error loading games: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏀</span>
            <h1 className="text-4xl font-bold">Live Games</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Real-time scores and stats • Updates every 30 seconds
          </p>
        </div>

        {/* Sport Selector */}
        {sports && sports.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-2">
              {sports.map((sport) => (
                <button
                  key={sport.sport_key}
                  onClick={() => setSelectedSport(sport.sport_key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSport === sport.sport_key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  🏀 {sport.display_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Loading games...</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[240px] rounded-lg border bg-card animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Live Games */}
            {liveGames.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </div>
                  <h2 className="text-2xl font-semibold text-red-500">Live Now</h2>
                  <span className="text-sm text-muted-foreground">({liveGames.length} {liveGames.length === 1 ? 'game' : 'games'})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveGames.map((game) => (
                    <GameCard
                      key={game.game_id}
                      game={game}
                      onViewBoxScore={handleViewBoxScore}
                      onViewOdds={handleViewOdds}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Games */}
            {upcomingGames.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-2xl">📅</span>
                  <h2 className="text-2xl font-semibold">Upcoming Today</h2>
                  <span className="text-sm text-muted-foreground">({upcomingGames.length} {upcomingGames.length === 1 ? 'game' : 'games'})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingGames.map((game) => (
                    <GameCard
                      key={game.game_id}
                      game={game}
                      onViewBoxScore={handleViewBoxScore}
                      onViewOdds={handleViewOdds}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Final Games */}
            {finalGames.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-2xl">✅</span>
                  <h2 className="text-2xl font-semibold">Final Scores</h2>
                  <span className="text-sm text-muted-foreground">({finalGames.length} {finalGames.length === 1 ? 'game' : 'games'})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finalGames.map((game) => (
                    <GameCard
                      key={game.game_id}
                      game={game}
                      onViewBoxScore={handleViewBoxScore}
                      onViewOdds={handleViewOdds}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Games */}
            {!isLoading && games.length === 0 && (
              <div className="text-center py-20">
                <div className="text-8xl mb-6">🏀</div>
                <h3 className="text-2xl font-semibold mb-3">No games scheduled today</h3>
                <p className="text-muted-foreground text-lg">Check back later for today's matchups</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Box Score Modal */}
      <BoxScoreModal
        isOpen={!!selectedGameId}
        onClose={() => selectGame(null)}
        boxScore={selectedBoxScore}
        sportKey={selectedSport}
      />
    </div>
  );
}
