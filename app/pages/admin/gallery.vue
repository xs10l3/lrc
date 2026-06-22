<template>
  <div class="admin" :class="{ 'admin--auth': !authenticated }">
    <section v-if="authChecking" class="admin__login">
      <h1>完整图库</h1>
      <p class="admin__subtitle">正在检查登录状态...</p>
    </section>

    <form v-else-if="!authenticated" class="admin__login" @submit.prevent="login">
      <h1>完整图库</h1>
      <p class="admin__subtitle">请输入管理密码后继续</p>
      <input
        v-model="adminPassword"
        class="admin__password"
        type="password"
        autocomplete="current-password"
        placeholder="管理密码"
        :disabled="loggingIn"
      >
      <button class="btn btn--primary" type="submit" :disabled="!adminPassword || loggingIn">
        {{ loggingIn ? '登录中...' : '登录' }}
      </button>
      <p v-if="authMessage" class="admin__upload-msg admin__upload-msg--error">{{ authMessage }}</p>
    </form>

    <template v-else>
      <header class="admin__header">
        <div>
          <h1>完整图库</h1>
          <p class="admin__subtitle">查看和选择全部已上传图片</p>
        </div>
        <div class="admin__header-actions">
          <NuxtLink to="/admin" class="admin__link">
            返回管理端
          </NuxtLink>
          <button class="btn btn--ghost" type="button" @click="logout">退出</button>
        </div>
      </header>

      <section class="admin__panel">
        <div class="admin__panel-title-row">
          <h2>全部图片</h2>
          <span class="admin__counter">共 {{ galleryTotal }} 张</span>
        </div>
        <p class="admin__hint">
          最新上传的图片排在最前，每页 {{ GALLERY_PAGE_SIZE }} 张，选择后可直接展示、加入待展示，或设为默认图
        </p>

        <div v-if="uploadedImages.length" class="admin__gallery">
          <div class="admin__gallery-grid admin__gallery-grid--full">
            <div
              v-for="img in uploadedImages"
              :key="img.url"
              class="admin__gallery-item"
              role="button"
              tabindex="0"
              :class="{
                'admin__gallery-item--selected': selectedImageUrl === img.url,
                'admin__gallery-item--in-pending': pendingImages.includes(img.url),
              }"
              @click="selectedImageUrl = img.url"
              @keydown.enter.prevent="selectedImageUrl = img.url"
              @keydown.space.prevent="selectedImageUrl = img.url"
            >
              <img :src="img.url" alt="" loading="lazy">
              <span v-if="idleImageUrl === img.url" class="admin__gallery-badge admin__gallery-badge--idle">默认图</span>
              <span v-if="pendingImages.includes(img.url)" class="admin__gallery-badge">待展示</span>
            </div>
          </div>
        </div>
        <p v-else class="admin__gallery-empty">图库为空，请先上传图片</p>

        <div v-if="galleryPageCount > 1" class="admin__pager">
          <button class="btn" :disabled="galleryLoading || galleryPage <= 1" @click="goToPage(galleryPage - 1)">
            上一页
          </button>
          <span class="admin__pager-status">
            第 {{ galleryPage }} / {{ galleryPageCount }} 页
          </span>
          <button class="btn" :disabled="galleryLoading || galleryPage >= galleryPageCount" @click="goToPage(galleryPage + 1)">
            下一页
          </button>
        </div>

        <div class="admin__actions">
          <button class="btn btn--primary" :disabled="!selectedImageUrl || directDisplaying" @click="showSelectedImage">
            {{ directDisplaying ? '展示中...' : '直接展示' }}
          </button>
          <button class="btn" :disabled="!selectedImageUrl" @click="addToPending">
            加入待展示
          </button>
          <button class="btn" :disabled="!selectedImageUrl || idleImageUrl === selectedImageUrl" @click="setDefaultImage(selectedImageUrl)">
            {{ selectedImageUrl && idleImageUrl === selectedImageUrl ? '已是默认图' : '设为默认图' }}
          </button>
        </div>
        <p v-if="galleryMessage" class="admin__upload-msg" :class="{ 'admin__upload-msg--error': galleryError }">
          {{ galleryMessage }}
        </p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
const authChecking = ref(true)
const authenticated = ref(false)
const adminPassword = ref('')
const loggingIn = ref(false)
const authMessage = ref('')
const uploadedImages = ref<{ url: string, mtime: number }[]>([])
const selectedImageUrl = ref('')
const directDisplaying = ref(false)
const galleryMessage = ref('')
const galleryError = ref(false)
const galleryLoading = ref(false)
const galleryPage = ref(1)
const galleryPageCount = ref(1)
const galleryTotal = ref(0)
const GALLERY_PAGE_SIZE = 30

const {
  imageUrl,
  idleImageUrl,
  pendingImages,
  refresh,
} = usePlaybackSync()

onMounted(async () => {
  await checkAdminAuth()
  if (authenticated.value) await fetchUploadedImages()
})

watch(imageUrl, (url) => {
  if (url) selectedImageUrl.value = url
}, { immediate: true })

async function checkAdminAuth() {
  authChecking.value = true
  authMessage.value = ''
  try {
    const res = await $fetch<{ authenticated: boolean, configured: boolean }>('/api/auth/admin/status')
    authenticated.value = res.authenticated
    if (!res.configured) {
      authMessage.value = '服务端未配置 ADMIN_PASSWORD'
    }
  } catch (e) {
    authenticated.value = false
    authMessage.value = e instanceof Error ? e.message : '无法检查登录状态'
  } finally {
    authChecking.value = false
  }
}

async function login() {
  if (!adminPassword.value || loggingIn.value) return
  loggingIn.value = true
  authMessage.value = ''
  try {
    await $fetch('/api/auth/admin/login', {
      method: 'POST',
      body: { password: adminPassword.value },
    })
    authenticated.value = true
    adminPassword.value = ''
    await fetchUploadedImages()
  } catch (e) {
    authMessage.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loggingIn.value = false
  }
}

async function logout() {
  await $fetch('/api/auth/admin/logout', { method: 'POST' })
  authenticated.value = false
  uploadedImages.value = []
  selectedImageUrl.value = ''
  galleryPage.value = 1
  galleryPageCount.value = 1
  galleryTotal.value = 0
  adminPassword.value = ''
}

async function fetchUploadedImages() {
  galleryLoading.value = true
  try {
    const res = await $fetch<{
      images: typeof uploadedImages.value
      total: number
      page: number
      pageCount: number
    }>('/api/images', {
      query: {
        page: galleryPage.value,
        limit: GALLERY_PAGE_SIZE,
      },
    })
    uploadedImages.value = res.images
    galleryTotal.value = res.total
    galleryPage.value = res.page
    galleryPageCount.value = res.pageCount
  } catch {
    uploadedImages.value = []
    galleryTotal.value = 0
    galleryPage.value = 1
    galleryPageCount.value = 1
  } finally {
    galleryLoading.value = false
  }
}

async function goToPage(page: number) {
  if (page < 1 || page > galleryPageCount.value || page === galleryPage.value) return
  selectedImageUrl.value = ''
  galleryMessage.value = ''
  galleryError.value = false
  galleryPage.value = page
  await fetchUploadedImages()
}

async function send(action: string, extra?: Record<string, unknown>) {
  await $fetch('/api/control', { method: 'POST', body: { action, ...extra } })
  await refresh()
}

async function addToPending() {
  if (!selectedImageUrl.value) return
  galleryMessage.value = ''
  galleryError.value = false
  try {
    await send('addPending', { url: selectedImageUrl.value })
    galleryMessage.value = '已加入待展示队列'
  } catch (e) {
    galleryError.value = true
    galleryMessage.value = e instanceof Error ? e.message : '添加失败'
  }
}

async function showSelectedImage() {
  if (!selectedImageUrl.value) return
  directDisplaying.value = true
  galleryMessage.value = ''
  galleryError.value = false
  try {
    await send('selectImage', { url: selectedImageUrl.value })
    galleryMessage.value = '已直接展示到显示端'
  } catch (e) {
    galleryError.value = true
    galleryMessage.value = e instanceof Error ? e.message : '展示失败'
  } finally {
    directDisplaying.value = false
  }
}

async function setDefaultImage(url: string) {
  galleryMessage.value = ''
  galleryError.value = false
  try {
    await send('setIdleImage', { url })
    galleryMessage.value = '已设置为默认图'
  } catch (e) {
    galleryError.value = true
    galleryMessage.value = e instanceof Error ? e.message : '设置默认图失败'
  }
}
</script>

<style scoped>
.admin {
  max-width: 1040px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  color: #e8e8e8;
  position: relative;
}

.admin--auth {
  min-height: 100vh;
  display: grid;
  place-items: center;
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

.admin__login {
  width: min(100%, 360px);
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(10px);
  box-sizing: border-box;
}

.admin__login .btn {
  width: 100%;
  margin-top: 0.85rem;
}

.admin__password {
  width: 100%;
  margin-top: 1.25rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid #333;
  border-radius: 6px;
  background: #0a0a0a;
  color: #eee;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.admin__password:focus {
  outline: none;
  border-color: rgba(212, 168, 83, 0.55);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.12);
}

.admin__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.admin__header-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
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

.admin__panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.admin__panel h2 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #666;
  margin: 0;
}

.admin__counter {
  color: #888;
  font-size: 0.8rem;
}

.admin__hint {
  margin: -0.5rem 0 1rem;
  font-size: 0.8rem;
  color: #555;
}

.admin__gallery {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.admin__gallery-empty {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  color: #555;
}

.admin__gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 0.6rem;
}

.admin__gallery-grid--full {
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
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

.admin__gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.admin__gallery-badge {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  padding: 0.15rem 0.35rem;
  font-size: 0.6rem;
  text-align: center;
  background: rgba(212, 168, 83, 0.85);
  color: #1a1000;
  font-weight: 500;
  border-radius: 999px;
}

.admin__gallery-badge--idle {
  left: 0.35rem;
  right: auto;
  background: rgba(255, 255, 255, 0.86);
  color: #111;
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

.admin__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
}

.admin__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.admin__pager-status {
  min-width: 7.5rem;
  color: #888;
  font-size: 0.82rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.admin__upload-msg {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: #8fbc8f;
}

.admin__upload-msg--error {
  color: #ff8888;
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

.btn--ghost {
  padding: 0.5rem 0.8rem;
  color: #888;
  background: transparent;
}

.btn--ghost:hover:not(:disabled) {
  color: #ddd;
  background: rgba(255, 255, 255, 0.06);
}

@media (max-width: 640px) {
  .admin__header,
  .admin__panel-title-row,
  .admin__actions,
  .admin__pager {
    align-items: stretch;
    flex-direction: column;
  }

  .admin__header-actions {
    flex-wrap: wrap;
  }
}
</style>
