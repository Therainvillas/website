<template>
  <section class="claim" id="klaim">
    <header class="claim__head">
      <span class="claim__badge">Klaim di Halaman Ini</span>
      <h3>Cara Klaim Kode Promo Oktober</h3>
      <p>Ikuti 3 langkah berikut. Setelah bukti terkirim, kode promo muncul <strong>secara acak</strong> dan hanya <strong>berlaku 2 menit</strong>.</p>
    </header>

    <div class="claim__villa">
      <label for="claim-villa">Pilih villa yang akan dipesan <span class="claim__req">*</span></label>
      <select id="claim-villa" v-model="villaSlug">
        <option value="">— Pilih villa —</option>
        <option v-for="v in eligibleVillas" :key="v.id" :value="v.slug">
          {{ v.name }} — {{ v.priceLabel.replace('/malam', '') }} (harga awal Rp {{ formatRupiah(v.originalPrice) }})
        </option>
      </select>
      <p class="claim__villa-note">Kode promo hanya berlaku untuk villa dengan harga promo (harga awal dicoret). Villa tanpa harga coret tidak bisa klaim kode.</p>
    </div>

    <div class="claim__grid">
      <div class="claim__step" :class="{ 'is-done': rated }">
        <span class="claim__num">1</span>
        <strong>Beri rating di Google Maps</strong>
        <p>Buka Google Maps The Rain Villas, lalu berikan rating untuk villa kami.</p>
        <a :href="mapsUrl" target="_blank" rel="noopener" class="claim__btn claim__btn--maps">★ Rating di Google Maps</a>
        <label class="claim__check">
          <input type="checkbox" v-model="rated" />
          <span>Saya sudah memberi rating</span>
        </label>
      </div>

      <div class="claim__step" :class="{ 'is-done': !!dataUrl }">
        <span class="claim__num">2</span>
        <strong>Upload screenshot bukti rating</strong>
        <p>Pilih foto dari galeri (JPEG / PNG). Foto dikompres otomatis sebelum dikirim.</p>
        <input ref="input" type="file" accept="image/*" class="claim__file" @change="onFile" />
        <button type="button" class="claim__btn claim__btn--ghost" @click="pick">📷 Pilih Foto</button>
        <img
          v-if="preview"
          :src="preview"
          alt="Pratinjau bukti rating"
          class="claim__preview"
          title="Klik untuk memperbesar"
          @click="zoom = true"
        />
      </div>

      <div class="claim__step" :class="{ 'is-done': !!code }">
        <span class="claim__num">3</span>
        <strong>Kirim bukti &amp; dapatkan kode</strong>
        <p>Bukti dikirim ke admin, lalu kode promo dibuka secara acak selama 2 menit.</p>
        <button
          type="button"
          class="claim__btn claim__btn--primary"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ sending ? 'Mengirim bukti…' : 'Kirim Bukti & Dapatkan Kode' }}
        </button>
      </div>
    </div>

    <p v-if="status" class="claim__status" :class="statusType" role="status">{{ status }}</p>

    <div v-if="code" class="claim__codebox">
      <span class="claim__code-label">✅ Kode promo Anda — sisa waktu <strong>{{ mmss }}</strong></span>
      <div class="claim__code-value">{{ code }}</div>
      <div class="claim__code-actions">
        <button type="button" class="claim__btn claim__btn--ghost" @click="copy">Salin Kode</button>
        <a :href="bookingHref" class="claim__btn claim__btn--primary">Booking &amp; Pakai Kode</a>
      </div>
      <p class="claim__code-note">Kode terpakai otomatis di formulir booking. Jika waktu habis, kode hangus — upload bukti lagi untuk kode baru.</p>
    </div>

    <div v-if="zoom && preview" class="claim__lightbox" @click.self="zoom = false">
      <img :src="preview" alt="Bukti rating" />
      <button type="button" class="claim__lightbox-close" aria-label="Tutup" @click="zoom = false">&times;</button>
    </div>
  </section>
</template>

<script>
import { MAPS_RATING_URL, PROOF_API, promos, isVillaPromoEligible } from '../data/promos.js';
import { villas } from '../data/villas.js';

const CLAIM_KEY = 'trv_promo_claimed';
const CLAIM_TTL_MS = 2 * 60 * 1000; // kode berlaku 2 menit
const PROMO_CODE = (promos[0] && promos[0].code) || 'OKTOBER10';

export default {
  name: 'PromoClaim',
  data() {
    return {
      mapsUrl: MAPS_RATING_URL,
      rated: false,
      fileName: '',
      dataUrl: '',
      preview: '',
      sending: false,
      status: '',
      statusType: '',
      code: '',
      villaSlug: '',
      claimTs: 0,
      remain: 0,
      zoom: false,
      timer: null,
    };
  },
  computed: {
    eligibleVillas() {
      return villas.filter((v) => isVillaPromoEligible(v));
    },
    selectedVilla() {
      return this.eligibleVillas.find((v) => v.slug === this.villaSlug) || null;
    },
    canSubmit() {
      return !!this.selectedVilla && this.rated && !!this.dataUrl && !this.sending && !this.code;
    },
    mmss() {
      const m = Math.floor(this.remain / 60);
      const s = String(this.remain % 60).padStart(2, '0');
      return `${m}:${s}`;
    },
    bookingHref() {
      if (!this.code) return '/booking';
      const params = new URLSearchParams({ promo: this.code });
      if (this.selectedVilla) params.set('villa', this.selectedVilla.name);
      return `/booking?${params.toString()}`;
    },
  },
  mounted() {
    this.readVillaFromQuery();
    this.restore();
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  methods: {
    formatRupiah(n) {
      return (Number(n) || 0).toLocaleString('id-ID');
    },
    readVillaFromQuery() {
      let slug = '';
      try {
        slug = new URLSearchParams(window.location.search).get('villa') || '';
      } catch (e) { /* ignore */ }
      if (!slug) return;
      const eligible = this.eligibleVillas.find((v) => v.slug === slug);
      if (eligible) {
        this.villaSlug = eligible.slug;
        return;
      }
      const any = villas.find((v) => v.slug === slug);
      if (any) {
        this.setStatus(`${any.name} tidak punya harga promo (harga coret), jadi tidak bisa klaim kode promo.`, 'err');
      }
    },
    // ---------- penyimpanan klaim (sinkron dengan BookingForm) ----------
    readClaims() {
      let claims = {};
      try {
        const stored = JSON.parse(localStorage.getItem(CLAIM_KEY) || '{}');
        if (stored && typeof stored === 'object') claims = stored;
      } catch (e) { /* ignore */ }
      try {
        const cm = document.cookie.match(/(?:^|;\s*)trv_promo_claimed=([^;]*)/);
        if (cm) {
          const ck = JSON.parse(decodeURIComponent(cm[1]));
          if (ck && typeof ck === 'object') Object.assign(claims, ck);
        }
      } catch (e) { /* ignore */ }
      return claims;
    },
    saveClaims(claims) {
      try { localStorage.setItem(CLAIM_KEY, JSON.stringify(claims)); } catch (e) { /* ignore */ }
      try {
        document.cookie = 'trv_promo_claimed=' + encodeURIComponent(JSON.stringify(claims)) +
          '; path=/; max-age=2592000; SameSite=Lax';
      } catch (e) { /* ignore */ }
    },
    restore() {
      const claims = this.readClaims();
      let best = null;
      Object.keys(claims).forEach((k) => {
        const v = claims[k];
        if (v && typeof v === 'object' && typeof v.ts === 'number' && v.promo === PROMO_CODE) {
          if (!best || v.ts > best.ts) best = { key: k, ts: v.ts };
        }
      });
      if (!best) return;
      if (Date.now() - best.ts <= CLAIM_TTL_MS) {
        this.code = best.key;
        this.claimTs = best.ts;
        this.rated = true;
        this.setStatus('Kode dari klaim sebelumnya masih berlaku — segera gunakan.', 'ok');
        this.startTick();
      } else {
        delete claims[best.key];
        this.saveClaims(claims);
      }
    },
    // ---------- langkah 2: foto ----------
    pick() {
      if (this.$refs.input) this.$refs.input.click();
    },
    onFile(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.type && !/^image\//.test(file.type)) {
        this.setStatus('Format harus gambar (JPEG / PNG). Pilih ulang bukti screenshot Anda.', 'err');
        e.target.value = '';
        return;
      }
      this.processFile(file)
        .then((dataUrl) => {
          this.fileName = file.name || 'bukti-rating.jpg';
          this.dataUrl = dataUrl;
          this.preview = dataUrl;
          this.setStatus('Foto siap dikirim. Klik "Kirim Bukti & Dapatkan Kode".', 'wait');
        })
        .catch((err) => {
          this.dataUrl = '';
          this.preview = '';
          this.setStatus(err.message || 'Foto tidak terbaca. Pilih ulang dari galeri.', 'err');
        })
        .finally(() => {
          e.target.value = '';
        });
    },
    processFile(file) {
      return new Promise((resolve, reject) => {
        if (file.type && !/^image\//.test(file.type)) {
          reject(new Error('Format harus gambar (JPEG / PNG).'));
          return;
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('File tidak terbaca. Pilih ulang dari galeri.'));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error('Gambar tidak valid. Pilih screenshot lain.'));
          img.onload = () => {
            try {
              const max = 1600;
              let w = img.naturalWidth || img.width;
              let h = img.naturalHeight || img.height;
              if (w > max || h > max) {
                const r = Math.min(max / w, max / h);
                w = Math.round(w * r);
                h = Math.round(h * r);
              }
              const cv = document.createElement('canvas');
              cv.width = w;
              cv.height = h;
              cv.getContext('2d').drawImage(img, 0, 0, w, h);
              const out = cv.toDataURL('image/jpeg', 0.85);
              if (out.length > 4.5 * 1024 * 1024) {
                reject(new Error('Foto terlalu besar. Pilih screenshot lain yang lebih kecil.'));
              } else {
                resolve(out);
              }
            } catch (err) {
              resolve(reader.result);
            }
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    },
    // ---------- langkah 3: kirim + buka kode ----------
    genCode() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let s = '';
      for (let i = 0; i < 6; i += 1) {
        s += chars[Math.floor(Math.random() * chars.length)];
      }
      return `OKT-${s}`;
    },
    async submit() {
      if (!this.canSubmit) return;
      this.sending = true;
      this.setStatus('Mengirim bukti ke admin…', 'wait');
      const code = this.genCode();
      try {
        if (PROOF_API) {
          await fetch(PROOF_API, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'addProof',
              code,
              name: this.fileName || 'bukti-rating.jpg',
              type: 'image/jpeg',
              data: this.dataUrl,
              ts: new Date().toISOString(),
            }),
          });
        }
        const claims = this.readClaims();
        // buang kode promo lain yang masih tersimpan (hanya 1 kode aktif)
        Object.keys(claims).forEach((k) => {
          const v = claims[k];
          if (v && typeof v === 'object' && v.promo === PROMO_CODE) delete claims[k];
          else if (v === PROMO_CODE || k === PROMO_CODE) delete claims[k];
        });
        claims[code] = { ts: Date.now(), promo: PROMO_CODE };
        this.saveClaims(claims);
        this.code = code;
        this.claimTs = Date.now();
        this.setStatus('Bukti terkirim ✅ Kode promo berhasil dibuka — segera gunakan, berlaku 2 menit.', 'ok');
        this.startTick();
      } catch (err) {
        this.setStatus('Gagal mengirim bukti. Periksa koneksi lalu coba lagi.', 'err');
      } finally {
        this.sending = false;
      }
    },
    startTick() {
      clearInterval(this.timer);
      const tick = () => {
        this.remain = Math.max(0, Math.ceil((CLAIM_TTL_MS - (Date.now() - this.claimTs)) / 1000));
        if (this.remain <= 0) this.expire();
      };
      tick();
      this.timer = setInterval(tick, 1000);
    },
    expire() {
      clearInterval(this.timer);
      const claims = this.readClaims();
      if (this.code) delete claims[this.code];
      this.saveClaims(claims);
      this.code = '';
      this.remain = 0;
      this.dataUrl = '';
      this.preview = '';
      this.fileName = '';
      if (this.$refs.input) this.$refs.input.value = '';
      this.setStatus('⏰ Masa berlaku kode habis (2 menit). Upload bukti lagi untuk mendapatkan kode baru.', 'err');
    },
    copy() {
      const done = () => this.setStatus('Kode disalin ke papan klip.', 'ok');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(this.code).then(done).catch(() => this.fallbackCopy(done));
      } else {
        this.fallbackCopy(done);
      }
    },
    fallbackCopy(done) {
      try {
        const ta = document.createElement('textarea');
        ta.value = this.code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch (e) {
        this.setStatus('Gagal menyalin. Salin manual kode: ' + this.code, 'err');
      }
    },
    setStatus(msg, type) {
      this.status = msg;
      this.statusType = type || '';
    },
  },
};
</script>

<style scoped>
.claim {
  max-width: 860px;
  margin: 32px auto 0;
  text-align: left;
  background: var(--color-panel, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 22px;
  padding: 34px 30px;
  position: relative;
}
.claim__head {
  text-align: center;
  margin-bottom: 24px;
}
.claim__badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--color-accent, #5b8def);
  background: rgba(var(--color-accent-rgb, 91, 141, 239), 0.09);
  padding: 5px 16px;
  border-radius: 20px;
  margin-bottom: 10px;
}
.claim__head h3 {
  font-family: var(--font-display, inherit);
  font-size: 1.5rem;
  color: var(--color-dark, #0f172a);
  margin-bottom: 8px;
}
.claim__head p {
  color: var(--color-gray, #64748b);
  font-size: 0.95rem;
  line-height: 1.7;
  max-width: 560px;
  margin: 0 auto;
}
.claim__villa {
  max-width: 560px;
  margin: 0 auto 18px;
  text-align: left;
}
.claim__villa label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-dark, #0f172a);
  margin-bottom: 6px;
}
.claim__req {
  color: #dc2626;
}
.claim__villa select {
  width: 100%;
  padding: 11px 14px;
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  background: #fff;
  color: var(--color-dark, #0f172a);
  font-family: inherit;
  font-size: 0.9rem;
}
.claim__villa select:focus {
  outline: none;
  border-color: var(--color-accent, #5b8def);
  box-shadow: 0 0 0 4px rgba(91, 141, 239, 0.1);
}
.claim__villa-note {
  margin: 8px 0 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--color-gray, #64748b);
}
.claim__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.claim__step {
  background: rgba(var(--color-accent-rgb, 91, 141, 239), 0.04);
  border: 1px solid rgba(var(--color-accent-rgb, 91, 141, 239), 0.14);
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}
.claim__step.is-done {
  border-color: rgba(34, 197, 94, 0.45);
  background: rgba(34, 197, 94, 0.06);
}
.claim__num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8def, #7a5ce0);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.claim__step strong {
  font-size: 0.95rem;
  color: var(--color-dark, #0f172a);
}
.claim__step p {
  font-size: 0.83rem;
  color: var(--color-gray, #64748b);
  line-height: 1.6;
  margin: 0;
}
.claim__file {
  display: none;
}
.claim__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 999px;
  border: none;
  font-weight: 600;
  font-size: 0.86rem;
  text-decoration: none;
  cursor: pointer;
  text-align: center;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.claim__btn:hover {
  transform: translateY(-1px);
}
.claim__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}
.claim__btn--maps {
  background: #fff;
  color: #1a73e8;
  border: 1px solid rgba(26, 115, 232, 0.35);
}
.claim__btn--ghost {
  background: rgba(var(--color-accent-rgb, 91, 141, 239), 0.1);
  color: var(--color-dark, #0f172a);
}
.claim__btn--primary {
  background: linear-gradient(135deg, #5b8def, #7a5ce0);
  color: #fff;
}
.claim__check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.83rem;
  color: var(--color-dark, #0f172a);
  cursor: pointer;
  user-select: none;
}
.claim__check input {
  accent-color: #5b8def;
  width: 16px;
  height: 16px;
}
.claim__preview {
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--color-border, #e5e7eb);
  cursor: zoom-in;
  display: block;
}
.claim__status {
  margin: 18px 0 0;
  font-size: 0.88rem;
  line-height: 1.6;
  padding: 10px 14px;
  border-radius: 10px;
  text-align: center;
}
.claim__status.ok {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
}
.claim__status.err {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
}
.claim__status.wait {
  background: rgba(var(--color-accent-rgb, 91, 141, 239), 0.08);
  color: var(--color-dark, #334155);
}
.claim__codebox {
  margin-top: 20px;
  text-align: center;
  background: linear-gradient(135deg, rgba(91, 141, 239, 0.1), rgba(122, 92, 224, 0.1));
  border: 1px dashed rgba(var(--color-accent-rgb, 91, 141, 239), 0.5);
  border-radius: 16px;
  padding: 22px 18px;
}
.claim__code-label {
  font-size: 0.9rem;
  color: var(--color-dark, #334155);
}
.claim__code-value {
  font-family: var(--font-display, monospace);
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 4px;
  color: var(--color-dark, #0f172a);
  margin: 8px 0 14px;
}
.claim__code-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
.claim__code-note {
  margin: 12px 0 0;
  font-size: 0.78rem;
  color: var(--color-gray, #64748b);
}
.claim__lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.claim__lightbox img {
  max-width: 100%;
  max-height: 88vh;
  border-radius: 12px;
}
.claim__lightbox-close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}
@media (max-width: 768px) {
  .claim {
    padding: 26px 16px;
  }
  .claim__grid {
    grid-template-columns: 1fr;
  }
  .claim__code-value {
    font-size: 1.6rem;
  }
}
</style>
