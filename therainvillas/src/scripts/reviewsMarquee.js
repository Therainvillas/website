// Marquee ulasan vertikal: fetch + render + kontrol jeda.
//
// Dimuat secara lazy oleh ReviewsMarquee.astro saat section mendekati viewport,
// supaya fetch dan penggantian DOM tidak ikut membebani load awal. Animasi tetap
// 100% CSS transform; script hanya menyetel durasi agar kecepatan konstan,
// menduplikasi baris agar loop mulus, dan menjeda animasi di luar layar.

import { REVIEWS_API_URL, parseReviews, reviewRowHTML, sampleReviews } from '../data/reviews.js';

const CACHE_KEY = 'trv_reviews_cache';
const TIMEOUT_MS = 5000;
const SPEED_PX_PER_SEC = 26;
const MAX_COPIES = 12;
// Tampilkan ulasan terbaru saja: loop tetap ringkas dan bobot layer animasi
// tidak membengkak ketika jumlah ulasan terus bertambah.
const MAX_REVIEWS = 20;

const HALF_CLASS = 'reviews-marquee__half';

function setDuration(track) {
  const half = track.querySelector(`.${HALF_CLASS}`);
  const height = half ? half.offsetHeight : track.offsetHeight / 2;
  if (!height) return;
  const seconds = Math.max(12, height / SPEED_PX_PER_SEC);
  track.style.setProperty('--rv-dur', `${seconds.toFixed(1)}s`);
}

function timeOf(review) {
  const time = new Date(review && review.timestamp ? review.timestamp : 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function prepareReviews(reviews) {
  const list = (reviews && reviews.length ? reviews.slice() : sampleReviews.slice());
  // Ulasan terbaru lebih relevan untuk ditampilkan lebih dulu.
  list.sort((a, b) => timeOf(b) - timeOf(a));
  return list.slice(0, MAX_REVIEWS);
}

function renderRows(track, viewport, reviews) {
  const list = prepareReviews(reviews);
  const rows = list.map(reviewRowHTML).join('');

  // Satu set baris harus lebih tinggi dari viewport, kalau tidak loop
  // translateY(-50%) akan menyisakan ruang kosong.
  track.innerHTML = `<div class="${HALF_CLASS}">${rows}</div>`;
  const half = track.firstElementChild;
  let copies = 1;
  const minHeight = (viewport.offsetHeight || 380) + 40;
  while (half.offsetHeight > 0 && half.offsetHeight < minHeight && copies < MAX_COPIES) {
    half.insertAdjacentHTML('beforeend', rows);
    copies += 1;
  }

  const halfHTML = half.innerHTML;
  track.innerHTML =
    `<div class="${HALF_CLASS}">${halfHTML}</div>` +
    `<div class="${HALF_CLASS}" aria-hidden="true">${halfHTML}</div>`;

  setDuration(track);
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    /* storage penuh / diblokir */
  }
}

export function initReviewsMarquee(track, viewport, toggle) {
  if (!track || !viewport || track.dataset.marqueeReady === '1') return;
  track.dataset.marqueeReady = '1';

  let current = [];
  let resizeTimer = 0;

  const render = (reviews) => {
    if (reviews && reviews.length) current = reviews;
    renderRows(track, viewport, current);
  };

  // Jeda animasi saat section di luar viewport → tidak ada compositing sia-sia.
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

  // Tinggi baris berubah saat font termuat / layar berputar → hitung ulang.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => render(current));
  }
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => render(current), 200);
  });

  // Tombol jeda / lanjut.
  if (toggle) {
    toggle.setAttribute('aria-pressed', 'false');
    toggle.addEventListener('click', () => {
      const paused = track.classList.toggle('is-paused');
      toggle.textContent = paused ? 'Lanjutkan gulir' : 'Jeda gulir';
      toggle.setAttribute('aria-pressed', String(paused));
    });
  }

  // Sentuhan di HP: berhenti selama jari menempel, lanjut sebentar setelahnya.
  let resume = 0;
  viewport.addEventListener(
    'touchstart',
    () => {
      clearTimeout(resume);
      track.classList.add('is-held');
    },
    { passive: true },
  );
  viewport.addEventListener(
    'touchend',
    () => {
      resume = window.setTimeout(() => track.classList.remove('is-held'), 1800);
    },
    { passive: true },
  );

  (async () => {
    // Tampilkan ulasan yang sudah di-cache lebih dulu, lalu refresh di background.
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (Array.isArray(cached) && cached.length) render(cached);
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
      const reviews = parseReviews(data);
      if (reviews.length) render(reviews);
    } catch (e) {
      // network error / timeout → biarkan baris SSR (tidak pernah kosong)
    } finally {
      clearTimeout(timer);
    }
  })();
}
