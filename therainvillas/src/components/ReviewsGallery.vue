<template>
  <div class="rg">
    <div v-if="villas.length" class="rg__grid">
      <div
        v-for="villa in villas"
        :key="villa.id"
        class="rg__card"
        :class="{ 'rg__card--active': selectedId === villa.id }"
        @click="selectVilla(villa.id)"
      >
        <div class="rg__img-wrap">
          <img :src="villa.image" :alt="villa.name" loading="lazy" />
        </div>
        <div class="rg__body">
          <h3 class="rg__name">{{ villa.name }}</h3>
          <div v-if="summary[villaKey(villa.name)]" class="rg__rating">
            <span class="rg__stars">
              <span v-for="n in 5" :key="n" :class="{ on: n <= Math.round(summary[villaKey(villa.name)].average) }">★</span>
            </span>
            <strong>{{ summary[villaKey(villa.name)].average.toFixed(1) }}</strong>
            <span class="rg__count">({{ summary[villaKey(villa.name)].count }})</span>
          </div>
          <div v-else class="rg__rating rg__rating--none">
            <span class="rg__stars"><span v-for="n in 5" :key="n">★</span></span>
            <span class="rg__count">Belum ada ulasan</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="rg__loading">
      <div class="rg__spinner"></div>
      <span>Memuat ulasan...</span>
    </div>
    <div v-if="error" class="rg__empty">{{ error }}</div>

    <div v-if="selectedVilla" class="rg__detail">
      <h2 class="rg__detail-title">Ulasan {{ selectedVilla.name }}</h2>
      <div class="rg__detail-rating">
        <span class="rg__big-score">{{ (selectedSummary.average || 0).toFixed(1) }}</span>
        <div>
          <span class="rg__stars rg__stars--big">
            <span v-for="n in 5" :key="n" :class="{ on: n <= Math.round(selectedSummary.average || 0) }">★</span>
          </span>
          <span class="rg__detail-count">{{ selectedSummary.count || 0 }} ulasan</span>
        </div>
      </div>

      <div v-if="selectedReviews.length === 0" class="rg__empty">
        Belum ada ulasan. Jadilah yang pertama!
      </div>
      <div v-else class="rg__reviews">
        <div v-for="(r, i) in selectedReviews" :key="i" class="rg__review">
          <div class="rg__review-head">
            <div class="rg__avatar">{{ (r.name || 'T').charAt(0).toUpperCase() }}</div>
            <div>
              <strong>{{ r.name || 'Tamu Anonim' }}</strong>
              <div class="rg__stars rg__stars--sm">
                <span v-for="n in 5" :key="n" :class="{ on: n <= Number(r.rating) }">★</span>
              </div>
            </div>
            <span v-if="r.timestamp" class="rg__date">{{ formatDate(r.timestamp) }}</span>
          </div>
          <p class="rg__text">"{{ r.message }}"</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { REVIEWS_API_URL, sampleReviews, parseReviews, computeVillaSummary, normalizeVillaName } from '../data/reviews.js';

export default {
  data() {
    return {
      villas: [],
      allReviews: [],
      summary: {},
      selectedId: null,
      loading: true,
      error: '',
    };
  },
  computed: {
    selectedVilla() {
      return this.villas.find((v) => v.id === this.selectedId) || null;
    },
    selectedSummary() {
      return this.summary[this.villaKey(this.selectedVilla ? this.selectedVilla.name : '')] || { count: 0, average: 0 };
    },
    selectedReviews() {
      if (!this.selectedVilla) return [];
      const key = this.villaKey(this.selectedVilla.name);
      return (this.summary[key] && this.summary[key].reviews) || [];
    },
  },
  async mounted() {
    const mod = await import('../data/villas.js');
    this.villas = mod.villas;
    if (this.villas.length) this.selectedId = this.villas[0].id;
    try {
      const url = REVIEWS_API_URL + '?action=reviews&_=' + Date.now();
      const data = await this.fetchWithFallback(url);
      let all = parseReviews(data);
      if (!all.length) all = sampleReviews;
      this.allReviews = all;
      this.summary = computeVillaSummary(all);
      this.preselectVillaWithReviews();
    } catch (e) {
      this.error = 'Gagal memuat ulasan.';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    villaKey(name) {
      return normalizeVillaName(name);
    },
    selectVilla(id) {
      this.selectedId = id;
    },
    preselectVillaWithReviews() {
      const withReviews = this.villas.find((v) => {
        const s = this.summary[this.villaKey(v.name)];
        return s && s.count > 0;
      });
      if (withReviews) this.selectedId = withReviews.id;
    },
    async fetchWithFallback(url) {
      try {
        const res = await fetch(url, { redirect: 'follow', cache: 'no-store' });
        const text = await res.text();
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          const m = text.match(/\(([\s\S]*)\)\s*;?\s*$/);
          if (m) {
            try { data = JSON.parse(m[1]); } catch (e2) { data = null; }
          }
        }
        if (data && (Array.isArray(data.reviews) || data.error)) return data;
        throw new Error('no data');
      } catch (e) {
        return this.fetchJSONP(url);
      }
    },
    fetchJSONP(url) {
      return new Promise((resolve) => {
        const cb = 'cb_rg_' + Date.now();
        const timer = setTimeout(() => {
          delete window[cb];
          resolve({ reviews: sampleReviews });
        }, 8000);
        window[cb] = (data) => {
          clearTimeout(timer);
          delete window[cb];
          resolve(data || { reviews: sampleReviews });
        };
        const script = document.createElement('script');
        script.src = url + '&callback=' + cb;
        script.onerror = () => {
          clearTimeout(timer);
          delete window[cb];
          resolve({ reviews: sampleReviews });
        };
        document.head.appendChild(script);
      });
    },
    formatDate(ts) {
      if (!ts) return '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },
  },
};
</script>

<style scoped>
.rg__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.rg__card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: all 0.2s;
}
.rg__card:hover {
  transform: translateY(-3px);
}
.rg__card--active {
  border-color: #5b8def;
}
.rg__img-wrap {
  height: 130px;
  overflow: hidden;
}
.rg__img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rg__body {
  padding: 14px;
}
.rg__name {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 6px;
}
.rg__rating {
  display: flex;
  align-items: center;
  gap: 6px;
}
.rg__rating strong {
  color: #a08bff;
}
.rg__count {
  color: #94a3b8;
  font-size: 0.82rem;
}
.rg__stars {
  color: #d1d5db;
  font-size: 1rem;
  display: inline-flex;
}
.rg__stars .on {
  color: #a08bff;
}
.rg__stars--big {
  font-size: 1.4rem;
}
.rg__stars--sm {
  font-size: 0.8rem;
}
.rg__rating--none .rg__count {
  font-style: italic;
}
.rg__loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  padding: 20px 0;
}
.rg__spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(91,141,239,0.2);
  border-top-color: #5b8def;
  border-radius: 50%;
  animation: rg-spin 0.8s linear infinite;
}
@keyframes rg-spin { to { transform: rotate(360deg); } }
.rg__empty {
  color: #94a3b8;
  padding: 20px 0;
}
.rg__detail {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 6px 24px rgba(0,0,0,0.05);
}
.rg__detail-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.rg__detail-rating {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff7ed;
  border-radius: 14px;
  border: 1px solid #fed7aa;
}
.rg__big-score {
  font-size: 2.4rem;
  font-weight: 800;
  color: #7a5ce0;
}
.rg__detail-count {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-left: 8px;
}
.rg__reviews {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rg__review {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}
.rg__review-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.rg__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #5b8def;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}
.rg__date {
  margin-left: auto;
  font-size: 0.8rem;
  color: #94a3b8;
}
.rg__text {
  font-size: 0.92rem;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .rg__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .rg__grid {
    grid-template-columns: 1fr;
  }
}
</style>
