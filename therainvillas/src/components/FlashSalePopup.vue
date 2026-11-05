<template>
  <transition name="flash-fade">
    <div v-if="visible" class="flash-popup" @click.self="close">
      <div
        ref="modal"
        class="flash-popup__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flash-sale-title"
        aria-describedby="flash-sale-deadline"
      >
        <button
          ref="closeBtn"
          type="button"
          class="flash-popup__close"
          aria-label="Tutup popup Flash Sale 11.11"
          @click="close"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <figure class="flash-popup__hero">
          <picture>
            <source media="(max-width: 560px)" srcset="/promo/11.11-800.webp" />
            <img
              src="/promo/11.11-1200.webp"
              alt="Flash Sale 11.11 November Rain The Rain Villas, live TikTok 10 November"
              class="flash-popup__img"
              width="2000"
              height="1414"
              decoding="async"
            />
          </picture>
          <div class="flash-popup__rain" aria-hidden="true"></div>
        </figure>

        <div class="flash-popup__panel">
          <p class="flash-popup__kicker">
            <span class="flash-popup__dot" aria-hidden="true"></span>
            <span id="flash-sale-title">Flash Sale 11.11 · November Rain</span>
          </p>

          <p class="flash-popup__ends">Berakhir dalam</p>

          <div class="flash-popup__countdown" role="timer" aria-label="Hitung mundur Flash Sale 11.11">
            <div v-for="item in countdownItems" :key="item.label" class="flash-popup__unit">
              <span class="flash-popup__value">{{ item.value }}</span>
              <span class="flash-popup__label">{{ item.label }}</span>
            </div>
          </div>

          <p id="flash-sale-deadline" class="flash-popup__deadline">11 November 2026 · 00.00 WIB</p>

          <div class="flash-popup__actions">
            <a
              :href="waLink"
              target="_blank"
              rel="noopener"
              class="flash-popup__btn flash-popup__btn--primary"
              @click="close"
            >
              Tanya Promo 11.11
            </a>
            <a href="/our-villas/" class="flash-popup__btn" @click="close">Lihat Villa</a>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
// Promo berakhir 11 November 2026 pukul 00.00 WIB.
const DEADLINE = new Date('2026-11-11T00:00:00+07:00');
const DEADLINE_MS = DEADLINE.getTime();
// Disembunyikan hanya untuk sesi browser ini, agar tidak menutupi halaman terus-menerus.
const DISMISS_KEY = 'trv_flashsale_1111_dismissed';
const SHOW_DELAY_MS = 900;

const WA_LINK =
  'https://wa.me/6282125492037?text=' +
  encodeURIComponent('Halo The Rain Villas, saya ingin tanya promo Flash Sale 11.11 November Rain.');

function getRemaining(now = Date.now()) {
  const diff = DEADLINE_MS - now;
  if (diff <= 0) return null;
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export default {
  name: 'FlashSalePopup',
  data() {
    return {
      visible: false,
      remaining: null,
      waLink: WA_LINK,
    };
  },
  computed: {
    countdownItems() {
      const r = this.remaining;
      if (!r) return [];
      const pad = (n) => String(n).padStart(2, '0');
      return [
        { label: 'Hari', value: pad(r.days) },
        { label: 'Jam', value: pad(r.hours) },
        { label: 'Menit', value: pad(r.minutes) },
        { label: 'Detik', value: pad(r.seconds) },
      ];
    },
  },
  mounted() {
    if (!this.canShow()) return;

    this.preloadHero();

    const reveal = () => {
      if (this._revealed) return;
      const remaining = getRemaining();
      if (!remaining) return;

      this._revealed = true;
      this.remaining = remaining;
      this.visible = true;
      this.lockBody();
      this.startCountdown();
      document.addEventListener('keydown', this.onKeydown);

      this._lastFocused = document.activeElement;
      this.$nextTick(() => {
        if (this.$refs.closeBtn) this.$refs.closeBtn.focus({ preventScroll: true });
      });
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this._onVisibility = () => {
        if (document.visibilityState !== 'visible') return;
        document.removeEventListener('visibilitychange', this._onVisibility);
        this._onVisibility = null;
        this._timer = setTimeout(reveal, SHOW_DELAY_MS);
      };
      document.addEventListener('visibilitychange', this._onVisibility);
    } else {
      this._timer = setTimeout(reveal, SHOW_DELAY_MS);
    }
  },
  beforeUnmount() {
    this.teardown();
  },
  methods: {
    canShow() {
      if (typeof location !== 'undefined' && /^\/admin(\/|$)/.test(location.pathname)) return false;
      if (!getRemaining()) return false;
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === '1') return false;
      } catch (e) { /* ignore */ }
      return true;
    },
    preloadHero() {
      try {
        const src = window.matchMedia('(max-width: 560px)').matches
          ? '/promo/11.11-800.webp'
          : '/promo/11.11-1200.webp';
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        this._preloadHero = img;
      } catch (e) { /* ignore */ }
    },
    startCountdown() {
      this.stopCountdown();
      this._interval = setInterval(() => {
        const remaining = getRemaining();
        if (!remaining) {
          this.remaining = null;
          this.close({ remember: false });
          return;
        }
        this.remaining = remaining;
      }, 1000);
    },
    stopCountdown() {
      if (this._interval) {
        clearInterval(this._interval);
        this._interval = null;
      }
    },
    lockBody() {
      if (this._bodyLocked) return;
      this._bodyLocked = true;
      this._prevOverflow = document.body.style.overflow;
      this._prevPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    },
    unlockBody() {
      if (!this._bodyLocked) return;
      this._bodyLocked = false;
      document.body.style.overflow = this._prevOverflow || '';
      document.body.style.paddingRight = this._prevPaddingRight || '';
    },
    close(opts = {}) {
      const remember = !opts || opts.remember !== false;
      this.visible = false;
      this.teardown();
      if (remember) {
        try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
      }
      const last = this._lastFocused;
      this._lastFocused = null;
      if (last && typeof last.focus === 'function' && document.contains(last)) {
        try { last.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      }
    },
    onKeydown(e) {
      if (!this.visible) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }
      if (e.key === 'Tab') this.trapFocus(e);
    },
    trapFocus(e) {
      const root = this.$refs.modal;
      if (!root) return;
      const focusable = root.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    teardown() {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
      if (this._onVisibility) {
        document.removeEventListener('visibilitychange', this._onVisibility);
        this._onVisibility = null;
      }
      this.stopCountdown();
      document.removeEventListener('keydown', this.onKeydown);
      this.unlockBody();
    },
  },
};
</script>

<style scoped>
.flash-fade-enter-active,
.flash-fade-leave-active {
  transition: opacity 0.28s ease;
}
.flash-fade-enter-active .flash-popup__modal {
  transition: transform 0.34s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.flash-fade-enter-from,
.flash-fade-leave-to {
  opacity: 0;
}
.flash-fade-enter-from .flash-popup__modal {
  transform: translateY(18px) scale(0.96);
}

.flash-popup {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(3, 8, 18, 0.74);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.flash-popup__modal {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  overflow: hidden auto;
  border-radius: 24px;
  border: 1px solid rgba(247, 207, 107, 0.32);
  background: #050d19;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  isolation: isolate;
}

.flash-popup__hero {
  position: relative;
  margin: 0;
  overflow: hidden;
  background: #0b1a2e;
}

.flash-popup__img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 2000 / 1414;
  object-fit: cover;
}

.flash-popup__rain {
  position: absolute;
  inset: -30% -18%;
  z-index: 1;
  pointer-events: none;
  opacity: 0.68;
  mix-blend-mode: screen;
  background-image: repeating-linear-gradient(
    104deg,
    transparent 0 11px,
    rgba(166, 214, 255, 0.24) 11px 12px,
    transparent 12px 28px
  );
  background-size: 118px 190px;
  animation: flash-rain 0.62s linear infinite;
}

.flash-popup__rain::before,
.flash-popup__rain::after {
  content: '';
  position: absolute;
  inset: 0;
}

.flash-popup__rain::before {
  background-image: repeating-linear-gradient(
    102deg,
    transparent 0 19px,
    rgba(255, 255, 255, 0.13) 19px 20px,
    transparent 20px 43px
  );
  background-size: 176px 250px;
  animation: flash-rain-slow 0.92s linear infinite;
}

.flash-popup__rain::after {
  background-image: repeating-linear-gradient(
    100deg,
    transparent 0 27px,
    rgba(120, 190, 255, 0.18) 27px 28.5px,
    transparent 28.5px 58px
  );
  background-size: 248px 320px;
  animation: flash-rain-fast 0.42s linear infinite;
}

@keyframes flash-rain {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -110px 190px;
  }
}

@keyframes flash-rain-slow {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -170px 250px;
  }
}

@keyframes flash-rain-fast {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -80px 150px;
  }
}

.flash-popup__panel {
  position: relative;
  z-index: 2;
  padding: 16px 26px 26px;
  text-align: center;
  background:
    radial-gradient(90% 130% at 50% 0%, rgba(56, 130, 190, 0.16) 0%, transparent 62%),
    linear-gradient(180deg, #08111f 0%, #050d19 100%);
}

.flash-popup__close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(6, 14, 26, 0.58);
  color: #dbe8f5;
  cursor: pointer;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.flash-popup__close:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  transform: rotate(90deg);
}
.flash-popup__close:focus-visible {
  outline: 3px solid rgba(247, 207, 107, 0.62);
  outline-offset: 2px;
}

.flash-popup__kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #f7cf6b;
  font-size: 0.69rem;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}
.flash-popup__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #f7cf6b;
  box-shadow: 0 0 0 0 rgba(247, 207, 107, 0.6);
  animation: flash-pulse 1.8s ease-out infinite;
}
@keyframes flash-pulse {
  0% { box-shadow: 0 0 0 0 rgba(247, 207, 107, 0.6); }
  70% { box-shadow: 0 0 0 9px rgba(247, 207, 107, 0); }
  100% { box-shadow: 0 0 0 0 rgba(247, 207, 107, 0); }
}

.flash-popup__ends {
  margin: 12px 0 0;
  color: #e8f2ff;
  font-family: var(--font-display);
  font-size: 1.12rem;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.flash-popup__countdown {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
  margin: 12px 0 0;
}
.flash-popup__unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.03));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
}
.flash-popup__value {
  font-family: var(--font-secondary);
  font-size: clamp(1.45rem, 5vw, 1.9rem);
  font-weight: 700;
  line-height: 1;
  color: #fff6d8;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 18px rgba(247, 207, 107, 0.25);
}
.flash-popup__label {
  font-size: 0.63rem;
  font-weight: 600;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: #8fa6bf;
}

.flash-popup__deadline {
  margin: 10px 0 0;
  color: #8fa6bf;
  font-size: 0.74rem;
  letter-spacing: 0.4px;
}

.flash-popup__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}
.flash-popup__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 11px 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #e6f1fb;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}
.flash-popup__btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.13);
}
.flash-popup__btn--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #ffe7a3 0%, #f7cf6b 45%, #d39a35 100%);
  color: #201403;
  box-shadow: 0 12px 26px rgba(247, 207, 107, 0.22);
}
.flash-popup__btn--primary:hover {
  background: linear-gradient(135deg, #fff0bd 0%, #ffd97a 45%, #e0a93f 100%);
  box-shadow: 0 16px 32px rgba(247, 207, 107, 0.3);
}
.flash-popup__btn:focus-visible {
  outline: 3px solid rgba(247, 207, 107, 0.62);
  outline-offset: 2px;
}

@media (max-width: 520px) {
  .flash-popup {
    padding: 12px;
  }
  .flash-popup__modal {
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
    border-radius: 20px;
  }
  .flash-popup__panel {
    padding: 14px 16px 22px;
  }
  .flash-popup__ends {
    font-size: 1rem;
  }
  .flash-popup__countdown {
    gap: 7px;
  }
  .flash-popup__unit {
    padding: 10px 4px 8px;
    border-radius: 12px;
  }
  .flash-popup__actions {
    flex-direction: column;
  }
  .flash-popup__btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flash-popup__rain,
  .flash-popup__rain::before,
  .flash-popup__rain::after,
  .flash-popup__dot {
    animation: none;
  }
  .flash-fade-enter-active,
  .flash-fade-leave-active,
  .flash-fade-enter-active .flash-popup__modal,
  .flash-popup__close,
  .flash-popup__btn {
    transition: none;
  }
  .flash-popup__close:hover,
  .flash-popup__btn:hover {
    transform: none;
  }
}
</style>
