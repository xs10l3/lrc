import type { DisplayTheme } from '#shared/utils/themes'
import { DEFAULT_THEME } from '#shared/utils/themes'
import type { LyricLine, LrcMeta } from '#shared/utils/parseLrc'
import { isValidUploadUrl } from './uploads'

export type DisplayMode = 'lyrics' | 'image'

export interface PlaybackState {
  meta: LrcMeta
  lines: LyricLine[]
  raw: string
  isPlaying: boolean
  anchorTime: number
  anchorAt: number
  displayMode: DisplayMode
  imageUrl: string
  pendingImages: string[]
  theme: DisplayTheme
}

const state: PlaybackState = {
  meta: {},
  lines: [],
  raw: '',
  isPlaying: false,
  anchorTime: 0,
  anchorAt: Date.now(),
  displayMode: 'lyrics',
  imageUrl: '',
  pendingImages: [],
  theme: DEFAULT_THEME,
}

export function getPlaybackState(): PlaybackState {
  return {
    ...state,
    meta: { ...state.meta },
    lines: [...state.lines],
    pendingImages: [...state.pendingImages],
  }
}

export function getCurrentTime(): number {
  if (!state.isPlaying) return state.anchorTime
  return state.anchorTime + (Date.now() - state.anchorAt)
}

export function setLyrics(raw: string, meta: LrcMeta, lines: LyricLine[]) {
  state.raw = raw
  state.meta = meta
  state.lines = lines
  state.isPlaying = false
  state.anchorTime = 0
  state.anchorAt = Date.now()
  state.displayMode = 'lyrics'
}

export function clearLyrics() {
  state.raw = ''
  state.meta = {}
  state.lines = []
  state.isPlaying = false
  state.anchorTime = 0
  state.anchorAt = Date.now()
  state.displayMode = state.imageUrl ? 'image' : 'lyrics'
}

export function setImage(url: string) {
  state.imageUrl = url
  state.displayMode = 'image'
  state.isPlaying = false
  state.anchorTime = 0
  state.anchorAt = Date.now()
}

export function clearImage() {
  state.imageUrl = ''
  state.displayMode = 'lyrics'
}

export function setDisplayMode(mode: DisplayMode) {
  if (mode === 'image' && !state.imageUrl) return
  if (mode === 'lyrics' && state.lines.length === 0 && !state.imageUrl) return
  state.displayMode = mode
}

export function addPendingImage(url: string): boolean {
  if (!isValidUploadUrl(url)) return false
  if (state.pendingImages.includes(url)) return false
  state.pendingImages.push(url)
  return true
}

export function removePendingImage(url: string) {
  state.pendingImages = state.pendingImages.filter(u => u !== url)
}

export function clearPendingImages() {
  state.pendingImages = []
}

export function movePendingImage(url: string, direction: -1 | 1) {
  const i = state.pendingImages.indexOf(url)
  if (i < 0) return
  const j = i + direction
  if (j < 0 || j >= state.pendingImages.length) return
  const list = state.pendingImages
  ;[list[i]!, list[j]!] = [list[j]!, list[i]!]
}

export function showPendingImage(url: string): boolean {
  const i = state.pendingImages.indexOf(url)
  if (i < 0) return false
  state.pendingImages.splice(i, 1)
  setImage(url)
  return true
}

export function showNextPending(): string | null {
  const next = state.pendingImages.shift() ?? null
  if (next) setImage(next)
  return next
}

export function play() {
  if (state.lines.length === 0) return
  state.anchorAt = Date.now()
  state.isPlaying = true
}

export function pause() {
  if (!state.isPlaying) return
  state.anchorTime = getCurrentTime()
  state.isPlaying = false
}

export function seek(timeMs: number) {
  state.anchorTime = Math.max(0, timeMs)
  state.anchorAt = Date.now()
}

export function togglePlay() {
  if (state.isPlaying) pause()
  else play()
}

export function reset() {
  state.isPlaying = false
  state.anchorTime = 0
  state.anchorAt = Date.now()
}

export function setTheme(theme: DisplayTheme) {
  state.theme = theme
}
