// Efek 3D tilt untuk kartu produk (.villa-card & .vf-card).
//
// - Memakai CSS variable + requestAnimationFrame supaya tidak ada perubahan
//   layout: yang dianimasikan hanya transform dan opacity glare.
// - Listener dipasang sekali per kartu; kartu baru (mis. hasil filter Vue)
//   otomatis dipasang lewat MutationObserver.
// - pointerType "touch" tidak memiringkan kartu, hanya memberi umpan balik tap.
// - prefers-reduced-motion: reduce mematikan efek sepenuhnya, termasuk saat
//   preferensi diubah ketika halaman sedang dibuka.

const CARD_SELECTOR = '.villa-card, .vf-card';
const MAX_TILT = 9; // derajat, cukup terasa tanpa merusak keterbacaan

const motionQuery =
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

let reducedMotion = motionQuery ? motionQuery.matches : false;

const enhanced = new WeakSet();
const states = new WeakMap();

function getState(card) {
  let state = states.get(card);
  if (!state) {
    state = { x: 0, y: 0, raf: 0, resetTimer: 0 };
    states.set(card, state);
  }
  return state;
}

function setVar(card, name, value) {
  card.style.setProperty(name, value);
}

function resetCard(card) {
  const state = states.get(card);
  if (state && state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = 0;
  }
  if (state && state.resetTimer) {
    clearTimeout(state.resetTimer);
    state.resetTimer = 0;
  }

  card.classList.remove('is-tilting', 'is-pressed', 'is-resetting');
  setVar(card, '--tilt-rx', '0deg');
  setVar(card, '--tilt-ry', '0deg');
  setVar(card, '--tilt-gx', '50%');
  setVar(card, '--tilt-gy', '50%');
}

function startTilt(card) {
  const state = getState(card);
  if (state.resetTimer) {
    clearTimeout(state.resetTimer);
    state.resetTimer = 0;
  }
  card.classList.remove('is-resetting');
  card.classList.add('is-tilting');
}

function updateTilt(card, clientX, clientY) {
  const rect = card.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  let x = (clientX - rect.left) / rect.width;
  let y = (clientY - rect.top) / rect.height;
  x = x < 0 ? 0 : x > 1 ? 1 : x;
  y = y < 0 ? 0 : y > 1 ? 1 : y;

  const nx = x - 0.5;
  const ny = y - 0.5;

  // Sisi yang didekati kursor terangkat ke arah pengguna.
  const rotateX = ny * 2 * MAX_TILT;
  const rotateY = -nx * 2 * MAX_TILT;

  setVar(card, '--tilt-rx', rotateX.toFixed(2) + 'deg');
  setVar(card, '--tilt-ry', rotateY.toFixed(2) + 'deg');
  setVar(card, '--tilt-gx', (x * 100).toFixed(1) + '%');
  setVar(card, '--tilt-gy', (y * 100).toFixed(1) + '%');
}

function handlePointerEnter(event) {
  if (event.pointerType === 'touch' || reducedMotion) return;
  const card = event.currentTarget;
  startTilt(card);
  updateTilt(card, event.clientX, event.clientY);
}

function handlePointerMove(event) {
  if (event.pointerType === 'touch' || reducedMotion) return;
  const card = event.currentTarget;
  if (!card.classList.contains('is-tilting')) startTilt(card);

  const state = getState(card);
  state.x = event.clientX;
  state.y = event.clientY;
  if (state.raf) return;

  state.raf = requestAnimationFrame(() => {
    state.raf = 0;
    if (!card.isConnected) return;
    updateTilt(card, state.x, state.y);
  });
}

function handlePointerLeave(event) {
  const card = event.currentTarget;
  if (event.pointerType === 'touch') {
    card.classList.remove('is-pressed');
    return;
  }

  const wasTilting = card.classList.contains('is-tilting');
  resetCard(card);
  if (!wasTilting || reducedMotion) return;

  // Tahan clipping sudut membulat selama animasi kembali (0,4 dtk).
  card.classList.add('is-resetting');
  const state = getState(card);
  state.resetTimer = window.setTimeout(() => {
    state.resetTimer = 0;
    card.classList.remove('is-resetting');
  }, 420);
}

function handlePointerDown(event) {
  if (event.pointerType !== 'touch') return;
  event.currentTarget.classList.add('is-pressed');
}

function handlePointerUp(event) {
  if (event.pointerType !== 'touch') return;
  event.currentTarget.classList.remove('is-pressed');
}

function handleMotionChange(event) {
  reducedMotion = event.matches;
  if (reducedMotion) {
    document.querySelectorAll(CARD_SELECTOR).forEach(resetCard);
  }
}

function enhance(card) {
  if (!(card instanceof HTMLElement) || enhanced.has(card)) return;
  enhanced.add(card);
  resetCard(card);

  card.addEventListener('pointerenter', handlePointerEnter, { passive: true });
  card.addEventListener('pointermove', handlePointerMove, { passive: true });
  card.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  card.addEventListener('pointerdown', handlePointerDown, { passive: true });
  card.addEventListener('pointerup', handlePointerUp, { passive: true });
  card.addEventListener('pointercancel', handlePointerUp, { passive: true });
}

function scan(root) {
  if (!root || (root.nodeType !== 1 && root.nodeType !== 9)) return;

  if (root.nodeType === 1 && root.matches(CARD_SELECTOR)) {
    enhance(root);
  }
  if (typeof root.querySelectorAll === 'function') {
    root.querySelectorAll(CARD_SELECTOR).forEach(enhance);
  }
}

function init() {
  scan(document);

  if (!('MutationObserver' in window) || !document.body) return;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(scan);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (motionQuery) {
  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', handleMotionChange);
  } else if (typeof motionQuery.addListener === 'function') {
    motionQuery.addListener(handleMotionChange);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
