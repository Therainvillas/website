/**
 * Flash Sale 24 Oktober 2026.
 * -------------------------------------------------------------------------
 * Harga spesial PER MALAM hanya untuk tanggal 24 Oktober 2026 (Sabtu) pada
 * villa yang terdaftar di `FLASH_SALE_PRICES`.
 *
 * Konsep:
 *  - `originalPrice` = harga normal hari Sabtu (`villa.dayPrices[6]`) yang
 *    ditampilkan dicoret (strikethrough) di kartu villa & halaman detail.
 *  - `salePrice`     = harga flash sale yang dipakai di tampilan DAN di
 *    perhitungan booking (`getNightPrice` di seasonPrices.js).
 *  - `isFlashSaleActive()` dipakai untuk menampilkan banner. Flash sale
 *    berhenti tampil setelah 24 Oktober 2026 pukul 23:59 WIB.
 *
 * Untuk menambah villa lain: cukup tambahkan baris di `FLASH_SALE_PRICES`.
 */

import { villas } from './villas.js';

// ── Tanggal flash sale ─────────────────────────────────────────────────
export const FLASH_SALE_DATE = '2026-10-24';
export const FLASH_SALE_END = '2026-10-24T23:59:59+07:00';
export const FLASH_SALE_LABEL = 'Flash Sale 24 Oktober';

// ── Harga flash sale per villa (per malam) ─────────────────────────────
const FLASH_SALE_PRICES = {
  'Villa Arisyfa': 3000000,
  'Villa Thymi': 3500000,
  'Villa Twins': 3000000,
};

function findVilla(name) {
  return villas.find((v) => v.name === name) || null;
}

/** Harga normal hari Sabtu (harga yang dicoret), atau `price` bila tidak ada. */
function originalPriceOf(villa) {
  if (!villa) return null;
  if (Array.isArray(villa.dayPrices) && typeof villa.dayPrices[6] === 'number') {
    return villa.dayPrices[6];
  }
  return typeof villa.price === 'number' ? villa.price : null;
}

/** Daftar villa yang ikut flash sale, lengkap dengan harga asli & diskon. */
export const flashSaleVillas = Object.entries(FLASH_SALE_PRICES).map(([name, salePrice]) => {
  const villa = findVilla(name);
  const originalPrice = originalPriceOf(villa);
  const saving = originalPrice != null ? originalPrice - salePrice : 0;

  return {
    name,
    slug: villa?.slug ?? null,
    image: villa?.image ?? '',
    capacity: villa?.capacity ?? 0,
    bedrooms: villa?.bedrooms ?? 0,
    originalPrice,
    salePrice,
    saving,
    discountPercent:
      originalPrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0,
  };
});

const FLASH_SALE_MAP = Object.fromEntries(flashSaleVillas.map((v) => [v.name, v]));

/** Info flash sale untuk sebuah villa, atau `null` bila villa tidak ikut. */
export function getFlashSale(villaName) {
  if (!villaName) return null;
  return FLASH_SALE_MAP[String(villaName).trim()] || null;
}

/** Harga flash sale untuk tanggal tertentu; `null` jika tanggal bukan 24 Okt. */
export function getFlashSalePrice(villaName, dateStr) {
  if (dateStr !== FLASH_SALE_DATE) return null;
  const info = getFlashSale(villaName);
  return info ? info.salePrice : null;
}

/** True bila tanggal (YYYY-MM-DD) adalah tanggal flash sale. */
export function isFlashSaleDate(dateStr) {
  return dateStr === FLASH_SALE_DATE;
}

/** True bila flash sale belum berakhir (dipakai untuk menampilkan banner). */
export function isFlashSaleActive(now = new Date()) {
  return now.getTime() <= new Date(FLASH_SALE_END).getTime();
}
