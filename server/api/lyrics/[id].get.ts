import { readSavedLyric } from '../../utils/lyrics-store'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少歌词 ID' })
  }
  const raw = await readSavedLyric(id)
  return { raw }
})
