'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { useCashFlow } from '@/lib/hooks/use-cash-flow'
import { updateRoundDecision, submitRound } from '@/lib/firebase/firestore'
import { ROLE_LABELS, ROLE_ICONS } from '@/lib/logic/constants'
import { formatBillion } from '@/lib/utils/format'
import type { Role } from '@/lib/types/game'

export default function CeoPage() {
  const { roomCode, teamId, currentRound } = useGameStore()
  const { assets, currentDecisions } = useTeamStore()
  const { availableCash } = useCashFlow()
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!assets || !currentDecisions) {
    return <div className="text-center py-12 text-muted-foreground">데이터 로딩 중...</div>
  }

  const roundId = `round_${currentRound}`
  const isLocked = currentDecisions.isSubmitted
  const otherRoles: Exclude<Role, 'ceo'>[] = ['cfo', 'cpo', 'cro', 'cmo', 'cho']

  const handleApproval = (role: Exclude<Role, 'ceo'>, approved: boolean) => {
    if (!roomCode || !teamId || isLocked) return
    updateRoundDecision(roomCode, teamId, roundId, `approvals.${role}`, approved)
  }

  const handleStrategy = (text: string) => {
    if (!roomCode || !teamId || isLocked) return
    updateRoundDecision(roomCode, teamId, roundId, 'ceoStrategy', text)
  }

  const handleSubmit = async () => {
    if (!roomCode || !teamId) return
    setSubmitting(true)
    try {
      await submitRound(roomCode, teamId, roundId)
      setConfirmOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const allApproved = otherRoles.every((r) => currentDecisions.approvals[r])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">CEO 대시보드</h1>

      {isLocked && (
        <div className="bg-green-50 border-green-200 border p-4 rounded text-green-800">
          <p className="font-bold">최종 승인 완료</p>
          <p className="text-sm">이번 기수의 모든 의사결정이 제출되었습니다.</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>부서별 현황</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {otherRoles.map((role) => (
              <div
                key={role}
                className={`p-4 rounded-lg border-2 text-center cursor-pointer transition-colors ${
                  currentDecisions.approvals[role]
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => !isLocked && handleApproval(role, !currentDecisions.approvals[role])}
              >
                <span className="text-2xl">{ROLE_ICONS[role]}</span>
                <p className="text-sm font-medium mt-1">{ROLE_LABELS[role].split(' ')[0]}</p>
                <Badge
                  variant={currentDecisions.approvals[role] ? 'default' : 'secondary'}
                  className="mt-2"
                >
                  {currentDecisions.approvals[role] ? '승인' : '대기'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>재무 요약</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">보유 현금</p>
              <p className="text-xl font-bold">{formatBillion(assets.cash)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">대출금</p>
              <p className="text-xl font-bold text-red-600">{formatBillion(assets.loan)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">자본금</p>
              <p className="text-xl font-bold text-blue-600">{formatBillion(assets.capital)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">가용 자금</p>
              <p className={`text-xl font-bold ${availableCash < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatBillion(availableCash)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>전략 메모</CardTitle></CardHeader>
        <CardContent>
          <Label>{currentRound}기 핵심 전략</Label>
          <Textarea
            placeholder="이번 기수의 핵심 전략을 입력하세요..."
            value={currentDecisions.ceoStrategy}
            onChange={(e) => handleStrategy(e.target.value)}
            disabled={isLocked}
            className="mt-2"
            rows={4}
          />
        </CardContent>
      </Card>

      {!isLocked && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="w-full py-6 text-lg"
              disabled={!allApproved}
            >
              {allApproved ? '최종 승인' : '모든 부서의 승인이 필요합니다'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>최종 승인 확인</DialogTitle>
              <DialogDescription>
                승인하시겠습니까? 이후 이번 기수의 의사결정을 수정할 수 없습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1">
                취소
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? '제출 중...' : '최종 승인'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
