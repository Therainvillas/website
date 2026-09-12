<template>
  <div class="booking">
    <div class="booking__form">
      <div v-if="!preselected" class="booking__field">
        <label>Pilih Villa</label>
        <div class="booking__picker">
          <button
            v-for="v in villas"
            :key="v.id"
            class="booking__pill"
            :class="{ 'booking__pill--active': selectedId == v.id }"
            @click="selectVilla(v.id)"
          >
            <span class="booking__pill-img" :style="{ backgroundImage: `url(${v.image})` }"></span>
            <span class="booking__pill-name">{{ v.name.replace('Villa ', '') }}</span>
            <span class="booking__pill-price">{{ v.priceLabel.replace('/malam', '') }}</span>
          </button>
        </div>
      </div>

      <div v-if="selectedVilla" class="booking__info">
        <div class="booking__villa" :style="{ backgroundImage: `url(${selectedVilla.image})` }">
          <div class="booking__villa-overlay"></div>
          <div class="booking__villa-content">
            <h3>{{ selectedVilla.name }}</h3>
            <p class="booking__capacity">{{ selectedVilla.capacity }} tamu • {{ selectedVilla.bedrooms }} kamar</p>
            <p class="booking__price">{{ selectedVilla.priceLabel }}</p>
          </div>
        </div>
      </div>

      <div v-if="selectedVilla && loading" class="booking__loading">
        <div class="booking__spinner"></div>
        <span>Memuat data ketersediaan...</span>
      </div>

      <div v-if="notice" class="booking__notice">
        <span>{{ notice }}</span>
      </div>

      <div v-if="error" class="booking__error">
        <span>{{ error }}</span>
      </div>

      <div v-if="selectedVilla && !loading" class="booking__calendar">
        <div class="calendar" :style="{ backgroundImage: `url(${selectedVilla.image})` }">
          <div class="calendar__overlay"></div>
          <div class="calendar__nav">
            <button @click="prevMonth">&larr;</button>
            <span class="calendar__title">{{ monthLabel }}</span>
            <button @click="nextMonth">&rarr;</button>
          </div>
          <div class="calendar__grid">
            <span class="calendar__day-name">Min</span>
            <span class="calendar__day-name">Sen</span>
            <span class="calendar__day-name">Sel</span>
            <span class="calendar__day-name">Rab</span>
            <span class="calendar__day-name">Kam</span>
            <span class="calendar__day-name">Jum</span>
            <span class="calendar__day-name">Sab</span>

            <template v-for="(cell, i) in calendarCells" :key="i">
              <span
                v-if="cell === null"
                class="calendar__cell calendar__cell--empty"
              ></span>
              <button
                v-else
                class="calendar__cell"
                :class="cellClass(cell)"
                :disabled="!isSelectable(cell)"
                :title="holidayName(cell)"
                @click="selectDate(cell)"
              >
                <span class="calendar__cell-num">{{ cell.day }}</span>
                <span v-if="!isUnavailable(cell)" class="calendar__cell-price">{{ cellPrice(cell) }}</span>
                <span v-if="holidayName(cell) && !isUnavailable(cell)" class="calendar__holiday-dot"></span>
              </button>
            </template>
          </div>
        </div>

        <div v-if="checkIn || checkOut" class="booking__selection">
          <div v-if="checkIn" class="booking__date-tag">
            <span class="booking__date-label">Check-in</span>
            <span>{{ formatDateDisplay(checkIn) }}</span>
          </div>
          <div v-if="checkOut" class="booking__date-tag">
            <span class="booking__date-label">Check-out</span>
            <span>{{ formatDateDisplay(checkOut) }}</span>
          </div>
          <div v-if="nightCount > 0" class="booking__total">
            <span>{{ nightCount }} malam</span>
            <span class="booking__total-price">Rp {{ totalPrice }}</span>
          </div>
        </div>

        <a
          v-if="checkIn && checkOut"
          :href="bookingLink"
          target="_blank"
          rel="nofollow"
          class="btn btn--whatsapp booking__wa"
        >
          Lanjut ke Form Booking
        </a>
      </div>
    </div>
  </div>
</template>

<script>
// Ganti URL ini dengan endpoint Web App Google Apps Script setelah deploy
const SPREADSHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzuvJ1h77RQyTPx9nz_CHjeisiOgvLhksHT60esWOh3BrHnUTVn_9xQrEH30Tv5op7s/exec';

// Hari libur nasional Indonesia 2026 — update sesuai ketetapan pemerintah
const HOLIDAYS = {
  "2026-01-01": "Tahun Baru Masehi",
  "2026-01-27": "Isra' Mi'raj",
  "2026-02-17": "Tahun Baru Imlek",
  "2026-03-21": "Hari Raya Nyepi",
  "2026-03-29": "Wafat Isa Almasih",
  "2026-04-10": "Idul Fitri 1447 H",
  "2026-04-11": "Idul Fitri 1447 H",
  "2026-05-01": "Hari Buruh Internasional",
  "2026-05-07": "Kenaikan Isa Almasih",
  "2026-05-21": "Hari Raya Waisak",
  "2026-06-01": "Hari Lahir Pancasila",
  "2026-07-06": "Idul Adha 1447 H",
  "2026-08-17": "Hari Kemerdekaan RI",
  "2026-09-05": "Tahun Baru Islam 1448 H",
  "2026-11-14": "Maulid Nabi Muhammad SAW",
  "2026-12-25": "Hari Natal",
};

export default {
  props: {
    initialVillaId: { type: [String, Number], default: null },
  },
  data() {
    const now = new Date();
    return {
      villas: [],
      selectedId: "",
      month: now.getMonth(),
      year: now.getFullYear(),
      checkIn: null,
      checkOut: null,
      apiBlockedDates: [],
      loading: false,
      error: "",
      notice: "",
      retryTimer: null,
      preselected: false,
    };
  },
  async mounted() {
    const mod = await import("../data/villas.js");
    this.villas = mod.villas;
    if (this.initialVillaId) {
      this.preselected = true;
      this.selectedId = String(this.initialVillaId);
    }
    if (this.selectedId) this.fetchBlockedDates();
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
    selectedVilla() {
      return this.villas.find((v) => v.id === Number(this.selectedId));
    },
    monthLabel() {
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
      ];
      return `${months[this.month]} ${this.year}`;
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
    nightCount() {
      if (!this.checkIn || !this.checkOut) return 0;
      const diff = this.checkOut.getTime() - this.checkIn.getTime();
      return Math.round(diff / (1000 * 60 * 60 * 24));
    },
    totalPrice() {
      if (!this.nightCount || !this.selectedVilla || !this.selectedVilla.dayPrices) return "0";
      let total = 0;
      for (let i = 0; i < this.nightCount; i++) {
        const d = new Date(this.checkIn);
        d.setDate(d.getDate() + i);
        total += this.dayPrice(d);
      }
      return total.toLocaleString("id-ID").replace(/,/g, ".");
    },
    waLink() {
      if (!this.selectedVilla || !this.checkIn || !this.checkOut) return "#";
      const total = this.totalPrice;
      const msg = `Halo The Rain Villas, saya ingin memesan ${this.selectedVilla.name} untuk:\nCheck-in: ${this.formatDateDisplay(this.checkIn)}\nCheck-out: ${this.formatDateDisplay(this.checkOut)}\n${this.nightCount} malam - Rp ${total}\nMohon info ketersediaan.`;
      return `https://wa.me/6282125492037?text=${encodeURIComponent(msg)}`;
    },
    bookingLink() {
      if (!this.selectedVilla || !this.checkIn || !this.checkOut) return "/booking";
      const q = new URLSearchParams({
        villa: this.selectedVilla.name,
        checkIn: this.localDate(this.checkIn),
        checkOut: this.localDate(this.checkOut),
      });
      return `/booking?${q.toString()}`;
    },
  },
  methods: {
    dayPrice(date) {
      const day = date.getDay();
      const prices = this.selectedVilla.dayPrices;
      return prices && prices[day] ? prices[day] : this.selectedVilla.price;
    },
    cellPrice(cell) {
      const p = this.dayPrice(new Date(cell.year, cell.month, cell.day));
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
    selectVilla(id) {
      if (this.selectedId == id) return;
      this.selectedId = id;
      this.checkIn = null;
      this.checkOut = null;
      this.apiBlockedDates = [];
      this.error = "";
      this.notice = "";
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
      this.fetchBlockedDates();
    },
    onVillaChange() {
      this.checkIn = null;
      this.checkOut = null;
      this.apiBlockedDates = [];
      this.error = "";
      this.notice = "";
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
      if (this.selectedId) this.fetchBlockedDates();
    },
    fetchBlockedDates() {
      this.error = "";
      const villa = this.villas.find((v) => v.id === Number(this.selectedId));
      if (!villa) { this.loading = false; return; }

      const cached = this.loadBlockedCache(villa);
      if (cached.length) {
        this.apiBlockedDates = cached;
        this.loading = false;
      } else {
        this.loading = true;
      }

      var url = SPREADSHEET_API_URL + '?villa=' + encodeURIComponent(villa.scheduleName || villa.name) + '&_=' + Date.now();
      var self = this;

      // Coba fetch dulu (CORS mungkin berhasil)
      fetch(url, { redirect: 'follow', cache: 'no-store' })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (Array.isArray(data)) {
            self.apiBlockedDates = data;
            self.saveBlockedCache(villa, data);
            self.notice = "";
            self.error = "";
          } else if (data && data.error) {
            console.warn("API error:", data.error);
            self.onFetchFail(villa);
          }
          self.loading = false;
        })
        .catch(function () {
          // Fallback ke JSONP jika fetch gagal (CORS issue)
          self.fetchJSONP(villa);
        });
    },
    fetchJSONP(villa) {
      var self = this;
      var url = SPREADSHEET_API_URL + '?villa=' + encodeURIComponent(villa.scheduleName || villa.name) + '&_=' + Date.now();
      var callbackName = 'cb_' + Date.now();

      window[callbackName] = function (data) {
        delete window[callbackName];
        if (Array.isArray(data)) {
          self.apiBlockedDates = data;
          self.saveBlockedCache(villa, data);
          self.notice = "";
          self.error = "";
        } else if (data && data.error) {
          console.warn("API error:", data.error);
          self.onFetchFail(villa);
        } else {
          self.onFetchFail(villa);
        }
        self.loading = false;
      };

      var script = document.createElement('script');
      script.src = url + '&callback=' + callbackName;
      script.onerror = function () {
        delete window[callbackName];
        self.onFetchFail(villa);
        self.loading = false;
      };
      setTimeout(function () {
        if (window[callbackName]) {
          delete window[callbackName];
          self.onFetchFail(villa);
          self.loading = false;
        }
      }, 8000);
      document.head.appendChild(script);
    },
    onFetchFail(villa) {
      const cached = this.loadBlockedCache(villa);
      if (cached.length) {
        this.apiBlockedDates = cached;
        this.notice = "Menampilkan jadwal terakhir — akan diperbarui otomatis saat koneksi pulih.";
        this.error = "";
      } else {
        this.apiBlockedDates = [];
        this.notice = "";
        this.error = "Server sedang tidak merespon. Coba lagi nanti.";
      }
      this.scheduleRetry();
    },
    scheduleRetry() {
      if (this.retryTimer) return;
      const currentId = this.selectedId;
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        if (this.selectedId === currentId) this.fetchBlockedDates();
      }, 20000);
    },
    handleOnline() {
      this.notice = "";
      if (this.selectedId) this.fetchBlockedDates();
    },
    loadBlockedCache(villa) {
      try {
        const raw = JSON.parse(localStorage.getItem("trv_blocked_cache")) || {};
        const key = String(villa.scheduleName || villa.id);
        const entry = raw[key];
        if (entry && Array.isArray(entry.dates)) return entry.dates;
      } catch (e) {}
      return [];
    },
    saveBlockedCache(villa, dates) {
      try {
        const key = String(villa.scheduleName || villa.id);
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
    isUnavailable(cell) {
      if (!this.selectedVilla) return true;
      var s = this.dateStr(cell);
      var d = new Date(cell.year, cell.month, cell.day);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) return true;
      return this.apiBlockedDates.includes(s) ||
             this.getAdminBlocked().includes(s) ||
             this.selectedVilla.unavailable.includes(s);
    },
    isSelectable(cell) {
      if (this.isUnavailable(cell)) return this.isCheckoutOnly(cell);
      return true;
    },
    isCheckoutOnly(cell) {
      if (!this.isUnavailable(cell)) return false;
      if (!this.checkIn) return false;
      const d = new Date(cell.year, cell.month, cell.day);
      return d.getTime() > this.checkIn.getTime();
    },
    getAdminBlocked() {
      try {
        const raw = JSON.parse(localStorage.getItem("therainvillas_blocked")) || {};
        const key = String(this.selectedVilla.id);
        return raw[key] || [];
      } catch {
        return [];
      }
    },
    isSelected(cell) {
      const d = new Date(cell.year, cell.month, cell.day).getTime();
      if (this.checkIn && d === this.checkIn.getTime()) return true;
      if (this.checkOut && d === this.checkOut.getTime()) return true;
      return false;
    },
    isInRange(cell) {
      if (!this.checkIn || !this.checkOut) return false;
      const d = new Date(cell.year, cell.month, cell.day).getTime();
      return d > this.checkIn.getTime() && d < this.checkOut.getTime();
    },
    cellClass(cell) {
      if (!cell) return "";
      return {
        "calendar__cell--unavailable": this.isUnavailable(cell) && !this.isCheckoutOnly(cell),
        "calendar__cell--checkout-only": this.isCheckoutOnly(cell),
        "calendar__cell--selected": this.isSelected(cell),
        "calendar__cell--in-range": this.isInRange(cell),
        "calendar__cell--holiday": HOLIDAYS[this.dateStr(cell)],
      };
    },
    selectDate(cell) {
      if (!this.isSelectable(cell)) return;
      const selected = new Date(cell.year, cell.month, cell.day);

      if (!this.checkIn || (this.checkIn && this.checkOut)) {
        if (this.isUnavailable(cell)) return;
        this.checkIn = selected;
        this.checkOut = null;
      } else {
        if (selected <= this.checkIn) {
          if (this.isUnavailable(cell)) return;
          this.checkIn = selected;
        } else {
          this.checkOut = selected;
        }
      }
    },
    holidayName(cell) {
      if (!cell) return "";
      return HOLIDAYS[this.dateStr(cell)] || "";
    },
formatDateDisplay(d) {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
      ];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },
    localDate(d) {
      const p2 = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
    },
  },
};
</script>

<style scoped>
.booking {
  max-width: 700px;
  margin: 0 auto;
}

.booking__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.booking__field label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.booking__picker {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.booking__picker::-webkit-scrollbar {
  width: 6px;
}

.booking__picker::-webkit-scrollbar-track {
  background: transparent;
}

.booking__picker::-webkit-scrollbar-thumb {
  background: rgba(91,141,239,0.3);
  border-radius: 3px;
}

.booking__pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 2px solid rgba(0,0,0,0.06);
  background: white;
  cursor: pointer;
  transition: all 0.25s;
  text-align: left;
  font-family: inherit;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.booking__pill:hover {
  border-color: rgba(91,141,239,0.4);
  box-shadow: 0 4px 16px rgba(91,141,239,0.1);
  transform: translateY(-1px);
}

.booking__pill--active {
  border-color: #5b8def;
  background: rgba(91,141,239,0.06);
  box-shadow: 0 0 0 1px #5b8def, 0 4px 16px rgba(91,141,239,0.12);
}

.booking__pill-img {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.06);
}

.booking__pill-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.booking__pill-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.85rem;
  line-height: 1.3;
}

.booking__pill-price {
  font-size: 0.75rem;
  color: #5b8def;
  font-weight: 500;
  margin-top: 1px;
}

.booking__villa {
  position: relative;
  border-radius: 16px;
  padding: 48px 24px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.booking__villa-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 100%);
}

.booking__villa-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
}

.booking__villa-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.booking__villa-content .booking__capacity {
  font-size: 0.95rem;
  opacity: 0.85;
  margin-bottom: 4px;
}

.booking__villa-content .booking__price {
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  margin-top: 4px;
}

.booking__capacity {
  font-size: 0.85rem;
  color: var(--color-gray, #727586);
}

.booking__price {
  font-weight: 600;
  color: var(--color-primary);
  margin-top: 4px;
}

.calendar {
  position: relative;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.calendar__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 0;
}

.calendar__nav {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.calendar__nav button {
  background: rgba(255,255,255,0.85);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
  backdrop-filter: blur(2px);
}

.calendar__nav button:hover {
  background: rgba(255,255,255,1);
}

.calendar__title {
  font-size: 1.05rem;
  font-weight: 600;
  color: white;
}

.calendar__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar__day-name {
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
  padding: 8px 0;
}

.calendar__cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border-radius: 10px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: rgba(255,255,255,0.15);
  font-family: inherit;
  color: white;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.2);
}

.calendar__cell-num {
  line-height: 1.1;
}

.calendar__cell-price {
  font-size: 0.6rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  line-height: 1;
  background: rgba(0,0,0,0.25);
  padding: 1px 5px;
  border-radius: 6px;
  white-space: nowrap;
}

.calendar__cell:hover:not(:disabled):not(.calendar__cell--unavailable) {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.4);
  transform: scale(1.05);
}

.calendar__cell--empty {
  cursor: default;
}

.calendar__cell--holiday {
  color: #fca5a5 !important;
  font-weight: 600;
  position: relative;
  flex-direction: column;
  gap: 0;
}

.calendar__holiday-dot {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ef4444;
}

.calendar__cell--unavailable {
  color: rgba(255,255,255,0.35);
  cursor: not-allowed;
  text-decoration: line-through;
  background: rgba(0,0,0,0.25);
}

.calendar__cell--checkout-only {
  color: #ffe8b8;
  background: rgba(255, 190, 90, 0.22);
  border: 1px solid rgba(255, 190, 90, 0.55);
}
.calendar__cell--checkout-only:hover:not(:disabled) {
  background: rgba(255, 190, 90, 0.38);
  border-color: rgba(255, 190, 90, 0.8);
}

.calendar__cell--selected {
  background: linear-gradient(135deg, #5b8def, #7c9bf7) !important;
  color: white !important;
  font-weight: 700;
  border-color: rgba(255,255,255,0.85) !important;
  box-shadow: 0 0 0 2px rgba(91,141,239,0.4);
}

.calendar__cell--selected .calendar__cell-num,
.calendar__cell--selected .calendar__cell-price {
  color: white !important;
}

.calendar__cell--in-range {
  background: rgba(91,141,239,0.28);
  color: white;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-color: rgba(91,141,239,0.5);
}

.booking__selection {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

.booking__date-tag {
  background: var(--color-gray-light, #f2f3f6);
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
}

.booking__date-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray, #727586);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.booking__total {
  background: var(--color-primary);
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  text-align: center;
}

.booking__total-price {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
}

.booking__wa {
  position: relative;
  z-index: 1;
  margin-top: 8px;
  width: 100%;
  padding: 16px;
  font-size: 1.05rem;
  text-align: center;
}

.booking__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 24px;
  background: rgba(0,0,0,0.04);
  border-radius: 16px;
  color: var(--color-gray, #727586);
  font-size: 0.95rem;
}

.booking__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(91,141,239,0.2);
  border-top-color: #5b8def;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.booking__notice {
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.45);
  border-radius: 10px;
  color: #b45309;
  font-size: 0.85rem;
  text-align: center;
}

.booking__error {
  padding: 12px 16px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 10px;
  color: #ef4444;
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 768px) {
  .booking__picker {
    grid-template-columns: 1fr;
    max-height: 280px;
  }

  .booking__villa {
    padding: 36px 20px;
    min-height: 180px;
  }

  .booking__villa-content h3 {
    font-size: 1.25rem;
  }

  .booking__villa-content .booking__price {
    font-size: 1rem;
  }

  .calendar {
    padding: 16px;
  }

  .calendar__grid {
    gap: 2px;
  }

  .calendar__cell {
    font-size: 0.8rem;
    border-radius: 6px;
  }

  .booking__selection {
    flex-direction: column;
    align-items: stretch;
  }

  .booking__date-tag {
    text-align: center;
  }
}
</style>
