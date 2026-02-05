export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import {
  updateRoomRound,
  updateRoomStatus,
  initRoundForAllTeams,
} from '@/lib/firebase/firestore'
import type { RoundNumber } from '@/lib/types/game'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { roomCode, round } = body as { roomCode: string; round: RoundNumber }

    console.log('[start-round] Starting round', { roomCode, round })

    if (!roomCode || !round || round < 1 || round > 4) {
      console.log('[start-round] Invalid request', { roomCode, round })
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }

    console.log('[start-round] Updating room round...')
    await updateRoomRound(roomCode, round)

    console.log('[start-round] Updating room status to PLAYING...')
    await updateRoomStatus(roomCode, 'PLAYING')

    console.log('[start-round] Initializing round for all teams...')
    await initRoundForAllTeams(roomCode, round)

    console.log('[start-round] Success!')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[start-round] Error:', error)
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
