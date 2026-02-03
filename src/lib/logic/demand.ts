import type { MarketConfig, VehicleType } from '@/lib/types/game'
import { BASE_DEMAND_PER_TEAM } from './constants'

export function calculateTotalDemand(
  totalTeams: number,
  roundConfig: MarketConfig
): number {
  return BASE_DEMAND_PER_TEAM * totalTeams * roundConfig.demandMultiplier
}

export function calculateDemandPerVehicle(
  totalDemand: number,
  roundConfig: MarketConfig
): Readonly<Record<VehicleType, number>> {
  const unlocked = roundConfig.unlockedVehicles
  const basePer = totalDemand / unlocked.length

  return {
    gasoline: unlocked.includes('gasoline') ? basePer : 0,
    diesel: unlocked.includes('diesel')
      ? basePer * roundConfig.dieselDemandMultiplier
      : 0,
    hybrid: unlocked.includes('hybrid') ? basePer : 0,
    ev: unlocked.includes('ev') ? basePer : 0,
    hydrogen: unlocked.includes('hydrogen') ? basePer : 0,
  }
}
