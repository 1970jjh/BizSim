'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/lib/stores/game-store'
import { getAllTeams, joinTeam, subscribeToRoom, getRoomData } from '@/lib/firebase/firestore'
import { ROLE_LABELS, ROLE_ICONS } from '@/lib/logic/constants'
import type { Role, TeamDocument, RoomDocument } from '@/lib/types/game'

export default function LobbyPage() {
  const router = useRouter()
  const { roomCode, userId, nickname } = useGameStore()
  const setTeam = useGameStore((s) => s.setTeam)
  const setRole = useGameStore((s) => s.setRole)
  const [teams, setTeams] = useState<Array<TeamDocument & { id: string }>>([])
  const [roomData, setRoomData] = useState<RoomDocument | null>(null)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState<string | null>(null) // Track which role is being joined
  const [myRoles, setMyRoles] = useState<{ teamId: string; role: Role }[]>([])

  // Load room data and teams
  useEffect(() => {
    if (!roomCode) {
      router.push('/login')
      return
    }

    const loadData = async () => {
      const [room, teamsData] = await Promise.all([
        getRoomData(roomCode),
        getAllTeams(roomCode),
      ])
      setRoomData(room)
      setTeams(teamsData)

      // Find roles already selected by current user
      if (userId) {
        const userRoles: { teamId: string; role: Role }[] = []
        teamsData.forEach((team) => {
          Object.entries(team.roles).forEach(([role, data]) => {
            if (data.uid === userId) {
              userRoles.push({ teamId: team.id, role: role as Role })
            }
          })
        })
        setMyRoles(userRoles)
      }
    }

    loadData()
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [roomCode, userId, router])

  // Listen for game start
  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToRoom(roomCode, (data) => {
      setRoomData(data)
      if (data.status === 'PLAYING' && myRoles.length > 0) {
        // Navigate to first selected role's dashboard
        setTeam(myRoles[0].teamId)
        setRole(myRoles[0].role)
        router.push('/dashboard/overview')
      }
    })
    return () => unsub()
  }, [roomCode, router, myRoles, setTeam, setRole])

  const handleJoin = async (teamId: string, role: Role) => {
    if (!roomCode || !userId || !nickname) return
    setJoining(`${teamId}-${role}`)
    setError('')
    try {
      await joinTeam(roomCode, teamId, role, userId, nickname)
      // Update local state
      setMyRoles((prev) => {
        const exists = prev.some((r) => r.teamId === teamId && r.role === role)
        if (!exists) {
          return [...prev, { teamId, role }]
        }
        return prev
      })
      // Set as primary team/role if first selection
      if (myRoles.length === 0) {
        setTeam(teamId)
        setRole(role)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '역할 선택에 실패했습니다.')
    } finally {
      setJoining(null)
    }
  }

  const isMyRole = (teamId: string, role: Role) => {
    return myRoles.some((r) => r.teamId === teamId && r.role === role)
  }

  const roles = Object.keys(ROLE_LABELS) as Role[]

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <span className="text-sm font-bold text-[#a29bfe]">JJ CREATIVE Edu with AI</span>
          <h1 className="text-4xl font-black gradient-text mt-1">팀 & 직무 선택</h1>
          <p className="text-white/70 mt-3 text-lg">
            {roomData?.roomName || '방 이름 로딩 중...'}
          </p>
          {roomData?.status === 'PLAYING' ? (
            myRoles.length > 0 ? (
              <div className="mt-4">
                <p className="text-[#55efc4] text-sm mb-3">
                  {myRoles.length}개 직무 선택됨 - 게임이 진행 중입니다!
                </p>
                <button
                  onClick={() => {
                    setTeam(myRoles[0].teamId)
                    setRole(myRoles[0].role)
                    router.push('/dashboard/overview')
                  }}
                  className="bg-white text-gray-900 px-8 py-3 rounded-xl font-extrabold text-lg shadow-lg transition-all hover:scale-105"
                >
                  대시보드로 이동
                </button>
              </div>
            ) : (
              <p className="text-yellow-400 text-sm mt-2">
                게임이 시작되었습니다! 직무를 선택하고 참여하세요.
              </p>
            )
          ) : myRoles.length > 0 ? (
            <p className="text-[#55efc4] text-sm mt-2">
              {myRoles.length}개 직무 선택됨 - 게임 시작을 기다리는 중...
            </p>
          ) : null}
          {error && (
            <p className="text-red-400 mt-2 bg-red-500/10 inline-block px-4 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="glass p-6">
              <h3 className="text-xl font-bold text-white mb-4">{team.teamName}</h3>
              <div className="space-y-3">
                {roles.map((role) => {
                  const taken = team.roles[role]
                  const isMine = isMyRole(team.id, role)
                  const isJoiningThis = joining === `${team.id}-${role}`

                  return (
                    <div
                      key={role}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        isMine
                          ? 'bg-[#6c5ce7]/30 border border-[#6c5ce7]/50'
                          : taken
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ROLE_ICONS[role]}</span>
                        <span className="text-white font-medium">{ROLE_LABELS[role]}</span>
                      </div>
                      {taken ? (
                        <span
                          className={`text-sm px-3 py-1 rounded-full ${
                            isMine
                              ? 'bg-[#55efc4]/20 text-[#55efc4] font-bold'
                              : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {isMine ? '내 직무' : taken.nickname}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoin(team.id, role)}
                          disabled={!!joining}
                          className="bg-white text-gray-900 px-4 py-1.5 rounded-lg font-bold text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {isJoiningThis ? '선택 중...' : '선택'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-white/30 pt-8">
          JJ CREATIVE Edu with AI &copy; 2026 All Rights Reserved.
        </footer>
      </div>
    </div>
  )
}
