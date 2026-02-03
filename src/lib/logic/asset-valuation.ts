import type { TeamAssets, LeaderboardEntry } from '@/lib/types/game'
import { FACILITY_BUILD_COST } from './constants'

export function calculateTotalAssetValue(assets: TeamAssets): number {
  const cashValue = assets.cash

  const facilityCount = Object.values(assets.facilities).reduce(
    (s, n) => s + n,
    0
  )
  const facilityValue = facilityCount * FACILITY_BUILD_COST * 0.5

  const techValue =
    (assets.techLevel.design - 1) * 300 +
    (assets.techLevel.safety - 1) * 200 +
    (assets.techLevel.process - 1) * 250

  const humanCapitalValue =
    assets.employees.skilled * 100 + assets.employees.master * 200

  return Math.round(
    (cashValue + facilityValue + techValue + humanCapitalValue) * 100
  ) / 100
}

interface TeamForLeaderboard {
  readonly teamId: string
  readonly teamName: string
  readonly cumulativeNetProfit: number
  readonly assets: TeamAssets
}

export function calculateLeaderboard(
  teams: readonly TeamForLeaderboard[]
): readonly LeaderboardEntry[] {
  const entries = teams.map((t) => {
    const totalAssetValue = calculateTotalAssetValue(t.assets)
    return {
      teamId: t.teamId,
      teamName: t.teamName,
      cumulativeNetProfit: t.cumulativeNetProfit,
      totalAssetValue,
      score: t.cumulativeNetProfit + totalAssetValue,
      rank: 0,
    }
  })
  const sorted = [...entries].sort((a, b) => b.score - a.score)
  return sorted.map((e, i) => ({ ...e, rank: i + 1 }))
}
