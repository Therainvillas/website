<template>
  <div class="vf">
    <div class="vf__bar">
      <input
        v-model="search"
        type="text"
        class="vf__search"
        placeholder="Cari nama villa..."
      />

      <div class="vf__dropdown" ref="areaDrop">
        <button class="vf__drop-btn" @click="toggleDrop('area')">
          <span>Daerah</span>
          <span v-if="areaLabel" class="vf__drop-active">{{ areaLabel }}</span>
          <svg class="vf__chevron" :class="{ 'vf__chevron--open': openDrop === 'area' }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="vf__drop-menu" v-show="openDrop === 'area'">
          <label class="vf__drop-item">
            <input type="radio" value="" v-model="area" @change="openDrop = null" />
            <span>Semua Daerah</span>
          </label>
          <label v-for="o in areaOptions" :key="o.value" class="vf__drop-item">
            <input type="radio" :value="o.value" v-model="area" @change="openDrop = null" />
            <span>{{ o.label }}</span>
          </label>
        </div>
      </div>

      <div class="vf__dropdown" ref="priceDrop">
        <button class="vf__drop-btn" @click="toggleDrop('price')">
          <span>Harga</span>
          <span v-if="priceLabel" class="vf__drop-active">{{ priceLabel }}</span>
          <svg class="vf__chevron" :class="{ 'vf__chevron--open': openDrop === 'price' }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="vf__drop-menu" v-show="openDrop === 'price'">
          <label v-for="o in priceOptions" :key="o.value" class="vf__drop-item">
            <input type="radio" :value="o.value" v-model="priceRange" @change="openDrop = null" />
            <span>{{ o.label }}</span>
          </label>
        </div>
      </div>

      <div class="vf__dropdown" ref="capDrop">
        <button class="vf__drop-btn" @click="toggleDrop('cap')">
          <span>Kapasitas</span>
          <span v-if="capLabel" class="vf__drop-active">{{ capLabel }}</span>
          <svg class="vf__chevron" :class="{ 'vf__chevron--open': openDrop === 'cap' }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="vf__drop-menu" v-show="openDrop === 'cap'">
          <label v-for="o in capOptions" :key="o.value" class="vf__drop-item">
            <input type="radio" :value="o.value" v-model="capMin" @change="openDrop = null" />
            <span>{{ o.label }}</span>
          </label>
        </div>
      </div>

      <div class="vf__dropdown" ref="bedDrop">
        <button class="vf__drop-btn" @click="toggleDrop('bed')">
          <span>Kamar</span>
          <span v-if="bedLabel" class="vf__drop-active">{{ bedLabel }}</span>
          <svg class="vf__chevron" :class="{ 'vf__chevron--open': openDrop === 'bed' }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="vf__drop-menu" v-show="openDrop === 'bed'">
          <label v-for="o in bedOptions" :key="o.value" class="vf__drop-item">
            <input type="radio" :value="o.value" v-model="bedMin" @change="openDrop = null" />
            <span>{{ o.label }}</span>
          </label>
        </div>
      </div>

      <div class="vf__date">
        <label class="vf__date-label" for="vf-checkin">Tanggal Menginap</label>
        <div class="vf__date-row">
          <input
            id="vf-checkin"
            v-model="checkIn"
            type="date"
            class="vf__date-input"
            :min="todayStr"
            @focus="ensureSchedules()"
          />
        </div>
        <span class="vf__date-hint">
          {{ checkIn ? 'Villa otomatis difilter untuk ' + formatDateID(checkIn) : 'Pilih tanggal — villa langsung terfilter' }}
        </span>
      </div>

      <button
        v-if="hasFilter"
        class="vf__clear"
        @click="clearAll"
      >
        Reset
      </button>
    </div>

    <div class="vf__amenities">
      <button
        v-for="a in amenityOptions"
        :key="a.value"
        class="vf__amenity-btn"
        :class="{ 'vf__amenity-btn--on': selectedAmenities.includes(a.value) }"
        @click="toggleAmenity(a.value)"
      >
        {{ a.label }}
      </button>
    </div>

    <div class="vf__count">
      Menampilkan <strong>{{ filtered.length }}</strong> dari {{ villas.length }} villa<span v-if="checkIn"> yang tersedia pada <strong>{{ formatDateID(checkIn) }}</strong></span>
    </div>

    <p v-if="checkIn && scheduleLoading" class="vf__notice vf__notice--loading">
      <span class="vf__spinner"></span> Memeriksa jadwal terbaru dari sheet…
    </p>
    <p v-else-if="checkIn && scheduleNotice" class="vf__notice">{{ scheduleNotice }}</p>

    <div class="vf__grid">
      <div v-for="villa in paginated" :key="villa.id" class="vf__card-wrap">
        <a :href="villaHref(villa)" class="vf-card">
          <div class="vf-card__media">
            <img :src="villa.image" :alt="villa.name" loading="lazy" />
            <span v-if="villa.badge" class="vf-card__badge">{{ villa.badge }}</span>
            <span v-if="checkIn && isVillaAvailable(villa, checkIn)" class="vf-card__available">Tersedia</span>
            <span
              v-if="discountPercent(villa) > 0"
              class="vf-card__discount"
              :aria-label="`Diskon ${discountPercent(villa)} persen`"
            >
              <strong>-{{ discountPercent(villa) }}%</strong>
              <small>Hemat</small>
            </span>
            <span class="vf-card__price">
              <s v-if="villa.originalPrice && villa.originalPrice > villa.price" class="vf-card__price-old">{{ formatPrice(villa.originalPrice) }}</s>
              <span>{{ villa.priceLabel || formatPrice(villa.price) }}</span>
            </span>
          </div>
          <div class="vf-card__body">
            <h3 class="vf-card__title">{{ villa.name }}</h3>
            <p v-if="villa.area" class="vf-card__area">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {{ villa.area }}<template v-if="villa.region">, {{ villa.region }}</template>
            </p>
            <p class="vf-card__desc">{{ villa.description }}</p>
            <ul class="vf-card__stats">
              <li><span class="vf-card__stat-icon"><svg viewBox="0 0 128 128" aria-hidden="true"><use class="ti ti--light" href="/icon/svg/bed.svg#light"></use><use class="ti ti--dark" href="/icon/svg/bed.svg#dark"></use></svg></span> <strong>{{ villa.bedrooms }}</strong> kamar</li>
              <li><span class="vf-card__stat-icon"><svg viewBox="0 0 128 128" aria-hidden="true"><use class="ti ti--light" href="/icon/svg/bathroom.svg#light"></use><use class="ti ti--dark" href="/icon/svg/bathroom.svg#dark"></use></svg></span> <strong>{{ villa.bathrooms }}</strong> mandi</li>
              <li><span class="vf-card__stat-icon"><svg viewBox="0 0 128 128" aria-hidden="true"><use class="ti ti--light" href="/icon/svg/groupp.svg#light"></use><use class="ti ti--dark" href="/icon/svg/groupp.svg#dark"></use></svg></span> <strong>{{ villa.capacity }}</strong> tamu</li>
              <li><span class="vf-card__stat-icon"><svg viewBox="0 0 128 128" aria-hidden="true"><use class="ti ti--light" href="/icon/svg/parking.svg#light"></use><use class="ti ti--dark" href="/icon/svg/parking.svg#dark"></use></svg></span> <strong>{{ villa.parking }}</strong> parkir</li>
            </ul>
            <div class="vf-card__tags">
              <span v-if="villa.busAccess" class="vf-card__tag vf-card__tag--bus">Bus 3/4</span>
              <span v-for="tag in villaAmenities(villa).slice(0, villa.busAccess ? 3 : 4)" :key="tag" class="vf-card__tag">{{ tag }}</span>
            </div>
            <span class="vf-card__btn">Lihat Detail</span>
          </div>
        </a>
      </div>
    </div>

    <div v-if="filtered.length === 0" class="vf__empty">
      <p v-if="checkIn">Tidak ada villa yang tersedia pada {{ formatDateID(checkIn) }}. Coba pilih tanggal lain.</p>
      <p v-else>Tidak ada villa yang cocok dengan filter Anda.</p>
      <button class="vf__clear" @click="clearAll">Reset Filter</button>
    </div>

    <div v-if="showLoadMore" class="vf__more">
      <button class="vf__more-btn" @click="showMore">Tampilkan Lebih Banyak</button>
    </div>
  </div>
</template>

<script>
import {
  fetchVillaSchedule,
  isScheduleCacheFresh,
  readAdminBlockedDates,
  readAdminScheduleCache,
  readScheduleCache,
  writeScheduleCache,
} from '../data/scheduleApi.js';
import { withTrailingSlash } from '../utils/url.js';

const PRICE_OPTIONS = [
  { label: 'Semua Harga', value: '' },
  { label: 'Sampai Rp 1.000.000', value: '0-1000000' },
  { label: 'Rp 1.000.000 - 1.500.000', value: '1000000-1500000' },
  { label: 'Rp 1.500.000 - 2.000.000', value: '1500000-2000000' },
  { label: 'Rp 2.000.000 - 3.000.000', value: '2000000-3000000' },
  { label: 'Di atas Rp 3.000.000', value: '3000000-999999999' },
];

const CAP_OPTIONS = [
  { label: 'Semua', value: 0 },
  { label: '10+ tamu', value: 10 },
  { label: '20+ tamu', value: 20 },
  { label: '30+ tamu', value: 30 },
  { label: '50+ tamu', value: 50 },
];

const BED_OPTIONS = [
  { label: 'Semua', value: 0 },
  { label: '1+ kamar', value: 1 },
  { label: '2+ kamar', value: 2 },
  { label: '3+ kamar', value: 3 },
  { label: '5+ kamar', value: 5 },
];

const AMENITY_OPTIONS = [
  { label: 'Gazebo', value: 'gazebo' },
  { label: 'Playground', value: 'playground' },
  { label: 'Mountain View', value: 'mountain' },
  { label: 'Bus 3/4', value: 'bus' },
];

const AMENITY_KEYWORDS = {
  gazebo: ['gazebo'],
  playground: ['playground'],
  mountain: ['mountain', 'pegunungan', 'view'],
};

const PAGE_SIZE = 12;

export default {
  props: {
    villas: { type: Array, required: true },
  },
  data() {
    return {
      search: '',
      area: '',
      priceRange: '',
      capMin: 0,
      bedMin: 0,
      selectedAmenities: [],
      openDrop: null,
      visibleCount: PAGE_SIZE,
      priceOptions: PRICE_OPTIONS,
      capOptions: CAP_OPTIONS,
      bedOptions: BED_OPTIONS,
      amenityOptions: AMENITY_OPTIONS,
      checkIn: '',
      scheduleDates: {},
      scheduleLoading: false,
      scheduleNotice: '',
      schedulesFetchedAt: 0,
      scheduleTimer: null,
    };
  },
  computed: {
    areaLabel() {
      const o = this.areaOptions.find(o => o.value === this.area);
      return o ? o.label : '';
    },
    areaOptions() {
      const seen = new Map();
      this.villas.forEach((v) => {
        if (!v.area || seen.has(v.area)) return;
        seen.set(v.area, v.region ? `${v.area}, ${v.region}` : v.area);
      });
      return Array.from(seen, ([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'id'));
    },
    priceLabel() {
      const o = PRICE_OPTIONS.find(o => o.value === this.priceRange);
      return o && o.value ? o.label : '';
    },
    capLabel() {
      const o = CAP_OPTIONS.find(o => o.value === this.capMin);
      return o && o.value ? o.label : '';
    },
    bedLabel() {
      const o = BED_OPTIONS.find(o => o.value === this.bedMin);
      return o && o.value ? o.label : '';
    },
    hasFilter() {
      return this.search || this.area || this.priceRange || this.capMin || this.bedMin || this.selectedAmenities.length || this.checkIn;
    },
    todayStr() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    filtered() {
      let list = this.villas;
      if (this.search) {
        const q = this.search.toLowerCase();
        list = list.filter(v => v.name.toLowerCase().includes(q));
      }
      if (this.area) {
        list = list.filter(v => v.area === this.area);
      }
      if (this.priceRange) {
        const [min, max] = this.priceRange.split('-').map(Number);
        list = list.filter(v => v.price >= min && v.price <= max);
      }
      if (this.capMin) {
        list = list.filter(v => v.capacity >= this.capMin);
      }
      if (this.bedMin) {
        list = list.filter(v => v.bedrooms >= this.bedMin);
      }
      if (this.selectedAmenities.length) {
        list = list.filter(v => {
          const text = v.amenities.join(' ').toLowerCase();
          return this.selectedAmenities.every(key => {
            if (key === 'bus') return v.busAccess === true;
            return AMENITY_KEYWORDS[key].some(kw => text.includes(kw));
          });
        });
      }
      if (this.checkIn) {
        list = list.filter(v => this.isVillaAvailable(v, this.checkIn));
      }
      return list;
    },
    paginated() {
      return this.filtered.slice(0, this.visibleCount);
    },
    showLoadMore() {
      return this.visibleCount < this.filtered.length;
    },
  },
  watch: {
    search() {
      this.visibleCount = PAGE_SIZE;
    },
    area() {
      this.visibleCount = PAGE_SIZE;
    },
    priceRange() {
      this.visibleCount = PAGE_SIZE;
    },
    capMin() {
      this.visibleCount = PAGE_SIZE;
    },
    bedMin() {
      this.visibleCount = PAGE_SIZE;
    },
    selectedAmenities: {
      deep: true,
      handler() {
        this.visibleCount = PAGE_SIZE;
      },
    },
    checkIn(value) {
      this.visibleCount = PAGE_SIZE;
      if (value) this.ensureSchedules();
    },
  },
  methods: {
    formatPrice(n) {
      if (!n) return 'Cek harga';
      return 'Rp ' + Number(n).toLocaleString('id-ID');
    },
    discountPercent(villa) {
      const original = Number(villa && villa.originalPrice) || 0;
      const current = Number(villa && villa.price) || 0;
      if (!original || !current || original <= current) return 0;
      return Math.round((1 - current / original) * 100);
    },
    slugify(s) {
      return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    },
    villaHref(villa) {
      return withTrailingSlash(`/${this.slugify(villa.name)}`);
    },
    toggleDrop(name) {
      this.openDrop = this.openDrop === name ? null : name;
    },
    toggleAmenity(val) {
      const idx = this.selectedAmenities.indexOf(val);
      if (idx === -1) this.selectedAmenities.push(val);
      else this.selectedAmenities.splice(idx, 1);
    },
    clearAll() {
      this.search = '';
      this.area = '';
      this.priceRange = '';
      this.capMin = 0;
      this.bedMin = 0;
      this.selectedAmenities = [];
      this.checkIn = '';
    },
    formatDateID(value) {
      if (!value) return '';
      const d = new Date(value + 'T00:00:00');
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    },
    isVillaAvailable(villa, dateStr) {
      if (!dateStr || !villa) return true;
      const key = String(dateStr).slice(0, 10);
      return !this.getBlockedDates(villa).includes(key);
    },
    getBlockedDates(villa) {
      const set = new Set();

      // Tanggal tidak tersedia bawaan data villa.
      if (Array.isArray(villa.unavailable)) {
        villa.unavailable.forEach((d) => set.add(String(d).slice(0, 10)));
      }

      // Blokir manual admin (localStorage, key = id villa).
      readAdminBlockedDates(villa).forEach((d) => set.add(d));

      // Cache jadwal dari sheet yang ditulis panel admin (key = id villa).
      readAdminScheduleCache(villa).forEach((d) => set.add(d));

      // Jadwal sheet terbaru yang diambil langsung oleh filter ini.
      const live = this.scheduleDates[villa.id];
      if (Array.isArray(live)) live.forEach((d) => set.add(d));

      return Array.from(set);
    },
    loadCachedSchedules() {
      const map = {};
      let newest = 0;
      let allFresh = this.villas.length > 0;
      this.villas.forEach((villa) => {
        const entry = readScheduleCache(villa);
        const merged = new Set([
          ...entry.dates,
          ...readAdminScheduleCache(villa),
        ]);
        if (merged.size) map[villa.id] = Array.from(merged);
        if (entry.savedAt > newest) newest = entry.savedAt;
        if (!isScheduleCacheFresh(entry.savedAt)) allFresh = false;
      });
      this.scheduleDates = map;
      // Fetch ulang bila masih ada villa yang belum punya cache segar.
      this.schedulesFetchedAt = allFresh ? newest : 0;
    },
    async ensureSchedules(force = false) {
      if (this.scheduleLoading || !this.villas.length) return;
      if (!force && isScheduleCacheFresh(this.schedulesFetchedAt)) return;

      this.scheduleLoading = true;
      this.scheduleNotice = '';
      this.schedulesFetchedAt = Date.now();

      let failed = 0;
      await Promise.all(
        this.villas.map(async (villa) => {
          try {
            const dates = await fetchVillaSchedule(villa);
            this.scheduleDates = { ...this.scheduleDates, [villa.id]: dates };
            writeScheduleCache(villa, dates);
          } catch {
            // Pertahankan cache terakhir agar tanggal tetap terblok.
            failed += 1;
          }
        })
      );

      this.scheduleLoading = false;
      this.scheduleNotice = failed
        ? 'Sebagian jadwal gagal diperbarui — memakai data terakhir yang tersimpan.'
        : '';
    },
    villaAmenities(villa) {
      return villa.amenities || [];
    },
    showMore() {
      this.visibleCount += PAGE_SIZE;
    },
    handleClickOutside(e) {
      if (this.openDrop && !e.target.closest('.vf__dropdown')) {
        this.openDrop = null;
      }
    },
  },
  mounted() {
    this.loadCachedSchedules();
    // Prefetch diam-diam agar saat pengguna memilih tanggal, data sheet sudah siap.
    this.scheduleTimer = setTimeout(() => this.ensureSchedules(), 1500);
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    if (this.scheduleTimer) clearTimeout(this.scheduleTimer);
    document.removeEventListener('click', this.handleClickOutside);
  },
};
</script>

<style scoped>
.vf {
  width: 100%;
}

.vf__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.vf__search {
  flex: 1 1 220px;
  min-width: 0;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  background: var(--color-panel, #fff);
  color: var(--color-dark, #0f172a);
  font-size: 0.92rem;
  outline: none;
  transition: border-color 0.2s;
}

.vf__date {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vf__date-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-gray, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.vf__date-input {
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  background: var(--color-panel, #fff);
  color: var(--color-dark, #0f172a);
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.2s;
  color-scheme: light;
}

[data-theme="dark"] .vf__date-input {
  color-scheme: dark;
}

.vf__date-input:focus {
  border-color: #5b8def;
}

.vf__date-hint {
  font-size: 0.72rem;
  color: var(--color-gray, #6b7280);
  line-height: 1.4;
}

.vf__notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -8px 0 20px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.82rem;
  color: #64748b;
  background: rgba(91, 141, 239, 0.08);
  border: 1px solid rgba(91, 141, 239, 0.2);
}

.vf__notice--loading {
  color: #3b6fd4;
}

.vf__spinner {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 2px solid rgba(91, 141, 239, 0.25);
  border-top-color: #5b8def;
  border-radius: 50%;
  animation: vf-spin 0.8s linear infinite;
}

@keyframes vf-spin {
  to { transform: rotate(360deg); }
}

.vf__date-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.vf__date-row .vf__date-input {
  flex: 1 1 auto;
}

.vf__date-btn {
  height: 44px;
  padding: 0 20px;
  border: 1px solid #5b8def;
  border-radius: 12px;
  background: #5b8def;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  white-space: nowrap;
}

.vf__date-btn:hover {
  background: #4a7de0;
  transform: translateY(-1px);
}

.vf__date-btn:active {
  transform: translateY(0);
}

.vf__search:focus {
  border-color: #5b8def;
}

.vf__dropdown {
  position: relative;
}

.vf__drop-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  background: var(--color-panel, #fff);
  color: var(--color-dark, #0f172a);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s;
  white-space: nowrap;
}

.vf__drop-btn:hover {
  border-color: #5b8def;
}

.vf__drop-active {
  color: #5b8def;
  font-weight: 700;
}

.vf__chevron {
  transition: transform 0.2s;
}

.vf__chevron--open {
  transform: rotate(180deg);
}

.vf__drop-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 220px;
  background: var(--color-panel, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  z-index: 100;
  padding: 6px;
  overflow: hidden;
}

.vf__drop-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: background 0.15s;
}

.vf__drop-item:hover {
  background: rgba(91, 141, 239, 0.08);
}

.vf__drop-item input[type="radio"] {
  accent-color: #5b8def;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.vf__clear {
  height: 44px;
  padding: 0 18px;
  border: 1px solid #e74c3c;
  border-radius: 12px;
  background: transparent;
  color: #e74c3c;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.vf__clear:hover {
  background: #e74c3c;
  color: #fff;
}

.vf__amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.vf__amenity-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 20px;
  background: var(--color-panel, #fff);
  color: var(--color-dark, #0f172a);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.vf__amenity-btn:hover {
  border-color: #5b8def;
}

.vf__amenity-btn--on {
  border-color: #5b8def;
  background: rgba(91, 141, 239, 0.12);
  color: #3b6fd4;
}

.vf__count {
  font-size: 0.88rem;
  color: var(--color-muted, #64748b);
  margin-bottom: 24px;
}

.vf__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.vf-card {
  --tilt-rx: 0deg;
  --tilt-ry: 0deg;
  --tilt-gx: 50%;
  --tilt-gy: 50%;
  --tilt-glare: 0;
  --card-radius: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-panel, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--card-radius);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transform: none;
  transform-origin: center;
  transition: transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* Kilau tipis mengikuti kursor, hanya tampil saat hover. */
.vf-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 3;
  border-radius: inherit;
  pointer-events: none;
  opacity: var(--tilt-glare);
  background: radial-gradient(
    circle 190px at var(--tilt-gx) var(--tilt-gy),
    rgba(255, 255, 255, 0.24),
    rgba(255, 255, 255, 0) 70%
  );
  transition: opacity 0.3s ease;
}

/* Pengguna keyboard: kartu terangkat halus saat difokus. */
.vf-card:focus-visible {
  transform: translateY(-4px);
}

.vf-card.is-tilting {
  --tilt-glare: 1;
  z-index: 1;
  transform: perspective(700px) rotateX(var(--tilt-rx)) rotateY(var(--tilt-ry)) translateY(-6px);
  transition: transform 0.18s ease-out;
  will-change: transform;
}

/* Pastikan sudut tetap membulat penuh saat kartu diputar 3D,
   termasuk ketika kartu sedang kembali ke posisi semula. */
.vf-card.is-tilting,
.vf-card.is-resetting {
  clip-path: inset(0 round var(--card-radius));
}

/* Umpan balik tap di layar sentuh (tanpa tilt). */
.vf-card.is-pressed {
  transform: translateY(1px) scale(0.985);
  transition: transform 0.15s ease-out;
}

.vf-card__media {
  position: relative;
  display: block;
  height: 220px;
  overflow: hidden;
  border-radius: var(--card-radius) var(--card-radius) 0 0;
}

.vf-card__media > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vf-card__price {
  position: absolute;
  left: 14px;
  bottom: 14px;
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  background: rgba(91, 141, 239, 0.92);
  backdrop-filter: blur(4px);
}

.vf-card__price-old {
  font-size: 0.78em;
  font-weight: 600;
  opacity: 0.78;
}

.vf-card__badge {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 800;
  color: #4a2c00;
  background: linear-gradient(135deg, #ffd76a 0%, #ffb84d 55%, #ff9d2e 100%);
  box-shadow: 0 6px 18px rgba(255, 170, 40, 0.45);
  letter-spacing: 0.2px;
}

.vf-card__available {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 800;
  color: #fff;
  background: rgba(22, 163, 74, 0.95);
  box-shadow: 0 6px 18px rgba(22, 163, 74, 0.35);
  letter-spacing: 0.2px;
}

.vf-card__discount {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 2;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  padding: 6px 10px 7px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #ff3d6e 0%, #ff7a18 100%);
  box-shadow: 0 8px 20px rgba(255, 61, 110, 0.45);
  transform: rotate(-3deg);
  transition: transform 0.35s ease;
}

.vf-card__discount strong {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.2px;
}

.vf-card__discount small {
  margin-top: 2px;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.92;
}

.vf-card:hover .vf-card__discount {
  transform: rotate(-3deg);
}

@media (prefers-reduced-motion: reduce) {
  .vf-card__discount {
    transition: none;
  }

  .vf-card,
  .vf-card.is-tilting,
  .vf-card.is-pressed,
  .vf-card:focus-visible {
    transform: none;
    transition: none;
  }

  .vf-card::after {
    display: none;
  }
}

.vf-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px;
}

.vf-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 6px;
  color: var(--color-dark, #0f172a);
}

.vf-card__area {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 0 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #5b8def;
}

.vf-card__area svg {
  flex: none;
}

.vf-card__desc {
  color: var(--color-muted, #64748b);
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vf-card__stats {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0;
  margin: 0 0 14px;
}

.vf-card__stats li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--color-gray, #64748b);
}

.vf-card__stats strong {
  color: var(--color-dark, #0f172a);
}

.vf-card__stat-icon {
  display: inline-flex;
  flex-shrink: 0;
}

.vf-card__stat-icon svg {
  width: 16px;
  height: 16px;
  display: block;
}

.vf-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: auto 0 16px;
}

.vf-card__tag {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(91, 141, 239, 0.08);
  color: #5b8def;
}

.vf-card__tag--bus {
  background: rgba(16, 185, 129, 0.12);
  color: #0f9f6e;
}

.vf-card__btn {
  display: block;
  text-align: center;
  padding: 11px 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  background: linear-gradient(135deg, #5b8def 0%, #7a5ce0 100%);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.vf-card:hover .vf-card__btn {
  opacity: 0.9;
  transform: translateY(-2px);
}

.vf__empty {
  text-align: center;
  padding: 60px 20px;
}

.vf__empty p {
  font-size: 1.1rem;
  color: var(--color-muted, #64748b);
  margin-bottom: 20px;
}

.vf__more {
  text-align: center;
  margin-top: 40px;
}

.vf__more-btn {
  padding: 14px 36px;
  border: 2px solid #5b8def;
  border-radius: 12px;
  background: transparent;
  color: #5b8def;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.vf__more-btn:hover {
  background: #5b8def;
  color: #fff;
}

@media (max-width: 768px) {
  .vf__bar {
    flex-direction: column;
  }

  .vf__search {
    height: 36px;
    font-size: 0.82rem;
    padding: 0 12px;
    border-radius: 10px;
    line-height: 22.528px;
  }

  .vf__search,
  .vf__dropdown,
  .vf__date {
    width: 100%;
  }

  .vf__date-input {
    height: 36px;
    font-size: 0.82rem;
    padding: 0 12px;
    border-radius: 10px;
  }

  .vf__date-row {
    flex-direction: column;
  }

  .vf__date-btn {
    height: 36px;
    font-size: 0.82rem;
    padding: 0 14px;
    border-radius: 10px;
  }

  .vf__drop-btn {
    width: 100%;
    justify-content: space-between;
  }

  .vf__drop-menu {
    left: 0;
    right: 0;
  }

  .vf__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .vf-card__media {
    height: 190px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .vf__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
