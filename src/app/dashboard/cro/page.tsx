'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { updateRoundDecision } from '@/lib/firebase/firestore'
import { DESIGN_RND_COST, SAFETY_RND_COST, SAFETY_FAILURE_RATE, VEHICLE_LABELS } from '@/lib/logic/constants'
import { formatBillion, formatPercent } from '@/lib/utils/format'
import type { VehicleType, SafetyLevel } from '@/lib/types/game'

export default function CroPage() {
  const { roomCode, teamId, currentRound } = useGameStore()
  const { assets, currentDecisions } = useTeamStore()

  if (!assets || !currentDecisions) {
    return <div className="text-center py-12 text-muted-foreground">데이터 로딩 중...</div>
  }

  const roundId = `round_${currentRound}`
  const isLocked = currentDecisions.isSubmitted
  const designLevel = assets.techLevel.design
  const safetyLevel = assets.techLevel.safety

  const handleUpdate = (field: string, value: unknown) => {
    if (!roomCode || !teamId || isLocked) return
    updateRoundDecision(roomCode, teamId, roundId, field, value)
  }

  const designCostKey = `${designLevel}_${designLevel + 1}`
  const designCost = DESIGN_RND_COST[designCostKey] ?? 0
  const safetyCostKey = `${safetyLevel}_${safetyLevel + 1}`
  const safetyCost = SAFETY_RND_COST[safetyCostKey] ?? 0

  const techUnlocks: Record<number, string> = {
    1: '가솔린 기본',
    2: '디젤 개선',
    3: '하이브리드 해금',
    4: '전기차 해금',
    5: '수소차 해금',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">연구개발 대시보드</h1>

      {isLocked && (
        <div className="bg-yellow-50 border-yellow-200 border p-3 rounded text-yellow-800 text-sm">
          CEO가 최종 승인했습니다. 수정할 수 없습니다.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>설계 기술 레벨</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl font-bold">Lv {designLevel}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((lv) => (
                  <div
                    key={lv}
                    className={`w-8 h-3 rounded ${lv <= designLevel ? 'bg-blue-500' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{techUnlocks[designLevel]}</p>
            {designLevel < 5 && (
              <p className="text-sm mt-2">다음 레벨: {techUnlocks[designLevel + 1]} ({formatBillion(designCost)})</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>안전 인증 레벨</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl font-bold">Lv {safetyLevel}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((lv) => (
                  <div
                    key={lv}
                    className={`w-8 h-3 rounded ${lv <= safetyLevel ? 'bg-green-500' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm">현재 실패비용: <span className="font-bold text-red-600">{formatPercent(SAFETY_FAILURE_RATE[safetyLevel])}</span></p>
            {safetyLevel < 5 && (
              <p className="text-sm mt-1">
                다음 레벨 실패비용: {formatPercent(SAFETY_FAILURE_RATE[(safetyLevel + 1) as SafetyLevel])}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>설계 R&D 투자</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {designLevel >= 5 ? (
            <p className="text-sm text-green-600">최고 레벨 달성!</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">투자 비용: {formatBillion(designCost)}</p>
              {(['gasoline', 'diesel', 'hybrid', 'ev', 'hydrogen'] as VehicleType[]).map((vt) => (
                <div key={vt} className="flex items-center justify-between">
                  <Label>{VEHICLE_LABELS[vt]} 투자</Label>
                  <Switch
                    checked={currentDecisions.rnd.designInvestments[vt]}
                    onCheckedChange={(checked) => handleUpdate(`rnd.designInvestments.${vt}`, checked)}
                    disabled={isLocked}
                  />
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>안전인증 R&D 투자</CardTitle></CardHeader>
        <CardContent>
          {safetyLevel >= 5 ? (
            <p className="text-sm text-green-600">최고 레벨 달성! 실패비용 0%</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <Label>안전 레벨 업그레이드</Label>
                <p className="text-sm text-muted-foreground">비용: {formatBillion(safetyCost)}</p>
              </div>
              <Switch
                checked={currentDecisions.rnd.safetyInvestment}
                onCheckedChange={(checked) => handleUpdate('rnd.safetyInvestment', checked)}
                disabled={isLocked}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
