export function formatBillion(value: number): string {
  return `${value.toLocaleString('ko-KR')}억`
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR')
}
