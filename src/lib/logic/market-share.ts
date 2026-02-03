import { MARKET_SHARE_BONUS, MARKET_SHARE_PENALTY } from './constants'

export interface TeamBid {
  readonly teamId: string
  readonly bidPrice: number
  readonly productionCapacity: number
}

export interface MarketAllocation {
  readonly teamId: string
  readonly allocatedDemand: number
}

export function allocateMarketShare(
  teamBids: readonly TeamBid[],
  totalDemandForType: number
): readonly MarketAllocation[] {
  if (teamBids.length === 0 || totalDemandForType <= 0) return []

  const activeBids = teamBids.filter(
    (b) => b.bidPrice > 0 && b.productionCapacity > 0
  )
  if (activeBids.length === 0) return []

  const sorted = [...activeBids].sort((a, b) => a.bidPrice - b.bidPrice)
  const baseAllocation = totalDemandForType / sorted.length

  return sorted.map((team, index) => {
    const ratio =
      sorted.length <= 1
        ? 1.0
        : MARKET_SHARE_BONUS -
          (index / (sorted.length - 1)) *
            (MARKET_SHARE_BONUS - MARKET_SHARE_PENALTY)

    const allocated = Math.round(baseAllocation * ratio * 100) / 100
    return {
      teamId: team.teamId,
      allocatedDemand: Math.min(allocated, team.productionCapacity),
    }
  })
}
