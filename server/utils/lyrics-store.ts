import { randomUUID } from 'node:crypto'
import { parseLrc } from '#shared/utils/parseLrc'
import { deleteObject, getObjectText, listObjects, uploadObject } from './obs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LYRICS_PREFIX = 'lyrics/'

export interface SavedLyric {
  id: string
  name: string
  title?: string
  artist?: string
  lineCount: number
  mtime: number
}

function lyricKey(id: string) {
  return `${LYRICS_PREFIX}${id}.lrc`
}

export function isValidLyricId(id: string): boolean {
  return UUID_RE.test(id)
}

export async function saveLyric(raw: string, name?: string): Promise<SavedLyric> {
  const parsed = parseLrc(raw)
  const id = randomUUID()
  const key = lyricKey(id)

  const displayName = name?.trim()
    || parsed.meta.title
    || `歌词-${id.slice(0, 8)}`

  await uploadObject(key, raw, 'text/plain; charset=utf-8')

  return {
    id,
    name: displayName,
    title: parsed.meta.title,
    artist: parsed.meta.artist,
    lineCount: parsed.lines.length,
    mtime: Date.now(),
  }
}

export async function listSavedLyrics(): Promise<SavedLyric[]> {
  try {
    const objects = await listObjects(LYRICS_PREFIX)
    const lyrics: SavedLyric[] = []

    for (const obj of objects) {
      if (!obj.Key?.endsWith('.lrc')) continue
      const id = obj.Key.slice(LYRICS_PREFIX.length, -4)
      if (!isValidLyricId(id)) continue

      const raw = await getObjectText(obj.Key)
      const parsed = parseLrc(raw)
      lyrics.push({
        id,
        name: parsed.meta.title || `歌词-${id.slice(0, 8)}`,
        title: parsed.meta.title,
        artist: parsed.meta.artist,
        lineCount: parsed.lines.length,
        mtime: obj.LastModified?.getTime() ?? 0,
      })
    }

    lyrics.sort((a, b) => b.mtime - a.mtime)
    return lyrics
  } catch {
    return []
  }
}

export async function readSavedLyric(id: string): Promise<string> {
  if (!isValidLyricId(id)) {
    throw createError({ statusCode: 400, message: '无效的歌词 ID' })
  }
  try {
    return await getObjectText(lyricKey(id))
  } catch {
    throw createError({ statusCode: 404, message: '歌词不存在' })
  }
}

export async function deleteSavedLyric(id: string) {
  if (!isValidLyricId(id)) {
    throw createError({ statusCode: 400, message: '无效的歌词 ID' })
  }
  try {
    await deleteObject(lyricKey(id))
  } catch {
    throw createError({ statusCode: 404, message: '歌词不存在' })
  }
}
