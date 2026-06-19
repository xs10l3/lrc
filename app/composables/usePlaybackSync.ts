export function usePlaybackSync() {
  const meta = ref<{ title?: string, artist?: string, album?: string }>({})
  const lines = ref<{ time: number, text: string }[]>([])
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const displayMode = ref<'lyrics' | 'image'>('lyrics')
  const imageUrl = ref('')
  const pendingImages = ref<string[]>([])

  let timer: ReturnType<typeof setInterval> | null = null
  let lastServerTime = 0
  let lastFetchAt = 0
  let localPlaying = false

  async function fetchState() {
    try {
      const data = await $fetch<{
        meta: typeof meta.value
        lines: typeof lines.value
        isPlaying: boolean
        currentTime: number
        displayMode: 'lyrics' | 'image'
        imageUrl: string
        pendingImages: string[]
      }>('/api/state')
      meta.value = data.meta
      lines.value = data.lines
      isPlaying.value = data.isPlaying
      currentTime.value = data.currentTime
      displayMode.value = data.displayMode
      imageUrl.value = data.imageUrl
      pendingImages.value = data.pendingImages
      lastServerTime = data.currentTime
      lastFetchAt = Date.now()
      localPlaying = data.isPlaying
    } catch {
      // 静默重试
    }
  }

  function tick() {
    if (localPlaying) {
      currentTime.value = lastServerTime + (Date.now() - lastFetchAt)
    }
  }

  function start() {
    fetchState()
    timer = setInterval(() => {
      tick()
      if (Date.now() - lastFetchAt > 500) fetchState()
    }, 50)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  onMounted(start)
  onUnmounted(stop)

  return {
    meta,
    lines,
    isPlaying,
    currentTime,
    displayMode,
    imageUrl,
    pendingImages,
    refresh: fetchState,
  }
}
