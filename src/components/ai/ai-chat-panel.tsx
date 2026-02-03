'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUiStore } from '@/lib/stores/ui-store'
import { useGameStore } from '@/lib/stores/game-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { ROLE_LABELS } from '@/lib/logic/constants'
import { formatBillion } from '@/lib/utils/format'

interface ChatMessage {
  readonly id: string
  readonly role: 'user' | 'assistant'
  readonly content: string
}

export function AiChatPanel() {
  const { aiPanelOpen, setAiPanelOpen } = useUiStore()
  const { role, currentRound, marketConfig } = useGameStore()
  const { assets } = useTeamStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isStreaming) return

    const question = inputValue.trim()
    setInputValue('')

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    }
    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)

    const teamDataSummary = assets
      ? `현금: ${formatBillion(assets.cash)}, 대출: ${formatBillion(assets.loan)}, 자본금: ${formatBillion(assets.capital)}`
      : '데이터 없음'

    const roundConfigSummary = marketConfig
      ? `${currentRound}기, 이자율: ${(marketConfig.interestRate * 100).toFixed(0)}%, 수요배율: ${marketConfig.demandMultiplier}`
      : ''

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role ?? 'ceo',
          teamData: teamDataSummary,
          roundConfig: roundConfigSummary,
          question,
        }),
      })

      if (!res.ok) throw new Error('AI 응답 실패')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      const assistantId = `assistant-${Date.now()}`
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          const current = accumulated
          setMessages((prev) => {
            const withoutLast = prev.filter((m) => m.id !== assistantId)
            return [...withoutLast, { id: assistantId, role: 'assistant', content: current }]
          })
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: 'assistant', content: 'AI 응답 중 오류가 발생했습니다.' },
      ])
    } finally {
      setIsStreaming(false)
    }
  }, [inputValue, isStreaming, assets, marketConfig, currentRound, role])

  if (!aiPanelOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white border rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
        <div>
          <p className="font-semibold text-sm">AI 컨설턴트</p>
          <p className="text-xs text-muted-foreground">
            {role ? ROLE_LABELS[role] : ''} 전문 상담
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAiPanelOpen(false)}>
          X
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <p>경영 전략에 대해 질문해보세요.</p>
              <p className="text-xs mt-2">예: &quot;이번 기에 설비 투자를 해야 할까요?&quot;</p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`text-sm p-2 rounded ${
                m.role === 'user'
                  ? 'bg-blue-100 text-right ml-8'
                  : 'bg-gray-100 mr-8'
              }`}
            >
              {m.content}
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="text-sm text-muted-foreground p-2">
              AI가 답변을 작성 중...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="질문을 입력하세요..."
          disabled={isStreaming}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={isStreaming || !inputValue.trim()}>
          전송
        </Button>
      </form>
    </div>
  )
}
