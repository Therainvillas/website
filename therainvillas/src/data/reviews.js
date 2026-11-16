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

export function reviewRowHTML(r, index = 0) {
  const rating = Math.min(5, Math.max(0, Math.round(Number(r.rating) || 0)));
  const name = r.name || 'Tamu Anonim';
  const initial = String(name).trim().charAt(0).toUpperCase() || 'T';
  const villa = r.villa || '';
  const avatar = r.avatar
    ? `<img src="${escapeHtml(r.avatar)}" alt="" loading="lazy" decoding="async">`
    : escapeHtml(initial);
  const stars = '★'.repeat(rating);
  const offStars = '★'.repeat(5 - rating);
  return `<article class="reviews-marquee__row">
        <span class="reviews-marquee__av reviews-marquee__av--${index % 3}" aria-hidden="true">${avatar}</span>
        <div class="reviews-marquee__body">
          <div class="reviews-marquee__top">
            <span class="reviews-marquee__name">${escapeHtml(name)}
              <svg class="reviews-marquee__check" viewBox="0 0 24 24" fill="none" role="img" aria-label="Tamu terverifikasi"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M7.5 12.5l3 3 6-6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            ${villa ? `<span class="reviews-marquee__villa">${escapeHtml(villa)}</span>` : ''}
          </div>
          <div class="reviews-marquee__stars" role="img" aria-label="${rating} dari 5 bintang">
            <span aria-hidden="true">${stars}</span><span class="reviews-marquee__stars-off" aria-hidden="true">${offStars}</span>
          </div>
          <p class="reviews-marquee__text">“${escapeHtml(r.message)}”</p>
        </div>
      </article>`;
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
