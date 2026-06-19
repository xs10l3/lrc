import { listSavedLyrics } from '../utils/lyrics-store'

export default defineEventHandler(async () => {
  const lyrics = await listSavedLyrics()
  return { lyrics }
})
