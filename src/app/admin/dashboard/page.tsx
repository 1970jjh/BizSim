'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createRoom, subscribeToRoom, getAllTeams, getAllRooms, deleteRoom } from '@/lib/firebase/firestore'
import { signOutUser } from '@/lib/firebase/auth'
import { ROLE_LABELS } from '@/lib/logic/constants'
import { formatBillion } from '@/lib/utils/format'
import { useGameStore } from '@/lib/stores/game-store'
import type { RoomDocument, TeamDocument, Role, RoundNumber, LeaderboardEntry } from '@/lib/types/game'

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  WAITING: { label: '대기중', bgColor: 'rgba(0, 206, 201, 0.2)', textColor: '#81ecec' },
  PLAYING: { label: '진행중', bgColor: 'rgba(108, 92, 231, 0.3)', textColor: '#a29bfe' },
  FINISHED: { label: '종료', bgColor: 'rgba(255, 255, 255, 0.05)', textColor: '#aaa' },
}

export default function AdminDashboardPage() {
  const router = useRouter()

  const [rooms, setRooms] = useState<Array<RoomDocument & { roomCode: string }>>([])
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null)
  const [roomData, setRoomData] = useState<RoomDocument | null>(null)
  const [teams, setTeams] = useState<Array<TeamDocument & { id: string }>>([])
  const [roomName, setRoomName] = useState('')
  const [teamCount, setTeamCount] = useState(4)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(true)

  // Load all rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const allRooms = await getAllRooms()
        const activeRooms = allRooms
          .filter((r) => r.status !== 'DELETED')
          .sort((a, b) => b.createdAt - a.createdAt)
        setRooms(activeRooms)
        // Auto-select first room if available
        if (activeRooms.length > 0 && !selectedRoomCode) {
          setSelectedRoomCode(activeRooms[0].roomCode)
        }
      } catch (error) {
        console.error('Failed to load rooms:', error)
      } finally {
        setLoadingRooms(false)
      }
    }
    loadRooms()
  }, [])

  // Subscribe to selected room
  useEffect(() => {
    if (!selectedRoomCode) {
      setRoomData(null)
      setTeams([])
      return
    }
    const unsub = subscribeToRoom(selectedRoomCode, (data) => setRoomData(data))
    return () => unsub()
  }, [selectedRoomCode])

  // Refresh teams when room is selected
  const refreshTeams = useCallback(async () => {
    if (!selectedRoomCode) return
    const t = await getAllTeams(selectedRoomCode)
    setTeams(t)
  }, [selectedRoomCode])

  useEffect(() => {
    if (selectedRoomCode) {
      refreshTeams()
      const interval = setInterval(refreshTeams, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedRoomCode, refreshTeams])

  const handleCreate = async () => {
    if (!roomName.trim()) return
    setCreating(true)
    try {
      const code = await createRoom(roomName.trim(), teamCount)
      const allRooms = await getAllRooms()
      const activeRooms = allRooms
        .filter((r) => r.status !== 'DELETED')
        .sort((a, b) => b.createdAt - a.createdAt)
      setRooms(activeRooms)
      setSelectedRoomCode(code)
      setDialogOpen(false)
      setRoomName('')
      setTeamCount(4)
    } catch (error) {
      console.error('Failed to create room:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleStartRound = async (round: RoundNumber) => {
    if (!selectedRoomCode) return
    setLoading(true)
    try {
      await fetch('/api/game/start-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: selectedRoomCode, round }),
      })
      await refreshTeams()
    } finally {
      setLoading(false)
    }
  }

  const handleEndRound = async () => {
    if (!selectedRoomCode) return
    setLoading(true)
    try {
      await fetch('/api/game/end-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: selectedRoomCode }),
      })
      await refreshTeams()
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOutUser()
    useGameStore.getState().setAdmin(false)
    router.push('/login')
  }

  const handleDeleteRoom = async () => {
    if (!selectedRoomCode) return
    setLoading(true)
    try {
      await deleteRoom(selectedRoomCode)
      // Refresh rooms list
      const allRooms = await getAllRooms()
      const activeRooms = allRooms
        .filter((r) => r.status !== 'DELETED')
        .sort((a, b) => b.createdAt - a.createdAt)
      setRooms(activeRooms)
      setSelectedRoomCode(activeRooms.length > 0 ? activeRooms[0].roomCode : null)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Failed to delete room:', error)
    } finally {
      setLoading(false)
    }
  }

  const roleCount = (team: TeamDocument) => Object.keys(team.roles).length

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 p-5">
        {/* Header - spans full width */}
        <header className="col-span-full glass flex justify-between items-center px-8 py-4">
          <div>
            <span className="text-sm font-bold text-[#a29bfe]">JJ CREATIVE Edu with AI</span>
            <h1 className="text-2xl font-black gradient-text tracking-tight">BizSim 관리자</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full text-sm transition-all hover:bg-white/20">
                학습자 화면 보기
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 border border-red-500/30 text-white px-4 py-2 rounded-full text-sm transition-all hover:bg-red-500/30"
            >
              로그아웃
            </button>
          </div>
        </header>

        {/* Sidebar - Room List */}
        <aside className="glass p-5 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold">게임 방 목록</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="btn-gradient text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform hover:-translate-y-0.5">
                  새 방 만들기
                </button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10 bg-[#1a1a2e]/95">
                <DialogHeader>
                  <DialogTitle className="text-white">새 게임 방 만들기</DialogTitle>
                  <DialogDescription className="text-white/60">
                    방 이름과 참여 팀 수를 설정하여 새로운 게임 방을 생성합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-white/70">방 이름</Label>
                    <Input
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="예: 2024 경영전략 과정"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70">참여 팀 수 (2~12)</Label>
                    <Input
                      type="number"
                      min={2}
                      max={12}
                      value={teamCount}
                      onChange={(e) => setTeamCount(Number(e.target.value))}
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !roomName.trim()}
                    className="w-full btn-gradient border-0 text-white font-bold"
                  >
                    {creating ? '생성 중...' : '방 생성'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {loadingRooms ? (
              <div className="text-center py-8 text-white/50">방 목록을 불러오는 중...</div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                생성된 방이 없습니다.
                <br />
                새 방을 만들어 시작하세요.
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.roomCode}
                  onClick={() => setSelectedRoomCode(room.roomCode)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedRoomCode === room.roomCode
                      ? 'glass-active'
                      : 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-lg tracking-widest">{room.roomCode}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: STATUS_CONFIG[room.status]?.bgColor,
                        color: STATUS_CONFIG[room.status]?.textColor,
                      }}
                    >
                      {STATUS_CONFIG[room.status]?.label}
                    </span>
                  </div>
                  <div className="text-sm text-white/70">{room.roomName}</div>
                  <div className="flex justify-between text-xs text-white/40 mt-2">
                    <span>{formatDate(room.createdAt)}</span>
                    <span>{room.totalTeams}팀</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-col gap-5 overflow-y-auto">
          {!selectedRoomCode || !roomData ? (
            <div className="glass flex-1 flex items-center justify-center text-white/50">
              왼쪽 목록에서 관리할 방을 선택하세요.
            </div>
          ) : (
            <>
              {/* Room Info Card */}
              <section className="glass p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <div className="text-sm text-white/60 mb-1">Current Room Code</div>
                    <div className="text-6xl font-black leading-none mb-2 text-shadow-lg">
                      {selectedRoomCode}
                    </div>
                    <div className="text-xl font-light text-white/80">{roomData.roomName}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className="inline-block px-4 py-1.5 rounded-full text-sm mb-4 border"
                      style={{
                        background: STATUS_CONFIG[roomData.status]?.bgColor,
                        borderColor: STATUS_CONFIG[roomData.status]?.textColor + '66',
                        color: STATUS_CONFIG[roomData.status]?.textColor,
                      }}
                    >
                      {STATUS_CONFIG[roomData.status]?.label}
                      {roomData.status === 'PLAYING' && ` · ${roomData.currentRound}기`}
                    </div>
                    <div className="flex gap-3 justify-end">
                      {roomData.status === 'WAITING' && (
                        <button
                          onClick={() => handleStartRound(1)}
                          disabled={loading}
                          className="bg-white text-gray-900 px-6 py-3 rounded-xl font-extrabold text-lg shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                        >
                          {loading ? '처리 중...' : '1기 시작'}
                        </button>
                      )}
                      {roomData.status === 'PLAYING' && (
                        <>
                          <button
                            onClick={handleEndRound}
                            disabled={loading}
                            className="bg-red-500/20 border border-red-500/40 text-red-300 px-5 py-3 rounded-xl font-bold transition-all hover:bg-red-500/30 disabled:opacity-50"
                          >
                            강제 마감
                          </button>
                          {roomData.currentRound < 4 && (
                            <button
                              onClick={() => handleStartRound((roomData.currentRound + 1) as RoundNumber)}
                              disabled={loading}
                              className="bg-white text-gray-900 px-6 py-3 rounded-xl font-extrabold shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                            >
                              {roomData.currentRound + 1}기 시작
                            </button>
                          )}
                        </>
                      )}
                      {roomData.status === 'FINISHED' && (
                        <span className="text-white/50">게임이 종료되었습니다.</span>
                      )}
                      {/* Delete Room Button */}
                      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <button className="bg-white/10 border border-white/20 text-white/70 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300">
                            방 삭제
                          </button>
                        </DialogTrigger>
                        <DialogContent className="glass border-white/10 bg-[#1a1a2e]/95">
                          <DialogHeader>
                            <DialogTitle className="text-white">방 삭제 확인</DialogTitle>
                            <DialogDescription className="text-white/60">
                              정말로 <span className="text-red-400 font-bold">{roomData.roomName}</span> 방을 삭제하시겠습니까?
                              <br />
                              이 작업은 되돌릴 수 없습니다.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => setDeleteDialogOpen(false)}
                              className="flex-1 bg-white/10 border border-white/20 text-white py-2 rounded-xl font-medium transition-all hover:bg-white/20"
                            >
                              취소
                            </button>
                            <button
                              onClick={handleDeleteRoom}
                              disabled={loading}
                              className="flex-1 bg-red-500/20 border border-red-500/40 text-red-300 py-2 rounded-xl font-bold transition-all hover:bg-red-500/30 disabled:opacity-50"
                            >
                              {loading ? '삭제 중...' : '삭제'}
                            </button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </section>

              {/* Teams Section */}
              <section className="glass p-8 flex-1">
                <div className="mb-5">
                  <h3 className="text-xl font-bold mb-1">팀 현황</h3>
                  <p className="text-sm text-white/60">
                    학습자들에게 방 코드{' '}
                    <span className="text-[#a29bfe] font-bold">{selectedRoomCode}</span>를
                    공유하세요
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all hover:bg-white/[0.08] hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
                        <h4 className="text-lg font-bold">{team.teamName}</h4>
                        <span className="text-xs bg-black/30 px-2 py-1 rounded-lg">
                          {roleCount(team)}/6
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                          <div key={role} className="flex justify-between text-sm">
                            <span className="text-white/60">{ROLE_LABELS[role]}</span>
                            <span
                              className={
                                team.roles[role]
                                  ? 'text-[#55efc4]'
                                  : 'text-white/30 italic'
                              }
                            >
                              {team.roles[role]?.nickname ?? '빈 자리'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Leaderboard */}
              {roomData.leaderboard && roomData.leaderboard.length > 0 && (
                <section className="glass p-8">
                  <h3 className="text-xl font-bold mb-5">리더보드</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-white/60">
                          <th className="text-left p-3">순위</th>
                          <th className="text-left p-3">팀</th>
                          <th className="text-right p-3">누적 순이익</th>
                          <th className="text-right p-3">자산 가치</th>
                          <th className="text-right p-3">총점</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(roomData.leaderboard as LeaderboardEntry[]).map((entry, idx) => (
                          <tr
                            key={entry.teamId}
                            className={`border-b border-white/5 ${
                              idx === 0 ? 'bg-yellow-500/10' : ''
                            }`}
                          >
                            <td className="p-3 font-bold">
                              {entry.rank === 1 && '🏆 '}
                              {entry.rank}위
                            </td>
                            <td className="p-3">{entry.teamName}</td>
                            <td className="p-3 text-right text-[#81ecec]">
                              {formatBillion(entry.cumulativeNetProfit)}
                            </td>
                            <td className="p-3 text-right text-[#a29bfe]">
                              {formatBillion(entry.totalAssetValue)}
                            </td>
                            <td className="p-3 text-right font-bold text-white">
                              {formatBillion(entry.score)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-white/30">
        JJ CREATIVE Edu with AI &copy; 2026 All Rights Reserved.
      </footer>
    </div>
  )
}
