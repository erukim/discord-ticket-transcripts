/** HTML escape */
export function escapeHtml(text: string | undefined | null): string {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** JSON 을 <script> 안에 안전하게 넣기 위한 이스케이프 */
export function escapeJsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** 숫자 → #RRGGBB */
export function colorToHex(color?: number): string | undefined {
  if (color == null) return undefined
  return '#' + color.toString(16).padStart(6, '0')
}

export interface DurationUnits {
  days: string
  hours: string
  minutes: string
  seconds: string
}

/** ms → "2시간 13분 5초" / "2h 13m 5s" (언어 단위 주입) */
export function humanizeDuration(
  ms: number,
  units: DurationUnits = { days: 'd', hours: 'h', minutes: 'm', seconds: 's' }
): string {
  if (ms < 0) ms = 0
  const s = Math.floor(ms / 1000) % 60
  const m = Math.floor(ms / 1000 / 60) % 60
  const h = Math.floor(ms / 1000 / 60 / 60) % 24
  const d = Math.floor(ms / 1000 / 60 / 60 / 24)
  const parts: string[] = []
  if (d) parts.push(`${d}${units.days}`)
  if (h) parts.push(`${h}${units.hours}`)
  if (m) parts.push(`${m}${units.minutes}`)
  if (s || !parts.length) parts.push(`${s}${units.seconds}`)
  return parts.join(' ')
}
