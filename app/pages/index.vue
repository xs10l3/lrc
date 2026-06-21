<template>
  <div class="home">
    <div class="home__bg" aria-hidden="true" />
    <div class="home__content">
      <p class="home__badge">GRADUATION 2026</p>
      <h1>愿此去繁花似锦</h1>
      <p class="home__desc">致每一位奔赴山海的高三毕业生</p>
      <div class="home__blessing">
        <p>愿你们带着今日的光，走向更辽阔的天地。</p>
        <p>高考不是终点，而是青春写给未来的一封热烈回信。</p>
        <p>祝前程滚烫，梦想有声，下一程依然闪闪发亮。</p>
      </div>
      <NuxtLink to="/display" class="home__button">
        查看歌词
      </NuxtLink>
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
  margin: 0 0 1.4rem;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.home__blessing {
  max-width: 520px;
  margin: 0 auto 2.4rem;
  color: rgba(255, 255, 255, 0.64);
  font-size: 0.95rem;
  line-height: 1.9;
}

.home__blessing p {
  margin: 0.25rem 0;
}

.home__nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.home__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 9rem;
  min-height: 2.75rem;
  padding: 0 1.4rem;
  border: 1px solid rgba(212, 168, 83, 0.35);
  border-radius: 6px;
  background: linear-gradient(135deg, #d4a853, #ffe9b0);
  color: #1a1000;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.home__button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 30px rgba(212, 168, 83, 0.18);
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
