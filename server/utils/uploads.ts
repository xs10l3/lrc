import { readdir, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])

export function getUploadsDir() {
  return join(process.cwd(), 'public', 'uploads')
}

export function isValidUploadUrl(url: string): boolean {
  if (!url.startsWith('/uploads/')) return false
  const name = url.slice('/uploads/'.length)
  if (!name || name.includes('/') || name.includes('..')) return false
  return IMAGE_EXT.has(extname(name).toLowerCase())
}

export async function listUploadedImages() {
  const dir = getUploadsDir()
  try {
    const files = await readdir(dir)
    const images: { url: string, mtime: number }[] = []

    for (const file of files) {
      if (!IMAGE_EXT.has(extname(file).toLowerCase())) continue
      const filePath = join(dir, file)
      const info = await stat(filePath)
      if (!info.isFile()) continue
      images.push({ url: `/uploads/${file}`, mtime: info.mtimeMs })
    }

    images.sort((a, b) => b.mtime - a.mtime)
    return images
  } catch {
    return []
  }
}
