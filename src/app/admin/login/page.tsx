'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInAdmin } from '@/lib/firebase/auth'
import { useGameStore } from '@/lib/stores/game-store'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setAdmin = useGameStore((s) => s.setAdmin)
  const setUser = useGameStore((s) => s.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cred = await signInAdmin(email, password)
      setUser(cred.user.uid, '관리자')
      setAdmin(true)
      router.push('/admin/dashboard')
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
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
          <p className="text-white/60 mt-2">관리자 로그인</p>
        </div>

        {/* Login Card */}
        <div className="glass p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">강사 로그인</h2>
            <p className="text-sm text-white/60 mt-1">등록된 관리자 계정으로 로그인합니다</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient text-white py-3 rounded-xl font-extrabold text-lg shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        {/* Back to Student Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-white/50 hover:text-white/80 underline-offset-4 hover:underline transition-colors"
          >
            학습자로 입장하기
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-white/30 pt-4">
          JJ CREATIVE Edu with AI &copy; 2026 All Rights Reserved.
        </footer>
      </div>
    </div>
  )
}
