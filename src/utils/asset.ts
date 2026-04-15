import axios from 'axios'

const DEFAULT_MAX_SIZE = 8 * 1024 * 1024

export interface AssetCacheOptions {
  enabled: boolean
  maxSize: number
}

/** 네트워크 호출을 최소화하기 위한 URL → dataURL 캐시 */
export class AssetCache {
  private cache = new Map<string, Promise<string | undefined>>()
  private opts: AssetCacheOptions

  constructor(opts?: Partial<AssetCacheOptions>) {
    this.opts = {
      enabled: opts?.enabled ?? true,
      maxSize: opts?.maxSize ?? DEFAULT_MAX_SIZE
    }
  }

  /**
   * URL 에셋을 base64 data URL 로 변환해서 반환.
   * 실패하거나 크기 초과 시 undefined.
   */
  async toDataUrl(url?: string, overrideContentType?: string): Promise<string | undefined> {
    if (!this.opts.enabled || !url) return undefined
    if (this.cache.has(url)) return this.cache.get(url)

    const task = (async () => {
      try {
        const res = await axios.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer',
          timeout: 15000,
          maxContentLength: this.opts.maxSize,
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

    this.cache.set(url, task)
    return task
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
