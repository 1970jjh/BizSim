'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createRoom, subscribeToRoom, getAllTeams } from '@/lib/firebase/firestore'
import { ROLE_LABELS } from '@/lib/logic/constants'
import { formatBillion } from '@/lib/utils/format'
import type { RoomDocument, TeamDocument, Role, RoundNumber, LeaderboardEntry } from '@/lib/types/game'

export default function AdminDashboardPage() {
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [roomData, setRoomData] = useState<RoomDocument | null>(null)
  const [teams, setTeams] = useState<Array<TeamDocument & { id: string }>>([])
  const [roomName, setRoomName] = useState('')
  const [teamCount, setTeamCount] = useState(4)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToRoom(roomCode, (data) => setRoomData(data))
    return () => unsub()
  }, [roomCode])

  const refreshTeams = useCallback(async () => {
    if (!roomCode) return
    const t = await getAllTeams(roomCode)
    setTeams(t)
  }, [roomCode])

  useEffect(() => {
    if (roomCode) {
      refreshTeams()
      const interval = setInterval(refreshTeams, 5000)
      return () => clearInterval(interval)
    }
  }, [roomCode, refreshTeams])

  const handleCreate = async () => {
    if (!roomName.trim()) return
    setCreating(true)
    try {
      const code = await createRoom(roomName.trim(), teamCount)
      setRoomCode(code)
      setDialogOpen(false)
    } catch {
      // handle error
    } finally {
      setCreating(false)
    }
  }

  const handleStartRound = async (round: RoundNumber) => {
    if (!roomCode) return
    setLoading(true)
    try {
      await fetch('/api/game/start-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, round }),
      })
      await refreshTeams()
    } finally {
      setLoading(false)
    }
  }

  const handleEndRound = async () => {
    if (!roomCode) return
    setLoading(true)
    try {
      await fetch('/api/game/end-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode }),
      })
      await refreshTeams()
    } finally {
      setLoading(false)
    }
  }

  const roleCount = (team: TeamDocument) =>
    Object.keys(team.roles).length

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">BizSim 관리자 대시보드</h1>

        {!roomCode ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mb-4 text-muted-foreground">아직 생성된 방이 없습니다.</p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">방 만들기</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 게임 방 만들기</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>방 이름</Label>
                      <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="예: 2024 경영전략 과정" />
                    </div>
                    <div>
                      <Label>참여 팀 수 (2~12)</Label>
                      <Input type="number" min={2} max={12} value={teamCount} onChange={(e) => setTeamCount(Number(e.target.value))} />
                    </div>
                    <Button onClick={handleCreate} disabled={creating} className="w-full">
                      {creating ? '생성 중...' : '방 생성'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>방 코드</span>
                  <Badge variant="outline" className="text-3xl px-6 py-2 font-mono tracking-widest">
                    {roomCode}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                <Badge>{roomData?.status ?? 'WAITING'}</Badge>
                <Badge variant="secondary">{roomData?.currentRound ?? 1}기</Badge>
                <span className="text-sm text-muted-foreground">{roomData?.roomName}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>라운드 제어</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3 flex-wrap">
                {roomData?.status === 'WAITING' && (
                  <Button onClick={() => handleStartRound(1)} disabled={loading}>
                    1기 시작
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>팀 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              <span className={team.roles[role] ? 'text-green-600' : 'text-gray-400'}>
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

            {roomData?.leaderboard && roomData.leaderboard.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>리더보드</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
