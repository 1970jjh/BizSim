import type { RoundNumber, LeaderboardEntry, Role, RoundResults } from './game'

export interface StartRoundRequest {
  readonly roomCode: string
  readonly round: RoundNumber
}

export interface StartRoundResponse {
  readonly success: boolean
  readonly error?: string
}

export interface EndRoundRequest {
  readonly roomCode: string
}

export interface EndRoundResponse {
  readonly success: boolean
  readonly leaderboard?: readonly LeaderboardEntry[]
  readonly teamResults?: Record<string, RoundResults>
  readonly error?: string
}

export interface AiConsultRequest {
  readonly role: Role
  readonly teamData: string
  readonly roundConfig: string
  readonly question: string
}
