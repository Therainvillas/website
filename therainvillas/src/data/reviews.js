export const REVIEWS_API_URL = 'https://script.google.com/macros/s/AKfycbzuvJ1h77RQyTPx9nz_CHjeisiOgvLhksHT60esWOh3BrHnUTVn_9xQrEH30Tv5op7s/exec';

export const sampleReviews = [
  {
    villa: 'Villa Cyrena',
    rating: 5,
    name: 'Sarah Wijaya',
    message: 'Pengalaman menginap yang luar biasa! Villa bersih, fasilitas lengkap, pemandangan indah. Pasti balik lagi.',
    timestamp: '2026-05-12T10:00:00Z',
  },
  {
    villa: 'Villa Cempaka',
    rating: 5,
    name: 'Budi Santoso',
    message: 'Recommended banget buat family gathering. Anak-anak senang berenang, orang dewasa bisa BBQ. Semua puas!',
    timestamp: '2026-04-20T10:00:00Z',
  },
  {
    villa: 'Villa Agave',
    rating: 5,
    name: 'Dewi Lestari',
    message: 'Pelayanan ramah, check-in mudah, villanya sesuai foto. Worth every penny!',
    timestamp: '2026-03-15T10:00:00Z',
  },
  {
    villa: 'Villa Arsy',
    rating: 4,
    name: 'Andi Pratama',
    message: 'Villa nyaman dan sejuk. Kolam renangnya bersih. Sedikit kurang saja di area parkir.',
    timestamp: '2026-02-08T10:00:00Z',
  },
  {
    villa: 'Villa Wanela',
    rating: 5,
    name: 'Rina Marlina',
    message: 'Cozy banget! Cocok untuk staycation santai. Staf ramah dan responsif.',
    timestamp: '2026-01-22T10:00:00Z',
  },
];

export function parseReviews(data) {
  if (data && Array.isArray(data.reviews)) return data.reviews;
  return [];
}

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function reviewCardHTML(r) {
  const rating = Math.min(5, Math.max(1, Number(r.rating) || 0));
  const stars = '★'.repeat(rating).padEnd(5, '☆');
  const name = r.name || 'Tamu Anonim';
  const initial = String(name).trim().charAt(0).toUpperCase() || 'T';
  const villa = r.villa || '';
  return `
      <div class="reviews-marquee__card">
        <span class="reviews-marquee__quote" aria-hidden="true">“</span>
        <div class="reviews-marquee__rect">
          <div class="reviews-marquee__stars" aria-label="${rating} dari 5 bintang">${stars}</div>
          <p class="reviews-marquee__text">${escapeHtml(r.message)}</p>
        </div>
        <div class="reviews-marquee__author">
          <div class="reviews-marquee__avatar">
            <span class="reviews-marquee__avatar-initial">${escapeHtml(initial)}</span>
          </div>
          <div class="reviews-marquee__meta">
            <div class="reviews-marquee__name-row">
              <strong class="reviews-marquee__name">${escapeHtml(name)}</strong>
              <span class="reviews-marquee__check" title="Tamu terverifikasi">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            </div>
            ${villa ? `<span class="reviews-marquee__villa">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              ${escapeHtml(villa)}
            </span>` : ''}
          </div>
        </div>
      </div>
    `;
}

export function normalizeVillaName(name) {
  return String(name || '').toLowerCase().replace(/^villa\s+/i, '').trim();
}

export function computeVillaSummary(reviews) {
  const map = {};
  reviews.forEach((r) => {
    const key = normalizeVillaName(r.villa);
    if (!key) return;
    if (!map[key]) map[key] = { count: 0, total: 0, reviews: [] };
    map[key].count += 1;
    map[key].total += Number(r.rating) || 0;
    map[key].reviews.push(r);
  });
  const result = {};
  Object.keys(map).forEach((key) => {
    const entry = map[key];
    result[key] = {
      count: entry.count,
      average: entry.count ? (entry.total / entry.count) : 0,
      reviews: entry.reviews,
    };
  });
  return result;
}
