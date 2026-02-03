'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { updateRoundDecision } from '@/lib/firebase/firestore'
import { VEHICLE_LABELS } from '@/lib/logic/constants'
import { formatBillion, formatPercent } from '@/lib/utils/format'
import type { VehicleType } from '@/lib/types/game'

export default function CmoPage() {
  const { roomCode, teamId, currentRound, marketConfig } = useGameStore()
  const { assets, currentDecisions } = useTeamStore()

  if (!assets || !currentDecisions || !marketConfig) {
    return <div className="text-center py-12 text-muted-foreground">데이터 로딩 중...</div>
  }

  const roundId = `round_${currentRound}`
  const isLocked = currentDecisions.isSubmitted
  const unlocked = marketConfig.unlockedVehicles as VehicleType[]

  const handleUpdate = (vt: VehicleType, value: number) => {
    if (!roomCode || !teamId || isLocked) return
    updateRoundDecision(roomCode, teamId, roundId, `marketing.bidPrices.${vt}`, Math.max(0, value))
  }

  const cycleLabel: Record<string, string> = {
    recovery: '회복기 - 균형 시장',
    boom: '호황기 - 고가 전략 추천',
    recession: '불황기 - 저가 전략 추천',
    green_growth: '성장기 - 친환경 프리미엄',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">마케팅 대시보드</h1>

      {isLocked && (
        <div className="bg-yellow-50 border-yellow-200 border p-3 rounded text-yellow-800 text-sm">
          CEO가 최종 승인했습니다. 수정할 수 없습니다.
        </div>
      )}

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader><CardTitle className="text-sm">시장 분석</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge>{currentRound}기</Badge>
            <span className="text-sm font-medium">{cycleLabel[marketConfig.cycle]}</span>
          </div>
          <p className="text-sm">수요 변동: x{marketConfig.demandMultiplier} | 이자율: {formatPercent(marketConfig.interestRate)}</p>
          <p className="text-sm text-amber-700">{marketConfig.newsDetails}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>입찰가 설정</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            차종별 판매 희망 가격을 입력하세요 (억원/만대). 최저가 팀이 더 많은 물량을 배정받습니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlocked.map((vt) => {
              const production = Math.min(
                assets.facilities[vt] + currentDecisions.production.facilityExpansion[vt],
                currentDecisions.production.materialPurchase[vt]
              )
              const estimatedRevenue = production * currentDecisions.marketing.bidPrices[vt]

              return (
                <div key={vt} className="p-4 border rounded space-y-2">
                  <Label className="font-bold">{VEHICLE_LABELS[vt]}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={currentDecisions.marketing.bidPrices[vt]}
                    onChange={(e) => handleUpdate(vt, Number(e.target.value))}
                    disabled={isLocked}
                    placeholder="입찰가 (억원/만대)"
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>예상 생산량: {production} 만대</p>
                    <p>예상 매출: {formatBillion(estimatedRevenue)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">전략 가이드</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {marketConfig.cycle === 'boom' && (
            <p className="text-green-700">호황기입니다. 수요가 많으므로 비교적 높은 가격도 판매 가능합니다.</p>
          )}
          {marketConfig.cycle === 'recession' && (
            <p className="text-red-700">불황기입니다. 경쟁력 있는 낮은 가격을 제시해야 판매량을 확보할 수 있습니다.</p>
          )}
          {marketConfig.cycle === 'recovery' && (
            <p className="text-blue-700">균형 시장입니다. 적정 가격으로 안정적인 매출을 목표로 하세요.</p>
          )}
          {marketConfig.cycle === 'green_growth' && (
            <p className="text-purple-700">친환경 성장기입니다. 전기차/하이브리드에 프리미엄 가격을 적용할 수 있습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
