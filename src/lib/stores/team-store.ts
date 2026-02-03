import { create } from 'zustand'
import type { Role, RoundDecisions, RoundResults, TeamAssets } from '@/lib/types/game'

interface TeamState {
  assets: TeamAssets | null
  currentDecisions: RoundDecisions | null
  roundResults: RoundResults | null
  allRoundResults: Record<string, RoundResults>
  otherRolesReady: Record<Role, boolean>
}

interface TeamActions {
  setAssets: (assets: TeamAssets) => void
  setDecisions: (decisions: RoundDecisions) => void
  setRoundResults: (results: RoundResults) => void
  setAllRoundResults: (results: Record<string, RoundResults>) => void
  setRolesReady: (ready: Record<Role, boolean>) => void
  reset: () => void
}

const initialState: TeamState = {
  assets: null,
  currentDecisions: null,
  roundResults: null,
  allRoundResults: {},
  otherRolesReady: {
    ceo: false,
    cfo: false,
    cpo: false,
    cro: false,
    cmo: false,
    cho: false,
  },
}

export const useTeamStore = create<TeamState & TeamActions>()((set) => ({
  ...initialState,

  setAssets: (assets) => set({ assets }),

  setDecisions: (decisions) => set({ currentDecisions: decisions }),

  setRoundResults: (results) => set({ roundResults: results }),

  setAllRoundResults: (results) => set({ allRoundResults: results }),

  setRolesReady: (ready) => set({ otherRolesReady: ready }),

  reset: () => set(initialState),
}))
