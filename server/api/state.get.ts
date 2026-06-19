import { getCurrentTime, getPlaybackState } from '../utils/playback'

export default defineEventHandler(() => {
  const playback = getPlaybackState()
  return {
    meta: playback.meta,
    lines: playback.lines,
    isPlaying: playback.isPlaying,
    currentTime: getCurrentTime(),
    displayMode: playback.displayMode,
    imageUrl: playback.imageUrl,
    pendingImages: playback.pendingImages,
  }
})
