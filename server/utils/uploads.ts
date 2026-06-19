import { extname } from 'node:path'
import { listObjects } from './obs'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])
const UPLOAD_PREFIX = 'uploads/'

function getPublicBaseUrl(): string {
  const config = useRuntimeConfig()
  return (config.obsPublicBaseUrl as string).replace(/\/$/, '')
}

export function isValidUploadUrl(url: string): boolean {
  const publicBase = getPublicBaseUrl()

  if (url.startsWith(`${publicBase}/`)) {
    const name = url.slice(publicBase.length + 1)
    if (!name.startsWith(UPLOAD_PREFIX) || name.includes('..')) return false
    return IMAGE_EXT.has(extname(name).toLowerCase())
  }

  if (url.startsWith('/uploads/')) {
    const name = url.slice('/uploads/'.length)
    if (!name || name.includes('/') || name.includes('..')) return false
    return IMAGE_EXT.has(extname(name).toLowerCase())
  }

  return false
}

export async function listUploadedImages() {
  try {
    const objects = await listObjects(UPLOAD_PREFIX)
    const images = objects
      .filter(obj => obj.Key && IMAGE_EXT.has(extname(obj.Key).toLowerCase()))
      .map(obj => ({
        url: `${getPublicBaseUrl()}/${obj.Key}`,
        mtime: obj.LastModified?.getTime() ?? 0,
      }))

    images.sort((a, b) => b.mtime - a.mtime)
    return images
  } catch {
    return []
  }
}
