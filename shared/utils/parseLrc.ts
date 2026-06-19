export interface LyricLine {
  time: number
  text: string
}

export interface LrcMeta {
  title?: string
  artist?: string
  album?: string
  offset?: number
}

export interface ParsedLrc {
  meta: LrcMeta
  lines: LyricLine[]
}

const META_TAGS: Record<string, keyof LrcMeta> = {
  ti: 'title',
  ar: 'artist',
  al: 'album',
  offset: 'offset',
}

const TIME_RE = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g

function parseTimestamp(min: string, sec: string, frac?: string): number {
  const minutes = Number(min)
  const seconds = Number(sec)
  let ms = 0
  if (frac !== undefined) {
    const padded = frac.padEnd(3, '0').slice(0, 3)
    ms = Number(padded)
  }
  return minutes * 60_000 + seconds * 1_000 + ms
}

export function parseLrc(raw: string): ParsedLrc {
  const meta: LrcMeta = {}
  const lineMap = new Map<number, string[]>()

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const metaMatch = trimmed.match(/^\[([a-z]+):(.+)\]$/i)
    if (metaMatch) {
      const [, tag, value] = metaMatch
      const key = META_TAGS[tag.toLowerCase()]
      if (key === 'offset') {
        meta.offset = Number(value)
      } else if (key) {
        meta[key] = value.trim()
      }
      continue
    }

    let match: RegExpExecArray | null
    const times: number[] = []
    TIME_RE.lastIndex = 0
    while ((match = TIME_RE.exec(trimmed)) !== null) {
      times.push(parseTimestamp(match[1], match[2], match[3]))
    }
    if (times.length === 0) continue

    const text = trimmed.replace(TIME_RE, '').trim()
    for (const time of times) {
      const existing = lineMap.get(time) ?? []
      existing.push(text)
      lineMap.set(time, existing)
    }
  }

  const offset = meta.offset ?? 0
  const lines: LyricLine[] = []
  for (const [time, texts] of lineMap) {
    for (const text of texts) {
      lines.push({ time: Math.max(0, time + offset), text })
    }
  }
  lines.sort((a, b) => a.time - b.time)

  return { meta, lines }
}

export function findActiveLineIndex(lines: LyricLine[], currentMs: number): number {
  if (lines.length === 0) return -1
  let index = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentMs) index = i
    else break
  }
  return index
}

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const centi = Math.floor((ms % 1000) / 10)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centi).padStart(2, '0')}`
}
