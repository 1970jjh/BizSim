export const dynamic = 'force-dynamic'

import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import type { Role } from '@/lib/types/game'

const ROLE_PROMPTS: Record<Role, string> = {
  ceo: '너는 자동차 기업의 CEO 전략 컨설턴트야. 전체 경영 전략, 부서 간 조율, 투자 우선순위에 대해 조언해줘.',
  cfo: '너는 자동차 기업의 재무 컨설턴트야. 부채비율, 현금 흐름, 자금 조달 전략에 대해 조언해줘.',
  cpo: '너는 자동차 기업의 생산 컨설턴트야. 설비 투자, 생산량 최적화, 공정 기술 선택에 대해 조언해줘.',
  cro: '너는 자동차 기업의 R&D 컨설턴트야. 기술 투자 시점, 차종 해금 전략, 안전 인증 투자에 대해 조언해줘.',
  cmo: '너는 자동차 기업의 마케팅 컨설턴트야. 가격 전략, 시장 분석, 입찰 전략에 대해 조언해줘.',
  cho: '너는 자동차 기업의 인사 컨설턴트야. 인력 채용, 교육 투자, 인건비 최적화에 대해 조언해줘.',
}

export async function POST(req: Request) {
  try {
    const { role, teamData, roundConfig, question } = await req.json()

    const systemPrompt = `${ROLE_PROMPTS[role as Role] ?? ROLE_PROMPTS.ceo}

현재 경제 상황:
${roundConfig}

답변은 한국어로, 3~5문장으로 간결하고 실용적으로 해줘. 구체적인 숫자와 전략을 포함해줘.`

    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `우리 팀 현황:\n${teamData}\n\n질문: ${question}`,
        },
      ],
      maxOutputTokens: 500,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI 응답 생성 중 오류가 발생했습니다.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
