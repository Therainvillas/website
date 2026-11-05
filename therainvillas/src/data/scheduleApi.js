// Sumber jadwal terbooking villa (Google Apps Script Web App).
// Dipakai panel admin, kalender ketersediaan, dan filter Our Villas agar
// semuanya membaca data yang sama dari sheet.
export const SPREADSHEET_API_URL =
  'https://script.google.com/macros/s/AKfycbzuvJ1h77RQyTPx9nz_CHjeisiOgvLhksHT60esWOh3BrHnUTVn_9xQrEH30Tv5op7s/exec';

// Cache publik (dipakai AvailabilityGrid & filter Our Villas). Key: scheduleName.
export const SCHEDULE_CACHE_KEY = 'trv_blocked_cache';
// Cache yang ditulis panel admin. Key: id villa.
export const ADMIN_SCHEDULE_CACHE_KEY = 'therainvillas_sheet_blocked';
// Tanggal blokir manual dari panel admin. Key: id villa.
export const ADMIN_BLOCKED_KEY = 'therainvillas_blocked';

const CACHE_TTL_MS = 5 * 60 * 1000;
const JSONP_TIMEOUT_MS = 8000;

export function scheduleName(villa) {
  if (!villa) return '';
  return String(villa.scheduleName || villa.name || '');
}

export function normalizeDates(dates) {
  if (!Array.isArray(dates)) return [];
  const seen = new Set();
  dates.forEach((d) => {
    if (d === null || d === undefined) return;
    const value = String(d).trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) seen.add(value);
  });
  return Array.from(seen).sort();
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

/** Cache publik dari kalender ketersediaan: { key: { dates, savedAt } } */
export function readScheduleCache(villa) {
  const raw = readJson(SCHEDULE_CACHE_KEY);
  const entry = raw[scheduleName(villa)];
  if (entry && Array.isArray(entry.dates)) {
    const savedAt = Date.parse(entry.savedAt) || 0;
    return { dates: normalizeDates(entry.dates), savedAt };
  }
  return { dates: [], savedAt: 0 };
}

export function writeScheduleCache(villa, dates) {
  try {
    const raw = readJson(SCHEDULE_CACHE_KEY);
    raw[scheduleName(villa)] = {
      dates: normalizeDates(dates),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(raw));
  } catch {
    /* localStorage bisa diblokir (mode privat) — abaikan. */
  }
}

/** Cache yang ditulis panel admin (disimpan per id villa). */
export function readAdminScheduleCache(villa) {
  const raw = readJson(ADMIN_SCHEDULE_CACHE_KEY);
  const entry = raw[String(villa && villa.id)] || raw[scheduleName(villa)];
  if (entry && Array.isArray(entry.dates)) return normalizeDates(entry.dates);
  return [];
}

/** Tanggal blokir manual yang dibuat admin lewat kalender panel admin. */
export function readAdminBlockedDates(villa) {
  const raw = readJson(ADMIN_BLOCKED_KEY);
  const entry = raw[String(villa && villa.id)];
  if (Array.isArray(entry)) return normalizeDates(entry);
  return [];
}

export function isScheduleCacheFresh(savedAt) {
  return !!savedAt && Date.now() - savedAt < CACHE_TTL_MS;
}

/** Normalisasi nama villa seperti backend Apps Script. */
export function normalizeVillaName(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/^villa\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Simpan blokir manual (hasil server) ke cache localStorage per id villa. */
export function writeAdminBlockedDates(villa, dates) {
  try {
    const raw = readJson(ADMIN_BLOCKED_KEY);
    raw[String(villa && villa.id)] = normalizeDates(dates);
    localStorage.setItem(ADMIN_BLOCKED_KEY, JSON.stringify(raw));
  } catch {
    /* localStorage bisa diblokir — abaikan. */
  }
}

function scheduleUrl(villa, options = {}) {
  const manual = options.includeManual === false ? '&manual=0' : '';
  return (
    SPREADSHEET_API_URL +
    '?villa=' +
    encodeURIComponent(scheduleName(villa)) +
    '&_=' +
    Date.now() +
    manual
  );
}

function fetchJsonpData(url) {
  return new Promise((resolve, reject) => {
    const callbackName = 'trv_sched_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');

    const cleanup = () => {
      clearTimeout(timer);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, JSONP_TIMEOUT_MS);

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('network error'));
    };
    script.src = url + '&callback=' + callbackName;
    document.head.appendChild(script);
  });
}

function fetchJsonp(url) {
  return fetchJsonpData(url).then((data) => {
    if (Array.isArray(data)) return normalizeDates(data);
    throw new Error((data && data.error) || 'invalid response');
  });
}

/**
 * Ambil seluruh blokir manual dari sheet 'Blokir Manual'.
 * Mengembalikan array { villa, date, note, timestamp }.
 */
export function fetchManualBlocks() {
  const url = SPREADSHEET_API_URL + '?action=manualBlocks&_=' + Date.now();
  return fetch(url, { redirect: 'follow', cache: 'no-store' })
    .then((res) => res.json())
    .catch(() => fetchJsonpData(url))
    .then((data) => {
      if (data && Array.isArray(data.blocks)) {
        return data.blocks
          .map((b) => ({
            villa: String((b && b.villa) || ''),
            date: String((b && b.date) || '').slice(0, 10),
            note: String((b && b.note) || ''),
            timestamp: String((b && b.timestamp) || ''),
          }))
          .filter((b) => b.villa && /^\d{4}-\d{2}-\d{2}$/.test(b.date));
      }
      throw new Error((data && data.error) || 'invalid response');
    });
}

/**
 * Simpan / hapus blokir manual untuk satu villa + tanggal.
 * op: 'block' | 'unblock' (idempotent, aman diulang saat retry).
 * Memakai POST; bila CORS memblokir respons, fallback ke GET JSONP dengan
 * operasi yang sama sehingga tidak terjadi toggle ganda.
 */
export function toggleManualBlock(villa, date, op = 'toggle') {
  const villaName = scheduleName(villa);
  const payload = { type: 'manualBlock', villa: villaName, date, op };

  return fetch(SPREADSHEET_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })
    .then((res) => res.json())
    .catch(() => {
      const url =
        SPREADSHEET_API_URL +
        '?action=toggleManualBlock&villa=' +
        encodeURIComponent(villaName) +
        '&date=' +
        encodeURIComponent(date) +
        '&op=' +
        encodeURIComponent(op) +
        '&_=' +
        Date.now();
      return fetchJsonpData(url);
    })
    .then((data) => {
      if (data && data.success) return data;
      throw new Error((data && data.error) || 'gagal menyimpan blokir manual');
    });
}

/**
 * Ambil daftar tanggal terbooking satu villa langsung dari sheet.
 * Fetch biasa dulu (CORS), lalu fallback JSONP seperti panel admin.
 */
export function fetchVillaSchedule(villa, options = {}) {
  const url = scheduleUrl(villa, options);
  return fetch(url, { redirect: 'follow', cache: 'no-store' })
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) return normalizeDates(data);
      throw new Error((data && data.error) || 'invalid response');
    })
    .catch(() => fetchJsonp(url));
}
