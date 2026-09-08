<template>
  <div class="vr">
    <div class="vr__head">
      <h3 class="vr__title">Ulasan Penyewa</h3>
      <div v-if="summary" class="vr__rating-summary">
        <span class="vr__stars">
          <span v-for="n in 5" :key="n" class="vr__star" :class="{ 'vr__star--on': n <= Math.round(summary.average) }">★</span>
        </span>
        <span class="vr__score">{{ summary.average.toFixed(1) }}</span>
        <span class="vr__count">({{ summary.count }} ulasan)</span>
      </div>
    </div>

    <div v-if="loading" class="vr__loading">
      <div class="vr__spinner"></div>
      <span>Memuat ulasan...</span>
    </div>

    <div v-else-if="error" class="vr__empty">{{ error }}</div>

    <div v-else-if="reviews.length === 0" class="vr__empty">
      Belum ada ulasan untuk villa ini. Jadilah yang pertama memberikan penilaian!
    </div>

    <div v-else class="vr__list">
      <div v-for="(r, i) in reviews" :key="i" class="vr__item">
        <div class="vr__item-head">
          <div class="vr__avatar">{{ initial(r.name) }}</div>
          <div class="vr__item-meta">
            <strong class="vr__name">{{ r.name || 'Tamu Anonim' }}</strong>
            <span class="vr__item-stars">
              <span v-for="n in 5" :key="n" :class="{ on: n <= Number(r.rating) }">★</span>
            </span>
          </div>
          <span v-if="r.timestamp" class="vr__date">{{ formatDate(r.timestamp) }}</span>
        </div>
        <p class="vr__text">"{{ r.message }}"</p>
      </div>
    </div>
  </div>
</template>

<script>
import { REVIEWS_API_URL, sampleReviews, parseReviews, computeVillaSummary, normalizeVillaName } from '../data/reviews.js';

export default {
  props: {
    villaId: { type: [String, Number], default: null },
    villaName: { type: String, default: '' },
  },
  data() {
    return {
      reviews: [],
      loading: true,
      error: '',
      summary: null,
    };
  },
  async mounted() {
    try {
      const url = REVIEWS_API_URL + '?action=reviews' + (this.villaName ? '&villa=' + encodeURIComponent(this.villaName) : '') + '&_=' + Date.now();
      const data = await this.fetchWithFallback(url);
      let all = parseReviews(data);
      if (!all.length) all = sampleReviews;
      const key = normalizeVillaName(this.villaName);
      if (key) {
        const filtered = all.filter((r) => normalizeVillaName(r.villa) === key);
        this.reviews = filtered.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      } else {
        this.reviews = all;
      }
      const summary = computeVillaSummary(all);
      this.summary = summary[key] || { count: 0, average: 0, reviews: [] };
    } catch (e) {
      this.error = 'Gagal memuat ulasan.';
    } finally {
      this.loading = false;
    }
  },
  methods: {
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
        const cb = 'cb_rev_' + Date.now();
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
    initial(name) {
      return (name || 'T').charAt(0).toUpperCase();
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
.vr__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.vr__title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}
.vr__rating-summary {
  display: flex;
  align-items: center;
  gap: 6px;
}
.vr__stars {
  display: inline-flex;
}
.vr__star {
  color: #d1d5db;
  font-size: 1rem;
}
.vr__star--on {
  color: #a08bff;
}
.vr__score {
  font-weight: 700;
  font-size: 1.1rem;
}
.vr__count {
  color: #94a3b8;
  font-size: 0.85rem;
}
.vr__loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  padding: 12px 0;
}
.vr__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(91,141,239,0.2);
  border-top-color: #5b8def;
  border-radius: 50%;
  animation: vr-spin 0.8s linear infinite;
}
@keyframes vr-spin { to { transform: rotate(360deg); } }
.vr__empty {
  color: #94a3b8;
  font-size: 0.9rem;
  padding: 16px 0;
}
.vr__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.vr__item {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  background: #f8fafc;
}
.vr__item-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.vr__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #5b8def;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}
.vr__item-meta {
  display: flex;
  flex-direction: column;
}
.vr__name {
  font-size: 0.92rem;
}
.vr__item-stars {
  color: #d1d5db;
  font-size: 0.85rem;
}
.vr__item-stars .on {
  color: #a08bff;
}
.vr__date {
  margin-left: auto;
  font-size: 0.8rem;
  color: #94a3b8;
  white-space: nowrap;
}
.vr__text {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}
</style>
