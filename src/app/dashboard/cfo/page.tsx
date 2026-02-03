'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { useCashFlow } from '@/lib/hooks/use-cash-flow'
import { updateRoundDecision } from '@/lib/firebase/firestore'
import { formatBillion, formatPercent } from '@/lib/utils/format'

export default function CfoPage() {
  const { roomCode, teamId, currentRound, marketConfig } = useGameStore()
  const { assets, currentDecisions } = useTeamStore()
  const { currentCash, plannedExpenses, availableCash } = useCashFlow()

  if (!assets || !currentDecisions || !marketConfig) {
    return <div className="text-center py-12 text-muted-foreground">데이터 로딩 중...</div>
  }

  const roundId = `round_${currentRound}`
  const isLocked = currentDecisions.isSubmitted
  const debtRatio = assets.capital > 0 ? assets.loan / assets.capital : 0

  const handleUpdate = (field: string, value: number) => {
    if (!roomCode || !teamId || isLocked) return
    updateRoundDecision(roomCode, teamId, roundId, field, Math.max(0, value))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">재무 관리 대시보드</h1>

      {isLocked && (
        <div className="bg-yellow-50 border-yellow-200 border p-3 rounded text-yellow-800 text-sm">
          CEO가 최종 승인했습니다. 수정할 수 없습니다.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">보유 현금</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatBillion(assets.cash)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">총 차입금</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatBillion(assets.loan)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">자본금</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{formatBillion(assets.capital)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">부채비율</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${debtRatio > 2 ? 'text-red-600' : ''}`}>
              {formatPercent(debtRatio)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>자금 조달</span>
            <span className="text-sm font-normal text-muted-foreground">
              현재 이자율: <span className="font-bold text-red-600">{formatPercent(marketConfig.interestRate)}</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>추가 대출 (억원)</Label>
            <Input
              type="number"
              min={0}
              value={currentDecisions.finance.loanRequest}
              onChange={(e) => handleUpdate('finance.loanRequest', Number(e.target.value))}
              disabled={isLocked}
            />
            <p className="text-xs text-muted-foreground mt-1">
              예상 이자: {formatBillion(currentDecisions.finance.loanRequest * marketConfig.interestRate)}
            </p>
          </div>
          <div>
            <Label>대출 상환 (억원)</Label>
            <Input
              type="number"
              min={0}
              max={assets.loan}
              value={currentDecisions.finance.loanRepay}
              onChange={(e) => handleUpdate('finance.loanRepay', Number(e.target.value))}
              disabled={isLocked}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>현금 흐름 분석</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>기초 현금</span>
            <span>{formatBillion(assets.cash)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>+ 추가 대출</span>
            <span>+{formatBillion(currentDecisions.finance.loanRequest)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>- 대출 상환</span>
            <span>-{formatBillion(currentDecisions.finance.loanRepay)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-medium">
            <span>가용 현금</span>
            <span>{formatBillion(currentCash)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>- 예상 지출 (타 부서)</span>
            <span>-{formatBillion(plannedExpenses)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>잔여 자금</span>
            <span className={availableCash < 0 ? 'text-red-600' : 'text-green-600'}>
              {formatBillion(availableCash)}
            </span>
          </div>
        </CardContent>
      </Card>

      {availableCash < 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            자금이 부족합니다! 추가 대출을 신청하거나 다른 부서의 투자를 줄여야 합니다.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
