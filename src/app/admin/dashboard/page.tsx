'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { createRoom, subscribeToRoom, getAllTeams, getAllRooms } from '@/lib/firebase/firestore'
import { signOutUser } from '@/lib/firebase/auth'
import { ROLE_LABELS } from '@/lib/logic/constants'
import { formatBillion } from '@/lib/utils/format'
import { useGameStore } from '@/lib/stores/game-store'
import type { RoomDocument, TeamDocument, Role, RoundNumber, LeaderboardEntry } from '@/lib/types/game'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  WAITING: { label: '대기중', variant: 'secondary' },
  PLAYING: { label: '진행중', variant: 'default' },
  FINISHED: { label: '종료', variant: 'outline' },
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
  const [loadingRooms, setLoadingRooms] = useState(true)

  // Load all rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const allRooms = await getAllRooms()
        // Filter out deleted rooms and sort by createdAt descending
        const activeRooms = allRooms
          .filter((r) => r.status !== 'DELETED')
          .sort((a, b) => b.createdAt - a.createdAt)
        setRooms(activeRooms)
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
      // Refresh rooms list and select the new room
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

  const roleCount = (team: TeamDocument) => Object.keys(team.roles).length

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">BizSim 관리자</h1>
            <p className="text-sm text-muted-foreground">게임 방 생성 및 진행 관리</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:underline">
              학습자 화면 보기
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Room List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">게임 방 목록</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">새 방 만들기</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 게임 방 만들기</DialogTitle>
                    <DialogDescription>
                      방 이름과 참여 팀 수를 설정하여 새로운 게임 방을 생성합니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>방 이름</Label>
                      <Input
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="예: 2024 경영전략 과정"
                      />
                    </div>
                    <div>
                      <Label>참여 팀 수 (2~12)</Label>
                      <Input
                        type="number"
                        min={2}
                        max={12}
                        value={teamCount}
                        onChange={(e) => setTeamCount(Number(e.target.value))}
                      />
                    </div>
                    <Button onClick={handleCreate} disabled={creating || !roomName.trim()} className="w-full">
                      {creating ? '생성 중...' : '방 생성'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loadingRooms ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  방 목록을 불러오는 중...
                </CardContent>
              </Card>
            ) : rooms.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  생성된 방이 없습니다.
                  <br />
                  새 방을 만들어 시작하세요.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <Card
                    key={room.roomCode}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                      selectedRoomCode === room.roomCode ? 'ring-2 ring-primary bg-slate-50' : ''
                    }`}
                    onClick={() => setSelectedRoomCode(room.roomCode)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold tracking-wider">
                              {room.roomCode}
                            </span>
                            <Badge variant={STATUS_LABELS[room.status]?.variant ?? 'secondary'}>
                              {STATUS_LABELS[room.status]?.label ?? room.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {room.roomName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(room.createdAt)} · {room.totalTeams}팀
                          </p>
                        </div>
                        {room.status === 'PLAYING' && (
                          <Badge variant="outline">{room.currentRound}기</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right: Room Details */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedRoomCode ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  왼쪽 목록에서 관리할 방을 선택하세요.
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Room Info */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardDescription>방 코드</CardDescription>
                        <CardTitle className="text-4xl font-mono tracking-widest">
                          {selectedRoomCode}
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <Badge variant={STATUS_LABELS[roomData?.status ?? 'WAITING']?.variant}>
                          {STATUS_LABELS[roomData?.status ?? 'WAITING']?.label}
                        </Badge>
                        {roomData?.status === 'PLAYING' && (
                          <p className="text-2xl font-bold mt-1">{roomData.currentRound}기</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{roomData?.roomName}</p>
                    <Separator className="my-4" />
                    <div className="flex gap-3 flex-wrap">
                      {roomData?.status === 'WAITING' && (
                        <Button onClick={() => handleStartRound(1)} disabled={loading}>
                          {loading ? '처리 중...' : '1기 시작'}
                        </Button>
                      )}
                      {roomData?.status === 'PLAYING' && (
                        <>
                          <Button variant="destructive" onClick={handleEndRound} disabled={loading}>
                            강제 마감 & 결산
                          </Button>
                          {roomData.currentRound < 4 && (
                            <Button
                              onClick={() => handleStartRound((roomData.currentRound + 1) as RoundNumber)}
                              disabled={loading}
                            >
                              {roomData.currentRound + 1}기 시작
                            </Button>
                          )}
                        </>
                      )}
                      {roomData?.status === 'FINISHED' && (
                        <p className="text-muted-foreground">게임이 종료되었습니다.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Teams Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>팀 현황</CardTitle>
                    <CardDescription>
                      학습자들에게 방 코드 <span className="font-mono font-bold">{selectedRoomCode}</span>를 공유하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {teams.map((team) => (
                        <Card key={team.id} className="border">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between">
                              <span>{team.teamName}</span>
                              <Badge variant={roleCount(team) === 6 ? 'default' : 'secondary'}>
                                {roleCount(team)}/6
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1 text-sm">
                              {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                                <div key={role} className="flex justify-between">
                                  <span>{ROLE_LABELS[role]}</span>
                                  <span
                                    className={team.roles[role] ? 'text-green-600' : 'text-gray-400'}
                                  >
                                    {team.roles[role]?.nickname ?? '빈 자리'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Leaderboard */}
                {roomData?.leaderboard && roomData.leaderboard.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>리더보드</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">순위</th>
                              <th className="text-left p-2">팀</th>
                              <th className="text-right p-2">누적 순이익</th>
                              <th className="text-right p-2">자산 가치</th>
                              <th className="text-right p-2">총점</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(roomData.leaderboard as LeaderboardEntry[]).map((entry) => (
                              <tr key={entry.teamId} className="border-b">
                                <td className="p-2 font-bold">{entry.rank}위</td>
                                <td className="p-2">{entry.teamName}</td>
                                <td className="p-2 text-right">{formatBillion(entry.cumulativeNetProfit)}</td>
                                <td className="p-2 text-right">{formatBillion(entry.totalAssetValue)}</td>
                                <td className="p-2 text-right font-bold">{formatBillion(entry.score)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
