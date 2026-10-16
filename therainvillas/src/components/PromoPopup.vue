<template>
  <transition name="fade">
    <div v-if="visible" class="promo-popup" @click.self="close">
      <div class="promo-popup__modal" role="dialog" aria-modal="true">
        <button class="promo-popup__close" @click="close" aria-label="Tutup">×</button>
        <a href="/promo" @click="close">
          <img src="/promo/promo oktober.PNG" alt="Promo Oktober 10% - Kode OKTOBER10" class="promo-popup__img" />
        </a>
        <div class="promo-popup__footer">
          <a href="/booking?promo=OKTOBER10" class="promo-popup__btn promo-popup__btn--primary" @click="close">
            Gunakan Kode OKTOBER10
          </a>
          <a href="/promo" class="promo-popup__btn" @click="close">Lihat Detail Promo</a>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
const STORAGE_KEY = "trv_promo_oktober10_hidden_until";

export default {
  name: "PromoPopup",
  data() {
    return {
      visible: false,
    };
  },
  mounted() {
    try {
      const until = localStorage.getItem(STORAGE_KEY);
      if (until && Number(until) > Date.now()) {
        return;
      }
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      this.visible = true;
      document.body.style.overflow = "hidden";
    }, 800);
  },
  beforeUnmount() {
    document.body.style.overflow = "";
  },
  methods: {
    close() {
      this.visible = false;
      document.body.style.overflow = "";
      try {
        // Sembunyikan 24 jam
        localStorage.setItem(STORAGE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      } catch (e) {
        // ignore
      }
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
  display: block;
  object-fit: contain;
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
  .promo-popup__footer {
    position: static;
    background: #000;
  }
}
</style>
