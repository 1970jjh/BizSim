'use client'

import Link from 'next/link'
import { useFirestoreSync } from '@/lib/hooks/use-firestore-sync'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { useCashFlow } from '@/lib/hooks/use-cash-flow'
import { ROLE_LABELS, ROLE_ICONS } from '@/lib/logic/constants'
import { formatBillion } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { AiChatButton } from '@/components/ai/ai-chat-button'
import { AiChatPanel } from '@/components/ai/ai-chat-panel'
import type { Role } from '@/lib/types/game'

const ROUND_COLORS: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-green-500',
  3: 'bg-red-500',
  4: 'bg-purple-500',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useFirestoreSync()
  const { currentRound, marketConfig, role } = useGameStore()
  const { assets } = useTeamStore()
  const { availableCash } = useCashFlow()

  const navItems = [
    { href: '/dashboard/overview', label: '전체 현황', icon: '📊' },
    ...(role ? [{ href: `/dashboard/${role}`, label: `내 대시보드 (${ROLE_LABELS[role]})`, icon: ROLE_ICONS[role] }] : []),
    { href: '/dashboard/report', label: '결산 리포트', icon: '📋' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen p-4 flex-shrink-0 hidden md:block">
        <div className="mb-6">
          <h2 className="font-bold text-lg">BizSim</h2>
          {role && (
            <div className="mt-2 p-3 bg-slate-100 rounded-lg">
              <span className="text-2xl">{ROLE_ICONS[role]}</span>
              <p className="font-medium text-sm mt-1">{ROLE_LABELS[role]}</p>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2">팀원 현황</p>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <div key={r} className="flex items-center justify-between text-xs py-1">
              <span>{ROLE_ICONS[r]} {ROLE_LABELS[r].split(' ')[0]}</span>
              <Badge variant="outline" className="text-xs">
                {r === role ? '나' : '-'}
              </Badge>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Badge className={`${ROUND_COLORS[currentRound]} text-white`}>
              {currentRound}기
            </Badge>
            {marketConfig && (
              <span className="text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                {marketConfig.newsHeadline}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">보유 현금: </span>
              <span className="font-bold">{formatBillion(assets?.cash ?? 0)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">가용 자금: </span>
              <span className={`font-bold ${availableCash < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {formatBillion(availableCash)}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* AI Chat */}
      <AiChatButton />
      <AiChatPanel />
    </div>
  )
}
