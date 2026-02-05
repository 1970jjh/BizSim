'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInAnonymously, updateProfile } from 'firebase/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAuthInstance } from '@/lib/firebase/config'
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
  const authInitialized = useRef(false)

  const [authError, setAuthError] = useState('')

  // First authenticate anonymously, then fetch rooms
  useEffect(() => {
    const initAndFetchRooms = async () => {
      try {
        // Authenticate anonymously first to access Firestore
        if (!authInitialized.current) {
          const auth = getAuthInstance()
          if (!auth.currentUser) {
            await signInAnonymously(auth)
          }
          authInitialized.current = true
        }

        // Now fetch rooms
        const allRooms = await getAllRooms()
        const availableRooms = allRooms.filter(
          (room) => room.status === 'WAITING' || room.status === 'PLAYING'
        )
        setRooms(availableRooms)
        setAuthError('')
      } catch (err: unknown) {
        console.error('Failed to fetch rooms:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage.includes('auth/admin-restricted-operation')) {
          setAuthError('Firebase 익명 인증이 비활성화되어 있습니다. 관리자에게 문의하세요.')
        } else if (errorMessage.includes('permission-denied')) {
          setAuthError('Firestore 접근 권한이 없습니다.')
        } else {
          setAuthError(`방 목록을 불러올 수 없습니다: ${errorMessage}`)
        }
      } finally {
        setLoadingRooms(false)
      }
    }
    initAndFetchRooms()
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

      // Update profile with nickname (already authenticated anonymously)
      const auth = getAuthInstance()
      const user = auth.currentUser
      if (user) {
        await updateProfile(user, { displayName: nickname.trim() })
        setUser(user.uid, nickname.trim())
        setRoom(selectedRoom.roomCode, room.status, room.currentRound, room.marketConfig)
        router.push('/lobby')
      } else {
        setError('인증에 실패했습니다. 페이지를 새로고침하세요.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '입장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <span className="text-sm font-bold text-[#a29bfe]">JJ CREATIVE Edu with AI</span>
          <h1 className="text-5xl font-black gradient-text tracking-tight mt-1">BizSim</h1>
          <p className="text-white/60 mt-2">C-Level 경영 시뮬레이션</p>
        </div>

        {/* Login Card */}
        <div className="glass p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">학습자 입장</h2>
            <p className="text-sm text-white/60 mt-1">개설된 방을 선택하고 입장하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Room List */}
            <div className="space-y-2">
              <Label className="text-white/70">개설된 방</Label>
              {loadingRooms ? (
                <div className="text-sm text-white/50 py-6 text-center">
                  방 목록을 불러오는 중...
                </div>
              ) : authError ? (
                <div className="text-sm text-red-400 py-6 text-center border border-red-500/20 rounded-xl bg-red-500/10">
                  {authError}
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-sm text-white/50 py-6 text-center border border-white/10 rounded-xl bg-white/[0.02]">
                  현재 개설된 방이 없습니다
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {rooms.map((room) => (
                    <div
                      key={room.roomCode}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedRoom?.roomCode === room.roomCode
                          ? 'glass-active'
                          : 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{room.roomName}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            room.status === 'WAITING'
                              ? 'bg-[#00cec9]/20 text-[#81ecec]'
                              : 'bg-[#6c5ce7]/20 text-[#a29bfe]'
                          }`}
                        >
                          {room.status === 'WAITING' ? '대기중' : '진행중'}
                        </span>
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        방 코드: {room.roomCode} · 팀 수: {room.totalTeams}개
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nickname Input */}
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-white/70">이름</Label>
              <Input
                id="nickname"
                placeholder="이름을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12"
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedRoom || !nickname.trim()}
              className="w-full bg-white text-gray-900 py-3 rounded-xl font-extrabold text-lg shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? '접속 중...' : '입장하기'}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-4 text-white/40">또는</span>
          </div>
        </div>

        {/* Admin Login Card */}
        <div className="glass p-6">
          <div className="text-center space-y-4">
            <div>
              <p className="text-white font-medium">관리자(강사)이신가요?</p>
              <p className="text-sm text-white/50">방을 생성하고 게임을 진행합니다</p>
            </div>
            <Link href="/admin/login">
              <button className="w-full bg-white/10 border border-white/20 text-white py-3 rounded-xl font-bold transition-all hover:bg-white/20">
                관리자로 로그인
              </button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-white/30 pt-4">
          JJ CREATIVE Edu with AI &copy; 2026 All Rights Reserved.
        </footer>
      </div>
    </div>
  )
}
