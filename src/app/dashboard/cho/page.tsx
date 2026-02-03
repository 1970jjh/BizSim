'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { updateRoundDecision } from '@/lib/firebase/firestore'
import { HIRE_COST_PER_GROUP, MAINTENANCE_COST, TRAINING_COST } from '@/lib/logic/constants'
import { formatBillion } from '@/lib/utils/format'

export default function ChoPage() {
  const { roomCode, teamId, currentRound } = useGameStore()
  const { assets, currentDecisions } = useTeamStore()

  if (!assets || !currentDecisions) {
    return <div className="text-center py-12 text-muted-foreground">데이터 로딩 중...</div>
  }

  const roundId = `round_${currentRound}`
  const isLocked = currentDecisions.isSubmitted

  const handleUpdate = (field: string, value: number) => {
    if (!roomCode || !teamId || isLocked) return
    updateRoundDecision(roomCode, teamId, roundId, field, Math.max(0, value))
  }

  const totalLaborCost =
    assets.employees.unskilled * MAINTENANCE_COST.unskilled +
    assets.employees.skilled * MAINTENANCE_COST.skilled +
    assets.employees.master * MAINTENANCE_COST.master +
    currentDecisions.hr.newHires * HIRE_COST_PER_GROUP +
    currentDecisions.hr.trainingUnskilledToSkilled * TRAINING_COST.unskilled_to_skilled +
    currentDecisions.hr.trainingSkilledToMaster * TRAINING_COST.skilled_to_master

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">인사 관리 대시보드</h1>

      {isLocked && (
        <div className="bg-yellow-50 border-yellow-200 border p-3 rounded text-yellow-800 text-sm">
          CEO가 최종 승인했습니다. 수정할 수 없습니다.
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>인력 현황</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">등급</th>
                <th className="text-right p-2">그룹 수</th>
                <th className="text-right p-2">인원 (20명/그룹)</th>
                <th className="text-right p-2">유지비 (그룹당)</th>
                <th className="text-right p-2">소계</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">기능공</td>
                <td className="p-2 text-right">{assets.employees.unskilled}</td>
                <td className="p-2 text-right">{assets.employees.unskilled * 20}명</td>
                <td className="p-2 text-right">{formatBillion(MAINTENANCE_COST.unskilled)}</td>
                <td className="p-2 text-right">{formatBillion(assets.employees.unskilled * MAINTENANCE_COST.unskilled)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">숙련공</td>
                <td className="p-2 text-right">{assets.employees.skilled}</td>
                <td className="p-2 text-right">{assets.employees.skilled * 20}명</td>
                <td className="p-2 text-right">{formatBillion(MAINTENANCE_COST.skilled)}</td>
                <td className="p-2 text-right">{formatBillion(assets.employees.skilled * MAINTENANCE_COST.skilled)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">마스터</td>
                <td className="p-2 text-right">{assets.employees.master}</td>
                <td className="p-2 text-right">{assets.employees.master * 20}명</td>
                <td className="p-2 text-right">{formatBillion(MAINTENANCE_COST.master)}</td>
                <td className="p-2 text-right">{formatBillion(assets.employees.master * MAINTENANCE_COST.master)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">신규 채용</CardTitle></CardHeader>
          <CardContent>
            <Label>기능공 그룹 수</Label>
            <Input
              type="number"
              min={0}
              max={20}
              value={currentDecisions.hr.newHires}
              onChange={(e) => handleUpdate('hr.newHires', Number(e.target.value))}
              disabled={isLocked}
            />
            <p className="text-xs text-muted-foreground mt-1">
              비용: {formatBillion(HIRE_COST_PER_GROUP)}/그룹
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">기능 → 숙련 교육</CardTitle></CardHeader>
          <CardContent>
            <Label>교육 그룹 수</Label>
            <Input
              type="number"
              min={0}
              max={assets.employees.unskilled}
              value={currentDecisions.hr.trainingUnskilledToSkilled}
              onChange={(e) => handleUpdate('hr.trainingUnskilledToSkilled', Number(e.target.value))}
              disabled={isLocked}
            />
            <p className="text-xs text-muted-foreground mt-1">
              비용: {formatBillion(TRAINING_COST.unskilled_to_skilled)}/그룹
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">숙련 → 마스터 교육</CardTitle></CardHeader>
          <CardContent>
            <Label>교육 그룹 수</Label>
            <Input
              type="number"
              min={0}
              max={assets.employees.skilled}
              value={currentDecisions.hr.trainingSkilledToMaster}
              onChange={(e) => handleUpdate('hr.trainingSkilledToMaster', Number(e.target.value))}
              disabled={isLocked}
            />
            <p className="text-xs text-muted-foreground mt-1">
              비용: {formatBillion(TRAINING_COST.skilled_to_master)}/그룹
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <p className="font-bold text-blue-800">
            예상 총 인건비: {formatBillion(totalLaborCost)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
