import { listUploadedImages } from '../utils/uploads'

export default defineEventHandler(async () => {
  const images = await listUploadedImages()
  return { images }
})
