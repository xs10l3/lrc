import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { parseLrc } from '#shared/utils/parseLrc'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface SavedLyric {
  id: string
  name: string
  title?: string
  artist?: string
  lineCount: number
  mtime: number
}

export function getLyricsDir() {
  return join(process.cwd(), 'data', 'lyrics')
}

export function isValidLyricId(id: string): boolean {
  return UUID_RE.test(id)
}

export async function saveLyric(raw: string, name?: string): Promise<SavedLyric> {
  const parsed = parseLrc(raw)
  const id = randomUUID()
  const dir = getLyricsDir()
  await mkdir(dir, { recursive: true })

  const displayName = name?.trim()
    || parsed.meta.title
    || `歌词-${id.slice(0, 8)}`

  await writeFile(join(dir, `${id}.lrc`), raw, 'utf-8')

  const info = await stat(join(dir, `${id}.lrc`))
  return {
    id,
    name: displayName,
    title: parsed.meta.title,
    artist: parsed.meta.artist,
    lineCount: parsed.lines.length,
    mtime: info.mtimeMs,
  }
}

export async function listSavedLyrics(): Promise<SavedLyric[]> {
  const dir = getLyricsDir()
  try {
    const files = await readdir(dir)
    const lyrics: SavedLyric[] = []

    for (const file of files) {
      if (!file.endsWith('.lrc')) continue
      const id = file.slice(0, -4)
      if (!isValidLyricId(id)) continue

      const filePath = join(dir, file)
      const info = await stat(filePath)
      if (!info.isFile()) continue

      const raw = await readFile(filePath, 'utf-8')
      const parsed = parseLrc(raw)
      lyrics.push({
        id,
        name: parsed.meta.title || `歌词-${id.slice(0, 8)}`,
        title: parsed.meta.title,
        artist: parsed.meta.artist,
        lineCount: parsed.lines.length,
        mtime: info.mtimeMs,
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
  const filePath = join(getLyricsDir(), `${id}.lrc`)
  try {
    return await readFile(filePath, 'utf-8')
  } catch {
    throw createError({ statusCode: 404, message: '歌词不存在' })
  }
}

export async function deleteSavedLyric(id: string) {
  if (!isValidLyricId(id)) {
    throw createError({ statusCode: 400, message: '无效的歌词 ID' })
  }
  try {
    await unlink(join(getLyricsDir(), `${id}.lrc`))
  } catch {
    throw createError({ statusCode: 404, message: '歌词不存在' })
  }
}
