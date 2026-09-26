export const promos = [
  {
    code: 'TRV10',
    kind: 'voucher',
    headline: 'Voucher Diskon 10% Villa',
    description: 'Potongan 10% dari subtotal menginap villa The Rain Villas. Berlaku untuk semua hari menginap, kecuali villa yang dikecualikan.',
    excluded: ['Rjs Cottage 1', 'Rjs Cottage 2', 'Rjs Cottage 3', 'Villa Kaca 1', 'Villa Kaca 2'],
    terms: [
      'Berlaku untuk semua villa The Rain Villas',
      'Tidak berlaku untuk Rjs Cottage 1, Rjs Cottage 2, Rjs Cottage 3, Villa Kaca 1, dan Villa Kaca 2',
      'Potongan dihitung otomatis dari subtotal menginap di formulir booking',
      'Tidak dapat digabungkan dengan promo atau voucher lain',
    ],
    type: 'percent',
    value: 10,
    label: 'Diskon 10%',
    validFrom: '2026-09-26T00:00:00',
    validUntil: '2026-09-30T23:59:59',
    featured: true,
  },
];

export const MAPS_RATING_URL =
  'https://www.google.com/maps/search/?api=1&query=The%20Rain%20Villas%20Kp.Ciburial%20Cibarengkok%20Cisarua%20Bogor';

// URL backend Google Apps Script untuk menerima & menampilkan bukti rating (folder `appsscript/Code.gs`).
// KOSONGKAN ('') = mode lokal: upload hanya membuka kode di perangkat, bukti TIDAK terkirim ke admin.
// Isi dengan URL hasil deploy Web App (contoh: 'https://script.google.com/macros/s/XXXX/exec'):
//  - upload wajib tersimpan di backend sebelum kode promo terbuka,
//  - halaman admin (admin/dashboard) menampilkan daftar bukti dari endpoint ini.
export const PROOF_API =
  'https://script.google.com/macros/s/AKfycbzYIxSBifJSKu-9On1GfHHQpGMo73RzoccC52m0nJQoQEV2S-6FjpoTTmuAV6bfmHor/exec';

export function getPromoStatus(promo, now = new Date()) {
  if (!promo) return 'expired';
  const from = promo.validFrom ? new Date(promo.validFrom) : null;
  const until = new Date(promo.validUntil);
  if (from && now < from) return 'upcoming';
  return now <= until ? 'active' : 'expired';
}

export function isPromoActive(promo, now = new Date()) {
  return getPromoStatus(promo, now) === 'active';
}

export function isPromoExcluded(promo, villaName) {
  if (!promo || !Array.isArray(promo.excluded) || !villaName) return false;
  const n = String(villaName).trim().toLowerCase();
  return promo.excluded.some((x) => String(x).trim().toLowerCase() === n);
}

export function getPromo(raw) {
  if (!raw) return null;
  const code = String(raw).trim().toUpperCase();
  return promos.find((p) => p.code.toUpperCase() === code) || null;
}

export const promoOfferJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AggregateOffer',
  name: 'Promo TRV10 — Diskon 10%',
  description: 'Diskon 10% dari subtotal menginap villa The Rain Villas dengan kode promo TRV10. Berlaku s.d. 30 September 2026 untuk semua villa, kecuali Rjs Cottage 1, Rjs Cottage 2, Rjs Cottage 3, Villa Kaca 1, dan Villa Kaca 2. Potongan dihitung otomatis di formulir pemesanan.',
  priceCurrency: 'IDR',
  lowPrice: 1000000,
  highPrice: 4500000,
  discount: '10%',
  discountCode: 'TRV10',
  availability: 'https://schema.org/InStock',
  validFrom: '2026-09-26T00:00:00+07:00',
  priceValidUntil: '2026-09-30T23:59:59+07:00',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'IDR',
    discount: '10%',
    discountCode: 'TRV10',
    priceValidUntil: '2026-09-30T23:59:59+07:00',
    seller: {
      '@type': 'Organization',
      name: 'The Rain Villas',
      url: 'https://therainvillas.com',
    },
  },
};