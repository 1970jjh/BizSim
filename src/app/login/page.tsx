'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">BizSim</h1>
          <p className="text-slate-400">C-Level 경영 시뮬레이션</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>학습자 입장</CardTitle>
            <CardDescription>관리자가 공유한 방 코드로 입장합니다</CardDescription>
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
