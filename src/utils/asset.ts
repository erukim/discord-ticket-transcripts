import axios from 'axios'

const DEFAULT_MAX_SIZE = 8 * 1024 * 1024

// Hosts we are willing to fetch assets from by default. Embed-posted URLs (image,
// author icon, footer icon) are user-controlled, so unrestricted fetching is an
// SSRF vector into the bot's network. Keep this tight to the Discord CDN family.
const DEFAULT_ALLOWED_HOST_PATTERNS: RegExp[] = [
  /(^|\.)discordapp\.com$/i,
  /(^|\.)discordapp\.net$/i,
  /(^|\.)discord\.com$/i,
  /(^|\.)discord\.media$/i
]

export interface AssetCacheOptions {
  enabled: boolean
  maxSize: number
  /** Additional host suffixes to allow (e.g. `['cdn.mycorp.com']`). */
  allowedHosts: string[]
  /** Disable host checking entirely (unsafe — only for trusted input). */
  allowAllHosts: boolean
}

/** 네트워크 호출을 최소화하기 위한 URL → dataURL 캐시 */
export class AssetCache {
  private cache = new Map<string, Promise<string | undefined>>()
  private opts: AssetCacheOptions

  constructor(opts?: Partial<AssetCacheOptions>) {
    this.opts = {
      enabled: opts?.enabled ?? true,
      maxSize: opts?.maxSize ?? DEFAULT_MAX_SIZE,
      allowedHosts: opts?.allowedHosts ?? [],
      allowAllHosts: opts?.allowAllHosts ?? false
    }
  }

  /**
   * URL 에셋을 base64 data URL 로 변환해서 반환.
   * 실패하거나 크기 초과 시 undefined.
   */
  async toDataUrl(url?: string, overrideContentType?: string): Promise<string | undefined> {
    if (!this.opts.enabled || !url) return undefined
    if (!this.isFetchable(url)) return undefined
    const cacheKey = overrideContentType ? `${url}|${overrideContentType}` : url
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)

    const task = (async () => {
      try {
        const res = await axios.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer',
          timeout: 15000,
          maxContentLength: this.opts.maxSize,
          maxRedirects: 3,
          validateStatus: (s) => s >= 200 && s < 300
        })
        const buf = Buffer.from(res.data)
        if (buf.byteLength > this.opts.maxSize) return undefined
        const contentType =
          overrideContentType || res.headers['content-type'] || guessContentType(url) || 'application/octet-stream'
        return `data:${contentType};base64,${buf.toString('base64')}`
      } catch {
        return undefined
      }
    })()

    this.cache.set(cacheKey, task)
    return task
  }

  /**
   * URL이 허용된 프로토콜/호스트에 속하는지 검사.
   * 허용 안 되면 fetch 자체를 건너뜀 → SSRF 벡터 차단.
   */
  private isFetchable(url: string): boolean {
    if (this.opts.allowAllHosts) return true
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return false
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    if (DEFAULT_ALLOWED_HOST_PATTERNS.some((re) => re.test(host))) return true
    return this.opts.allowedHosts.some((suffix) => {
      const s = suffix.toLowerCase().replace(/^\./, '')
      return host === s || host.endsWith('.' + s)
    })
  }
}

function guessContentType(url: string): string | undefined {
  const m = url.split('?')[0].match(/\.([a-z0-9]+)$/i)
  if (!m) return undefined
  const ext = m[1].toLowerCase()
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    json: 'application/json',
    txt: 'text/plain'
  }
  return map[ext]
}
