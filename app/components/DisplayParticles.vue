<template>
  <canvas ref="canvas" class="particles" aria-hidden="true" />
</template>

<script setup lang="ts">
import type { DisplayTheme } from '#shared/utils/themes'

const props = defineProps<{
  theme: DisplayTheme
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  opacity: number
  hue: number
}

const THEME_HUES: Record<DisplayTheme, [number, number]> = {
  gold: [45, 220],
  aurora: [260, 200],
  rose: [340, 20],
  jade: [160, 120],
  violet: [270, 290],
  amber: [35, 25],
}

let animId = 0
let particles: Particle[] = []

function init(width: number, height: number) {
  const [primary, secondary] = THEME_HUES[props.theme]
  const count = Math.floor((width * height) / 8000)
  particles = Array.from({ length: Math.min(count, 80) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 0.5,
    speedY: -(Math.random() * 0.4 + 0.15),
    speedX: (Math.random() - 0.5) * 0.2,
    opacity: Math.random() * 0.6 + 0.2,
    hue: Math.random() > 0.7 ? primary : secondary,
  }))
}

let cssWidth = 0
let cssHeight = 0

function draw() {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, cssWidth, cssHeight)

  for (const p of particles) {
    p.y += p.speedY
    p.x += p.speedX
    if (p.y < -4) {
      p.y = cssHeight + 4
      p.x = Math.random() * cssWidth
    }

    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
    grad.addColorStop(0, `hsla(${p.hue}, 80%, 75%, ${p.opacity})`)
    grad.addColorStop(1, `hsla(${p.hue}, 80%, 75%, 0)`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  animId = requestAnimationFrame(draw)
}

function resize() {
  const el = canvas.value
  if (!el?.parentElement) return
  const rect = el.parentElement.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  cssWidth = rect.width
  cssHeight = rect.height
  el.width = Math.round(rect.width * dpr)
  el.height = Math.round(rect.height * dpr)
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
  const ctx = el.getContext('2d')
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  init(cssWidth, cssHeight)
}

watch(() => props.theme, () => {
  if (cssWidth && cssHeight) init(cssWidth, cssHeight)
})

onMounted(() => {
  resize()
  draw()
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
</style>
