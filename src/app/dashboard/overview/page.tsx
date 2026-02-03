'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { useCashFlow } from '@/lib/hooks/use-cash-flow'
import { formatBillion, formatPercent } from '@/lib/utils/format'
import { SAFETY_FAILURE_RATE, VEHICLE_LABELS } from '@/lib/logic/constants'
import type { VehicleType } from '@/lib/types/game'

export default function OverviewPage() {
  const { marketConfig } = useGameStore()
  const { assets } = useTeamStore()
  const { currentCash, plannedExpenses, availableCash } = useCashFlow()

  if (!assets) {
    return <div className="text-center py-12 text-muted-foreground">데이터 로딩 중...</div>
  }

  const debtRatio = assets.loan > 0 ? assets.loan / (assets.capital || 1) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">전체 현황</h1>

      {marketConfig && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="font-bold text-amber-800">{marketConfig.newsHeadline}</p>
            <p className="text-sm text-amber-700 mt-1">{marketConfig.newsDetails}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">보유 현금</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatBillion(assets.cash)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">대출금</CardTitle></CardHeader>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">설비 현황</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((vt) => (
                assets.facilities[vt] > 0 && (
                  <div key={vt} className="flex justify-between">
                    <span>{VEHICLE_LABELS[vt]}</span>
                    <Badge variant="outline">{assets.facilities[vt]} 라인</Badge>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">기술 & 인력</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>설계 기술</span><Badge>Lv {assets.techLevel.design}</Badge>
            </div>
            <div className="flex justify-between">
              <span>안전 인증</span><Badge>Lv {assets.techLevel.safety} ({formatPercent(SAFETY_FAILURE_RATE[assets.techLevel.safety])} 실패)</Badge>
            </div>
            <div className="flex justify-between">
              <span>생산 기술</span><Badge>Lv {assets.techLevel.process}</Badge>
            </div>
            <div className="flex justify-between">
              <span>인력</span>
              <span>기능 {assets.employees.unskilled} / 숙련 {assets.employees.skilled} / 마스터 {assets.employees.master}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">자금 현황</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>현재 가용 현금</span><span className="font-bold">{formatBillion(currentCash)}</span>
          </div>
          <div className="flex justify-between">
            <span>계획된 지출</span><span className="text-red-600">{formatBillion(plannedExpenses)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-bold">잔여 자금</span>
            <span className={`font-bold ${availableCash < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatBillion(availableCash)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
