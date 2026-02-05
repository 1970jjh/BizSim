'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { signInAnonymouslyWithNickname } from '@/lib/firebase/auth'
import { getAllRooms, getRoomData } from '@/lib/firebase/firestore'
import { useGameStore } from '@/lib/stores/game-store'
import type { RoomDocument } from '@/lib/types/game'

type RoomWithCode = RoomDocument & { roomCode: string }

export default function LoginPage() {
  const [nickname, setNickname] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<RoomWithCode | null>(null)
  const [rooms, setRooms] = useState<RoomWithCode[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const router = useRouter()
  const setUser = useGameStore((s) => s.setUser)
  const setRoom = useGameStore((s) => s.setRoom)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const allRooms = await getAllRooms()
        // WAITING 상태인 방만 표시 (DELETED 제외)
        const availableRooms = allRooms.filter(
          (room) => room.status === 'WAITING' || room.status === 'PLAYING'
        )
        setRooms(availableRooms)
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
      } finally {
        setLoadingRooms(false)
      }
    }
    fetchRooms()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nickname.trim() || nickname.length > 20) {
      setError('이름을 1~20자로 입력하세요.')
      return
    }
    if (!selectedRoom) {
      setError('입장할 방을 선택하세요.')
      return
    }

    setLoading(true)
    try {
      const room = await getRoomData(selectedRoom.roomCode)
      if (!room) {
        setError('방이 존재하지 않습니다.')
        return
      }

      const user = await signInAnonymouslyWithNickname(nickname.trim())
      setUser(user.uid, nickname.trim())
      setRoom(selectedRoom.roomCode, room.status, room.currentRound, room.marketConfig)
      router.push('/lobby')
    } catch (err) {
      setError(err instanceof Error ? err.message : '입장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">BizSim</h1>
          <p className="text-slate-400">C-Level 경영 시뮬레이션</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>학습자 입장</CardTitle>
            <CardDescription>개설된 방을 선택하고 입장하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>개설된 방</Label>
                {loadingRooms ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    방 목록을 불러오는 중...
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    현재 개설된 방이 없습니다
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {rooms.map((room) => (
                      <div
                        key={room.roomCode}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedRoom?.roomCode === room.roomCode
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{room.roomName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            room.status === 'WAITING'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {room.status === 'WAITING' ? '대기중' : '진행중'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          팀 수: {room.totalTeams}개
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">이름</Label>
                <Input
                  id="nickname"
                  placeholder="이름을 입력하세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !selectedRoom || !nickname.trim()}
              >
                {loading ? '접속 중...' : '입장하기'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-800 px-2 text-slate-400">또는</span>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <p className="text-slate-300 font-medium">관리자(강사)이신가요?</p>
                <p className="text-sm text-slate-500">방을 생성하고 게임을 진행합니다</p>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/login">관리자로 로그인</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
