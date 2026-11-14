/**
 * Harga khusus Desember 2026 + harga Paket 2 Malam (30–31 Desember 2026).
 * -------------------------------------------------------------------------
 * Sumber: daftar "Harga Bulan Desember" dari pemilik villa.
 *
 * Konsep:
 *  - `DECEMBER_2026` = harga PER MALAM untuk tanggal tertentu (menimpa harga
 *    weekday normal di villas.js). Tanggal yang tidak ada di sini memakai
 *    harga normal (dayPrices[hari] / villa.price).
 *  - 30 & 31 Desember 2026 BISA dipesan 1 malam dengan harga per malam
 *    masing-masing (lihat DEC_SPEC).
 *  - `DECEMBER_2026_PACKAGE` = harga TOTAL paket 2 malam untuk tanggal
 *    `DEC_PACKAGE_DATES` (30 & 31 Des). Jika customer memilih kedua malam
 *    tersebut sekaligus, `getStayTotal()` otomatis memakai total paket bila
 *    lebih hemat daripada jumlah harga per malam.
 *    Nilai `null` = harga belum ditentukan (TBA).
 *  - Mulai 2027 harga promo berakhir: hari kerja memakai harga normal
 *    (`originalPrice`), tanpa tampilan harga coret.
 */

// ── Tanggal paket 2 malam ──────────────────────────────────────────────
export const DEC_PACKAGE_DATES = ["2026-12-30", "2026-12-31"];
export const DEC_PACKAGE_CHECKIN = "2026-12-30";
export const DEC_PACKAGE_CHECKOUT = "2027-01-01";

// ── Harga per malam Desember 2026 ──────────────────────────────────────
// Format: "Nama Villa": [[[daftar tanggal], harga], ...]
const DEC_SPEC = {
  "Villa Valora":   [[[20, 22, 23], 1400000], [[24], 1700000], [[25], 2000000], [[26], 2800000], [[27, 28, 29], 1500000], [[30], 3000000], [[31], 4000000]],
  "Villa Wanela":   [[[20, 22, 23], 1400000], [[24], 1700000], [[25], 2000000], [[26], 2800000], [[27, 28, 29], 1500000], [[30], 3000000], [[31], 4000000]],
  "Villa Elora":    [[[20, 22, 23], 1450000], [[24], 1800000], [[25], 2100000], [[26], 3000000], [[27, 28, 29], 1550000], [[30], 3300000], [[31], 4200000]],
  "Villa Cyrena":   [[[20, 22, 23], 1500000], [[24], 2000000], [[25], 2500000], [[26], 3500000], [[27, 28, 29], 1600000], [[30], 3500000], [[31], 4500000]],
  "Villa Ranna":    [[[20, 22, 23], 1500000], [[24], 2000000], [[25], 2500000], [[26], 3500000], [[27, 28, 29], 1600000], [[30], 3300000], [[31], 4500000]],
  "Villa 4D":       [[[20, 22, 23], 1500000], [[24], 2000000], [[25], 2500000], [[26], 3500000], [[27, 28, 29], 1600000], [[30], 3500000], [[31], 4700000]],
  "Villa Cempaka":  [[[20, 22, 23], 1500000], [[24], 2000000], [[25], 2500000], [[26], 3700000], [[27, 28, 29], 1600000], [[30], 3300000], [[31], 4800000]],
  "Villa Rio 5":    [[[20, 22, 23], 1550000], [[24], 2000000], [[25], 2500000], [[26], 3700000], [[27, 28, 29], 1600000], [[30], 3500000], [[31], 4800000]],
  "Villa Albi":     [[[20, 22, 23], 1550000], [[24], 1800000], [[25], 2500000], [[26], 3500000], [[27, 28, 29], 1600000], [[30], 3500000], [[31], 4800000]],
  "Villa Twins":    [[[20, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000], [[30], 3500000], [[31], 6000000]],
  "Echa Village":   [[[20, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000], [[30], 3500000], [[31], 4600000]],
  "Villa Kaca 2":   [[[20, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000], [[30], 3500000], [[31], 6000000]],
  "Villa Arisyfa":  [[[20, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000], [[30], 3500000], [[31], 5300000]],
  "Villa Cemara":   [[[20, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000], [[30], 4000000], [[31], 5300000]],
  "Villa Baduo":    [[[20, 22, 23], 1600000], [[24], 2000000], [[25], 3300000], [[26], 3700000], [[27, 28, 29], 1800000], [[30], 4000000], [[31], 5300000]],
  "Villa Awan":     [[[20, 22, 23], 1600000], [[24], 2000000], [[25], 3300000], [[26], 3700000], [[27, 28, 29], 1800000], [[30], 3500000], [[31], 5000000]],
  "Villa Opung":    [[[20, 22, 23], 1900000], [[24], 2000000], [[25], 3300000], [[26], 3700000], [[27, 28, 29], 1800000], [[30], 3500000], [[31], 5000000]],
  "Villa Calmora":  [[[20, 22, 23], 2000000], [[24], 2500000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000], [[30], 4000000], [[31], 7000000]],
  "Villa Aleia":    [[[20, 22, 23], 1600000], [[24], 2000000], [[25], 3300000], [[26], 3700000], [[27, 28, 29], 1800000], [[30], 3500000], [[31], 4800000]],
  "Villa Hala":     [[[20, 22, 23], 2300000], [[24], 3000000], [[25], 4500000], [[26], 4800000], [[27, 28, 29], 2400000], [[30], 5000000], [[31], 8000000]],
  "Villa Thymi":    [[[20, 22, 23], 1900000], [[24], 2300000], [[25], 4000000], [[26], 4500000], [[27, 28, 29], 2300000], [[30], 3800000], [[31], 6500000]],
  "Villa Rayya":    [[[20, 22, 23], 1650000], [[24], 2300000], [[25], 4000000], [[26], 4500000], [[27, 28, 29], 2000000], [[30], 3800000], [[31], 6000000]],
  "Villa Arsy":     [[[20, 22, 23], 1900000], [[24], 2300000], [[25], 4000000], [[26], 4500000], [[27, 28, 29], 2300000], [[30], 3800000], [[31], 6500000]],
  "Villa De Summit":[[[20, 22, 23], 2300000], [[24], 2800000], [[25], 4300000], [[26], 4800000], [[27, 28, 29], 2400000], [[30], 4000000], [[31], 6500000]],
  "Villa Kaca 1":   [[[20, 22, 23], 2700000], [[24], 2800000], [[25], 4300000], [[26], 5500000], [[27, 28, 29], 2800000], [[30], 4500000], [[31], 8000000]],
  "The Herlina":    [[[20, 22, 23], 2500000], [[24], 2900000], [[25], 4300000], [[26], 5500000], [[27, 28, 29], 2700000], [[30], 4500000], [[31], 7500000]],
  "Villa Bodas":    [[[20, 22, 23], 2500000], [[24], 2900000], [[25], 4300000], [[26], 5500000], [[27, 28, 29], 2700000], [[30], 4000000], [[31], 7500000]],
  "Villa Agave":    [[[20, 22, 23], 2000000], [[24], 2500000], [[25], 4200000], [[26], 5000000], [[27, 28, 29], 2500000], [[30], 4000000], [[31], 7500000]],
};

// ── High season awal Januari 2027 ─────────────────────────────────────
// Malam 3–7 Januari 2027 masih termasuk high season libur akhir tahun,
// jadi seluruh malam memakai tarif Jumat (bukan tarif weekday).
export const JANUARY_2027_HIGH_SEASON = [
  "2027-01-03",
  "2027-01-04",
  "2027-01-05",
  "2027-01-06",
  "2027-01-07",
];

const JANUARY_2027_HIGH_SEASON_SET = new Set(JANUARY_2027_HIGH_SEASON);

/** True jika malam tsb memakai tarif Jumat karena high season Januari 2027. */
export function isJanuary2027HighSeasonNight(dateStr) {
  return JANUARY_2027_HIGH_SEASON_SET.has(dateStr);
}

/** Tarif Jumat villa: dayPrices[5], lalu label "Jumat", lalu harga dasar. */
function getFridayPrice(villa) {
  if (villa.dayPrices && typeof villa.dayPrices[5] === "number") {
    return villa.dayPrices[5];
  }
  const row = Array.isArray(villa.pricingLabels)
    ? villa.pricingLabels.find((p) => /jumat/i.test(p.label || ""))
    : null;
  return row && typeof row.price === "number" ? row.price : villa.price;
}

/**
 * Tarif normal per hari (tanpa promo):
 * hari kerja Minggu–Kamis memakai harga awal (originalPrice) bila ada,
 * Jumat/Sabtu memakai dayPrices. Villa tanpa promo memakai dayPrices.
 */
function getNormalPriceForDay(villa, day) {
  if (day <= 4 && typeof villa.originalPrice === "number" && villa.originalPrice > 0) {
    return villa.originalPrice;
  }
  return (villa.dayPrices && villa.dayPrices[day]) || villa.price;
}

/** Harga normal terendah villa (untuk label "mulai dari") pada periode non-promo. */
export function getLowestNormalPrice(villa) {
  let min = Infinity;
  for (let day = 0; day <= 6; day++) {
    const price = getNormalPriceForDay(villa, day);
    if (typeof price === "number" && price > 0) min = Math.min(min, price);
  }
  return min === Infinity ? villa.price : min;
}

/** True bila tanggal tsb memakai harga normal (promo hanya berlaku sebelum 2027). */
export function isNormalPriceYear(date) {
  return date.getFullYear() >= 2027;
}

// ── Harga total Paket 2 malam (30–31 Des) ──────────────────────────────
// null = TBA (harga menyusul).
const DEC_PACKAGE = {
  "Villa Valora": 6000000,
  "Villa Wanela": 6000000,
  "Villa Elora": 6400000,
  "Villa Cyrena": 7000000,
  "Villa Ranna": 7000000,
  "Villa 4D": 7000000,
  "Villa Cempaka": 7000000,
  "Villa Rio 5": 7000000,
  "Villa Albi": 7000000,
  "Villa Twins": 8000000,
  "Echa Village": 8000000,
  "Villa Kaca 2": 8000000,
  "Villa Arisyfa": 7500000,
  "Villa Cemara": 8000000,
  "Villa Baduo": 8000000,
  "Villa Awan": 7500000,
  "Villa Opung": 7500000,
  "Villa Calmora": 9000000,
  "Villa Aleia": 7000000,
  "Villa Hala": 12000000,
  "Villa Thymi": 8500000,
  "Villa Rayya": 8300000,
  "Villa Arsy": 8500000,
  "Villa De Summit": 9000000,
  "Villa Kaca 1": 9500000,
  "The Herlina": 9500000,
  "Villa Bodas": 10000000,
  "Villa Agave": 9500000,
};

// ── Tanggal berharga TBA (belum pasti) ─────────────────────────────────
// Format: "Nama Villa": [[tanggalAwal, tanggalAkhir], ...] (Desember 2026).
// Rjs Cottage: harga 20–31 Des belum pasti.
const DEC_TBA_SPEC = {
  "Rjs Cottage 1": [[20, 31]],
  "Rjs Cottage 2": [[20, 31]],
  "Rjs Cottage 3": [[20, 31]],
};

function buildTba(spec) {
  const set = new Set();
  for (const [a, b] of spec) {
    for (let d = a; d <= b; d++) set.add(`2026-12-${String(d).padStart(2, "0")}`);
  }
  return set;
}

export const DECEMBER_2026_TBA = {};
for (const [name, spec] of Object.entries(DEC_TBA_SPEC)) {
  DECEMBER_2026_TBA[name] = buildTba(spec);
}

// Bangun peta tanggal → harga per malam.
function buildMap(spec) {
  const map = {};
  for (const [days, price] of spec) {
    for (const d of days) {
      map[`2026-12-${String(d).padStart(2, "0")}`] = price;
    }
  }
  return map;
}

export const DECEMBER_2026 = {};
for (const [name, spec] of Object.entries(DEC_SPEC)) {
  DECEMBER_2026[name] = buildMap(spec);
}

// ── Helper umum ────────────────────────────────────────────────────────

export function toDateStr(date) {
  const p2 = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`;
}

function toLocalDate(value) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === "string" && value) {
    return new Date(value + "T00:00:00");
  }
  return null;
}

/** True jika tanggal (YYYY-MM-DD) termasuk malam paket 30/31 Des 2026. */
export function isDecPackageNight(dateStr) {
  return DEC_PACKAGE_DATES.includes(dateStr);
}

/** True jika villa punya harga paket 2 malam Desember 2026. */
export function hasDecPackage(villa) {
  return !!villa && Object.prototype.hasOwnProperty.call(DEC_PACKAGE, villa.name);
}

/** Harga total paket 2 malam (angka), atau null jika TBA / tidak ada paket. */
export function decPackageTotal(villa) {
  if (!hasDecPackage(villa)) return null;
  return DEC_PACKAGE[villa.name];
}

/** True jika villa punya paket tapi harganya belum ditentukan (TBA). */
export function decPackageIsTba(villa) {
  return hasDecPackage(villa) && DEC_PACKAGE[villa.name] == null;
}

/**
 * Harga satu malam untuk villa pada tanggal tertentu (objek Date).
 * Urutan: override Desember → setengah harga paket (30/31 Des)
 * → harga normal.
 * Mengembalikan number, atau null bila malam paket berharga TBA.
 */
export function getNightPrice(villa, date) {
  if (!villa) return 0;
  const key = toDateStr(date);

  // Harga TBA (belum pasti) → tidak ada angka.
  const tba = DECEMBER_2026_TBA[villa.name];
  if (tba && tba.has(key)) return null;

  const map = DECEMBER_2026[villa.name];
  if (map && map[key] != null) return map[key];

  if (isDecPackageNight(key) && hasDecPackage(villa)) {
    const total = DEC_PACKAGE[villa.name];
    if (typeof total === "number") return Math.round(total / 2);
    return null; // TBA
  }

  // High season Januari 2027: semua malam memakai tarif Jumat.
  if (isJanuary2027HighSeasonNight(key)) return getFridayPrice(villa);

  // Mulai 2027 promo berakhir: hari kerja memakai harga normal (tanpa coretan).
  if (isNormalPriceYear(date)) return getNormalPriceForDay(villa, date.getDay());

  const day = date.getDay();
  return (villa.dayPrices && villa.dayPrices[day]) || villa.price;
}

/** True jika harga satu malam villa pada tanggal tsb belum pasti (TBA). */
export function isTbaNight(villa, date) {
  return getNightPrice(villa, date) == null;
}

/** Harga satu malam dari string tanggal (YYYY-MM-DD). */
export function getNightPriceByStr(villa, dateStr) {
  return getNightPrice(villa, new Date(dateStr + "T00:00:00"));
}

/**
 * Total harga menginap.
 * Menjumlahkan harga per malam, lalu bila rentang memuat 30 & 31 Des
 * sekaligus, otomatis memakai harga paket 2 malam jika lebih hemat.
 *
 * checkIn / checkOut boleh string "YYYY-MM-DD" atau objek Date.
 * Malam = [checkIn, checkOut).
 *
 * Mengembalikan { total, tba, packageApplied, nights }.
 */
export function getStayTotal(villa, checkIn, checkOut) {
  const result = { total: 0, tba: false, packageApplied: false, nights: 0 };
  if (!villa) return result;

  const start = toLocalDate(checkIn);
  const end = toLocalDate(checkOut);
  if (!start || !end) return result;

  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) return result;
  result.nights = nights;

  let total = 0;
  let packageNightsSum = 0;
  const packageNightsFound = { [DEC_PACKAGE_DATES[0]]: false, [DEC_PACKAGE_DATES[1]]: false };

  for (let i = 0; i < nights; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = toDateStr(d);
    const price = getNightPrice(villa, d);

    if (price == null) {
      result.tba = true;
      continue;
    }

    total += price;
    if (isDecPackageNight(key)) {
      packageNightsSum += price;
      packageNightsFound[key] = true;
    }
  }

  const includesBothPackageNights =
    packageNightsFound[DEC_PACKAGE_DATES[0]] && packageNightsFound[DEC_PACKAGE_DATES[1]];
  if (includesBothPackageNights) {
    const packageTotal = decPackageTotal(villa);
    if (typeof packageTotal === "number" && packageTotal < packageNightsSum) {
      total = total - packageNightsSum + packageTotal;
      result.packageApplied = true;
    }
  }

  result.total = total;
  return result;
}
