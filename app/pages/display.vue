<template>
  <div class="display-root">
    <Transition name="image-reveal" mode="out-in">
      <div
        :key="showImage ? imageUrl : 'lyrics'"
        class="display-screen"
        :class="{ 'display-screen--image': showImage }"
      >
        <template v-if="showImage">
          <div
            class="display-screen__image"
            :style="{ backgroundImage: `url(${imageUrl})` }"
            role="img"
          />
        </template>

        <template v-else>
          <DisplayParticles />

          <div class="display-screen__aurora" aria-hidden="true" />
          <div class="display-screen__vignette" aria-hidden="true" />
          <div class="display-screen__scanline" aria-hidden="true" />

          <header v-if="showMeta" class="display-screen__meta">
            <div class="display-screen__meta-line" />
            <p v-if="meta.title" class="display-screen__title">{{ meta.title }}</p>
            <p v-if="meta.artist" class="display-screen__artist">{{ meta.artist }}</p>
          </header>

          <div class="display-screen__body">
            <div v-if="lines.length" class="display-screen__lyrics-wrap">
              <TransitionGroup
                name="lyric"
                tag="div"
                class="display-screen__lyrics"
              >
                <p
                  v-for="item in visibleItems"
                  :key="item.globalIndex"
                  class="display-screen__line"
                  :class="item.state"
                >
                  <template v-if="item.state === 'is-active'">
                    <span class="display-screen__line-glow" aria-hidden="true">
                      <span
                        v-for="(ch, ci) in splitChars(item.text)"
                        :key="`g-${item.globalIndex}-${ci}`"
                        class="display-screen__char display-screen__char--glow"
                        :style="{ '--delay': `${ci * 0.07}s` }"
                      >{{ ch }}</span>
                    </span>
                    <span class="display-screen__line-text display-screen__line-text--emerge">
                      <span
                        v-for="(ch, ci) in splitChars(item.text)"
                        :key="`${item.globalIndex}-${ci}`"
                        class="display-screen__char"
                        :style="{ '--delay': `${ci * 0.07}s` }"
                      >{{ ch }}</span>
                    </span>
                  </template>
                  <span v-else class="display-screen__line-text">{{ item.text || '…' }}</span>
                </p>
              </TransitionGroup>
            </div>

            <div v-else class="display-screen__empty">
              <div class="display-screen__pulse-ring" />
              <p>等待内容</p>
            </div>
          </div>

          <footer v-if="showProgress" class="display-screen__footer">
            <div class="display-screen__progress">
              <div class="display-screen__progress-glow" :style="{ width: `${progress}%` }" />
              <div class="display-screen__progress-bar" :style="{ width: `${progress}%` }" />
            </div>
            <div class="display-screen__progress-dot" :style="{ left: `${progress}%` }" />
          </footer>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { findActiveLineIndex } from '#shared/utils/parseLrc'

definePageMeta({ layout: false })

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap',
    },
  ],
})

const { meta, lines, currentTime, displayMode, imageUrl } = usePlaybackSync()

const showImage = computed(() => displayMode.value === 'image' && !!imageUrl.value)
const showMeta = computed(() => !showImage.value && (meta.value.title || meta.value.artist))
const showProgress = computed(() => !showImage.value && lines.value.length > 0)

const activeIndex = computed(() => findActiveLineIndex(lines.value, currentTime.value))

const duration = computed(() => {
  const last = lines.value[lines.value.length - 1]
  return last ? last.time + 8000 : 1
})

const progress = computed(() =>
  Math.min(100, (currentTime.value / duration.value) * 100),
)

const visibleItems = computed(() => {
  const idx = activeIndex.value
  const all = lines.value

  if (all.length === 0) return []

  type LineItem = { time: number, text: string, globalIndex: number, state: string }

  if (idx < 0) {
    const first = all[0]!
    return [{ time: first.time, text: first.text, globalIndex: 0, state: 'is-active' }]
  }

  const items: LineItem[] = []

  if (idx > 0) {
    const prev = all[idx - 1]!
    items.push({ time: prev.time, text: prev.text, globalIndex: idx - 1, state: 'is-past' })
  }
  const current = all[idx]!
  items.push({ time: current.time, text: current.text, globalIndex: idx, state: 'is-active' })
  if (idx < all.length - 1) {
    const next = all[idx + 1]!
    items.push({ time: next.time, text: next.text, globalIndex: idx + 1, state: 'is-next' })
  }

  return items
})

function splitChars(text: string): string[] {
  return [...(text || '…')].map(c => (c === ' ' ? '\u00A0' : c))
}
</script>

<style scoped>
.display-root {
  min-height: 100dvh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.display-screen--image {
  padding: 0;
  border: none;
  display: block;
  aspect-ratio: auto;
  width: min(100vw, calc(100dvh / 3));
  height: min(100dvh, calc(100vw * 3));
}

.display-screen__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  animation: image-emerge 1s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes image-emerge {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.image-reveal-enter-active {
  transition: opacity 0.5s ease;
}
.image-reveal-leave-active {
  transition: opacity 0.35s ease;
}
.image-reveal-enter-from,
.image-reveal-leave-to {
  opacity: 0;
}

.display-screen {
  width: min(100vw, calc(100dvh / 3));
  aspect-ratio: 1 / 3;
  background: #030308;
  display: flex;
  flex-direction: column;
  padding: clamp(1.2rem, 5vw, 2.2rem) clamp(0.8rem, 3.5vw, 1.6rem);
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  border-left: 1px solid rgba(255, 215, 120, 0.06);
  border-right: 1px solid rgba(255, 215, 120, 0.06);
}

/* 极光背景 */
.display-screen__aurora {
  position: absolute;
  inset: -20%;
  z-index: 0;
  background:
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(120, 80, 255, 0.18), transparent 70%),
    radial-gradient(ellipse 50% 35% at 20% 60%, rgba(255, 180, 60, 0.1), transparent 65%),
    radial-gradient(ellipse 45% 30% at 80% 75%, rgba(60, 140, 255, 0.08), transparent 60%);
  animation: aurora-shift 12s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes aurora-shift {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-3%) scale(1.05); opacity: 1; }
}

.display-screen__vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.75) 100%);
  pointer-events: none;
}

.display-screen__scanline {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.012) 2px,
    rgba(255, 255, 255, 0.012) 4px
  );
  pointer-events: none;
  animation: scan-drift 8s linear infinite;
}

@keyframes scan-drift {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

.display-screen__meta {
  flex-shrink: 0;
  text-align: center;
  margin-bottom: clamp(0.5rem, 3vw, 1rem);
  position: relative;
  z-index: 3;
}

.display-screen__meta-line {
  width: 2rem;
  height: 1px;
  margin: 0 auto 0.75rem;
  background: linear-gradient(90deg, transparent, #d4a853, transparent);
  animation: line-breathe 3s ease-in-out infinite;
}

@keyframes line-breathe {
  0%, 100% { opacity: 0.4; width: 2rem; }
  50% { opacity: 1; width: 3rem; }
}

.display-screen__title {
  margin: 0;
  font-size: clamp(0.65rem, 3.2vw, 0.95rem);
  color: rgba(212, 168, 83, 0.7);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-weight: 600;
}

.display-screen__artist {
  margin: 0.35rem 0 0;
  font-size: clamp(0.55rem, 2.6vw, 0.8rem);
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.15em;
}

.display-screen__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 3;
  overflow: hidden;
}

.display-screen__lyrics-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.display-screen__empty {
  text-align: center;
  position: relative;
}

.display-screen__empty p {
  margin: 0;
  color: rgba(255, 255, 255, 0.2);
  font-size: clamp(0.75rem, 3.8vw, 1rem);
  letter-spacing: 0.35em;
  animation: empty-pulse 2.5s ease-in-out infinite;
}

@keyframes empty-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

.display-screen__pulse-ring {
  width: clamp(2rem, 10vw, 3.5rem);
  height: clamp(2rem, 10vw, 3.5rem);
  margin: 0 auto 1.2rem;
  border-radius: 50%;
  border: 1px solid rgba(212, 168, 83, 0.3);
  animation: ring-pulse 2s ease-out infinite;
}

@keyframes ring-pulse {
  0% { transform: scale(0.8); opacity: 1; box-shadow: 0 0 0 0 rgba(212, 168, 83, 0.4); }
  100% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 1rem rgba(212, 168, 83, 0); }
}

.display-screen__lyrics {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 5vw, 2rem);
  position: relative;
  min-height: 60%;
}

.display-screen__line {
  margin: 0;
  line-height: 1.45;
  word-break: break-word;
  position: relative;
  width: 100%;
  transition:
    color 0.6s ease,
    opacity 0.6s ease,
    transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 0.6s ease;
}

.display-screen__line-text {
  position: relative;
  z-index: 1;
}

.display-screen__line-text--emerge {
  display: inline-block;
}

.display-screen__char {
  display: inline-block;
  animation: char-emerge 1s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--delay, 0s);
}

.display-screen__char--glow {
  color: #ffe9b0;
  animation: char-emerge-glow 1s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--delay, 0s);
}

@keyframes char-emerge {
  0% {
    opacity: 0;
    transform: translateY(1.8em) scale(0.7);
    filter: blur(10px);
  }
  50% {
    opacity: 0.8;
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes char-emerge-glow {
  0% {
    opacity: 0;
    transform: translateY(1.8em) scale(0.7);
  }
  100% {
    opacity: 0.55;
    transform: translateY(0) scale(1);
  }
}

@keyframes line-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.display-screen__line-glow {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 0;
  text-align: center;
  color: transparent;
  filter: blur(18px);
  opacity: 0.5;
  pointer-events: none;
  line-height: inherit;
  font-size: inherit;
  letter-spacing: inherit;
  font-weight: inherit;
}

.display-screen__line.is-past {
  font-size: clamp(0.8rem, 4.5vw, 1.1rem);
  color: rgba(255, 255, 255, 0.1);
  transform: scale(0.9) translateY(-8px);
  filter: blur(1px);
}

.display-screen__line.is-active {
  font-size: clamp(1.8rem, 13vw, 3.2rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  transform: scale(1);
  padding: clamp(0.5rem, 2vw, 1rem) 0;
  animation: active-line-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.display-screen__line.is-active .display-screen__line-text--emerge {
  background: linear-gradient(
    120deg,
    #fff 0%,
    #ffe9b0 35%,
    #fff 50%,
    #d4a853 65%,
    #fff 100%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  animation:
    line-float 5s ease-in-out 1.2s infinite,
    shimmer 6s linear 1.5s infinite;
}

.display-screen__line.is-active .display-screen__char {
  background: linear-gradient(
    160deg,
    #fff 0%,
    #ffe9b0 40%,
    #d4a853 70%,
    #fff8e0 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

@keyframes active-line-enter {
  0% { opacity: 0; transform: scale(0.92); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}

.display-screen__line.is-next {
  font-size: clamp(0.9rem, 5vw, 1.25rem);
  color: rgba(255, 255, 255, 0.18);
  transform: scale(0.94) translateY(10px);
}

/* TransitionGroup */
.lyric-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.lyric-leave-active {
  transition: all 0.35s ease;
  position: absolute;
  width: 100%;
}
.lyric-enter-from {
  opacity: 0;
  transform: translateY(40px) scale(0.85);
}
.lyric-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.88);
  filter: blur(4px);
}
.lyric-move {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 进度条 */
.display-screen__footer {
  flex-shrink: 0;
  position: relative;
  z-index: 3;
  padding-top: clamp(0.8rem, 3vw, 1.2rem);
}

.display-screen__progress {
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: visible;
  position: relative;
}

.display-screen__progress-bar {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #8b6914, #d4a853, #ffe9b0);
  transition: width 0.1s linear;
}

.display-screen__progress-glow {
  position: absolute;
  top: -3px;
  left: 0;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, transparent, rgba(212, 168, 83, 0.5), transparent);
  filter: blur(4px);
  transition: width 0.1s linear;
  pointer-events: none;
}

.display-screen__progress-dot {
  position: absolute;
  bottom: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffe9b0;
  box-shadow: 0 0 8px 2px rgba(212, 168, 83, 0.8);
  transform: translateX(-50%);
  transition: left 0.1s linear;
}
</style>
