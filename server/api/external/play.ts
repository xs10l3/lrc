import {
  getCurrentTime,
  getPlaybackState,
  play,
  seek,
  setDisplayMode,
} from '../../utils/playback'

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return false
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function parseTime(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const time = Number(value)
  if (!Number.isFinite(time) || time < 0) {
    throw createError({ statusCode: 400, message: '无效的时间' })
  }
  return time
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')

  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return null
  }

  const method = getMethod(event)
  if (method !== 'GET' && method !== 'POST') {
    throw createError({ statusCode: 405, message: '仅支持 GET 或 POST' })
  }

  const query = getQuery(event)
  const body = method === 'POST' ? await readBody(event).catch(() => ({})) : {}
  const reset = parseBoolean(body?.reset ?? query.reset)
  const time = parseTime(body?.time ?? query.time)

  const before = getPlaybackState()
  if (before.lines.length === 0) {
    throw createError({ statusCode: 409, message: '尚未加载歌词' })
  }

  setDisplayMode('lyrics')
  if (time !== null) seek(time)
  else if (reset) seek(0)
  play()

  const playback = getPlaybackState()
  return {
    ok: true,
    isPlaying: playback.isPlaying,
    currentTime: getCurrentTime(),
    displayMode: playback.displayMode,
    lineCount: playback.lines.length,
    meta: playback.meta,
  }
})
