<template>
  <div class="display-root">
    <Transition name="image-reveal" mode="out-in">
      <div
        :key="showImage ? activeImageUrl : 'lyrics'"
        class="display-screen"
        :class="{ 'display-screen--image': showImage }"
        :data-theme="theme"
        :style="{ '--font-scale': fontScaleRatio }"
      >
        <template v-if="showImage">
          <div
            class="display-screen__image"
            :style="{ backgroundImage: `url(${activeImageUrl})` }"
            role="img"
          />
        </template>

        <template v-else>
          <DisplayParticles :theme="theme" />

          <div class="display-screen__aurora" aria-hidden="true" />
          <div class="display-screen__stage-light display-screen__stage-light--left" aria-hidden="true" />
          <div class="display-screen__stage-light display-screen__stage-light--right" aria-hidden="true" />
          <div class="display-screen__led-grid" aria-hidden="true" />
          <div class="display-screen__light-rig display-screen__light-rig--top" aria-hidden="true" />
          <div class="display-screen__light-rig display-screen__light-rig--bottom" aria-hidden="true" />
          <div class="display-screen__vignette" aria-hidden="true" />
          <div class="display-screen__scanline" aria-hidden="true" />

          <div class="display-screen__body">
            <div v-if="lines.length || hasIntroMeta" class="display-screen__lyrics-wrap">
              <Transition name="lyric" mode="out-in">
                <div v-if="showIntro" key="intro" class="display-screen__intro">
                  <div class="display-screen__intro-line" aria-hidden="true" />
                  <p v-if="meta.title" class="display-screen__intro-title">{{ meta.title }}</p>
                  <p v-if="meta.artist" class="display-screen__intro-artist">{{ meta.artist }}</p>
                </div>

                <TransitionGroup
                  v-else
                  key="lyrics"
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
              </Transition>
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

const { meta, lines, isPlaying, currentTime, displayMode, imageUrl, pendingImages, theme, fontScale } = usePlaybackSync()

const fontScaleRatio = computed(() => fontScale.value / 100)
const activeIndex = computed(() => findActiveLineIndex(lines.value, currentTime.value))
const hasIntroMeta = computed(() => !!(meta.value.title || meta.value.artist))
const activeImageUrl = computed(() => imageUrl.value || pendingImages.value[0] || '')
const showExplicitImage = computed(() => displayMode.value === 'image' && !!activeImageUrl.value)
const showMetaOnly = computed(() => lines.value.length === 0 && hasIntroMeta.value && !showExplicitImage.value)
const showImage = computed(() =>
  showExplicitImage.value
  || (!isPlaying.value && !showMetaOnly.value && !!activeImageUrl.value),
)
const showIntro = computed(() =>
  !showImage.value
  && activeIndex.value < 0
  && hasIntroMeta.value,
)
const showProgress = computed(() => !showImage.value && lines.value.length > 0)

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

  if (idx < 0) return []

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
  background:
    radial-gradient(circle at 50% 8%, rgba(255, 255, 255, 0.08), transparent 22rem),
    radial-gradient(circle at 50% 100%, rgba(212, 168, 83, 0.12), transparent 20rem),
    #000;
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
  --font-scale: 1;
  --bg-screen: #030308;
  --border: rgba(255, 215, 120, 0.06);
  --accent: #d4a853;
  --accent-light: #ffe9b0;
  --accent-soft: #fff8e0;
  --accent-dark: #8b6914;
  --text-muted: rgba(255, 255, 255, 0.45);
  --text-subtle: rgba(255, 255, 255, 0.18);
  --text-faint: rgba(255, 255, 255, 0.1);
  --text-empty: rgba(255, 255, 255, 0.2);
  --aurora-1: rgba(120, 80, 255, 0.18);
  --aurora-2: rgba(255, 180, 60, 0.1);
  --aurora-3: rgba(60, 140, 255, 0.08);
  --gradient-intro: linear-gradient(160deg, #fff 0%, #ffe9b0 40%, #d4a853 70%, #fff8e0 100%);
  --gradient-active: linear-gradient(160deg, #fff 0%, #ffe9b0 40%, #d4a853 70%, #fff8e0 100%);
  --gradient-shimmer: linear-gradient(120deg, #fff 0%, #ffe9b0 35%, #fff 50%, #d4a853 65%, #fff 100%);
  --gradient-progress: linear-gradient(90deg, #8b6914, #d4a853, #ffe9b0);
  --stage-glow: rgba(212, 168, 83, 0.34);
  --stage-beam: rgba(255, 233, 176, 0.16);
  --progress-glow: rgba(212, 168, 83, 0.5);
  --progress-dot-shadow: rgba(212, 168, 83, 0.8);
  --ring-border: rgba(212, 168, 83, 0.3);
  --ring-shadow: rgba(212, 168, 83, 0.4);

  width: min(100vw, calc(100dvh / 3));
  aspect-ratio: 1 / 3;
  background:
    radial-gradient(ellipse 70% 34% at 50% 102%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 72%),
    radial-gradient(ellipse 80% 26% at 50% 0%, rgba(255, 255, 255, 0.08), transparent 64%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 14%, transparent 82%, rgba(255, 255, 255, 0.03)),
    var(--bg-screen);
  display: flex;
  flex-direction: column;
  padding: clamp(1.2rem, 5vw, 2.2rem) clamp(0.8rem, 3.5vw, 1.6rem);
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  border-left: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.025),
    inset 0 0 80px rgba(0, 0, 0, 0.45),
    0 0 48px color-mix(in srgb, var(--accent) 18%, transparent);
  transition: background 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease;
}

.display-screen[data-theme="aurora"] {
  --bg-screen: #050510;
  --border: rgba(124, 155, 255, 0.1);
  --accent: #7c9bff;
  --accent-light: #c4d4ff;
  --accent-soft: #e8eeff;
  --accent-dark: #4a6fd4;
  --aurora-1: rgba(124, 155, 255, 0.22);
  --aurora-2: rgba(80, 220, 255, 0.12);
  --aurora-3: rgba(180, 120, 255, 0.1);
  --gradient-intro: linear-gradient(160deg, #fff 0%, #c4d4ff 40%, #7c9bff 70%, #e8eeff 100%);
  --gradient-active: linear-gradient(160deg, #fff 0%, #c4d4ff 40%, #7c9bff 70%, #e8eeff 100%);
  --gradient-shimmer: linear-gradient(120deg, #fff 0%, #c4d4ff 35%, #fff 50%, #7c9bff 65%, #fff 100%);
  --gradient-progress: linear-gradient(90deg, #4a6fd4, #7c9bff, #c4d4ff);
  --stage-glow: rgba(124, 155, 255, 0.35);
  --stage-beam: rgba(196, 212, 255, 0.16);
  --progress-glow: rgba(124, 155, 255, 0.5);
  --progress-dot-shadow: rgba(124, 155, 255, 0.8);
  --ring-border: rgba(124, 155, 255, 0.35);
  --ring-shadow: rgba(124, 155, 255, 0.4);
}

.display-screen[data-theme="rose"] {
  --bg-screen: #100508;
  --border: rgba(255, 122, 154, 0.1);
  --accent: #ff7a9a;
  --accent-light: #ffc4d4;
  --accent-soft: #ffe8ef;
  --accent-dark: #c44a6a;
  --aurora-1: rgba(255, 100, 140, 0.2);
  --aurora-2: rgba(255, 160, 120, 0.12);
  --aurora-3: rgba(200, 80, 120, 0.1);
  --gradient-intro: linear-gradient(160deg, #fff 0%, #ffc4d4 40%, #ff7a9a 70%, #ffe8ef 100%);
  --gradient-active: linear-gradient(160deg, #fff 0%, #ffc4d4 40%, #ff7a9a 70%, #ffe8ef 100%);
  --gradient-shimmer: linear-gradient(120deg, #fff 0%, #ffc4d4 35%, #fff 50%, #ff7a9a 65%, #fff 100%);
  --gradient-progress: linear-gradient(90deg, #c44a6a, #ff7a9a, #ffc4d4);
  --stage-glow: rgba(255, 122, 154, 0.34);
  --stage-beam: rgba(255, 196, 212, 0.16);
  --progress-glow: rgba(255, 122, 154, 0.5);
  --progress-dot-shadow: rgba(255, 122, 154, 0.8);
  --ring-border: rgba(255, 122, 154, 0.35);
  --ring-shadow: rgba(255, 122, 154, 0.4);
}

.display-screen[data-theme="jade"] {
  --bg-screen: #030a08;
  --border: rgba(95, 212, 168, 0.1);
  --accent: #5fd4a8;
  --accent-light: #b8f0d8;
  --accent-soft: #e0faf0;
  --accent-dark: #2a9a72;
  --aurora-1: rgba(60, 200, 160, 0.18);
  --aurora-2: rgba(120, 220, 180, 0.12);
  --aurora-3: rgba(40, 160, 140, 0.1);
  --gradient-intro: linear-gradient(160deg, #fff 0%, #b8f0d8 40%, #5fd4a8 70%, #e0faf0 100%);
  --gradient-active: linear-gradient(160deg, #fff 0%, #b8f0d8 40%, #5fd4a8 70%, #e0faf0 100%);
  --gradient-shimmer: linear-gradient(120deg, #fff 0%, #b8f0d8 35%, #fff 50%, #5fd4a8 65%, #fff 100%);
  --gradient-progress: linear-gradient(90deg, #2a9a72, #5fd4a8, #b8f0d8);
  --stage-glow: rgba(95, 212, 168, 0.32);
  --stage-beam: rgba(184, 240, 216, 0.15);
  --progress-glow: rgba(95, 212, 168, 0.5);
  --progress-dot-shadow: rgba(95, 212, 168, 0.8);
  --ring-border: rgba(95, 212, 168, 0.35);
  --ring-shadow: rgba(95, 212, 168, 0.4);
}

.display-screen[data-theme="violet"] {
  --bg-screen: #080510;
  --border: rgba(167, 139, 255, 0.1);
  --accent: #a78bff;
  --accent-light: #d4c4ff;
  --accent-soft: #f0ebff;
  --accent-dark: #7050c4;
  --aurora-1: rgba(167, 139, 255, 0.22);
  --aurora-2: rgba(220, 120, 255, 0.12);
  --aurora-3: rgba(120, 80, 200, 0.1);
  --gradient-intro: linear-gradient(160deg, #fff 0%, #d4c4ff 40%, #a78bff 70%, #f0ebff 100%);
  --gradient-active: linear-gradient(160deg, #fff 0%, #d4c4ff 40%, #a78bff 70%, #f0ebff 100%);
  --gradient-shimmer: linear-gradient(120deg, #fff 0%, #d4c4ff 35%, #fff 50%, #a78bff 65%, #fff 100%);
  --gradient-progress: linear-gradient(90deg, #7050c4, #a78bff, #d4c4ff);
  --stage-glow: rgba(167, 139, 255, 0.34);
  --stage-beam: rgba(212, 196, 255, 0.16);
  --progress-glow: rgba(167, 139, 255, 0.5);
  --progress-dot-shadow: rgba(167, 139, 255, 0.8);
  --ring-border: rgba(167, 139, 255, 0.35);
  --ring-shadow: rgba(167, 139, 255, 0.4);
}

.display-screen[data-theme="amber"] {
  --bg-screen: #0a0703;
  --border: rgba(255, 176, 74, 0.1);
  --accent: #ffb04a;
  --accent-light: #ffe0a8;
  --accent-soft: #fff4e0;
  --accent-dark: #c47a20;
  --aurora-1: rgba(255, 160, 60, 0.2);
  --aurora-2: rgba(255, 200, 100, 0.14);
  --aurora-3: rgba(200, 120, 40, 0.1);
  --gradient-intro: linear-gradient(160deg, #fff 0%, #ffe0a8 40%, #ffb04a 70%, #fff4e0 100%);
  --gradient-active: linear-gradient(160deg, #fff 0%, #ffe0a8 40%, #ffb04a 70%, #fff4e0 100%);
  --gradient-shimmer: linear-gradient(120deg, #fff 0%, #ffe0a8 35%, #fff 50%, #ffb04a 65%, #fff 100%);
  --gradient-progress: linear-gradient(90deg, #c47a20, #ffb04a, #ffe0a8);
  --stage-glow: rgba(255, 176, 74, 0.34);
  --stage-beam: rgba(255, 224, 168, 0.16);
  --progress-glow: rgba(255, 176, 74, 0.5);
  --progress-dot-shadow: rgba(255, 176, 74, 0.8);
  --ring-border: rgba(255, 176, 74, 0.35);
  --ring-shadow: rgba(255, 176, 74, 0.4);
}

/* 极光背景 */
.display-screen__aurora {
  position: absolute;
  inset: -20%;
  z-index: 0;
  background:
    radial-gradient(ellipse 62% 34% at 50% 2%, var(--aurora-1), transparent 70%),
    radial-gradient(ellipse 50% 35% at 12% 62%, var(--aurora-2), transparent 68%),
    radial-gradient(ellipse 45% 30% at 88% 72%, var(--aurora-3), transparent 62%);
  filter: saturate(1.2);
  animation: aurora-shift 10s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes aurora-shift {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-3%) scale(1.05); opacity: 1; }
}

.display-screen__stage-light {
  position: absolute;
  top: -8%;
  width: 34%;
  height: 72%;
  z-index: 1;
  opacity: 0.72;
  background: linear-gradient(180deg, var(--stage-beam), transparent 78%);
  filter: blur(2px);
  mix-blend-mode: screen;
  pointer-events: none;
  transform-origin: top center;
  animation: stage-sweep 5.8s ease-in-out infinite alternate;
}

.display-screen__stage-light--left {
  left: 6%;
  clip-path: polygon(38% 0, 64% 0, 100% 100%, 0 100%);
  transform: rotate(-18deg);
}

.display-screen__stage-light--right {
  right: 6%;
  clip-path: polygon(36% 0, 62% 0, 100% 100%, 0 100%);
  transform: rotate(18deg);
  animation-delay: -2.2s;
}

@keyframes stage-sweep {
  0% { opacity: 0.28; filter: blur(4px); }
  45% { opacity: 0.76; filter: blur(1px); }
  100% { opacity: 0.42; filter: blur(3px); }
}

.display-screen__led-grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.2;
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.16) 0 1px, transparent 1.6px),
    linear-gradient(90deg, transparent 0 48%, color-mix(in srgb, var(--accent) 16%, transparent) 49% 51%, transparent 52% 100%);
  background-size: 10px 10px, 44px 100%;
  mask-image: linear-gradient(180deg, transparent 0%, #000 12%, #000 84%, transparent 100%);
  pointer-events: none;
  animation: led-breathe 3.5s ease-in-out infinite;
}

@keyframes led-breathe {
  0%, 100% { opacity: 0.12; }
  50% { opacity: 0.28; }
}

.display-screen__light-rig {
  position: absolute;
  left: 8%;
  right: 8%;
  z-index: 3;
  height: 2px;
  background:
    radial-gradient(circle at 8% 50%, var(--accent-light) 0 2px, transparent 3px),
    radial-gradient(circle at 25% 50%, var(--accent) 0 2px, transparent 3px),
    radial-gradient(circle at 42% 50%, var(--accent-light) 0 2px, transparent 3px),
    radial-gradient(circle at 58% 50%, var(--accent) 0 2px, transparent 3px),
    radial-gradient(circle at 75% 50%, var(--accent-light) 0 2px, transparent 3px),
    radial-gradient(circle at 92% 50%, var(--accent) 0 2px, transparent 3px),
    linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 35%, transparent), transparent);
  box-shadow: 0 0 16px var(--stage-glow);
  opacity: 0.72;
  pointer-events: none;
}

.display-screen__light-rig--top {
  top: clamp(0.75rem, 3vw, 1.25rem);
}

.display-screen__light-rig--bottom {
  bottom: clamp(1.8rem, 6vw, 2.8rem);
  opacity: 0.46;
}

.display-screen__vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(ellipse 72% 58% at 50% 48%, transparent 22%, rgba(0, 0, 0, 0.46) 68%, rgba(0, 0, 0, 0.82) 100%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.5), transparent 18%, transparent 82%, rgba(0, 0, 0, 0.5));
  pointer-events: none;
}

.display-screen__scanline {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(255, 255, 255, 0.022) 3px,
    rgba(255, 255, 255, 0.022) 5px
  );
  mix-blend-mode: screen;
  opacity: 0.65;
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
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  animation: line-breathe 3s ease-in-out infinite;
}

@keyframes line-breathe {
  0%, 100% { opacity: 0.4; width: 2rem; }
  50% { opacity: 1; width: 3rem; }
}

.display-screen__title {
  margin: 0;
  font-size: clamp(0.65rem, 3.2vw, 0.95rem);
  color: color-mix(in srgb, var(--accent) 70%, transparent);
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
  z-index: 4;
  overflow: hidden;
}

.display-screen__lyrics-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.display-screen__intro {
  width: 100%;
  min-height: 62dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.9rem, 5vw, 1.8rem);
  text-align: center;
  padding: clamp(0.8rem, 4vw, 1.4rem) 0;
  animation: intro-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.display-screen__intro-line {
  width: 2px;
  height: clamp(4rem, 28vw, 8rem);
  margin: 0;
  background: linear-gradient(180deg, transparent, var(--accent), transparent);
  box-shadow: 0 0 16px var(--stage-glow);
  animation: vertical-line-breathe 2.2s ease-in-out infinite;
}

@keyframes vertical-line-breathe {
  0%, 100% { opacity: 0.45; height: clamp(4rem, 28vw, 8rem); }
  50% { opacity: 1; height: clamp(5rem, 36vw, 10rem); }
}

.display-screen__intro-title {
  margin: 0;
  font-size: clamp(calc(1.75rem * var(--font-scale)), calc(12vw * var(--font-scale)), calc(3rem * var(--font-scale)));
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.25;
  writing-mode: vertical-rl;
  text-orientation: upright;
  background: var(--gradient-intro);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0 0 26px var(--stage-glow);
}

.display-screen__intro-artist {
  margin: 0;
  font-size: clamp(calc(0.85rem * var(--font-scale)), calc(5vw * var(--font-scale)), calc(1.2rem * var(--font-scale)));
  color: color-mix(in srgb, var(--accent-light) 76%, rgba(255, 255, 255, 0.45));
  letter-spacing: 0.18em;
  writing-mode: vertical-rl;
  text-orientation: upright;
  text-shadow: 0 0 18px var(--stage-glow);
}

@keyframes intro-enter {
  0% {
    opacity: 0;
    transform: translateY(24px) scale(0.94);
    filter: blur(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.display-screen__empty {
  text-align: center;
  position: relative;
}

.display-screen__empty p {
  margin: 0;
  color: var(--text-empty);
  font-size: clamp(calc(0.75rem * var(--font-scale)), calc(3.8vw * var(--font-scale)), calc(1rem * var(--font-scale)));
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
  border: 1px solid var(--ring-border);
  animation: ring-pulse 2s ease-out infinite;
}

@keyframes ring-pulse {
  0% { transform: scale(0.8); opacity: 1; box-shadow: 0 0 0 0 var(--ring-shadow); }
  100% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 1rem transparent; }
}

.display-screen__lyrics {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: clamp(0.55rem, 3.2vw, 1.15rem);
  position: relative;
  min-height: 72dvh;
}

.display-screen__line {
  margin: 0;
  line-height: 1.22;
  word-break: break-word;
  position: relative;
  width: auto;
  min-height: 42dvh;
  max-height: 74dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: upright;
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
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.display-screen__char {
  display: inline-block;
  animation: char-emerge 1s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--delay, 0s);
}

.display-screen__char--glow {
  color: var(--accent-light);
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
  inset: 0;
  z-index: 0;
  text-align: center;
  color: transparent;
  filter: blur(20px);
  opacity: 0.72;
  pointer-events: none;
  line-height: inherit;
  font-size: inherit;
  letter-spacing: inherit;
  font-weight: inherit;
}

.display-screen__line.is-past {
  font-size: clamp(calc(0.82rem * var(--font-scale)), calc(4.8vw * var(--font-scale)), calc(1.2rem * var(--font-scale)));
  color: color-mix(in srgb, var(--accent-light) 30%, transparent);
  transform: scale(0.9) translateX(8px);
  filter: blur(0.8px);
  opacity: 0.42;
}

.display-screen__line.is-active {
  font-size: clamp(calc(2rem * var(--font-scale)), calc(14.5vw * var(--font-scale)), calc(3.65rem * var(--font-scale)));
  font-weight: 700;
  letter-spacing: 0.08em;
  transform: scale(1);
  padding: 0 clamp(0.45rem, 2vw, 0.9rem);
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.46),
    0 0 24px var(--stage-glow),
    0 0 52px color-mix(in srgb, var(--accent) 32%, transparent);
  animation: active-line-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.display-screen__line.is-active .display-screen__line-text--emerge {
  background: var(--gradient-shimmer);
  background-size: 220% auto;
  background-clip: text;
  -webkit-background-clip: text;
  filter: drop-shadow(0 0 14px var(--stage-glow));
  animation:
    line-float 4.2s ease-in-out 1s infinite,
    shimmer 4.8s linear 1.1s infinite;
}

.display-screen__line.is-active .display-screen__char {
  background: var(--gradient-active);
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
  font-size: clamp(calc(0.9rem * var(--font-scale)), calc(5.2vw * var(--font-scale)), calc(1.32rem * var(--font-scale)));
  color: color-mix(in srgb, var(--accent-light) 36%, transparent);
  transform: scale(0.92) translateX(-8px);
  opacity: 0.5;
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
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: visible;
  position: relative;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.7);
}

.display-screen__progress-bar {
  height: 100%;
  border-radius: 999px;
  background: var(--gradient-progress);
  box-shadow: 0 0 16px var(--progress-glow);
  transition: width 0.1s linear;
}

.display-screen__progress-glow {
  position: absolute;
  top: -3px;
  left: 0;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, transparent, var(--progress-glow), transparent);
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
  background: var(--accent-light);
  box-shadow: 0 0 8px 2px var(--progress-dot-shadow);
  transform: translateX(-50%);
  transition: left 0.1s linear;
}
</style>
