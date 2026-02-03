'use client'

import { Button } from '@/components/ui/button'
import { useUiStore } from '@/lib/stores/ui-store'

export function AiChatButton() {
  const { aiPanelOpen, setAiPanelOpen } = useUiStore()

  if (aiPanelOpen) return null

  return (
    <Button
      onClick={() => setAiPanelOpen(true)}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg text-xl"
      size="icon"
    >
      AI
    </Button>
  )
}
