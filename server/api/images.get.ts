import { listUploadedImages } from '../utils/uploads'
import { ensureIdleImage } from '../utils/playback'

function positiveInt(value: unknown, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  const num = Number(raw)
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : fallback
}

export default defineEventHandler(async (event) => {
  await ensureIdleImage()
  const query = getQuery(event)
  const limit = positiveInt(query.limit, 0)
  const requestedPage = positiveInt(query.page, 1)
  const images = await listUploadedImages()
  const total = images.length

  if (!limit) {
    return {
      images,
      total,
      page: 1,
      pageSize: total,
      pageCount: 1,
      hasMore: false,
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / limit))
  const page = Math.min(requestedPage, pageCount)
  const start = (page - 1) * limit
  const visibleImages = images.slice(start, start + limit)

  return {
    images: visibleImages,
    total,
    page,
    pageSize: limit,
    pageCount,
    hasMore: page < pageCount,
  }
})
