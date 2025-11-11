import { useEffect, useState } from 'react'
import { useGamesStore, GameSummary, BoxScore } from '@/lib/stores/games-store'
import { useWebSocket } from '@/providers/WebSocketProvider'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

interface Sport {
  sport_key: string;
  display_name: string;
}

export function useGames(sportKey: string = 'basketball_nba') {
  const {
    games,
    boxScores,
    selectedGameId,
    setGames,
    updateGame,
    selectGame,
    setBoxScore,
    isLoadingGames,
    setLoadingGames,
    getTodaysGames,
    getLiveGames,
    getUpcomingGames,
    getFinalGames,
  } = useGamesStore()

  const { lastMessage } = useWebSocket()
  const [sports, setSports] = useState<Sport[]>([])
  const [error, setError] = useState<string | null>(null)

  // Fetch enabled sports on mount
  useEffect(() => {
    fetchEnabledSports()
  }, [])

  // Fetch today's games when sport changes
  useEffect(() => {
    if (sportKey) {
      fetchTodaysGames()
    }
  }, [sportKey])

  // Handle WebSocket updates
  useEffect(() => {
    if (!lastMessage) return

    try {
      const message = JSON.parse(lastMessage.data)
      
      // Check if it's a game update
      if (message.message_type === 'game_update' || message.sport_key) {
        const gameUpdate = message as GameSummary
        updateGame(gameUpdate)
      }
    } catch (error) {
      console.error('Error processing game WebSocket message:', error)
    }
  }, [lastMessage, updateGame])

  async function fetchEnabledSports() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sports/enabled`)
      if (!response.ok) throw new Error('Failed to fetch sports')
      
      const data = await response.json()
      setSports(data || [])
    } catch (error) {
      console.error('Error fetching sports:', error)
      setError('Failed to load sports')
    }
  }

  async function fetchTodaysGames() {
    setLoadingGames(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/games/today?sport=${sportKey}`)
      if (!response.ok) throw new Error('Failed to fetch games')
      
      const data = await response.json()
      setGames(data.games || [])
    } catch (error) {
      console.error('Error fetching games:', error)
      setError('Failed to load games')
    } finally {
      setLoadingGames(false)
    }
  }

  // Fetch box score when a game is selected
  useEffect(() => {
    if (selectedGameId) {
      fetchBoxScore(selectedGameId)
    }
  }, [selectedGameId])

  async function fetchBoxScore(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/games/${id}/boxscore`)
      if (!response.ok) throw new Error('Failed to fetch box score')
      
      const boxScore: BoxScore = await response.json()
      setBoxScore(id, boxScore)
    } catch (error) {
      console.error('Error fetching box score:', error)
    }
  }

  return {
    sports,
    games: getTodaysGames(),
    boxScores,
    selectedGameId,
    selectGame,
    isLoading: isLoadingGames,
    error,
    refetch: fetchTodaysGames,
  }
}

export function useBoxScore(gameId: string | null) {
  const {
    getBoxScoreById,
    setBoxScore,
    isLoadingBoxScore,
    setLoadingBoxScore,
  } = useGamesStore()

  useEffect(() => {
    if (gameId) {
      fetchBoxScore(gameId)
    }
  }, [gameId])

  async function fetchBoxScore(id: string) {
    // Check if already cached
    if (getBoxScoreById(id)) return

    setLoadingBoxScore(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/games/${id}/boxscore`)
      if (!response.ok) throw new Error('Failed to fetch box score')
      
      const boxScore: BoxScore = await response.json()
      setBoxScore(id, boxScore)
    } catch (error) {
      console.error('Error fetching box score:', error)
    } finally {
      setLoadingBoxScore(false)
    }
  }

  return {
    boxScore: gameId ? getBoxScoreById(gameId) : null,
    isLoading: isLoadingBoxScore,
    refetch: gameId ? () => fetchBoxScore(gameId) : () => {},
  }
}
