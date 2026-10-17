<template>
  <transition name="fade">
    <div v-if="visible" class="promo-popup" @click.self="close">
      <div class="promo-popup__modal" role="dialog" aria-modal="true" aria-label="Promo Oktober 10%">
        <button class="promo-popup__close" @click="close" aria-label="Tutup">×</button>
        <a href="/promo" @click="close">
          <img
            src="/promo/promo oktober.webp"
            alt="Promo Oktober 10% - Kode OKTOBER10"
            class="promo-popup__img"
            width="1400"
            height="990"
          />
        </a>
        <div class="promo-popup__footer">
          <a href="/promo#klaim" class="promo-popup__btn promo-popup__btn--primary" @click="close">
            Klaim Kode OKTOBER10
          </a>
          <a href="/promo" class="promo-popup__btn" @click="close">Lihat Detail Promo</a>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { promos, isPromoActive } from '../data/promos.js';

// Disembunyikan hanya untuk sesi browser ini (bukan 24 jam),
// supaya popup muncul lagi di kunjungan berikutnya.
const DISMISS_KEY = 'trv_promo_oktober10_dismissed';
// Kunci lama (menyembunyikan 24 jam) dibersihkan agar tidak nyangkut.
const LEGACY_KEY = 'trv_promo_oktober10_hidden_until';
const SHOW_DELAY_MS = 700;

export default {
  name: 'PromoPopup',
  data() {
    return {
      visible: false,
    };
  },
  mounted() {
    // bersihkan kunci lama yang membuat popup hilang 24 jam
    try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* ignore */ }

    if (!this.canShow()) return;

    const reveal = () => {
      if (this._revealed) return;
      this._revealed = true;
      this.visible = true;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', this.onKeydown);
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      // tunda sampai tab benar-benar dilihat, agar tidak "muncul tapi tak terlihat"
      this._onVisibility = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', this._onVisibility);
          this._onVisibility = null;
          this._timer = setTimeout(reveal, SHOW_DELAY_MS);
        }
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
      // jangan tampil di area admin
      if (typeof location !== 'undefined' && /^\/admin(\/|$)/.test(location.pathname)) return false;
      // hanya tampil selama promo Oktober aktif
      const promo = Array.isArray(promos) ? promos[0] : null;
      if (!promo || !isPromoActive(promo)) return false;
      // sudah ditutup di sesi ini?
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === '1') return false;
      } catch (e) { /* ignore */ }
      return true;
    },
    close() {
      this.visible = false;
      this.teardown();
      try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
    },
    onKeydown(e) {
      if (e.key === 'Escape') this.close();
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
      document.removeEventListener('keydown', this.onKeydown);
      document.body.style.overflow = '';
    },
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.promo-popup {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.promo-popup__modal {
  position: relative;
  max-width: 520px;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  background: #000;
}
.promo-popup__close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.promo-popup__img {
  width: 100%;
  height: auto;
  aspect-ratio: 1400 / 990;
  max-height: 82vh;
  display: block;
  object-fit: contain;
  background: #000;
}
.promo-popup__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.9) 100%);
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
}
.promo-popup__btn {
  padding: 10px 16px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.9);
  color: #111;
}
.promo-popup__btn--primary {
  background: linear-gradient(135deg, #5b8def, #7a5ce0);
  color: #fff;
}
@media (max-width: 480px) {
  .promo-popup__img {
    max-height: 64vh;
  }
  .promo-popup__footer {
    position: static;
    background: #000;
  }
}
</style>
