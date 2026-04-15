import { TranscriptMessage } from '../types'
import { escapeHtml } from '../utils/escape'

/**
 * Discord Markdown → HTML 변환기.
 * - **bold**, *italic*, __underline__, ~~strike~~, `code`, ```block```
 * - 스포일러 ||text||
 * - 멘션 <@id>, <@&id>, <#id>, 유저/채널/역할/everyone/here
 * - 커스텀 이모지 <:name:id>, <a:name:id>
 * - 타임스탬프 <t:1234567890:F>
 * - URL 자동링크
 */
export function renderMarkdown(text: string, msg?: TranscriptMessage): string {
  if (!text) return ''

  // 1) 코드블록 분리 (다른 규칙이 침범 못하게)
  const codeBlocks: string[] = []
  text = text.replace(/```(?:([a-zA-Z0-9_+-]+)\n)?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length
    codeBlocks.push(
      `<pre class="tt-code-block"${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}>${escapeHtml(code)}</pre>`
    )
    return `\u0000CB${idx}\u0000`
  })

  // 2) 인라인 코드 분리
  const inlineCode: string[] = []
  text = text.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = inlineCode.length
    inlineCode.push(`<code class="tt-code-inline">${escapeHtml(code)}</code>`)
    return `\u0000IC${idx}\u0000`
  })

  // 3) escape 나머지
  let html = escapeHtml(text)

  // 4) 커스텀 이모지 <:name:id> / <a:name:id>
  html = html.replace(/&lt;(a?):(\w+):(\d+)&gt;/g, (_, a, name, id) => {
    const ext = a ? 'gif' : 'png'
    return `<img class="tt-emoji" src="https://cdn.discordapp.com/emojis/${id}.${ext}" alt=":${escapeHtml(name)}:" title=":${escapeHtml(name)}:">`
  })

  // 5) 멘션
  html = html.replace(/&lt;@!?(\d+)&gt;/g, (_, id) => {
    const user = msg?.mentions?.users?.find((u) => u.id === id)
    const name = user ? (user.displayName ?? user.username) : id
    return `<span class="tt-mention">@${escapeHtml(name)}</span>`
  })
  html = html.replace(/&lt;@&amp;(\d+)&gt;/g, (_, id) => {
    const role = msg?.mentions?.roles?.find((r) => r.id === id)
    const style = role?.color ? ` style="color:${role.color}"` : ''
    return `<span class="tt-mention"${style}>@${escapeHtml(role?.name ?? id)}</span>`
  })
  html = html.replace(/&lt;#(\d+)&gt;/g, (_, id) => {
    const ch = msg?.mentions?.channels?.find((c) => c.id === id)
    return `<span class="tt-mention">#${escapeHtml(ch?.name ?? id)}</span>`
  })
  html = html.replace(/@(everyone|here)/g, (_, tag) => `<span class="tt-mention">@${tag}</span>`)

  // 6) 타임스탬프 <t:unix:style>
  html = html.replace(/&lt;t:(\d+)(?::([tTdDfFR]))?&gt;/g, (_, ts, style) => {
    const d = new Date(Number(ts) * 1000)
    return `<span class="tt-mention" title="${d.toISOString()}">${formatTimestamp(d, style)}</span>`
  })

  // 7) 스포일러
  html = html.replace(/\|\|([^|]+)\|\|/g, '<span class="tt-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>')

  // 8) bold / underline / italic / strike
  html = html
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/(?<![\w*])\*([^*\n]+?)\*(?![\w*])/g, '<em>$1</em>')
    .replace(/(?<![\w_])_([^_\n]+?)_(?![\w_])/g, '<em>$1</em>')

  // 9) URL
  html = html.replace(/(?<!["=])(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')

  // 10) 개행 유지는 white-space: pre-wrap 이 처리
  // 11) 코드 복원
  html = html.replace(/\u0000IC(\d+)\u0000/g, (_, i) => inlineCode[Number(i)])
  html = html.replace(/\u0000CB(\d+)\u0000/g, (_, i) => codeBlocks[Number(i)])

  return html
}

function formatTimestamp(d: Date, style?: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  switch (style) {
    case 't':
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`
    case 'T':
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    case 'd':
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    case 'D':
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
    case 'R': {
      const diff = d.getTime() - Date.now()
      const abs = Math.abs(diff)
      const mins = Math.round(abs / 60000)
      if (mins < 60) return diff > 0 ? `${mins}분 후` : `${mins}분 전`
      const hours = Math.round(abs / 3600000)
      if (hours < 24) return diff > 0 ? `${hours}시간 후` : `${hours}시간 전`
      const days = Math.round(abs / 86400000)
      return diff > 0 ? `${days}일 후` : `${days}일 전`
    }
    case 'F':
    default:
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
}

/** 메시지 → 순수 텍스트 (텍스트 다운로드용) */
export function renderPlainText(msg: TranscriptMessage): string {
  const lines: string[] = []
  const ts = new Date(msg.createdAt)
  const time = ts.toISOString().replace('T', ' ').slice(0, 19)
  const author = msg.author.displayName ?? msg.author.username ?? msg.author.tag
  const tag = msg.author.isStaff ? ' [STAFF]' : msg.author.bot ? ' [BOT]' : ''
  lines.push(`[${time}] ${author}${tag}:`)

  if (msg.content) lines.push(msg.content)

  for (const a of msg.attachments) lines.push(`  첨부: ${a.name} (${a.url})`)
  for (const e of msg.embeds) {
    const parts: string[] = []
    if (e.title) parts.push(`제목: ${e.title}`)
    if (e.description) parts.push(`설명: ${e.description}`)
    for (const f of e.fields) parts.push(`  ${f.name}: ${f.value}`)
    if (parts.length) lines.push('  [Embed] ' + parts.join(' | '))
  }
  for (const s of msg.stickers) lines.push(`  스티커: ${s.name}`)
  for (const r of msg.reactions) lines.push(`  반응 ${r.emoji.name} x${r.count}`)
  for (const c of msg.components) {
    const label = describeComponent(c)
    if (label) lines.push(`  [컴포넌트] ${label}`)
  }

  return lines.join('\n')
}

function describeComponent(c: any): string {
  if (!c) return ''
  if (c.content) return String(c.content)
  if (c.label) return `버튼: ${c.label}`
  if (c.placeholder) return `셀렉트: ${c.placeholder}`
  if (Array.isArray(c.components)) return c.components.map(describeComponent).filter(Boolean).join(' / ')
  return ''
}
