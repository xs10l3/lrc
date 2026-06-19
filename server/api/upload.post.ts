import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { getUploadsDir } from '../utils/uploads'

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
}

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(item => item.name === 'file')

  if (!file?.data?.length) {
    throw createError({ statusCode: 400, message: '请选择图片文件' })
  }

  const original = file.filename ?? 'image.jpg'
  let ext = extname(original).toLowerCase()
  if (!ext && file.type) {
    ext = MIME_EXT[file.type] ?? ''
  }
  if (!ALLOWED_EXT.has(ext)) {
    throw createError({ statusCode: 400, message: '仅支持 JPG、PNG、GIF、WebP 格式' })
  }

  if (file.data.length > 10 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: '图片不能超过 10MB' })
  }

  const dir = getUploadsDir()
  await mkdir(dir, { recursive: true })

  const filename = `${randomUUID()}${ext}`
  await writeFile(join(dir, filename), file.data)

  const url = `/uploads/${filename}`

  return { ok: true, url }
})
