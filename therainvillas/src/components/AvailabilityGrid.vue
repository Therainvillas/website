<template>
  <div class="avail">
    <div class="avail__toolbar">
      <button type="button" class="avail__nav" @click="prevMonth" aria-label="Bulan sebelumnya">&larr;</button>
      <span class="avail__month">{{ monthLabel }}</span>
      <button type="button" class="avail__nav" @click="nextMonth" aria-label="Bulan berikutnya">&rarr;</button>
    </div>

    <div v-if="!loaded" class="avail__status">
      <div class="avail__spinner"></div>
      <span>Memuat jadwal semua villa...</span>
    </div>

    <div v-if="notice" class="avail__notice">{{ notice }}</div>
    <div v-if="error" class="avail__error">{{ error }}</div>

    <div class="avail__grid">
      <article
        v-for="v in villas"
        :key="v.id"
        class="avail-card"
        :style="{ backgroundImage: `url(${v.image})` }"
      >
        <div class="avail-card__overlay"></div>
        <div class="avail-card__inner">
          <header class="avail-card__head">
            <h3 class="avail-card__name">{{ v.name }}</h3>
            <p class="avail-card__meta">{{ v.capacity }} tamu &#8226; {{ v.bedrooms }} kamar</p>
            <p class="avail-card__price">{{ v.priceLabel }}</p>
          </header>
          <div class="avail-cal">
            <div class="avail-cal__weekdays">
              <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
            </div>
            <div class="avail-cal__cells">
              <template v-for="(cell, i) in calendarCells" :key="i">
                <span v-if="cell === null" class="avail-cell avail-cell--empty"></span>
                <a
                  v-else-if="isAvailable(v, cell)"
                  :href="dateHref(v, cell)"
                  class="avail-cell avail-cell--ready"
                  :title="'Booking ' + v.name + ' mulai ' + dateStr(cell)"
                >
                  <span class="avail-cell__num">{{ cell.day }}</span>
                  <span class="avail-cell__price">{{ cellPrice(v, cell) }}</span>
                </a>
                <span
                  v-else
                  class="avail-cell avail-cell--off"
                  :title="'Terbooking / tidak tersedia'"
                >
                  <span class="avail-cell__num">{{ cell.day }}</span>
                </span>
              </template>
            </div>
          </div>
        </div>
      </article>
    <p class="avail__tip">Klik tanggal yang tersedia untuk langsung membuka form booking villa tersebut.</p>
    </div>

    <div class="avail__legend">
      <span class="avail__legend-item">
        <i class="avail__swatch avail__swatch--ready"></i> Tersedia (harga/malam)
      </span>
      <span class="avail__legend-item">
        <i class="avail__swatch avail__swatch--off"></i> Terbooking / tidak tersedia
      </span>
    </div>
  </div>
</template>

<script>
// Ganti URL ini dengan endpoint Web App Google Apps Script setelah deploy
const SPREADSHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzuvJ1h77RQyTPx9nz_CHjeisiOgvLhksHT60esWOh3BrHnUTVn_9xQrEH30Tv5op7s/exec';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default {
  data() {
    const now = new Date();
    return {
      villas: [],
      schedules: {},
      failed: [],
      month: now.getMonth(),
      year: now.getFullYear(),
      loaded: false,
      error: "",
      notice: "",
      retryTimer: null,
    };
  },
  async mounted() {
    try {
      const mod = await import("../data/villas.js");
      this.villas = mod.villas;
    } catch (e) {
      this.error = "Data villa gagal dimuat.";
    }
    this.loaded = true;
    this.fetchAll();
    window.addEventListener('online', this.handleOnline);
  },
  beforeUnmount() {
    window.removeEventListener('online', this.handleOnline);
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  },
  computed: {
    monthLabel() {
      return `${MONTHS[this.month]} ${this.year}`;
    },
    calendarCells() {
      const firstDay = new Date(this.year, this.month, 1).getDay();
      const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < firstDay; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, month: this.month, year: this.year });
      }
      return cells;
    },
  },
  methods: {
    dayPrice(v, date) {
      const day = date.getDay();
      const prices = v.dayPrices;
      return prices && prices[day] ? prices[day] : v.price;
    },
    cellPrice(v, cell) {
      const p = this.dayPrice(v, new Date(cell.year, cell.month, cell.day));
      if (!p) return "";
      if (p >= 1000000) {
        const n = p / 1000000;
        return (Number.isInteger(n) ? n : n.toFixed(1)) + "jt";
      }
      if (p >= 1000) return Math.round(p / 1000) + "rb";
      return String(p);
    },
    dateStr(cell) {
      return `${cell.year}-${String(cell.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
    },
    dateHref(v, cell) {
      const ci = new Date(cell.year, cell.month, cell.day);
      const co = new Date(cell.year, cell.month, cell.day + 1);
      const p2 = (n) => String(n).padStart(2, "0");
      const ciStr = `${ci.getFullYear()}-${p2(ci.getMonth() + 1)}-${p2(ci.getDate())}`;
      const coStr = `${co.getFullYear()}-${p2(co.getMonth() + 1)}-${p2(co.getDate())}`;
      return `/booking?villa=${encodeURIComponent(v.name)}&checkIn=${ciStr}&checkOut=${coStr}`;
    },
    isUnavailable(v, cell) {
      if (!v) return true;
      const s = this.dateStr(cell);
      const d = new Date(cell.year, cell.month, cell.day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) return true;
      const blocked = this.schedules[v.id] || [];
      if (blocked.includes(s)) return true;
      if (this.adminBlocked(v).includes(s)) return true;
      if (Array.isArray(v.unavailable) && v.unavailable.includes(s)) return true;
      return false;
    },
    isAvailable(v, cell) {
      return !!(cell && !this.isUnavailable(v, cell));
    },
    adminBlocked(v) {
      try {
        const raw = JSON.parse(localStorage.getItem("therainvillas_blocked")) || {};
        return raw[String(v.id)] || [];
      } catch {
        return [];
      }
    },
    fetchAll() {
      this.error = "";
      this.villas.forEach((v) => this.fetchVilla(v));
    },
    fetchVilla(v) {
      const cached = this.loadBlockedCache(v);
      if (cached.length) this.schedules[v.id] = cached;

      const url = SPREADSHEET_API_URL + '?villa=' + encodeURIComponent(v.scheduleName || v.name) + '&_=' + Date.now();
      fetch(url, { redirect: 'follow', cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            this.schedules[v.id] = data;
            this.saveBlockedCache(v, data);
            this.markSuccess(v);
          } else if (data && data.error) {
            console.warn("API error:", data.error);
            this.markFail(v);
          }
        })
        .catch(() => this.fetchJSONP(v));
    },
    fetchJSONP(v) {
      const url = SPREADSHEET_API_URL + '?villa=' + encodeURIComponent(v.scheduleName || v.name) + '&_=' + Date.now();
      const callbackName = 'avail_cb_' + v.id + '_' + Date.now();

      window[callbackName] = (data) => {
        delete window[callbackName];
        if (Array.isArray(data)) {
          this.schedules[v.id] = data;
          this.saveBlockedCache(v, data);
          this.markSuccess(v);
          this.error = "";
        } else if (data && data.error) {
          console.warn("API error:", data.error);
          this.markFail(v);
        } else {
          this.markFail(v);
        }
      };

      const script = document.createElement('script');
      script.src = url + '&callback=' + callbackName;
      script.onerror = () => {
        delete window[callbackName];
        this.markFail(v);
      };
      setTimeout(() => {
        if (window[callbackName]) {
          delete window[callbackName];
          this.markFail(v);
        }
      }, 8000);
      document.head.appendChild(script);
    },
    markSuccess(v) {
      const i = this.failed.indexOf(v.id);
      if (i > -1) this.failed.splice(i, 1);
      this.refreshNotice();
    },
    markFail(v) {
      if (this.failed.indexOf(v.id) === -1) this.failed.push(v.id);
      this.refreshNotice();
      this.scheduleRetry();
    },
    refreshNotice() {
      if (this.failed.length) {
        this.notice = "Sebagian jadwal gagal diperbarui — menampilkan data terakhir.";
      } else {
        this.notice = "";
      }
    },
    scheduleRetry() {
      if (this.retryTimer) return;
      const ids = this.failed.slice();
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.villas.forEach((v) => {
          if (ids.indexOf(v.id) > -1) this.fetchVilla(v);
        });
      }, 20000);
    },
    handleOnline() {
      this.error = "";
      this.notice = "";
      this.fetchAll();
    },
    loadBlockedCache(v) {
      try {
        const raw = JSON.parse(localStorage.getItem("trv_blocked_cache")) || {};
        const key = String(v.scheduleName || v.name);
        const entry = raw[key];
        if (entry && Array.isArray(entry.dates)) return entry.dates;
      } catch (e) {}
      return [];
    },
    saveBlockedCache(v, dates) {
      try {
        const key = String(v.scheduleName || v.name);
        const raw = JSON.parse(localStorage.getItem("trv_blocked_cache")) || {};
        raw[key] = { dates: Array.isArray(dates) ? dates : [], savedAt: new Date().toISOString() };
        localStorage.setItem("trv_blocked_cache", JSON.stringify(raw));
      } catch (e) {}
    },
    prevMonth() {
      if (this.month === 0) {
        this.month = 11;
        this.year--;
      } else {
        this.month--;
      }
    },
    nextMonth() {
      if (this.month === 11) {
        this.month = 0;
        this.year++;
      } else {
        this.month++;
      }
    },
  },
};
</script>

<style scoped>
.avail {
  max-width: 1080px;
  margin: 0 auto;
}

.avail__toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 28px;
}

.avail__nav {
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  width: 44px;
  height: 44px;
  cursor: pointer;
  font-size: 1.1rem;
  color: var(--color-primary, #5b8def);
  transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.avail__nav:hover {
  border-color: var(--color-primary, #5b8def);
  background: rgba(91, 141, 239, 0.06);
}

.avail__month {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  min-width: 160px;
  text-align: center;
}

.avail__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 40px 24px;
  color: var(--color-gray, #727586);
  font-size: 0.95rem;
}

.avail__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(91, 141, 239, 0.2);
  border-top-color: #5b8def;
  border-radius: 50%;
  animation: avail-spin 0.8s linear infinite;
}

@keyframes avail-spin {
  to { transform: rotate(360deg); }
}

.avail__notice {
  padding: 12px 16px;
  margin-bottom: 20px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.45);
  border-radius: 10px;
  color: #b45309;
  font-size: 0.85rem;
  text-align: center;
}

.avail__error {
  padding: 12px 16px;
  margin-bottom: 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #ef4444;
  font-size: 0.85rem;
  text-align: center;
}

.avail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.avail-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
}

.avail-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.62) 0%, rgba(0, 0, 0, 0.5) 100%);
}

.avail-card__inner {
  position: relative;
  z-index: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.avail-card__name {
  font-size: 1.15rem;
  font-weight: 700;
  color: white;
  margin-bottom: 2px;
}

.avail-card__meta {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 2px;
}

.avail-card__price {
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.avail-cal {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.avail-cal__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.avail-cal__weekdays span {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  padding: 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.avail-cal__cells {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.avail-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  text-decoration: none;
  transition: all 0.2s;
}

a.avail-cell.avail-cell--ready:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.55);
  color: #ffffff;
  transform: scale(1.06);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
}

.avail-cell__num {
  font-size: 0.8rem;
  line-height: 1.1;
  font-weight: 600;
}

.avail-cell__price {
  font-size: 0.58rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1;
  background: rgba(0, 0, 0, 0.28);
  padding: 1px 4px;
  border-radius: 5px;
  white-space: nowrap;
}

.avail-cell--empty {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.avail-cell--off {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  text-decoration: line-through;
  box-shadow: none;
}

.avail-cell--off .avail-cell__num {
  color: rgba(255, 255, 255, 0.45);
}

.avail__tip {
  text-align: center;
  font-size: 0.82rem;
  color: var(--color-gray, #727586);
  margin-top: 22px;
}

.avail__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin-top: 28px;
  font-size: 0.85rem;
  color: var(--color-gray, #727586);
}

.avail__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.avail__swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  display: inline-block;
}

.avail__swatch--ready {
  background: rgba(91, 141, 239, 0.2);
  border: 1px solid rgba(91, 141, 239, 0.4);
}

.avail__swatch--off {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
}

@media (max-width: 768px) {
  .avail__grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .avail__month {
    min-width: 130px;
  }
}
</style>