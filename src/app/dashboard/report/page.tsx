'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTeamStore } from '@/lib/stores/team-store'
import { useGameStore } from '@/lib/stores/game-store'
import { useUiStore } from '@/lib/stores/ui-store'
import { formatBillion, formatPercent } from '@/lib/utils/format'
import type { VehicleType } from '@/lib/types/game'
import { VEHICLE_LABELS } from '@/lib/logic/constants'

const VEHICLE_TYPES: VehicleType[] = ['gasoline', 'diesel', 'hybrid', 'ev', 'hydrogen']

export default function ReportPage() {
  const { currentRound } = useGameStore()
  const { assets, roundResults, allRoundResults } = useTeamStore()
  const setAiPanelOpen = useUiStore((s) => s.setAiPanelOpen)
  const [selectedRound, setSelectedRound] = useState(currentRound)

  if (!assets) {
    return <div className="text-center py-12 text-muted-foreground">데이터 로딩 중...</div>
  }

  const results = selectedRound === currentRound ? roundResults : allRoundResults[`round_${selectedRound}`]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">성과 보고서</h1>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((r) => (
            <Button
              key={r}
              variant={selectedRound === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRound(r as 1 | 2 | 3 | 4)}
              disabled={r > currentRound}
            >
              {r}기
            </Button>
          ))}
        </div>
      </div>

      {!results ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {selectedRound === currentRound
              ? '아직 결산이 완료되지 않았습니다.'
              : `${selectedRound}기 데이터가 없습니다.`}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 손익계산서 */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedRound}기 손익계산서</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">항목</th>
                    <th className="text-right py-2 font-medium">금액</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">매출액</td>
                    <td className="text-right font-semibold text-blue-600">
                      {formatBillion(results.revenue)}
                    </td>
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="py-2 pl-4">변동비</td>
                    <td className="text-right text-red-600">
                      -{formatBillion(results.variableCost)}
                    </td>
                  </tr>
                  <tr className="text-xs text-muted-foreground">
                    <td className="py-1 pl-8">원재료비</td>
                    <td className="text-right">
                      -{formatBillion(results.materialCost)}
                    </td>
                  </tr>
                  <tr className="text-xs text-muted-foreground">
                    <td className="py-1 pl-8">판관비</td>
                    <td className="text-right">
                      -{formatBillion(results.salesAdminCost)}
                    </td>
                  </tr>
                  <tr className="text-xs text-muted-foreground">
                    <td className="py-1 pl-8">불량 비용</td>
                    <td className="text-right">
                      -{formatBillion(results.failureCost)}
                    </td>
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="py-2 pl-4">고정비</td>
                    <td className="text-right text-red-600">
                      -{formatBillion(results.fixedCost)}
                    </td>
                  </tr>
                  <tr className="text-xs text-muted-foreground">
                    <td className="py-1 pl-8">인건비</td>
                    <td className="text-right">
                      -{formatBillion(results.laborCost)}
                    </td>
                  </tr>
                  <tr className="text-xs text-muted-foreground">
                    <td className="py-1 pl-8">유지보수비</td>
                    <td className="text-right">
                      -{formatBillion(results.maintenanceCost)}
                    </td>
                  </tr>
                  <tr className="text-xs text-muted-foreground">
                    <td className="py-1 pl-8">감가상각비</td>
                    <td className="text-right">
                      -{formatBillion(results.depreciationCost)}
                    </td>
                  </tr>
                  <tr className="text-xs text-muted-foreground">
                    <td className="py-1 pl-8">이자비용</td>
                    <td className="text-right">
                      -{formatBillion(results.interestCost)}
                    </td>
                  </tr>
                  <tr className="text-xs text-muted-foreground">
                    <td className="py-1 pl-8">일반관리비</td>
                    <td className="text-right">
                      -{formatBillion(results.generalAdminCost)}
                    </td>
                  </tr>

                  <tr className="border-b border-t-2">
                    <td className="py-2 font-semibold">영업이익</td>
                    <td className={`text-right font-semibold ${results.operatingProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatBillion(results.operatingProfit)}
                    </td>
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="py-2 pl-4">법인세 (10%)</td>
                    <td className="text-right text-red-600">
                      -{formatBillion(results.taxAmount)}
                    </td>
                  </tr>

                  <tr className="border-t-2 bg-blue-50">
                    <td className="py-3 font-bold text-lg">당기순이익</td>
                    <td className={`text-right font-bold text-lg ${results.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {formatBillion(results.netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 차종별 실적 */}
          <Card>
            <CardHeader>
              <CardTitle>차종별 실적</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">차종</th>
                      <th className="text-right py-2">판매량</th>
                      <th className="text-right py-2">매출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VEHICLE_TYPES.map((vt) => {
                      const sold = results.salesVolume[vt]
                      const rev = results.revenueByVehicle[vt]
                      if (sold === 0 && rev === 0) return null
                      return (
                        <tr key={vt} className="border-b">
                          <td className="py-2">{VEHICLE_LABELS[vt]}</td>
                          <td className="text-right">{sold.toLocaleString()}대</td>
                          <td className="text-right text-blue-600">{formatBillion(rev)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 핵심 지표 */}
          <Card>
            <CardHeader>
              <CardTitle>핵심 경영 지표</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground">영업이익률</p>
                  <p className={`text-xl font-bold ${results.operatingProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {results.revenue > 0
                      ? formatPercent(results.operatingProfit / results.revenue)
                      : '-'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground">순이익률</p>
                  <p className={`text-xl font-bold ${results.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {results.revenue > 0
                      ? formatPercent(results.netProfit / results.revenue)
                      : '-'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground">부채비율</p>
                  <p className="text-xl font-bold">
                    {results.updatedAssets.capital > 0
                      ? formatPercent(results.updatedAssets.loan / results.updatedAssets.capital)
                      : '-'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-xs text-muted-foreground">총매출</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatBillion(results.revenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI 분석 */}
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground mb-3">AI 컨설턴트에게 이번 기 실적 분석을 요청하세요</p>
              <Button onClick={() => setAiPanelOpen(true)}>
                AI 실적 분석 요청
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
