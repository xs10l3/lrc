import { ensureIdleImage, getCurrentTime, getPlaybackState } from '../utils/playback'

export default defineEventHandler(async () => {
  await ensureIdleImage()
  const playback = getPlaybackState()
  return {
    meta: playback.meta,
    lines: playback.lines,
    isPlaying: playback.isPlaying,
    currentTime: getCurrentTime(),
    displayMode: playback.displayMode,
    imageUrl: playback.imageUrl,
    idleImageUrl: playback.idleImageUrl,
    pendingImages: playback.pendingImages,
    theme: playback.theme,
    fontScale: playback.fontScale,
  }
})
