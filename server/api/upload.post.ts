import { extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { uploadObject } from '../utils/obs'

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])
const UPLOAD_PREFIX = 'uploads/'

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

  const filename = `${randomUUID()}${ext}`
  const key = `${UPLOAD_PREFIX}${filename}`

  try {
    const url = await uploadObject(key, file.data, file.type)
    return { ok: true, url }
  } catch (e) {
    console.error('[OBS upload]', e)
    const message = e instanceof Error ? e.message : '上传到 OBS 失败，请检查配置'
    throw createError({ statusCode: 500, message })
  }
})
