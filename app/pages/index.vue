<template>
  <div class="home">
    <div class="home__bg" aria-hidden="true" />
    <div class="home__content">
      <p class="home__badge">LRC DISPLAY</p>
      <h1>歌词展示系统</h1>
      <p class="home__desc">1:3 竖屏 · 黑金视觉 · 毕业典礼现场</p>
      <!-- <nav class="home__nav">
        <NuxtLink to="/admin" class="home__card">
          <span class="home__card-icon">⚙</span>
          <span class="home__card-title">管理端</span>
          <span class="home__card-desc">上传 LRC、控制播放</span>
        </NuxtLink>
        <NuxtLink to="/display" class="home__card home__card--highlight">
          <span class="home__card-icon">✦</span>
          <span class="home__card-title">显示端</span>
          <span class="home__card-desc">竖屏歌词展示</span>
        </NuxtLink>
      </nav> -->
    </div>
  </div>
</template>

<style scoped>
.home {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.home__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 50% 40% at 50% 0%, rgba(120, 80, 255, 0.12), transparent),
    radial-gradient(ellipse 40% 30% at 80% 80%, rgba(212, 168, 83, 0.08), transparent),
    #000;
}

.home__content {
  position: relative;
  text-align: center;
  z-index: 1;
}

.home__badge {
  display: inline-block;
  margin: 0 0 1rem;
  padding: 0.3rem 0.8rem;
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  color: rgba(212, 168, 83, 0.7);
  border: 1px solid rgba(212, 168, 83, 0.2);
  border-radius: 2rem;
}

.home h1 {
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, #fff, #d4a853);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.home__desc {
  color: #555;
  margin: 0 0 2.5rem;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.home__nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.home__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 1.6rem 2.2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  min-width: 190px;
  backdrop-filter: blur(12px);
  transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
}

.home__card:hover {
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.home__card--highlight {
  border-color: rgba(212, 168, 83, 0.25);
  background: rgba(212, 168, 83, 0.05);
}

.home__card--highlight:hover {
  border-color: rgba(212, 168, 83, 0.5);
  box-shadow: 0 12px 40px rgba(212, 168, 83, 0.1);
}

.home__card-icon {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
  opacity: 0.6;
}

.home__card-title {
  font-size: 1.1rem;
  font-weight: 500;
}

.home__card-desc {
  font-size: 0.78rem;
  color: #666;
}
</style>
