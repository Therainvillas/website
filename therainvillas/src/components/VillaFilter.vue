<template>
  <div class="vf">
    <div class="vf__bar">
      <input
        v-model="search"
        type="text"
        class="vf__search"
        placeholder="Cari nama villa..."
      />

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
        <span class="vf__amenity-icon">{{ a.icon }}</span>
        {{ a.label }}
      </button>
    </div>

    <div class="vf__count">
      Menampilkan <strong>{{ filtered.length }}</strong> dari {{ villas.length }} villa
    </div>

    <div class="vf__grid">
      <div v-for="villa in paginated" :key="villa.id" class="vf__card-wrap">
        <a :href="`/villas/${villa.id}`" class="vf-card">
          <div class="vf-card__media">
            <img :src="villa.image" :alt="villa.name" loading="lazy" />
            <span class="vf-card__price">{{ villa.priceLabel || formatPrice(villa.price) }}</span>
          </div>
          <div class="vf-card__body">
            <h3 class="vf-card__title">{{ villa.name }}</h3>
            <p class="vf-card__desc">{{ villa.description }}</p>
            <ul class="vf-card__stats">
              <li><span class="vf-card__stat-icon"><img src="/icon/bed.png" alt="" /></span> <strong>{{ villa.bedrooms }}</strong> kamar</li>
              <li><span class="vf-card__stat-icon"><img src="/icon/bathtub.png" alt="" /></span> <strong>{{ villa.bathrooms }}</strong> mandi</li>
              <li><span>👥</span> <strong>{{ villa.capacity }}</strong> tamu</li>
              <li><span>🅿️</span> <strong>{{ villa.parking }}</strong> parkir</li>
            </ul>
            <div class="vf-card__tags">
              <span v-for="tag in villaAmenities(villa).slice(0, 4)" :key="tag" class="vf-card__tag">{{ tag }}</span>
            </div>
            <span class="vf-card__btn">Lihat Detail</span>
          </div>
        </a>
      </div>
    </div>

    <div v-if="filtered.length === 0" class="vf__empty">
      <p>Tidak ada villa yang cocok dengan filter Anda.</p>
      <button class="vf__clear" @click="clearAll">Reset Filter</button>
    </div>

    <div v-if="showLoadMore" class="vf__more">
      <button class="vf__more-btn" @click="showMore">Tampilkan Lebih Banyak</button>
    </div>
  </div>
</template>

<script>
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
  { label: 'Private Pool', value: 'pool', icon: '🏊' },
  { label: 'Billiard', value: 'billiard', icon: '🎱' },
  { label: 'Karaoke', value: 'karaoke', icon: '🎤' },
  { label: 'BBQ', value: 'bbq', icon: '🔥' },
  { label: 'Kitchen Set', value: 'kitchen', icon: '🍳' },
  { label: 'Gazebo', value: 'gazebo', icon: '🏡' },
  { label: 'Playground', value: 'playground', icon: '🎠' },
  { label: 'Mountain View', value: 'mountain', icon: '🏔️' },
  { label: 'WiFi & TV', value: 'wifi', icon: '📶' },
];

const AMENITY_KEYWORDS = {
  pool: ['private pool', 'pool'],
  billiard: ['billiard'],
  karaoke: ['karaoke'],
  bbq: ['bbq', 'api unggun'],
  kitchen: ['kitchen'],
  gazebo: ['gazebo'],
  playground: ['playground'],
  mountain: ['mountain', 'pegunungan', 'view'],
  wifi: ['wifi', 'smart tv'],
};

const PAGE_SIZE = 12;

export default {
  props: {
    villas: { type: Array, required: true },
  },
  data() {
    return {
      search: '',
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
    };
  },
  computed: {
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
      return this.search || this.priceRange || this.capMin || this.bedMin || this.selectedAmenities.length;
    },
    filtered() {
      let list = this.villas;
      if (this.search) {
        const q = this.search.toLowerCase();
        list = list.filter(v => v.name.toLowerCase().includes(q));
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
          return this.selectedAmenities.every(key =>
            AMENITY_KEYWORDS[key].some(kw => text.includes(kw))
          );
        });
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
    hasFilter() {
      this.visibleCount = PAGE_SIZE;
    },
  },
  methods: {
    formatPrice(n) {
      if (!n) return 'Cek harga';
      return 'Rp ' + Number(n).toLocaleString('id-ID');
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
      this.priceRange = '';
      this.capMin = 0;
      this.bedMin = 0;
      this.selectedAmenities = [];
    },
    showMore() {
      this.visibleCount += PAGE_SIZE;
    },
    villaAmenities(villa) {
      return villa.amenities || [];
    },
    handleClickOutside(e) {
      if (this.openDrop && !e.target.closest('.vf__dropdown')) {
        this.openDrop = null;
      }
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
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

.vf__amenity-icon {
  font-size: 0.95rem;
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
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-panel, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 20px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.35s ease, box-shadow 0.35s ease;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.vf-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 44px rgba(91, 141, 239, 0.18);
}

.vf-card__media {
  position: relative;
  display: block;
  height: 220px;
  overflow: hidden;
}

.vf-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.vf-card:hover .vf-card__media img {
  transform: scale(1.06);
}

.vf-card__price {
  position: absolute;
  left: 14px;
  bottom: 14px;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  background: rgba(91, 141, 239, 0.92);
  backdrop-filter: blur(4px);
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
  margin: 0 0 8px;
  color: var(--color-dark, #0f172a);
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

.vf-card__stat-icon img {
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

  .vf__search,
  .vf__dropdown {
    width: 100%;
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
    grid-template-columns: 1fr;
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
