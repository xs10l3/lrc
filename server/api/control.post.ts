import { isValidTheme } from '#shared/utils/themes'
import { parseLrc } from '#shared/utils/parseLrc'
import {
  addPendingImage,
  clearImage,
  clearLyrics,
  clearPendingImages,
  movePendingImage,
  pause,
  play,
  removePendingImage,
  reset,
  seek,
  setDisplayMode,
  setFontScale,
  setImage,
  setIdleImage,
  setLyrics,
  setTheme,
  showIdleImage,
  showNextPending,
  showPendingImage,
  togglePlay,
} from '../utils/playback'
import { isValidUploadUrl } from '../utils/uploads'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body?.action === 'upload') {
    const raw = String(body.raw ?? '')
    if (!raw.trim()) {
      throw createError({ statusCode: 400, message: '歌词内容不能为空' })
    }
    const parsed = parseLrc(raw)
    setLyrics(raw, parsed.meta, parsed.lines)
    return { ok: true, lineCount: parsed.lines.length, meta: parsed.meta }
  }

  if (body?.action === 'clear') {
    clearLyrics()
    return { ok: true }
  }

  if (body?.action === 'clearImage') {
    clearImage()
    return { ok: true }
  }

  if (body?.action === 'selectImage') {
    const url = String(body.url ?? '')
    if (!isValidUploadUrl(url)) {
      throw createError({ statusCode: 400, message: '无效的图片地址' })
    }
    setImage(url)
    return { ok: true, url }
  }

  if (body?.action === 'showIdleImage') {
    const url = showIdleImage()
    if (!url) {
      throw createError({ statusCode: 400, message: '暂无默认图片' })
    }
    return { ok: true, url }
  }

  if (body?.action === 'setIdleImage') {
    const url = String(body.url ?? '')
    if (!isValidUploadUrl(url)) {
      throw createError({ statusCode: 400, message: '无效的图片地址' })
    }
    setIdleImage(url)
    return { ok: true, url }
  }

  if (body?.action === 'addPending') {
    const url = String(body.url ?? '')
    if (!isValidUploadUrl(url)) {
      throw createError({ statusCode: 400, message: '无效的图片地址' })
    }
    if (!addPendingImage(url)) {
      throw createError({ statusCode: 400, message: '图片已在待展示列表中' })
    }
    return { ok: true }
  }

  if (body?.action === 'removePending') {
    const url = String(body.url ?? '')
    removePendingImage(url)
    return { ok: true }
  }

  if (body?.action === 'clearPending') {
    clearPendingImages()
    return { ok: true }
  }

  if (body?.action === 'movePending') {
    const url = String(body.url ?? '')
    const direction = Number(body.direction) === -1 ? -1 : 1
    movePendingImage(url, direction)
    return { ok: true }
  }

  if (body?.action === 'showPending') {
    const url = String(body.url ?? '')
    if (!showPendingImage(url)) {
      throw createError({ statusCode: 400, message: '该图片不在待展示列表中' })
    }
    return { ok: true, url }
  }

  if (body?.action === 'showNextPending') {
    const url = showNextPending()
    if (!url) {
      throw createError({ statusCode: 400, message: '待展示列表为空' })
    }
    return { ok: true, url }
  }

  if (body?.action === 'setMode') {
    const mode = body.mode === 'image' ? 'image' : 'lyrics'
    setDisplayMode(mode)
    return { ok: true }
  }

  if (body?.action === 'setTheme') {
    if (!isValidTheme(body.theme)) {
      throw createError({ statusCode: 400, message: '无效的主题' })
    }
    setTheme(body.theme)
    return { ok: true, theme: body.theme }
  }

  if (body?.action === 'setFontScale') {
    const fontScale = Number(body.fontScale)
    if (!Number.isFinite(fontScale)) {
      throw createError({ statusCode: 400, message: '无效的字体大小' })
    }
    setFontScale(fontScale)
    return { ok: true, fontScale: Math.min(140, Math.max(75, Math.round(fontScale))) }
  }

  if (body?.action === 'play') {
    play()
    return { ok: true }
  }

  if (body?.action === 'pause') {
    pause()
    return { ok: true }
  }

  if (body?.action === 'toggle') {
    togglePlay()
    return { ok: true }
  }

  if (body?.action === 'seek') {
    const time = Number(body.time)
    if (Number.isNaN(time)) {
      throw createError({ statusCode: 400, message: '无效的时间' })
    }
    seek(time)
    return { ok: true }
  }

  if (body?.action === 'reset') {
    reset()
    return { ok: true }
  }

  throw createError({ statusCode: 400, message: '未知操作' })
})
