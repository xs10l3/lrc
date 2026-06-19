import { saveLyric } from '../utils/lyrics-store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const raw = String(body?.raw ?? '')
  if (!raw.trim()) {
    throw createError({ statusCode: 400, message: '歌词内容不能为空' })
  }

  const name = body?.name ? String(body.name) : undefined
  const lyric = await saveLyric(raw, name)
  return { ok: true, lyric }
})
