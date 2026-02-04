export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import {
  getAllTeams,
  getRoomData,
  getRoundData,
  saveRoundResults,
  updateTeamAssets,
  saveLeaderboard,
  submitRound,
} from '@/lib/firebase/firestore'
import { calculateTotalDemand, calculateDemandPerVehicle } from '@/lib/logic/demand'
import { allocateMarketShare, type TeamBid } from '@/lib/logic/market-share'
import { calculateRoundResults } from '@/lib/logic/calculation-engine'
import { calculateLeaderboard } from '@/lib/logic/asset-valuation'
import { VEHICLE_TYPES, PRODUCTION_PER_LINE, DEFAULT_ROUND_DECISIONS } from '@/lib/logic/constants'
import type { VehicleType, RoundDecisions } from '@/lib/types/game'

export async function POST(request: Request) {
  try {
    const { roomCode } = (await request.json()) as { roomCode: string }

    if (!roomCode) {
      return NextResponse.json(
        { success: false, error: '방 코드가 필요합니다.' },
        { status: 400 }
      )
    }

    const room = await getRoomData(roomCode)
    if (!room) {
      return NextResponse.json(
        { success: false, error: '방을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const roundId = `round_${room.currentRound}`
    const teams = await getAllTeams(roomCode)

    // Force-submit unsubmitted teams
    for (const team of teams) {
      const roundData = await getRoundData(roomCode, team.id, roundId)
      if (roundData && !roundData.isSubmitted) {
        await submitRound(roomCode, team.id, roundId)
      }
    }

    // Calculate demand
    const totalDemand = calculateTotalDemand(
      room.totalTeams,
      room.marketConfig
    )
    const demandPerVehicle = calculateDemandPerVehicle(
      totalDemand,
      room.marketConfig
    )

    // Collect bids per vehicle type and allocate market share
    const allocations: Record<string, Record<VehicleType, number>> = {}

    for (const vt of VEHICLE_TYPES) {
      const bids: TeamBid[] = []

      for (const team of teams) {
        const roundData = await getRoundData(roomCode, team.id, roundId)
        const decisions = roundData ?? DEFAULT_ROUND_DECISIONS
        const capacity = Math.min(
          (team.assets.facilities[vt] +
            decisions.production.facilityExpansion[vt]) *
            PRODUCTION_PER_LINE,
          decisions.production.materialPurchase[vt]
        )
        bids.push({
          teamId: team.id,
          bidPrice: decisions.marketing.bidPrices[vt],
          productionCapacity: capacity,
        })
      }

      const shares = allocateMarketShare(bids, demandPerVehicle[vt])

      for (const share of shares) {
        if (!allocations[share.teamId]) {
          allocations[share.teamId] = {
            gasoline: 0,
            diesel: 0,
            hybrid: 0,
            ev: 0,
            hydrogen: 0,
          }
        }
        allocations[share.teamId][vt] = share.allocatedDemand
      }
    }

    // Calculate results for each team
    const teamResults: Record<string, ReturnType<typeof calculateRoundResults>> = {}

    for (const team of teams) {
      const roundData = await getRoundData(roomCode, team.id, roundId)
      const decisions: RoundDecisions = roundData ?? DEFAULT_ROUND_DECISIONS
      const allocated = allocations[team.id] ?? {
        gasoline: 0,
        diesel: 0,
        hybrid: 0,
        ev: 0,
        hydrogen: 0,
      }

      const results = calculateRoundResults(
        team.assets,
        decisions,
        allocated,
        room.marketConfig
      )

      teamResults[team.id] = results

      await saveRoundResults(roomCode, team.id, roundId, results)
      await updateTeamAssets(
        roomCode,
        team.id,
        results.updatedAssets,
        team.cumulativeNetProfit + results.netProfit
      )
    }

    // Calculate leaderboard
    const leaderboardInput = teams.map((team) => ({
      teamId: team.id,
      teamName: team.teamName,
      cumulativeNetProfit:
        team.cumulativeNetProfit + (teamResults[team.id]?.netProfit ?? 0),
      assets: teamResults[team.id]?.updatedAssets ?? team.assets,
    }))

    const leaderboard = calculateLeaderboard(leaderboardInput)
    await saveLeaderboard(roomCode, [...leaderboard])

    return NextResponse.json({ success: true, leaderboard, teamResults })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '결산 중 오류가 발생했습니다.'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
