import { promises as fs } from 'fs'
import { TicketTranscriptData } from './types'

/** HTML 문자열/Buffer/파일경로에서 JSON 데이터만 추출 */
export async function extract(input: string | Buffer): Promise<TicketTranscriptData> {
  let html: string
  if (Buffer.isBuffer(input)) {
    html = input.toString('utf-8')
  } else if (typeof input === 'string' && input.trim().startsWith('<')) {
    html = input
  } else {
    html = await fs.readFile(input, 'utf-8')
  }

  const match = html.match(
    /<script id="ticket-data"[^>]*>([\s\S]*?)<\/script>/
  )
  if (!match) throw new Error('티켓 데이터 스크립트를 찾지 못했습니다.')
  const json = match[1]
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u0026/g, '&')
  return JSON.parse(json) as TicketTranscriptData
}

/** 디렉토리 내 모든 HTML 티켓 파일을 스캔해서 통계 집계 */
export async function aggregate(dir: string): Promise<{
  count: number
  totalMessages: number
  tickets: { id: string; totalMessages: number; durationHuman?: string; category?: string }[]
}> {
  const entries = await fs.readdir(dir)
  const results: { id: string; totalMessages: number; durationHuman?: string; category?: string }[] = []
  let totalMessages = 0
  for (const name of entries) {
    if (!name.endsWith('.html')) continue
    try {
      const data = await extract(`${dir}/${name}`)
      results.push({
        id: data.ticket.id,
        totalMessages: data.stats.totalMessages,
        durationHuman: data.stats.durationHuman,
        category: data.ticket.category
      })
      totalMessages += data.stats.totalMessages
    } catch {
      /* skip */
    }
  }
  return { count: results.length, totalMessages, tickets: results }
}
