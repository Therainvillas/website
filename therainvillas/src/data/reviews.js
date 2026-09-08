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
