import { create } from 'zustand'

export interface GameSummary {
  game_id: string
  sport_key: string
  status: 'upcoming' | 'live' | 'final' | 'postponed'
  home_team: string
  home_team_abbr: string
  away_team: string
  away_team_abbr: string
  home_score: number
  away_score: number
  period: number
  period_label: string
  time_remaining?: string
  commence_time: string
  updated_at: string
  has_linked_odds?: boolean
}

export interface PlayerStat {
  player_name: string
  team_abbr: string
  position?: string
  stats: Record<string, any>
  display_stats: DisplayStat[]
}

export interface DisplayStat {
  label: string
  value: string
  category: string
}

export interface PeriodScore {
  period: number
  label: string
  home_score: number
  away_score: number
}

export interface BoxScore {
  game: GameSummary
  home_stats: Record<string, any>
  away_stats: Record<string, any>
  home_players: PlayerStat[]
  away_players: PlayerStat[]
  period_scores: PeriodScore[]
}

interface GamesStore {
  // State
  games: Map<string, GameSummary>
  boxScores: Map<string, BoxScore>
  selectedGameId: string | null
  isLoadingGames: boolean
  isLoadingBoxScore: boolean

  // Actions
  setGames: (games: GameSummary[]) => void
  updateGame: (game: GameSummary) => void
  setBoxScore: (gameId: string, boxScore: BoxScore) => void
  selectGame: (gameId: string | null) => void
  setLoadingGames: (loading: boolean) => void
  setLoadingBoxScore: (loading: boolean) => void

  // Computed
  getTodaysGames: () => GameSummary[]
  getLiveGames: () => GameSummary[]
  getUpcomingGames: () => GameSummary[]
  getFinalGames: () => GameSummary[]
  getGameById: (gameId: string) => GameSummary | undefined
  getBoxScoreById: (gameId: string) => BoxScore | undefined
}

export const useGamesStore = create<GamesStore>((set, get) => ({
  // Initial state
  games: new Map(),
  boxScores: new Map(),
  selectedGameId: null,
  isLoadingGames: false,
  isLoadingBoxScore: false,

  // Actions
  setGames: (games) => set((state) => {
    const newGames = new Map(state.games)
    games.forEach(game => newGames.set(game.game_id, game))
    return { games: newGames }
  }),

  updateGame: (game) => set((state) => {
    const newGames = new Map(state.games)
    newGames.set(game.game_id, game)
    return { games: newGames }
  }),

  setBoxScore: (gameId, boxScore) => set((state) => {
    const newBoxScores = new Map(state.boxScores)
    newBoxScores.set(gameId, boxScore)
    return { boxScores: newBoxScores }
  }),

  selectGame: (gameId) => set({ selectedGameId: gameId }),

  setLoadingGames: (loading) => set({ isLoadingGames: loading }),

  setLoadingBoxScore: (loading) => set({ isLoadingBoxScore: loading }),

  // Computed selectors
  getTodaysGames: () => {
    const { games } = get()
    return Array.from(games.values()).sort((a, b) => {
      // Sort by commence time
      return new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
    })
  },

  getLiveGames: () => {
    return get().getTodaysGames().filter(game => game.status === 'live')
  },

  getUpcomingGames: () => {
    return get().getTodaysGames().filter(game => game.status === 'upcoming')
  },

  getFinalGames: () => {
    return get().getTodaysGames().filter(game => game.status === 'final')
  },

  getGameById: (gameId) => {
    return get().games.get(gameId)
  },

  getBoxScoreById: (gameId) => {
    return get().boxScores.get(gameId)
  },
}))





