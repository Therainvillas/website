<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <div>
        <h1>Panel Admin</h1>
        <p class="dashboard__subtitle">Kelola jadwal ketersediaan villa & verifikasi bookingan</p>
      </div>
      <button @click="handleLogout" class="dashboard__logout">Keluar</button>
    </div>

    <div v-if="!authenticated" class="dashboard__unauthorized">
      <p>Anda belum login. <a href="/admin">Login di sini</a></p>
    </div>

    <div v-else class="dashboard__content">
      <!-- ===== BUKTI RATING ===== -->
      <div class="dashboard__proof-section">
        <div class="dashboard__proof-head">
          <div>
            <h2>Bukti Rating & Klaim Voucher</h2>
            <p class="dashboard__proof-sub">Screenshot rating Google Maps yang diupload pengunjung untuk membuka kode promo.</p>
          </div>
          <button @click="loadProofs" class="dashboard__proof-refresh" :disabled="proofsLoading">
            {{ proofsLoading ? 'Memuat…' : 'Refresh' }}
          </button>
        </div>

        <p v-if="sheetUrl || folderUrl" class="dashboard__proof-links">
          <a v-if="sheetUrl" :href="sheetUrl" target="_blank" rel="noopener" class="dashboard__proof-link">Buka Spreadsheet Bukti</a>
          <a v-if="folderUrl" :href="folderUrl" target="_blank" rel="noopener" class="dashboard__proof-link">Buka Folder Bukti</a>
        </p>

        <p v-if="proofsStatus" class="dashboard__proof-status" :class="{ 'dashboard__proof-status--ok': proofs.length }">{{ proofsStatus }}</p>

        <div v-if="proofs.length" class="dashboard__proof-grid">
          <div v-for="p in proofs" :key="p.id" class="dashboard__proof-card">
            <img v-if="p.data" :src="p.data" :alt="p.name" class="dashboard__proof-thumb" @click="openProof(p.data)" />
            <div v-else class="dashboard__proof-thumb dashboard__proof-thumb--empty">gambar tidak tersedia</div>
            <div class="dashboard__proof-meta">
              <div class="dashboard__booking-title-row">
                <span class="dashboard__badge-status dashboard__badge-status--pending">Voucher {{ p.code || '-' }}</span>
              </div>
              <p class="dashboard__proof-name">{{ p.name }}</p>
              <p class="dashboard__proof-date">{{ proofDate(p.ts) }}</p>
            </div>
            <button @click="deleteProof(p.id)" class="dashboard__proof-delete">Hapus</button>
          </div>
        </div>
      </div>

      <!-- ===== KALENDER BLOKIR ===== -->
      <div class="dashboard__calendar-wrap">
        <div v-for="villa in villas" :key="villa.id" class="dashboard__villa">
          <div class="dashboard__villa-header">
            <img :src="villa.image" :alt="villa.name" class="dashboard__villa-img" />
            <div>
              <h3>{{ villa.name }}</h3>
              <p class="dashboard__villa-meta">{{ villa.capacity }} tamu • {{ villa.bedrooms }} kamar</p>
            </div>
            <span class="dashboard__badge">{{ blockedCount(villa.id) }} diblokir</span>
          </div>

          <div class="dashboard__calendar">
            <div class="dashboard__nav">
              <button @click="prevMonth(villa.id)">&larr;</button>
              <span class="dashboard__month">{{ getMonthLabel(villa.id) }}</span>
              <button @click="nextMonth(villa.id)">&rarr;</button>
            </div>

            <div class="dashboard__grid">
              <span class="dashboard__day-name">Min</span>
              <span class="dashboard__day-name">Sen</span>
              <span class="dashboard__day-name">Sel</span>
              <span class="dashboard__day-name">Rab</span>
              <span class="dashboard__day-name">Kam</span>
              <span class="dashboard__day-name">Jum</span>
              <span class="dashboard__day-name">Sab</span>

              <template v-for="(cell, i) in getCalendar(villa.id)" :key="i">
                <span
                  v-if="cell === null"
                  class="dashboard__cell dashboard__cell--empty"
                ></span>
                <button
                  v-else
                  class="dashboard__cell"
                  :class="getCellClass(villa.id, cell)"
                  @click="toggleDate(villa.id, cell)"
                >
                  {{ cell.day }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="proofLightbox" class="dashboard__lightbox" @click="closeProof">
    <div class="dashboard__lightbox-inner" @click.stop>
      <img :src="proofLightbox" alt="Bukti rating rating" />
      <button class="dashboard__lightbox-close" @click="closeProof">×</button>
    </div>
  </div>
</template>

<script>
import { PROOF_API } from "../data/promos.js";

const STORAGE_KEY = "therainvillas_blocked";

function loadBlocked() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBlocked(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function dateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default {
  data() {
    return {
      authenticated: false,
      villas: [],
      calendarDates: {},
      proofs: [],
      proofsLoading: false,
      proofsStatus: "",
      sheetUrl: "",
      folderUrl: "",
      proofLightbox: "",
    };
  },
  async mounted() {
    this.authenticated = localStorage.getItem("therainvillas_admin") === "true";
    const mod = await import("../data/villas.js");
    this.villas = mod.villas;
    this.villas.forEach((v) => {
      this.calendarDates[v.id] = { month: new Date().getMonth(), year: new Date().getFullYear() };
    });
    if (this.authenticated) {
      this.loadProofs();
    }
  },
  methods: {
    getBlocked() {
      return loadBlocked();
    },
    getBlockedForVilla(villaId) {
      const all = this.getBlocked();
      return all[String(villaId)] || [];
    },
    blockedCount(villaId) {
      return this.getBlockedForVilla(villaId).length;
    },
    getDefaultBlocked(villaId) {
      const v = this.villas.find((x) => x.id === villaId);
      return v ? v.unavailable : [];
    },
    isBlocked(villaId, cell) {
      const ds = dateStr(cell.year, cell.month, cell.day);
      const fromAdmin = this.getBlockedForVilla(villaId).includes(ds);
      const fromDefault = this.getDefaultBlocked(villaId).includes(ds);
      return fromAdmin || fromDefault;
    },
    getCalendar(villaId) {
      const d = this.calendarDates[villaId] || { month: new Date().getMonth(), year: new Date().getFullYear() };
      const firstDay = new Date(d.year, d.month, 1).getDay();
      const daysInMonth = new Date(d.year, d.month + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < firstDay; i++) cells.push(null);
      for (let day = 1; day <= daysInMonth; day++) {
        cells.push({ day, month: d.month, year: d.year });
      }
      return cells;
    },
    getMonthLabel(villaId) {
      const d = this.calendarDates[villaId] || { month: new Date().getMonth(), year: new Date().getFullYear() };
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
      ];
      return `${months[d.month]} ${d.year}`;
    },
    prevMonth(villaId) {
      const d = this.calendarDates[villaId];
      if (d.month === 0) {
        d.month = 11;
        d.year--;
      } else {
        d.month--;
      }
    },
    nextMonth(villaId) {
      const d = this.calendarDates[villaId];
      if (d.month === 11) {
        d.month = 0;
        d.year++;
      } else {
        d.month++;
      }
    },
    getCellClass(villaId, cell) {
      const ds = dateStr(cell.year, cell.month, cell.day);
      const d = new Date(cell.year, cell.month, cell.day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const classes = {};
      if (d < today) classes["dashboard__cell--past"] = true;
      if (this.isBlocked(villaId, cell)) classes["dashboard__cell--blocked"] = true;

      const fromAdmin = this.getBlockedForVilla(villaId).includes(ds);
      if (fromAdmin) classes["dashboard__cell--admin-blocked"] = true;

      return classes;
    },
    toggleDate(villaId, cell) {
      const ds = dateStr(cell.year, cell.month, cell.day);
      const d = new Date(cell.year, cell.month, cell.day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) return;

      const all = this.getBlocked();
      const key = String(villaId);
      if (!all[key]) all[key] = [];

      const idx = all[key].indexOf(ds);
      if (idx > -1) {
        all[key].splice(idx, 1);
      } else {
        all[key].push(ds);
        all[key].sort();
      }

      saveBlocked(all);
      this.$forceUpdate();
    },
    handleLogout() {
      localStorage.removeItem("therainvillas_admin");
      window.location.href = "/admin";
    },
    proofDate(ts) {
      if (!ts) return "";
      try {
        return new Date(ts).toLocaleString("id-ID", {
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
      } catch (e) {
        return ts;
      }
    },
    loadProofs() {
      if (!PROOF_API) {
        this.proofs = [];
        this.proofsStatus = "PROOF_API belum diisi di src/data/promos.js. Setelah deploy backend (appsscript/Code.gs), isi URL lalu build ulang.";
        return;
      }
      this.proofsLoading = true;
      this.proofsStatus = "";
      const self = this;
      const handleData = (data) => {
        self.proofsLoading = false;
        if (data && data.ok && Array.isArray(data.items)) {
          self.proofs = data.items;
          self.sheetUrl = data.spreadsheetUrl || "";
          self.folderUrl = data.folderUrl || "";
          self.proofsStatus = self.proofs.length ? "" : "Belum ada bukti rating terkirim.";
        } else if (data && data.error) {
          self.proofsStatus = "Backend: " + String(data.error);
        } else {
          self.proofsStatus = "Respon backend tidak valid.";
        }
      };
      fetch(PROOF_API, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "listProofs", limit: 40 }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("http " + r.status);
          return r.json();
        })
        .then(handleData)
        .catch(() => this._loadProofsJsonp(handleData));
    },
    _loadProofsJsonp(onData) {
      const self = this;
      const onErr = () => {
        self.proofsLoading = false;
        self.proofsStatus = "Gagal memuat bukti dari backend. Coba refresh.";
      };
      const cb = "__trvProofs" + Math.floor(Math.random() * 1e9);
      window[cb] = (data) => {
        delete window[cb];
        onData(data);
      };
      const url = PROOF_API + (PROOF_API.indexOf("?") > -1 ? "&" : "?") + "action=listProofs&limit=40&callback=" + cb;
      const s = document.createElement("script");
      s.src = url;
      const timer = window.setTimeout(() => {
        if (window[cb]) {
          delete window[cb];
          onErr();
        }
      }, 15000);
      s.onerror = () => {
        window.clearTimeout(timer);
        delete window[cb];
        onErr();
      };
      s.onload = () => window.clearTimeout(timer);
      document.head.appendChild(s);
    },
    deleteProof(id) {
      if (!PROOF_API) return;
      if (!window.confirm("Hapus bukti ini?")) return;
      const self = this;
      fetch(PROOF_API, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "deleteProof", id: id }),
      })
        .then(() => self.loadProofs())
        .catch(() => self.loadProofs());
    },
    openProof(data) {
      this.proofLightbox = data;
    },
    closeProof() {
      this.proofLightbox = "";
    },
  },
};
</script>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 0;
}

.dashboard__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.dashboard__header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.dashboard__subtitle {
  color: var(--color-gray, #727586);
  font-size: 0.9rem;
}

.dashboard__logout {
  background: none;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px 24px;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.dashboard__logout:hover {
  border-color: #dc2626;
  color: #dc2626;
}

.dashboard__unauthorized {
  text-align: center;
  padding: 80px 24px;
  font-size: 1.1rem;
}

.dashboard__unauthorized a {
  color: var(--color-primary);
  text-decoration: underline;
}

.dashboard__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ===== TABS ===== */
.dashboard__tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dashboard__tab {
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 20px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
}

.dashboard__tab--active {
  border-color: #5b8def;
  background: rgba(91, 141, 239, 0.08);
  color: #7a5ce0;
}

.dashboard__tab-count {
  background: #94a3b8;
  color: #fff;
  border-radius: 20px;
  padding: 1px 8px;
  font-size: 0.75rem;
  margin-left: 6px;
}

.dashboard__tab-count--pending {
  background: #5b8def;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(91, 141, 239, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(91, 141, 239, 0); }
}

/* ===== STATS BAR ===== */
.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.dashboard__stats--5 {
  grid-template-columns: repeat(5, 1fr);
}

.dashboard__stat {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
}

.dashboard__stat-num {
  display: block;
  font-size: 1.6rem;
  font-weight: 700;
  color: #1e293b;
}

.dashboard__stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dashboard__stat--pending .dashboard__stat-num { color: #a08bff; }
.dashboard__stat--verified .dashboard__stat-num { color: #16a34a; }
.dashboard__stat--rejected .dashboard__stat-num { color: #dc2626; }
.dashboard__stat--revenue .dashboard__stat-num { color: #0d9488; }

/* ===== RANKING ===== */
.dashboard__ranking {
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}
.dashboard__ranking-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1e293b;
}
.dashboard__ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dashboard__ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}
.dashboard__ranking-pos {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #0d1b2b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}
.dashboard__ranking-item:nth-child(1) .dashboard__ranking-pos { background: #a08bff; }
.dashboard__ranking-item:nth-child(2) .dashboard__ranking-pos { background: #94a3b8; }
.dashboard__ranking-item:nth-child(3) .dashboard__ranking-pos { background: #d97706; }
.dashboard__ranking-name {
  font-weight: 600;
  font-size: 0.92rem;
  color: #1e293b;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dashboard__ranking-count {
  font-size: 0.82rem;
  color: #64748b;
  white-space: nowrap;
}
.dashboard__ranking-revenue {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0d9488;
  white-space: nowrap;
}

/* ===== FILTERS ===== */
.dashboard__filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dashboard__filter {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.dashboard__filter--active {
  border-color: #0d1b2b;
  background: #0d1b2b;
  color: #fff;
}

.dashboard__filter--active.dashboard__filter--pending {
  background: #a08bff;
  border-color: #a08bff;
}

.dashboard__filter--active.dashboard__filter--verified {
  background: #16a34a;
  border-color: #16a34a;
}

.dashboard__filter--active.dashboard__filter--rejected {
  background: #dc2626;
  border-color: #dc2626;
}

.dashboard__filter-count {
  background: rgba(0,0,0,0.1);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.72rem;
  margin-left: 4px;
}

.dashboard__filter--active .dashboard__filter-count {
  background: rgba(255,255,255,0.25);
}

/* ===== BOOKING CARDS ===== */
.dashboard__bookings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard__booking {
  background: #fff;
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
}

.dashboard__booking:hover {
  transform: translateY(-2px);
}

.dashboard__booking-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.dashboard__booking-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dashboard__booking-head h4 {
  font-size: 1.1rem;
  font-weight: 700;
}

.dashboard__badge-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.dashboard__badge-status--pending {
  background: #fef3c7;
  color: #92400e;
}

.dashboard__badge-status--verified {
  background: #dcfce7;
  color: #166534;
}

.dashboard__badge-status--rejected {
  background: #fee2e2;
  color: #991b1b;
}

.dashboard__booking-meta {
  font-size: 0.85rem;
  color: var(--color-gray, #727586);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dashboard__booking-id {
  font-family: monospace;
  font-size: 0.72rem;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  color: #64748b;
  letter-spacing: 0.5px;
}

.dashboard__booking-date {
  font-size: 0.78rem;
  color: #94a3b8;
  white-space: nowrap;
}

.dashboard__booking-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  background: #f8fafc;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.dashboard__booking-info div {
  display: flex;
  flex-direction: column;
}

.dashboard__booking-info span {
  font-size: 0.72rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.dashboard__booking-info strong {
  font-size: 0.92rem;
  color: #11120f;
  margin-top: 2px;
}

/* ===== PROOF ===== */
.dashboard__proof {
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
}

.dashboard__proof p {
  font-size: 0.85rem;
  font-weight: 600;
  color: #854d0e;
  margin-bottom: 10px;
}

.dashboard__proof-img {
  max-width: 100%;
  max-height: 280px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: transform 0.2s;
}

.dashboard__proof-img:hover {
  transform: scale(1.02);
}

.dashboard__proof--empty {
  color: #94a3b8;
  text-align: center;
  font-size: 0.85rem;
}

/* ===== ACTION BUTTONS ===== */
.dashboard__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dashboard__btn-verify {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
}

.dashboard__btn-verify:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(22, 163, 74, 0.35);
}

.dashboard__btn-verify:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.dashboard__btn-reject {
  padding: 12px 20px;
  border: 2px solid #fecaca;
  border-radius: 12px;
  background: #fff;
  color: #dc2626;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.dashboard__btn-reject:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #dc2626;
}

.dashboard__btn-reject:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.dashboard__btn-spin {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ===== LOADING ===== */
.dashboard__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 48px 24px;
  color: #94a3b8;
}

.dashboard__loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(91, 141, 239, 0.2);
  border-top-color: #5b8def;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== LIGHTBOX ===== */
.dashboard__lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  cursor: pointer;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dashboard__lightbox-inner {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  cursor: default;
}

.dashboard__lightbox-inner img {
  max-width: 100%;
  max-height: 85vh;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.dashboard__lightbox-close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== PROOF SECTION ===== */
.dashboard__proof-section {
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}
.dashboard__proof-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.dashboard__proof-head h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}
.dashboard__proof-sub {
  font-size: 0.82rem;
  color: #64748b;
}
.dashboard__proof-refresh {
  background: #0d1b2b;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
.dashboard__proof-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.dashboard__proof-links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0 0 14px;
}
.dashboard__proof-link {
  display: inline-block;
  background: #0d9488;
  color: #fff;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}
.dashboard__proof-link:hover {
  background: #0f766e;
}
.dashboard__proof-status {
  font-size: 0.85rem;
  color: #dc2626;
  margin: 0 0 14px;
}
.dashboard__proof-status--ok {
  color: #64748b;
}
.dashboard__proof-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.dashboard__proof-card {
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 10px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dashboard__proof-thumb {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  cursor: zoom-in;
  border: 1px solid #e2e8f0;
  background: #fff;
}
.dashboard__proof-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.75rem;
  cursor: default;
}
.dashboard__proof-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dashboard__proof-name {
  font-size: 0.8rem;
  color: #334155;
  margin: 0;
  word-break: break-all;
}
.dashboard__proof-date {
  font-size: 0.72rem;
  color: #94a3b8;
  margin: 0;
}
.dashboard__proof-delete {
  align-self: flex-start;
  background: none;
  border: 1.5px solid #fecaca;
  color: #dc2626;
  border-radius: 8px;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.dashboard__proof-delete:hover {
  background: #fef2f2;
}

/* ===== CALENDAR (same as before) ===== */
.dashboard__villa {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.dashboard__villa-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard__villa-img {
  width: 80px;
  height: 56px;
  object-fit: cover;
  border-radius: 10px;
}

.dashboard__villa-header h3 {
  font-size: 1.15rem;
  font-weight: 600;
}

.dashboard__villa-meta {
  font-size: 0.85rem;
  color: var(--color-gray, #727586);
}

.dashboard__badge {
  margin-left: auto;
  background: #fef3c7;
  color: #92400e;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.dashboard__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dashboard__nav button {
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.dashboard__nav button:hover {
  background: var(--color-gray-light, #f2f3f6);
}

.dashboard__month {
  font-weight: 600;
  font-size: 1rem;
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.dashboard__day-name {
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-gray, #727586);
  padding: 8px 0;
}

.dashboard__cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  background: none;
  font-family: inherit;
  position: relative;
}

.dashboard__cell:hover:not(:disabled):not(.dashboard__cell--past) {
  background: var(--color-gray-light, #f2f3f6);
}

.dashboard__cell--empty {
  cursor: default;
}

.dashboard__cell--past {
  color: #d0d0d0;
  cursor: not-allowed;
}

.dashboard__cell--blocked {
  background: #fef2f2;
  color: #991b1b;
  text-decoration: line-through;
  font-weight: 500;
}

.dashboard__cell--admin-blocked::after {
  content: "?";
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.6rem;
  color: #dc2626;
}

.dashboard__calendar-wrap {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ===== ERROR & EMPTY ===== */
.dashboard__bookings-error {
  background: #fee2e2;
  color: #b91c1c;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 0.9rem;
}

.dashboard__retry {
  background: #5b8def;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
}

.dashboard__empty {
  text-align: center;
  color: #94a3b8;
  padding: 60px 20px;
}

.dashboard__empty-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

/* ===== INVOICE BUTTON ===== */
.dashboard__btn-invoice {
  padding: 12px 20px;
  border: 2px solid #c7d2fe;
  border-radius: 12px;
  background: #fff;
  color: #4338ca;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.dashboard__btn-invoice:hover:not(:disabled) {
  background: #eef2ff;
  border-color: #6366f1;
}

/* ===== INVOICE MODAL ===== */
.invoice-modal {
  position: fixed;
  inset: 0;
  background: rgba(13, 27, 43, 0.6);
  z-index: 1100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
  animation: fadeIn 0.2s ease;
}

.invoice-modal__panel {
  background: #eef0f4;
  border-radius: 16px;
  width: 720px;
  max-width: 100%;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
}

.invoice-modal__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: #0d1b2b;
  color: #fff;
  flex-wrap: wrap;
}

.invoice-modal__title {
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.invoice-modal__id {
  font-family: monospace;
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.invoice-modal__tools {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.invoice-modal__btn {
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.invoice-modal__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invoice-modal__btn--pdf {
  background: #5b8def;
  color: #fff;
}

.invoice-modal__btn--png {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.invoice-modal__btn--close {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 8px 12px;
}

.invoice-modal__scroll {
  overflow-y: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
}

/* ===== INVOICE SHEET (A4 preview) ===== */
.invoice-sheet {
  width: 595px;
  max-width: 100%;
  min-height: 842px;
  background: #fff;
  font-family: Arial, Helvetica, sans-serif;
  display: flex;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  color: #1a1a1a;
}

.invoice-sheet__sidebar {
  width: 180px;
  flex-shrink: 0;
  background: linear-gradient(to bottom, #f09a59 0%, #e87a30 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  color: #fff;
  overflow: hidden;
}

.invoice-sheet__sidebar-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 60px 200px, rgba(255,255,255,0.10) 0, transparent 180px),
    radial-gradient(circle at 50px 600px, rgba(255,255,255,0.10) 0, transparent 160px);
}

.invoice-sheet__sidebar-top {
  padding: 30px 20px 20px;
  position: relative;
  z-index: 1;
}

.invoice-sheet__title-large {
  font-size: 34px;
  font-weight: 900;
  color: #fff;
  line-height: 1;
  letter-spacing: -0.5px;
  text-transform: uppercase;
  font-family: 'Arial Black', Impact, sans-serif;
}

.invoice-sheet__brand {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.1;
  margin-top: 5px;
  letter-spacing: 0.5px;
}

.invoice-sheet__sep {
  height: 1.5px;
  background: rgba(255, 255, 255, 0.4);
  margin: 0 20px;
  position: relative;
  z-index: 1;
}

.invoice-sheet__contact {
  padding: 18px 20px 0;
  position: relative;
  z-index: 1;
}

.invoice-sheet__label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.invoice-sheet__text {
  font-size: 11px;
  line-height: 1.4;
}

.invoice-sheet__text--small {
  font-size: 10px;
  line-height: 1.4;
}

.invoice-sheet__line {
  height: 1px;
  background: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.invoice-sheet__content {
  flex: 1;
  position: relative;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0,50 Q25,60 50,40 T100,50' fill='none' stroke='rgba(0,0,0,0.05)' stroke-width='1'/%3E%3C/svg%3E");
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
}

.invoice-sheet__header {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 24px;
}

.invoice-sheet__logo {
  width: 140px;
  height: 80px;
  background: #f5f5f5;
  border: 1px dashed #ccc;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 10px;
  letter-spacing: 1px;
}

.invoice-sheet__logo::after {
  content: "SUMMER VILLAS";
}

.invoice-sheet__date {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: #1a1a1a;
}

.invoice-sheet__guest {
  margin-bottom: 10px;
}

.invoice-sheet__guest-name {
  font-size: 18px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.invoice-sheet__guest-phone {
  font-size: 18px;
  margin-top: 2px;
}

.invoice-sheet__divider {
  height: 3px;
  background: #1a1a1a;
  width: 100%;
  margin-bottom: 12px;
}

.invoice-sheet__table {
  margin-bottom: 16px;
  width: 100%;
}

.invoice-sheet__row {
  display: flex;
  padding: 6px 8px;
  font-size: 11px;
}

.invoice-sheet__row--shade {
  background: #d9d9d9;
}

.invoice-sheet__row-key {
  width: 130px;
  flex-shrink: 0;
}

.invoice-sheet__row-val {
  margin-left: 6px;
}

.invoice-sheet__total-box {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 26px;
}

.invoice-sheet__total-box-num {
  background: #4d4d4d;
  border-radius: 8px;
  padding: 12px 25px;
  min-width: 150px;
  text-align: center;
  color: #fff;
  font-size: 24px;
  letter-spacing: 1px;
}

.invoice-sheet__note {
  margin-top: auto;
  margin-bottom: 20px;
}

.invoice-sheet__note-title {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 1px;
  font-family: 'Arial Black', Impact, sans-serif;
  margin-bottom: 10px;
}

.invoice-sheet__note-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
}

.invoice-sheet__note-bullet {
  width: 8px;
  height: 14px;
  background: #f09a59;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  margin-top: 2px;
  flex-shrink: 0;
}

.invoice-sheet__note-text {
  font-size: 10px;
  line-height: 1.4;
}

.invoice-sheet__footer {
  text-align: center;
  font-size: 18px;
  font-style: italic;
  color: #e87a30;
  letter-spacing: 1px;
  font-family: Georgia, serif;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 640px) {
  .dashboard__stats,
  .dashboard__stats--5 {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard__booking-info {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard__booking-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .dashboard__actions {
    flex-direction: column;
  }
  .dashboard__btn-verify,
  .dashboard__btn-reject {
    width: 100%;
    justify-content: center;
  }
  .dashboard__btn-invoice {
    width: 100%;
    justify-content: center;
  }
  .invoice-modal {
    padding: 8px;
  }
  .invoice-sheet__sidebar {
    width: 130px;
  }
  .invoice-sheet__title-large {
    font-size: 26px;
  }
  .invoice-sheet__row-key {
    width: 100px;
  }
  .invoice-sheet__content {
    padding: 24px 18px;
  }
}
</style>
