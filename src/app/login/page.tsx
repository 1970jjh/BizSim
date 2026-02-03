'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { signInAnonymouslyWithNickname } from '@/lib/firebase/auth'
import { getRoomData } from '@/lib/firebase/firestore'
import { useGameStore } from '@/lib/stores/game-store'

export default function LoginPage() {
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setUser = useGameStore((s) => s.setUser)
  const setRoom = useGameStore((s) => s.setRoom)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nickname.trim() || nickname.length > 20) {
      setError('닉네임을 1~20자로 입력하세요.')
      return
    }
    const code = roomCode.toUpperCase().trim()
    if (code.length !== 4) {
      setError('방 코드는 4자리입니다.')
      return
    }

    setLoading(true)
    try {
      const room = await getRoomData(code)
      if (!room) {
        setError('존재하지 않는 방 코드입니다.')
        return
      }

      const user = await signInAnonymouslyWithNickname(nickname.trim())
      setUser(user.uid, nickname.trim())
      setRoom(code, room.status, room.currentRound, room.marketConfig)
      router.push('/lobby')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">BizSim</CardTitle>
          <p className="text-muted-foreground">C-Level 경영 시뮬레이션</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                placeholder="이름을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomCode">방 코드</Label>
              <Input
                id="roomCode"
                placeholder="4자리 코드 (예: A1B2)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="uppercase tracking-widest text-center text-lg"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '접속 중...' : '입장하기'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
