import { create } from 'zustand'
import type { MarketConfig, Role, RoomStatus, RoundNumber } from '@/lib/types/game'

interface GameState {
  roomCode: string | null
  roomStatus: RoomStatus
  currentRound: RoundNumber
  marketConfig: MarketConfig | null
  userId: string | null
  nickname: string | null
  teamId: string | null
  role: Role | null
  isAdmin: boolean
}

interface GameActions {
  setRoom: (roomCode: string, status: RoomStatus, round: RoundNumber, config: MarketConfig) => void
  setUser: (userId: string, nickname: string) => void
  setTeam: (teamId: string) => void
  setRole: (role: Role) => void
  setAdmin: (isAdmin: boolean) => void
  updateRound: (round: RoundNumber, config: MarketConfig) => void
  updateStatus: (status: RoomStatus) => void
  reset: () => void
}

const initialState: GameState = {
  roomCode: null,
  roomStatus: 'WAITING',
  currentRound: 1,
  marketConfig: null,
  userId: null,
  nickname: null,
  teamId: null,
  role: null,
  isAdmin: false,
}

export const useGameStore = create<GameState & GameActions>()((set) => ({
  ...initialState,

  setRoom: (roomCode, roomStatus, currentRound, marketConfig) =>
    set({ roomCode, roomStatus, currentRound, marketConfig }),

  setUser: (userId, nickname) =>
    set({ userId, nickname }),

  setTeam: (teamId) =>
    set({ teamId }),

  setRole: (role) =>
    set({ role }),

  setAdmin: (isAdmin) =>
    set({ isAdmin }),

  updateRound: (currentRound, marketConfig) =>
    set({ currentRound, marketConfig }),

  updateStatus: (roomStatus) =>
    set({ roomStatus }),

  reset: () => set(initialState),
}))
