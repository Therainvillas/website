<template>
  <div class="vs">
    <div class="vs-top">
      <span class="vs-badge">Sorotan</span>
      <span class="vs-hint" aria-hidden="true">Klik untuk lihat</span>
    </div>

    <div class="vs-row" ref="row">
      <button
        v-for="(img, i) in images"
        :key="i"
        type="button"
        class="vs-item"
        :style="{ animationDelay: (i * 0.05) + 's' }"
        @click="openAt(i)"
      >
        <span class="vs-ring">
          <span class="vs-ring__inner">
            <img :src="img" :alt="`${villaName} sorotan ${i + 1}`" loading="lazy" />
          </span>
        </span>
        <span class="vs-item__label">{{ i === 0 ? 'Utama' : 'Foto ' + (i + 1) }}</span>
      </button>
    </div>

    <div
      v-if="open"
      class="vs-story"
      :class="{ 'vs-story--paused': paused }"
      role="dialog"
      aria-modal="true"
      aria-label="Sorotan {{ villaName }}"
      @mouseenter="pause"
      @mouseleave="resume"
    >
      <div class="vs-story__backdrop"></div>

      <div class="vs-story__progress">
        <span v-for="(img, i) in images" :key="i" class="vs-progress">
          <span
            :key="index + '-' + i"
            class="vs-progress__fill"
            :class="i < index ? 'vs-progress__fill--done' : (i === index ? 'vs-progress__fill--active' : '')"
          ></span>
        </span>
      </div>

      <button type="button" class="vs-story__close" aria-label="Tutup" @click="close">&times;</button>

      <div class="vs-story__stage" ref="zone" @click.self="onZone">
        <button v-if="n > 1" type="button" class="vs-story__chev vs-story__chev--prev" aria-label="Sebelumnya" @click.stop="prev">&#8249;</button>
        <div class="vs-story__media" @click="onZone">
          <div class="vs-story__blur" :style="{ backgroundImage: 'url(' + images[index] + ')' }"></div>
          <img :src="images[index]" :alt="`${villaName} foto ${index + 1}`" class="vs-story__img" />
        </div>
        <button v-if="n > 1" type="button" class="vs-story__chev vs-story__chev--next" aria-label="Berikutnya" @click.stop="next">&#8250;</button>
      </div>

      <div class="vs-story__meta">
        <strong>{{ villaName }}</strong>
        <span>Foto {{ index + 1 }} / {{ n }}</span>
      </div>
    </div>
  </div>
</template>

<script>
const STORY_MS = 5000;

export default {
  name: 'VillaSorotan',
  props: {
    images: { type: Array, required: true },
    villaName: { type: String, default: '' },
  },
  data() {
    return { open: false, index: 0, timer: null, paused: false };
  },
  computed: {
    n() {
      return this.images.length || 0;
    },
  },
  watch: {
    open(v) {
      if (v) this.startTimer();
      else {
        this.clearTimer();
        this.paused = false;
      }
    },
  },
  mounted() {
    window.addEventListener('keydown', this.onKey);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKey);
    this.clearTimer();
  },
  // Vue 2 lifecycle fallback (Astro/Vite)
  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey);
    this.clearTimer();
  },
  methods: {
    openAt(i) {
      this.index = (i + this.n) % this.n;
      this.open = true;
    },
    close() {
      this.open = false;
    },
    startTimer() {
      this.clearTimer();
      if (this.n > 1) this.timer = setTimeout(this.next, STORY_MS);
    },
    restartTimer() {
      if (this.paused) return;
      this.startTimer();
    },
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    },
    pause() {
      this.paused = true;
      this.clearTimer();
    },
    resume() {
      this.paused = false;
      this.startTimer();
    },
    next() {
      if (!this.open || this.n < 2) return;
      this.index = (this.index + 1) % this.n;
      this.restartTimer();
    },
    prev() {
      if (!this.open || this.n < 2) return;
      this.index = (this.index - 1 + this.n) % this.n;
      this.restartTimer();
    },
    onZone(e) {
      const el = this.$refs.zone;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (e.clientX - r.left < r.width / 2) this.prev();
      else this.next();
    },
    onKey(e) {
      if (!this.open) return;
      if (e.key === 'Escape') this.close();
      else if (e.key === 'ArrowRight') this.next();
      else if (e.key === 'ArrowLeft') this.prev();
    },
  },
};
</script>

<style>
.vs {
  margin: 0 0 26px;
}
.vs-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.vs-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #7f5f38;
}
.vs-hint {
  font-size: 11px;
  color: rgba(244, 237, 227, 0.5);
}
.vs-row {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.vs-row::-webkit-scrollbar {
  display: none;
}
.vs-item {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transform: translateY(6px);
  animation: vs-in 0.4s ease forwards;
}
@keyframes vs-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.vs-ring {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  padding: 3px;
  background: conic-gradient(
    from 210deg,
    #feda75,
    #fa7e1e,
    #d62976,
    #962fbf,
    #4f5bd5,
    #feda75
  );
  transition: transform 0.18s ease;
}
.vs-item:hover .vs-ring {
  transform: scale(1.08);
}
.vs-ring__inner {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #141519;
  background: #1b1d22;
}
.vs-ring__inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.vs-item__label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(244, 237, 227, 0.85);
  letter-spacing: 0.02em;
}

.vs-story {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  flex-direction: column;
  animation: vs-fade 0.2s ease both;
}
@keyframes vs-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.vs-story__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 8, 10, 0.97);
}
.vs-story__progress {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 5px;
  padding: 16px clamp(10px, 4vw, 30px) 0;
}
.vs-progress {
  flex: 1;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}
.vs-progress__fill {
  display: block;
  height: 100%;
  width: 0;
  border-radius: 999px;
  background: #fff;
}
.vs-progress__fill--done {
  width: 100%;
}
.vs-progress__fill--active {
  animation: vs-fill 5s linear forwards;
}
.vs-story--paused .vs-progress__fill--active {
  animation-play-state: paused;
}
@keyframes vs-fill {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
.vs-story__close {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 4;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease;
}
.vs-story__close:hover {
  background: rgba(255, 255, 255, 0.22);
}
.vs-story__stage {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 0;
  padding: 0 clamp(12px, 5vw, 60px);
}
.vs-story__media {
  position: relative;
  max-width: 94vw;
  max-height: 82vh;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}
.vs-story__blur {
  position: absolute;
  inset: -40px;
  background-size: cover;
  background-position: center;
  filter: blur(34px) saturate(1.2);
  opacity: 0.35;
}
.vs-story__img {
  position: relative;
  display: block;
  max-width: 92vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 6px;
}
.vs-story__chev {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 30px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
  opacity: 0.95;
}
.vs-story__chev:hover {
  background: rgba(255, 255, 255, 0.24);
  transform: scale(1.08);
}
.vs-story__meta {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 12px 16px 18px;
  color: #fff;
  font-size: 12px;
}
.vs-story__meta strong {
  font-size: 14px;
  letter-spacing: 0.01em;
}
.vs-story__meta span {
  opacity: 0.65;
}

@media (max-width: 640px) {
  .vs-story__chev {
    display: none;
  }
  .vs-ring {
    width: 66px;
    height: 66px;
  }
  .vs-item__label {
    font-size: 10px;
  }
}
</style>