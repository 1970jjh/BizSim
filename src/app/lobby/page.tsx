'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGameStore } from '@/lib/stores/game-store'
import { getAllTeams, joinTeam, subscribeToRoom } from '@/lib/firebase/firestore'
import { ROLE_LABELS, ROLE_ICONS } from '@/lib/logic/constants'
import type { Role, TeamDocument } from '@/lib/types/game'

export default function LobbyPage() {
  const router = useRouter()
  const { roomCode, userId, nickname } = useGameStore()
  const setTeam = useGameStore((s) => s.setTeam)
  const setRole = useGameStore((s) => s.setRole)
  const [teams, setTeams] = useState<Array<TeamDocument & { id: string }>>([])
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!roomCode) {
      router.push('/login')
      return
    }
    const load = async () => {
      const t = await getAllTeams(roomCode)
      setTeams(t)
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [roomCode, router])

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToRoom(roomCode, (data) => {
      if (data.status === 'PLAYING') {
        router.push('/dashboard/overview')
      }
    })
    return () => unsub()
  }, [roomCode, router])

  const handleJoin = async (teamId: string, role: Role) => {
    if (!roomCode || !userId || !nickname) return
    setJoining(true)
    setError('')
    try {
      await joinTeam(roomCode, teamId, role, userId, nickname)
      setTeam(teamId)
      setRole(role)
      router.push('/dashboard/overview')
    } catch (err) {
      setError(err instanceof Error ? err.message : '역할 선택에 실패했습니다.')
    } finally {
      setJoining(false)
    }
  }

  const roles = Object.keys(ROLE_LABELS) as Role[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold">팀 & 직무 선택</h1>
          <p className="text-slate-300 mt-2">
            방 코드: <span className="font-mono text-xl tracking-widest">{roomCode}</span>
          </p>
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="bg-white/95">
              <CardHeader>
                <CardTitle>{team.teamName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roles.map((role) => {
                  const taken = team.roles[role]
                  return (
                    <div key={role} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <span>{ROLE_ICONS[role]}</span>
                        <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
                      </div>
                      {taken ? (
                        <Badge variant="secondary">{taken.nickname}</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoin(team.id, role)}
                          disabled={joining}
                        >
                          선택
                        </Button>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
