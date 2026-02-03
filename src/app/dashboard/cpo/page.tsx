'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { updateRoundDecision } from '@/lib/firebase/firestore'
import { MATERIAL_COST, FACILITY_BUILD_COST, VEHICLE_LABELS } from '@/lib/logic/constants'
import { formatBillion } from '@/lib/utils/format'
import type { VehicleType } from '@/lib/types/game'

export default function CpoPage() {
  const { roomCode, teamId, currentRound, marketConfig } = useGameStore()
  const { assets, currentDecisions } = useTeamStore()

  if (!assets || !currentDecisions || !marketConfig) {
    return <div className="text-center py-12 text-muted-foreground">데이터 로딩 중...</div>
  }

  const roundId = `round_${currentRound}`
  const unlocked = marketConfig.unlockedVehicles as VehicleType[]
  const isLocked = currentDecisions.isSubmitted

  const handleUpdate = (field: string, value: unknown) => {
    if (!roomCode || !teamId || isLocked) return
    updateRoundDecision(roomCode, teamId, roundId, field, value)
  }

  const handleMaterial = (vt: VehicleType, val: number) => {
    handleUpdate(`production.materialPurchase.${vt}`, Math.max(0, val))
  }

  const handleFacility = (vt: VehicleType, val: number) => {
    handleUpdate(`production.facilityExpansion.${vt}`, Math.max(0, val))
  }

  const handleTech = (val: string) => {
    handleUpdate('production.processTechLevel', Number(val))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">생산 관리 대시보드</h1>

      {isLocked && (
        <div className="bg-yellow-50 border-yellow-200 border p-3 rounded text-yellow-800 text-sm">
          CEO가 최종 승인했습니다. 수정할 수 없습니다.
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>현재 설비 현황</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {unlocked.map((vt) => (
              <div key={vt} className="text-center p-3 bg-slate-50 rounded">
                <p className="text-sm text-muted-foreground">{VEHICLE_LABELS[vt]}</p>
                <p className="text-2xl font-bold">{assets.facilities[vt]}</p>
                <p className="text-xs">라인</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>설비 증설</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">라인당 {formatBillion(FACILITY_BUILD_COST)}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((vt) => (
              <div key={vt} className="space-y-1">
                <Label>{VEHICLE_LABELS[vt]} 추가 라인</Label>
                <Input
                  type="number"
                  min={0}
                  value={currentDecisions.production.facilityExpansion[vt]}
                  onChange={(e) => handleFacility(vt, Number(e.target.value))}
                  disabled={isLocked}
                />
                <p className="text-xs text-muted-foreground">
                  비용: {formatBillion(currentDecisions.production.facilityExpansion[vt] * FACILITY_BUILD_COST)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>원자재 구매</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((vt) => (
              <div key={vt} className="space-y-1">
                <Label>{VEHICLE_LABELS[vt]} (만 Set)</Label>
                <Input
                  type="number"
                  min={0}
                  value={currentDecisions.production.materialPurchase[vt]}
                  onChange={(e) => handleMaterial(vt, Number(e.target.value))}
                  disabled={isLocked}
                />
                <p className="text-xs text-muted-foreground">
                  단가: {formatBillion(MATERIAL_COST[vt])}/만Set
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>생산 기술 레벨</CardTitle></CardHeader>
        <CardContent>
          <Select
            value={String(currentDecisions.production.processTechLevel)}
            onValueChange={handleTech}
            disabled={isLocked}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {marketConfig.unlockedTech.map((lv) => (
                <SelectItem key={lv} value={String(lv)}>
                  Lv {lv} {lv === 4 ? '(AI 무인 - 인건비 0)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}
