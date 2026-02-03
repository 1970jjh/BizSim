'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import {
  subscribeToRoom,
  subscribeToTeam,
  subscribeToRound,
} from '@/lib/firebase/firestore'

export function useFirestoreSync() {
  const roomCode = useGameStore((s) => s.roomCode)
  const teamId = useGameStore((s) => s.teamId)
  const currentRound = useGameStore((s) => s.currentRound)
  const updateRound = useGameStore((s) => s.updateRound)
  const updateStatus = useGameStore((s) => s.updateStatus)
  const setAssets = useTeamStore((s) => s.setAssets)
  const setDecisions = useTeamStore((s) => s.setDecisions)

  useEffect(() => {
    if (!roomCode) return

    const unsub = subscribeToRoom(roomCode, (data) => {
      updateStatus(data.status)
      updateRound(data.currentRound, data.marketConfig)
    })

    return () => unsub()
  }, [roomCode, updateRound, updateStatus])

  useEffect(() => {
    if (!roomCode || !teamId) return

    const unsub = subscribeToTeam(roomCode, teamId, (data) => {
      setAssets(data.assets)
    })

    return () => unsub()
  }, [roomCode, teamId, setAssets])

  useEffect(() => {
    if (!roomCode || !teamId) return

    const roundId = `round_${currentRound}`
    const unsub = subscribeToRound(roomCode, teamId, roundId, (data) => {
      setDecisions(data)
    })

    return () => unsub()
  }, [roomCode, teamId, currentRound, setDecisions])
}
