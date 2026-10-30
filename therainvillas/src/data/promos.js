export const promos = [
  {
    code: 'TRVPROMO',
    kind: 'voucher',
    headline: 'Harga Promo The Rain Villas',
    description: 'Harga promo (harga awal dicoret) bisa diklaim dengan memberikan rating Google Maps dan mengirim bukti rating.',
    excluded: ['Rjs Cottage 1', 'Rjs Cottage 2', 'Rjs Cottage 3', 'Villa Kaca 1', 'Villa Kaca 2'],
    terms: [
      'Berlaku hanya untuk villa dengan harga promo (harga awal dicoret). Villa tanpa harga coret tidak perlu klaim kode.',
      'Wajib memberi rating Google Maps dan mengirimkan bukti rating.',
      'Kode promo muncul secara acak setelah bukti terkirim dan hanya berlaku selama 2 menit.',
      'Kode promo hanya membuka akses ke harga promo, bukan potongan tambahan.',
      'Tidak berlaku untuk Rjs Cottage 1, Rjs Cottage 2, Rjs Cottage 3, Villa Kaca 1, dan Villa Kaca 2.',
      'Tidak dapat digabungkan dengan promo atau voucher lain.',
    ],
    type: 'unlock',
    value: 0,
    label: 'Akses Harga Promo',
    validFrom: '2026-01-01T00:00:00',
    validUntil: '2030-12-31T23:59:59',
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

/**
 * Villa hanya boleh memakai kode promo jika harganya sedang diskon
 * (harga awal lebih besar dari harga aktif / ada harga coret).
 */
export function isVillaPromoEligible(villa) {
  if (!villa) return false;
  const original = Number(villa.originalPrice) || 0;
  const current = Number(villa.price) || 0;
  return original > current;
}

/** True jika kode promo tidak boleh dipakai untuk villa ini. */
export function isPromoBlockedForVilla(promo, villa) {
  if (!villa) return true;
  if (isPromoExcluded(promo, villa.name)) return true;
  return !isVillaPromoEligible(villa);
}

export function getPromo(raw) {
  if (!raw) return null;
  const code = String(raw).trim().toUpperCase();
  return promos.find((p) => p.code.toUpperCase() === code) || null;
}
