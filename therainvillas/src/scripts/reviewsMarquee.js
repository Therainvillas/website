// Marquee ulasan: fetch + render + kontrol kecepatan.
//
// Dimuat secara lazy oleh ReviewsMarquee.astro saat section mendekati viewport,
// supaya fetch dan penggantian DOM tidak ikut membebani load awal. Animasi tetap
// 100% CSS transform; script hanya menyetel durasi agar kecepatan konstan dan
// menjeda animasi ketika marquee di luar layar.

import { REVIEWS_API_URL, parseReviews, reviewCardHTML } from '../data/reviews.js';

const CACHE_KEY = 'trv_reviews_cache';
const TIMEOUT_MS = 5000;
// Kecepatan geser yang dipertahankan berapa pun jumlah kartu / lebar layar.
const SPEED_PX_PER_SEC = 94;

function setDuration(track) {
  const width = track.scrollWidth;
  if (!width) return;
  // Keyframes bergeser -50% - 12px (kompensasi setengah gap 24px).
  const shift = width / 2 + 12;
  const seconds = Math.max(8, shift / SPEED_PX_PER_SEC);
  track.style.animationDuration = `${seconds.toFixed(2)}s`;
}

function renderReviews(track, reviews) {
  if (!reviews || !reviews.length) return;
  const cards = reviews.map(reviewCardHTML).join('');
  const viewportW = window.innerWidth || 1600;
  const approxSetW = reviews.length * 424; // lebar kartu + gap
  // Butuh minimal 2 set agar translateX(-50%) mulus; tambah 2 set lagi hanya
  // bila satu set belum cukup menutup lebar viewport (layar sangat lebar).
  const sets = Math.max(2, Math.ceil(viewportW / approxSetW) * 2);
  track.innerHTML = cards.repeat(sets);
  setDuration(track);
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(reviews));
  } catch (e) {
    /* storage penuh / diblokir */
  }
}

export function initReviewsMarquee(track) {
  if (!track || track.dataset.marqueeReady === '1') return;
  track.dataset.marqueeReady = '1';

  setDuration(track);

  // Jeda animasi saat marquee di luar viewport → tidak ada compositing sia-sia.
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          track.style.animationPlayState = entry.isIntersecting ? '' : 'paused';
        }
      },
      { rootMargin: '200px 0px' },
    );
    visibility.observe(track);
  }

  // Lebar set berubah saat rotasi layar / resize → hitung ulang durasi.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => setDuration(track), 180);
  });

  (async () => {
    // Tampilkan ulasan yang sudah di-cache lebih dulu, lalu refresh di background.
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (Array.isArray(cached) && cached.length) renderReviews(track, cached);
    } catch (e) {
      /* cache rusak / diblokir */
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const url = REVIEWS_API_URL + '?action=reviews&_=' + Date.now();
      const res = await fetch(url, { redirect: 'follow', cache: 'no-store', signal: controller.signal });
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        const m = text.match(/\(([\s\S]*)\)\s*;?\s*$/);
        if (m) {
          try {
            data = JSON.parse(m[1]);
          } catch (e2) {
            data = null;
          }
        }
      }
      renderReviews(track, parseReviews(data));
    } catch (e) {
      // network error / timeout → biarkan kartu SSR (tidak pernah kosong)
    } finally {
      clearTimeout(timer);
    }
  })();
}
