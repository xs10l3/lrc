<template>
  <div class="admin">
    <header class="admin__header">
      <div>
        <h1>歌词管理端</h1>
        <p class="admin__subtitle">上传 LRC 歌词或图片，控制播放，显示端实时同步</p>
      </div>
      <NuxtLink to="/display" target="_blank" class="admin__link">
        打开展示端 ↗
      </NuxtLink>
    </header>

    <section class="admin__panel">
      <h2>歌词编辑</h2>
      <p class="admin__hint">编辑后可保存到歌词库，或解析加载到显示端</p>
      <div class="admin__upload-row">
        <label class="admin__file-btn">
          选择 .lrc 文件
          <input ref="lrcInput" type="file" accept=".lrc,text/plain" hidden @change="onFileSelect">
        </label>
        <span v-if="fileName" class="admin__file-name">{{ fileName }}</span>
      </div>
      <textarea
        v-model="rawText"
        class="admin__textarea"
        placeholder="或直接粘贴 LRC 歌词内容…"
        spellcheck="false"
      />
      <div class="admin__actions">
        <button class="btn" :disabled="!rawText.trim() || savingLyric" @click="saveLyric">
          {{ savingLyric ? '保存中…' : '保存到歌词库' }}
        </button>
        <button class="btn btn--primary" :disabled="uploading" @click="upload">
          {{ uploading ? '解析中…' : '解析并加载' }}
        </button>
        <button class="btn btn--danger" :disabled="!hasLyrics || clearing" @click="clearLyrics">
          {{ clearing ? '清空中…' : '清空当前' }}
        </button>
      </div>
      <p v-if="lyricMessage" class="admin__upload-msg" :class="{ 'admin__upload-msg--error': lyricError }">
        {{ lyricMessage }}
      </p>
      <span v-if="lineCount !== null" class="admin__status">
        当前已加载 {{ lineCount }} 行
        <template v-if="meta.title"> · {{ meta.title }}</template>
        <template v-if="meta.artist"> — {{ meta.artist }}</template>
      </span>
    </section>

    <section class="admin__panel">
      <h2>歌词库</h2>
      <p class="admin__hint">已保存的歌词，点击加载到显示端</p>

      <ul v-if="savedLyrics.length" class="admin__lyric-list">
        <li
          v-for="item in savedLyrics"
          :key="item.id"
          class="admin__lyric-item"
          :class="{ 'admin__lyric-item--active': activeLyricId === item.id }"
        >
          <div class="admin__lyric-item-main">
            <span class="admin__lyric-item-title">{{ item.title || item.name }}</span>
            <span v-if="item.artist" class="admin__lyric-item-artist">{{ item.artist }}</span>
            <span class="admin__lyric-item-meta">{{ item.lineCount }} 行</span>
          </div>
          <div class="admin__lyric-item-actions">
            <button class="btn btn--icon btn--icon-show" title="加载" @click="loadSavedLyric(item.id)">▶</button>
            <button class="btn btn--icon" title="填入编辑区" @click="fillEditor(item.id)">✎</button>
            <button class="btn btn--icon btn--icon-remove" title="删除" @click="deleteSavedLyric(item.id)">×</button>
          </div>
        </li>
      </ul>
      <p v-else class="admin__gallery-empty">歌词库为空，请先保存歌词</p>
    </section>

    <section class="admin__panel">
      <h2>上传图片</h2>
      <p class="admin__hint">仅保存到图库，不会自动推送到显示端</p>
      <div class="admin__upload-row">
        <label class="admin__file-btn">
          选择图片
          <input
            ref="imageInput"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/*"
            hidden
            @change="onImageSelect"
          >
        </label>
        <span v-if="imageFileName" class="admin__file-name">{{ imageFileName }}</span>
      </div>
      <div v-if="imagePreview" class="admin__image-preview">
        <img :src="imagePreview" alt="待上传预览">
      </div>
      <div class="admin__actions">
        <button class="btn btn--primary" :disabled="!imageFile || imageUploading" @click="uploadImage">
          {{ imageUploading ? '上传中…' : '上传到图库' }}
        </button>
      </div>
      <p v-if="uploadMessage" class="admin__upload-msg" :class="{ 'admin__upload-msg--error': uploadError }">
        {{ uploadMessage }}
      </p>
    </section>

    <section class="admin__panel">
      <h2>图库</h2>
      <p class="admin__hint">选择图片后可加入待展示队列</p>

      <div v-if="uploadedImages.length" class="admin__gallery">
        <div class="admin__gallery-grid">
          <button
            v-for="img in uploadedImages"
            :key="img.url"
            type="button"
            class="admin__gallery-item"
            :class="{
              'admin__gallery-item--selected': selectedImageUrl === img.url,
              'admin__gallery-item--in-pending': pendingImages.includes(img.url),
            }"
            @click="selectedImageUrl = img.url"
          >
            <img :src="img.url" alt="" loading="lazy">
            <span v-if="pendingImages.includes(img.url)" class="admin__gallery-badge">待展示</span>
          </button>
        </div>
      </div>
      <p v-else class="admin__gallery-empty">图库为空，请先上传图片</p>

      <div class="admin__actions">
        <button class="btn" :disabled="!selectedImageUrl" @click="addToPending">
          加入待展示
        </button>
      </div>
    </section>

    <section class="admin__panel">
      <h2>待展示</h2>
      <p class="admin__hint">按顺序排队，点击展示后从队列移除</p>

      <ul v-if="pendingImages.length" class="admin__pending">
        <li
          v-for="(url, i) in pendingImages"
          :key="url"
          class="admin__pending-item"
          :class="{
            'admin__pending-item--active': currentImageUrl === url && displayMode === 'image',
            'admin__pending-item--next': i === 0,
          }"
        >
          <span class="admin__pending-index">{{ i + 1 }}</span>
          <button type="button" class="admin__pending-thumb" @click="showPending(url)">
            <img :src="url" alt="">
          </button>
          <div class="admin__pending-info">
            <span v-if="i === 0" class="admin__pending-tag">下一张</span>
            <span class="admin__pending-name">{{ fileNameFromUrl(url) }}</span>
          </div>
          <div class="admin__pending-actions">
            <button class="btn btn--icon" :disabled="i === 0" title="上移" @click="movePending(url, -1)">↑</button>
            <button class="btn btn--icon" :disabled="i === pendingImages.length - 1" title="下移" @click="movePending(url, 1)">↓</button>
            <button class="btn btn--icon btn--icon-show" title="展示" @click="showPending(url)">▶</button>
            <button class="btn btn--icon btn--icon-remove" title="移除" @click="removeFromPending(url)">×</button>
          </div>
        </li>
      </ul>
      <p v-else class="admin__gallery-empty">暂无待展示图片，请从图库添加</p>

      <div class="admin__actions admin__actions--display">
        <button
          class="btn btn--primary"
          :disabled="!pendingImages.length || displaying"
          @click="showNextPending"
        >
          {{ displaying ? '展示中…' : '展示下一张' }}
        </button>
        <button class="btn btn--danger" :disabled="!pendingImages.length" @click="clearPending">
          清空队列
        </button>
      </div>
    </section>

    <section class="admin__panel">
      <h2>展示控制</h2>
      <p class="admin__hint">管理显示端当前状态</p>

      <div class="admin__actions admin__actions--display">
        <button class="btn btn--danger" :disabled="!currentImageUrl" @click="stopDisplay">
          停止展示
        </button>
      </div>

      <div v-if="currentImageUrl && displayMode === 'image'" class="admin__display-preview">
        <span class="admin__display-label">显示端当前图片</span>
        <img :src="currentImageUrl" alt="当前展示">
      </div>
      <p v-else class="admin__gallery-empty">显示端未展示图片</p>

      <div v-if="currentImageUrl || hasLyrics" class="admin__mode-switch">
        <span class="admin__mode-label">显示端模式：</span>
        <button
          class="btn btn--mode"
          :class="{ 'btn--mode-active': displayMode === 'lyrics' }"
          :disabled="!hasLyrics"
          @click="switchMode('lyrics')"
        >
          歌词
        </button>
        <button
          class="btn btn--mode"
          :class="{ 'btn--mode-active': displayMode === 'image' }"
          :disabled="!currentImageUrl"
          @click="switchMode('image')"
        >
          图片
        </button>
      </div>
    </section>

    <section class="admin__panel">
      <h2>播放控制</h2>
      <div class="admin__controls">
        <button class="btn" :disabled="!hasLyrics" @click="send('reset')">重置</button>
        <button class="btn btn--primary" :disabled="!hasLyrics" @click="send('toggle')">
          {{ playing ? '暂停' : '播放' }}
        </button>
      </div>
      <div class="admin__seek">
        <input
          type="range"
          min="0"
          :max="duration"
          :value="currentTime"
          :disabled="!hasLyrics"
          @input="onSeek"
        >
        <span class="admin__time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>
    </section>

    <section v-if="previewLines.length" class="admin__panel">
      <h2>预览</h2>
      <ul class="admin__preview">
        <li
          v-for="(line, i) in previewLines"
          :key="i"
          :class="{ active: i === activeIndex }"
        >
          <span class="admin__preview-time">{{ formatTime(line.time) }}</span>
          {{ line.text || '…' }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { findActiveLineIndex, formatTime } from '#shared/utils/parseLrc'

const rawText = ref('')
const fileName = ref('')
const uploading = ref(false)
const savingLyric = ref(false)
const lyricMessage = ref('')
const lyricError = ref(false)
const clearing = ref(false)
const lineCount = ref<number | null>(null)
const meta = ref<{ title?: string, artist?: string }>({})
const playing = ref(false)
const currentTime = ref(0)
const previewLines = ref<{ time: number, text: string }[]>([])
const savedLyrics = ref<{
  id: string
  name: string
  title?: string
  artist?: string
  lineCount: number
  mtime: number
}[]>([])
const activeLyricId = ref('')
const lrcInput = ref<HTMLInputElement | null>(null)

const imageFile = ref<File | null>(null)
const imageFileName = ref('')
const imagePreview = ref('')
const imageUploading = ref(false)
const uploadMessage = ref('')
const uploadError = ref(false)
const selectedImageUrl = ref('')
const displaying = ref(false)
const currentImageUrl = ref('')
const uploadedImages = ref<{ url: string, mtime: number }[]>([])
const imageInput = ref<HTMLInputElement | null>(null)

const { lines, isPlaying, currentTime: syncedTime, displayMode, imageUrl, pendingImages, refresh } = usePlaybackSync()

const hasLyrics = computed(() => previewLines.value.length > 0)
const duration = computed(() => {
  const last = previewLines.value[previewLines.value.length - 1]
  return last ? last.time + 5000 : 0
})
const activeIndex = computed(() => findActiveLineIndex(previewLines.value, currentTime.value))

watch(syncedTime, (t) => { currentTime.value = t })
watch(isPlaying, (p) => { playing.value = p })
watch(lines, (l) => {
  previewLines.value = l
  if (l.length === 0) lineCount.value = null
}, { immediate: true })
watch(imageUrl, (url) => {
  currentImageUrl.value = url
  if (url && displayMode.value === 'image') {
    selectedImageUrl.value = url
  }
}, { immediate: true })

onMounted(() => {
  fetchUploadedImages()
  fetchSavedLyrics()
})

async function fetchSavedLyrics() {
  try {
    const res = await $fetch<{ lyrics: typeof savedLyrics.value }>('/api/lyrics')
    savedLyrics.value = res.lyrics
  } catch {
    savedLyrics.value = []
  }
}

async function saveLyric() {
  if (!rawText.value.trim()) return
  savingLyric.value = true
  lyricMessage.value = ''
  lyricError.value = false
  try {
    await $fetch('/api/lyrics', {
      method: 'POST',
      body: { raw: rawText.value, name: fileName.value || undefined },
    })
    lyricMessage.value = '已保存到歌词库'
    await fetchSavedLyrics()
  } catch (e) {
    lyricError.value = true
    lyricMessage.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    savingLyric.value = false
  }
}

async function loadSavedLyric(id: string) {
  uploading.value = true
  lyricMessage.value = ''
  lyricError.value = false
  try {
    const { raw } = await $fetch<{ raw: string }>(`/api/lyrics/${id}`)
    rawText.value = raw
    const res = await $fetch<{ lineCount: number, meta: typeof meta.value }>('/api/control', {
      method: 'POST',
      body: { action: 'upload', raw },
    })
    lineCount.value = res.lineCount
    meta.value = res.meta
    activeLyricId.value = id
    await refresh()
    lyricMessage.value = '已加载到显示端'
  } catch (e) {
    lyricError.value = true
    lyricMessage.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    uploading.value = false
  }
}

async function fillEditor(id: string) {
  try {
    const { raw } = await $fetch<{ raw: string }>(`/api/lyrics/${id}`)
    rawText.value = raw
    activeLyricId.value = id
    const item = savedLyrics.value.find(l => l.id === id)
    fileName.value = item?.title || item?.name || ''
    lyricMessage.value = '已填入编辑区'
    lyricError.value = false
  } catch (e) {
    lyricError.value = true
    lyricMessage.value = e instanceof Error ? e.message : '读取失败'
  }
}

async function deleteSavedLyric(id: string) {
  const item = savedLyrics.value.find(l => l.id === id)
  if (!confirm(`确定删除「${item?.title || item?.name || '歌词'}」？`)) return
  try {
    await $fetch(`/api/lyrics/${id}`, { method: 'DELETE' })
    if (activeLyricId.value === id) activeLyricId.value = ''
    await fetchSavedLyrics()
    lyricMessage.value = '已删除'
    lyricError.value = false
  } catch (e) {
    lyricError.value = true
    lyricMessage.value = e instanceof Error ? e.message : '删除失败'
  }
}

async function fetchUploadedImages() {
  try {
    const res = await $fetch<{ images: typeof uploadedImages.value }>('/api/images')
    uploadedImages.value = res.images
  } catch {
    uploadedImages.value = []
  }
}

async function addToPending() {
  if (!selectedImageUrl.value) return
  try {
    await send('addPending', { url: selectedImageUrl.value })
  } catch (e) {
    uploadError.value = true
    uploadMessage.value = e instanceof Error ? e.message : '添加失败'
  }
}

async function removeFromPending(url: string) {
  await send('removePending', { url })
}

async function clearPending() {
  if (!pendingImages.value.length) return
  if (!confirm('确定清空待展示队列？')) return
  await send('clearPending')
}

async function movePending(url: string, direction: -1 | 1) {
  await send('movePending', { url, direction })
}

async function showPending(url: string) {
  displaying.value = true
  try {
    await send('showPending', { url })
    currentImageUrl.value = url
  } finally {
    displaying.value = false
  }
}

async function showNextPending() {
  displaying.value = true
  try {
    const res = await $fetch<{ url: string }>('/api/control', {
      method: 'POST',
      body: { action: 'showNextPending' },
    })
    currentImageUrl.value = res.url
    await refresh()
  } catch (e) {
    uploadError.value = true
    uploadMessage.value = e instanceof Error ? e.message : '展示失败'
  } finally {
    displaying.value = false
  }
}

function fileNameFromUrl(url: string) {
  return url.split('/').pop() ?? url
}

async function stopDisplay() {
  await send('clearImage')
  currentImageUrl.value = ''
}

async function send(action: string, extra?: Record<string, unknown>) {
  await $fetch('/api/control', { method: 'POST', body: { action, ...extra } })
  await refresh()
}

async function upload() {
  if (!rawText.value.trim()) return
  uploading.value = true
  try {
    const res = await $fetch<{ lineCount: number, meta: typeof meta.value }>('/api/control', {
      method: 'POST',
      body: { action: 'upload', raw: rawText.value },
    })
    lineCount.value = res.lineCount
    meta.value = res.meta
    await refresh()
  } finally {
    uploading.value = false
  }
}

async function clearLyrics() {
  if (!confirm('确定清空所有歌词？')) return
  clearing.value = true
  try {
    await send('clear')
    rawText.value = ''
    fileName.value = ''
    lineCount.value = null
    meta.value = {}
    previewLines.value = []
  } finally {
    clearing.value = false
  }
}

async function uploadImage() {
  if (!imageFile.value) return
  imageUploading.value = true
  uploadMessage.value = ''
  uploadError.value = false
  try {
    const form = new FormData()
    form.append('file', imageFile.value, imageFile.value.name)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json() as { url?: string, message?: string }
    if (!res.ok) {
      throw new Error(data.message ?? '上传失败')
    }
    uploadMessage.value = '上传成功，可从图库加入待展示'
    selectedImageUrl.value = data.url!
    imageFile.value = null
    if (imagePreview.value) {
      URL.revokeObjectURL(imagePreview.value)
      imagePreview.value = ''
    }
    imageFileName.value = ''
    if (imageInput.value) imageInput.value.value = ''
    await fetchUploadedImages()
  } catch (e) {
    uploadError.value = true
    uploadMessage.value = e instanceof Error ? e.message : '上传失败'
  } finally {
    imageUploading.value = false
  }
}

async function switchMode(mode: 'lyrics' | 'image') {
  await send('setMode', { mode })
}

function onImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imageFile.value = file
  imageFileName.value = file.name
  imagePreview.value = URL.createObjectURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    rawText.value = String(reader.result ?? '')
  }
  reader.readAsText(file, 'utf-8')
}

let seekTimer: ReturnType<typeof setTimeout> | null = null
function onSeek(e: Event) {
  const time = Number((e.target as HTMLInputElement).value)
  currentTime.value = time
  if (seekTimer) clearTimeout(seekTimer)
  seekTimer = setTimeout(() => send('seek', { time }), 80)
}
</script>

<style scoped>
.admin {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  color: #e8e8e8;
  position: relative;
}

.admin::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 100% 0%, rgba(120, 80, 255, 0.06), transparent),
    radial-gradient(ellipse 50% 30% at 0% 100%, rgba(212, 168, 83, 0.05), transparent);
  pointer-events: none;
  z-index: -1;
}

.admin__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.admin h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  background: linear-gradient(135deg, #fff, #d4a853);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.admin__subtitle {
  margin: 0;
  color: #666;
  font-size: 0.875rem;
}

.admin__link {
  color: #d4a853;
  text-decoration: none;
  font-size: 0.875rem;
  white-space: nowrap;
  padding: 0.5rem 0.9rem;
  border: 1px solid rgba(212, 168, 83, 0.25);
  border-radius: 8px;
  transition: background 0.2s, box-shadow 0.2s;
}

.admin__link:hover {
  background: rgba(212, 168, 83, 0.08);
  box-shadow: 0 0 20px rgba(212, 168, 83, 0.1);
}

.admin__panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  backdrop-filter: blur(8px);
}

.admin__panel h2 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #666;
  margin: 0 0 1rem;
}

.admin__upload-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.admin__file-btn {
  display: inline-block;
  padding: 0.4rem 0.9rem;
  background: #222;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.admin__file-btn:hover {
  background: #2a2a2a;
}

.admin__file-name {
  font-size: 0.8rem;
  color: #888;
}

.admin__textarea {
  width: 100%;
  min-height: 200px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #ddd;
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  padding: 0.75rem;
  resize: vertical;
  box-sizing: border-box;
}

.admin__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
}

.admin__status {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #888;
}

.admin__controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.admin__seek input[type='range'] {
  width: 100%;
  accent-color: #d4a853;
}

.admin__time {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #888;
  font-variant-numeric: tabular-nums;
}

.admin__preview {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
}

.admin__preview li {
  padding: 0.35rem 0.5rem;
  font-size: 0.875rem;
  color: #555;
  border-radius: 4px;
}

.admin__preview li.active {
  color: #ffe9b0;
  background: rgba(212, 168, 83, 0.1);
  box-shadow: inset 2px 0 0 #d4a853;
}

.admin__preview-time {
  display: inline-block;
  width: 4.5rem;
  font-variant-numeric: tabular-nums;
  color: #444;
  font-size: 0.75rem;
}

.admin__preview li.active .admin__preview-time {
  color: #d4a853;
}

.btn {
  padding: 0.5rem 1.1rem;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a1a;
  color: #ddd;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn:hover:not(:disabled) {
  background: #252525;
}

.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn--primary {
  background: linear-gradient(135deg, #d4a853, #ffe9b0);
  color: #1a1000;
  border-color: transparent;
  font-weight: 500;
}

.btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #e8be6a, #fff0cc);
  box-shadow: 0 4px 20px rgba(212, 168, 83, 0.25);
}

.btn--danger {
  border-color: rgba(255, 100, 100, 0.3);
  color: #ff8888;
}

.btn--danger:hover:not(:disabled) {
  background: rgba(255, 80, 80, 0.1);
  border-color: rgba(255, 100, 100, 0.5);
}

.admin__image-preview {
  margin: 0.75rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0a0a0a;
  max-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin__image-preview img {
  max-width: 100%;
  max-height: 240px;
  object-fit: contain;
  display: block;
}

.admin__mode-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.admin__mode-label {
  font-size: 0.8rem;
  color: #666;
  margin-right: 0.25rem;
}

.btn--mode {
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
}

.btn--mode-active {
  border-color: rgba(212, 168, 83, 0.5);
  color: #d4a853;
  background: rgba(212, 168, 83, 0.1);
}

.admin__hint {
  margin: -0.5rem 0 1rem;
  font-size: 0.8rem;
  color: #555;
}

.admin__upload-msg {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: #8fbc8f;
}

.admin__upload-msg--error {
  color: #ff8888;
}

.admin__actions--display {
  margin-top: 1rem;
}

.admin__display-preview {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.admin__display-label {
  display: block;
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.admin__display-preview img {
  max-width: 100%;
  max-height: 160px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid rgba(212, 168, 83, 0.3);
  display: block;
}

.admin__gallery {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.admin__gallery-title {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #666;
  font-weight: normal;
}

.admin__gallery-empty {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  color: #555;
}

.admin__gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.6rem;
}

.admin__gallery-item {
  aspect-ratio: 1;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  background: #0a0a0a;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.admin__gallery-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.15rem;
  font-size: 0.6rem;
  text-align: center;
  background: rgba(212, 168, 83, 0.85);
  color: #1a1000;
  font-weight: 500;
}

.admin__gallery-item--in-pending {
  border-color: rgba(212, 168, 83, 0.35);
}

.admin__gallery-item:hover {
  border-color: rgba(212, 168, 83, 0.4);
  transform: translateY(-2px);
}

.admin__gallery-item--selected {
  border-color: rgba(255, 255, 255, 0.35);
}

.admin__gallery-item--active {
  border-color: #d4a853;
  box-shadow: 0 0 16px rgba(212, 168, 83, 0.25);
}

.admin__pending {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin__pending-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: border-color 0.2s, background 0.2s;
}

.admin__pending-item--next {
  border-color: rgba(212, 168, 83, 0.25);
  background: rgba(212, 168, 83, 0.05);
}

.admin__pending-item--active {
  border-color: rgba(212, 168, 83, 0.5);
  box-shadow: inset 3px 0 0 #d4a853;
}

.admin__pending-index {
  flex-shrink: 0;
  width: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: #666;
  font-variant-numeric: tabular-nums;
}

.admin__pending-thumb {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  background: #111;
}

.admin__pending-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.admin__pending-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.admin__pending-tag {
  font-size: 0.65rem;
  color: #d4a853;
  letter-spacing: 0.05em;
}

.admin__pending-name {
  font-size: 0.75rem;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin__pending-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.btn--icon {
  padding: 0.3rem 0.45rem;
  min-width: 1.8rem;
  font-size: 0.75rem;
  line-height: 1;
}

.btn--icon-show {
  color: #d4a853;
  border-color: rgba(212, 168, 83, 0.3);
}

.btn--icon-remove {
  color: #ff8888;
  border-color: rgba(255, 100, 100, 0.25);
}

.admin__gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.admin__lyric-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin__lyric-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: border-color 0.2s, background 0.2s;
}

.admin__lyric-item--active {
  border-color: rgba(212, 168, 83, 0.45);
  background: rgba(212, 168, 83, 0.06);
  box-shadow: inset 3px 0 0 #d4a853;
}

.admin__lyric-item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.admin__lyric-item-title {
  font-size: 0.9rem;
  color: #ddd;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin__lyric-item-artist {
  font-size: 0.75rem;
  color: #888;
}

.admin__lyric-item-meta {
  font-size: 0.7rem;
  color: #555;
}

.admin__lyric-item-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}
</style>
