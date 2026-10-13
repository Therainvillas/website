/**
 * Harga khusus Desember 2026 + aturan Paket 2 Malam (30–31 Desember 2026).
 * -------------------------------------------------------------------------
 * Sumber: daftar "Harga Bulan Desember" dari pemilik villa.
 *
 * Konsep:
 *  - `DECEMBER_2026` = harga PER MALAM untuk tanggal tertentu (menimpa harga
 *    weekday normal di villas.js). Tanggal yang tidak ada di sini memakai
 *    harga normal (dayPrices[hari] / villa.price).
 *  - `DECEMBER_2026_PACKAGE` = harga TOTAL paket 2 malam untuk tanggal
 *    `DEC_PACKAGE_DATES` (30 & 31 Des). Customer yang mengambil salah satu
 *    tanggal WAJIB mengambil keduanya (check-in 30 Des, check-out 1 Jan).
 *    Nilai `null` = harga belum ditentukan (TBC) — tetap wajib 2 malam.
 *
 * Harga per malam untuk 30 & 31 Des otomatis = total paket / 2, sehingga
 * 2 malam = harga paket.
 */

// ── Tanggal paket 2 malam ──────────────────────────────────────────────
export const DEC_PACKAGE_DATES = ["2026-12-30", "2026-12-31"];
export const DEC_PACKAGE_CHECKIN = "2026-12-30";
export const DEC_PACKAGE_CHECKOUT = "2027-01-01";

// ── Harga per malam Desember 2026 ──────────────────────────────────────
// Format: "Nama Villa": [[[daftar tanggal], harga], ...]
const DEC_SPEC = {
  "Villa Valora":   [[[20, 21, 22, 23], 1400000], [[24], 1700000], [[25], 2000000], [[26], 2800000], [[27, 28, 29], 1500000]],
  "Villa Wanela":   [[[20, 21, 22, 23], 1400000], [[24], 1700000], [[25], 2000000], [[26], 2800000], [[27, 28, 29], 1500000]],
  "Villa Hariza":   [[[20, 21, 22, 23], 1450000], [[24], 1800000], [[25], 2100000], [[26], 3000000], [[27, 28, 29], 1550000]],
  "Villa Cyrena":   [[[20, 21, 22, 23], 1500000], [[24], 2000000], [[25], 2500000], [[26], 3500000], [[27, 28, 29], 1600000]],
  "Villa Ranna":    [[[20, 21, 22, 23], 1500000], [[24], 2000000], [[25], 2500000], [[26], 3500000], [[27, 28, 29], 1600000]],
  "Villa 4D":       [[[20, 21, 22, 23], 1500000], [[24], 2000000], [[25], 2500000], [[26], 3500000], [[27, 28, 29], 1600000]],
  "Villa Cempaka":  [[[20, 21, 22, 23], 1500000], [[24], 2000000], [[25], 2500000], [[26], 3700000], [[27, 28, 29], 1600000]],
  "Villa Rio 5":    [[[20, 21, 22, 23], 1550000], [[24], 2000000], [[25], 2500000], [[26], 3700000], [[27, 28, 29], 1600000]],
  "Villa Albi":     [[[20, 21, 22, 23], 1550000], [[24], 1800000], [[25], 2500000], [[26], 3500000], [[27, 28, 29], 1600000]],
  "Villa Twins":    [[[20, 21, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000]],
  "Echa Village":   [[[20, 21, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000]],
  "Villa Kaca 2":   [[[20, 21, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000]],
  "Villa Arisyfa":  [[[20, 21, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000]],
  "Villa Cemara":   [[[20, 21, 22, 23], 1700000], [[24], 2000000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000]],
  "Villa Baduo":    [[[20, 21, 22, 23], 1600000], [[24], 2000000], [[25], 3300000], [[26], 3700000], [[27, 28, 29], 1800000]],
  "Villa Awan":     [[[20, 21, 22, 23], 1600000], [[24], 2000000], [[25], 3300000], [[26], 3700000], [[27, 28, 29], 1800000]],
  "Villa Opung":    [[[20, 21, 22, 23], 1900000], [[24], 2000000], [[25], 3300000], [[26], 3700000], [[27, 28, 29], 1800000]],
  "Villa Calmora":  [[[20, 21, 22, 23], 2000000], [[24], 2500000], [[25], 3300000], [[26], 3800000], [[27, 28, 29], 1800000]],
  "Villa Aleia":    [[[20, 21, 22, 23], 1600000], [[24], 2000000], [[25], 3300000], [[26], 3700000], [[27, 28, 29], 1800000]],
  "Villa Hala":     [[[20, 21, 22, 23], 2300000], [[24], 3000000], [[25], 4500000], [[26], 4800000], [[27, 28, 29], 2400000]],
  "Villa Thymi":    [[[20, 21, 22, 23], 1900000], [[24], 2300000], [[25], 4000000], [[26], 4500000], [[27, 28, 29], 2300000]],
  "Villa Rayya":    [[[20, 21, 22, 23], 1650000], [[24], 2300000], [[25], 4000000], [[26], 4500000], [[27, 28, 29], 2000000]],
  "Villa Arsy":     [[[20, 21, 22, 23], 1900000], [[24], 2300000], [[25], 4000000], [[26], 4500000], [[27, 28, 29], 2300000]],
  "Villa De Summit":[[[20, 21, 22, 23], 2300000], [[24], 2800000], [[25], 4300000], [[26], 4800000], [[27, 28, 29], 2400000]],
  "Villa Kaca 1":   [[[20, 21, 22, 23], 2700000], [[24], 2800000], [[25], 4300000], [[26], 5500000], [[27, 28, 29], 2800000]],
  "The Herlina":    [[[20, 21, 22, 23], 2500000], [[24], 2900000], [[25], 4300000], [[26], 5500000], [[27, 28, 29], 2700000]],
  "Villa Bodas":    [[[20, 21, 22, 23], 2500000], [[24], 2900000], [[25], 4300000], [[26], 5500000], [[27, 28, 29], 2700000]],
  "Villa Agave":    [[[20, 21, 22, 23], 2000000], [[24], 2500000], [[25], 4200000], [[26], 5000000], [[27, 28, 29], 2500000]],
};

// ── Harga total Paket 2 malam (30–31 Des) ──────────────────────────────
// null = TBC (harga menyusul), namun paket tetap wajib 2 malam.
const DEC_PACKAGE = {
  "Villa Valora": 6000000,
  "Villa Wanela": 6000000,
  "Villa Hariza": 6400000,
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
  "Villa Cemara": 7500000,
  "Villa Baduo": 7300000,
  "Villa Awan": 7500000,
  "Villa Opung": 7500000,
  "Villa Calmora": 9000000,
  "Villa Aleia": 7000000,
  "Villa Hala": null, // TBC
  "Villa Thymi": 8500000,
  "Villa Rayya": 8300000,
  "Villa Arsy": 8500000,
  "Villa De Summit": 9000000,
  "Villa Kaca 1": 9500000,
  "The Herlina": 9500000,
  "Villa Bodas": 9500000,
  "Villa Agave": 9000000,
};

// ── Tanggal berharga TBC (belum pasti) ─────────────────────────────────
// Format: "Nama Villa": [[tanggalAwal, tanggalAkhir], ...] (Desember 2026).
// Rjs Cottage: harga 20–31 Des belum pasti.
const DEC_TBC_SPEC = {
  "Rjs Cottage 1": [[20, 31]],
  "Rjs Cottage 2": [[20, 31]],
  "Rjs Cottage 3": [[20, 31]],
};

function buildTbc(spec) {
  const set = new Set();
  for (const [a, b] of spec) {
    for (let d = a; d <= b; d++) set.add(`2026-12-${String(d).padStart(2, "0")}`);
  }
  return set;
}

export const DECEMBER_2026_TBC = {};
for (const [name, spec] of Object.entries(DEC_TBC_SPEC)) {
  DECEMBER_2026_TBC[name] = buildTbc(spec);
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

/** True jika tanggal (YYYY-MM-DD) termasuk malam paket 30/31 Des 2026. */
export function isDecPackageNight(dateStr) {
  return DEC_PACKAGE_DATES.includes(dateStr);
}

/** True jika villa punya aturan paket 2 malam Desember 2026. */
export function hasDecPackage(villa) {
  return !!villa && Object.prototype.hasOwnProperty.call(DEC_PACKAGE, villa.name);
}

/** Harga total paket 2 malam (angka), atau null jika TBC / tidak ada paket. */
export function decPackageTotal(villa) {
  if (!hasDecPackage(villa)) return null;
  return DEC_PACKAGE[villa.name];
}

/** True jika villa punya paket tapi harganya belum ditentukan (TBC). */
export function decPackageIsTbc(villa) {
  return hasDecPackage(villa) && DEC_PACKAGE[villa.name] == null;
}

/**
 * Harga satu malam untuk villa pada tanggal tertentu (objek Date).
 * Urutan: override Desember → setengah harga paket (30/31 Des) → harga normal.
 * Mengembalikan number, atau null bila malam paket berharga TBC.
 */
export function getNightPrice(villa, date) {
  if (!villa) return 0;
  const key = toDateStr(date);

  // Harga TBC (belum pasti) → tidak ada angka.
  const tbc = DECEMBER_2026_TBC[villa.name];
  if (tbc && tbc.has(key)) return null;

  const map = DECEMBER_2026[villa.name];
  if (map && map[key] != null) return map[key];

  if (isDecPackageNight(key) && hasDecPackage(villa)) {
    const total = DEC_PACKAGE[villa.name];
    if (typeof total === "number") return Math.round(total / 2);
    return null; // TBC
  }

  const day = date.getDay();
  return (villa.dayPrices && villa.dayPrices[day]) || villa.price;
}

/** True jika harga satu malam villa pada tanggal tsb belum pasti (TBC). */
export function isTbcNight(villa, date) {
  return getNightPrice(villa, date) == null;
}

/** Harga satu malam dari string tanggal (YYYY-MM-DD). */
export function getNightPriceByStr(villa, dateStr) {
  return getNightPrice(villa, new Date(dateStr + "T00:00:00"));
}

/**
 * Validasi rentang menginap terhadap paket 2 malam.
 * Hanya berlaku untuk villa yang punya paket 2 malam Desember.
 * Malam = [checkIn, checkOut). Paket 30 & 31 Des harus diambil bersamaan:
 * rentang tidak boleh memuat salah satu saja.
 * Mengembalikan pesan error, atau "" kalau valid.
 */
export function decPackageRangeError(villa, checkInStr, checkOutStr) {
  if (!hasDecPackage(villa)) return "";
  if (!checkInStr || !checkOutStr) return "";
  const inRange = (d) => d >= checkInStr && d < checkOutStr;
  const has30 = inRange(DEC_PACKAGE_DATES[0]);
  const has31 = inRange(DEC_PACKAGE_DATES[1]);
  if (has30 !== has31) {
    return "Tanggal 30 & 31 Desember dijual sebagai paket 2 malam. Pilih check-in 30 Des dan check-out 1 Jan — kedua tanggal harus ikut.";
  }
  return "";
}
