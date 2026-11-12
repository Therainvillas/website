// Engine roda villa 3D untuk section #malam.
// Dimuat secara lazy oleh Slide03Evening.astro ketika section mendekati viewport,
// supaya animasi intro tidak membebani main thread saat first paint.
export function initVillaWheel() {
  const root = document.getElementById('malam');
  if (!root) return;

  const stage = root.querySelector('[data-wheel-stage]');
  const ring = root.querySelector('[data-wheel-ring]');
  const cards = Array.from(root.querySelectorAll('[data-wheel-card]'));
  const total = cards.length;
  if (!stage || !ring || !total) return;

  const searchInput = root.querySelector('[data-wheel-search]');
  const clearBtn = root.querySelector('[data-wheel-clear]');
  const resultsEl = root.querySelector('[data-wheel-results]');
  const announceEl = root.querySelector('[data-wheel-announce]');
  const prevBtn = root.querySelector('[data-wheel-prev]');
  const nextBtn = root.querySelector('[data-wheel-next]');
  const currentEl = root.querySelector('[data-wheel-current]');
  const range = root.querySelector('[data-wheel-range]');
  const chips = Array.from(root.querySelectorAll('[data-zone]'));
  const detail = root.querySelector('[data-wheel-detail]');
  const detailNum = root.querySelector('[data-detail-num]');
  const detailZone = root.querySelector('[data-detail-zone]');
  const detailName = root.querySelector('[data-detail-name]');
  const detailDesc = root.querySelector('[data-detail-desc]');
  const detailRooms = root.querySelector('[data-detail-rooms]');
  const detailGuests = root.querySelector('[data-detail-guests]');
  const detailPrice = root.querySelector('[data-detail-price]');
  const detailOld = root.querySelector('[data-detail-old]');
  const detailAmenities = root.querySelector('[data-detail-amenities]');
  const detailLink = root.querySelector('[data-detail-link]');
  const detailBook = root.querySelector('[data-detail-book]');
  const moreBtn = root.querySelector('[data-wheel-more]');
  const closeBtn = root.querySelector('[data-wheel-close]');

  const DEG = 360 / total;
  const mobileMQ = window.matchMedia('(max-width: 720px)');
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverMQ = window.matchMedia('(hover: hover) and (pointer: fine)');

  let reduced = reduceMQ.matches;
  let canHover = hoverMQ.matches;
  let cardW = 190;
  let cardH = 290;
  let radius = 1074;
  let stepPx = 118;
  let pos = reduced ? 0 : -10;
  let target = 0;
  let rate = 7.5;
  let running = false;
  let prevT = 0;
  let speed = 0;
  let intro = !reduced;
  let active = -1;
  let shown = -1;
  let enabled = new Set(cards.map((_, i) => i));
  let zoneFilter = '';

  let pointerId = null;
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startPos = 0;
  let lastMoveX = 0;
  let lastMoveT = 0;
  let velocity = 0;
  let suppressClick = false;
  let wheelTimer = 0;
  let resizeRaf = 0;

  const hovered = { el: null };
  const lastPointer = { x: 0, y: 0, active: false };

  const mod = (value) => ((value % total) + total) % total;
  const pad = (value) => String(value).padStart(2, '0');

  function shortDelta(index, from) {
    let delta = ((index - from) % total + total) % total;
    if (delta > total / 2) delta -= total;
    return delta;
  }

  function measure() {
    const mobile = mobileMQ.matches;
    // Rasio kartu disamakan dengan artwork portrait 1080x1500 (0,72) agar
    // judul dan harga di dalam gambar tidak terpotong oleh object-fit: cover.
    cardW = mobile ? 155 : 209;
    cardH = mobile ? 215 : 290;
    radius = (1.15 * (cardW / 2)) / Math.tan(Math.PI / total);
    stepPx = Math.max(62, cardW * 0.62);
    root.style.setProperty('--card-w', `${cardW}px`);
    root.style.setProperty('--card-h', `${cardH}px`);
    root.style.setProperty('--radius', `${radius.toFixed(2)}px`);
    root.style.setProperty('--floor-size', `${(radius * 2.5).toFixed(2)}px`);
    root.style.setProperty('--perspective', `${(radius * 1.35).toFixed(2)}px`);
    root.style.setProperty('--step', `${DEG}deg`);
  }

  function applyRing() {
    ring.style.setProperty('--rot', `${(-pos * DEG).toFixed(3)}deg`);
  }

  function render() {
    applyRing();
    const motion = Math.min(0.5, Math.abs(speed) / 9);

    for (let i = 0; i < total; i++) {
      const card = cards[i];
      const delta = shortDelta(i, pos);
      const distance = Math.abs(delta);
      const visible = distance <= 6.6;

      if (card._hidden !== !visible) {
        card.style.visibility = visible ? 'visible' : 'hidden';
        card._hidden = !visible;
      }
      if (!visible) continue;

      const angle = delta * DEG;
      const shade = 0.6 * Math.abs(Math.sin((angle * Math.PI) / 180));
      const fog = Math.min(1, Math.pow(distance / 6.2, 1.6));
      const lift = Math.pow(Math.max(0, 1 - distance), 1.7) * cardW * 0.5;

      card.style.setProperty('--shade', shade.toFixed(3));
      card.style.setProperty('--fog', fog.toFixed(3));
      card.style.setProperty('--lift', lift.toFixed(1));
      card.style.setProperty('--motion', motion.toFixed(3));
    }

    const index = mod(Math.round(pos));
    if (index !== active) setActive(index);
  }

  function setActive(index) {
    if (active >= 0 && cards[active]) cards[active].classList.remove('wheel__card--active');
    if (cards[index]) cards[index].classList.add('wheel__card--active');
    active = index;
    if (currentEl) currentEl.textContent = pad(index + 1);
    if (range) range.value = String(index + 1);
    if (!running && !intro) updateDetail(index);
  }

  function nearestMatch(from) {
    let best = null;
    enabled.forEach((index) => {
      const delta = shortDelta(index, from);
      if (!best || Math.abs(delta) < Math.abs(best.delta) - 1e-9) {
        best = { index, delta };
      }
    });
    return best;
  }

  function nearestIndexTo(index) {
    let best = null;
    let bestDistance = Infinity;
    enabled.forEach((candidate) => {
      const distance = Math.abs(shortDelta(candidate, index));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    });
    return best;
  }

  function settle(from) {
    const match = nearestMatch(from);
    target = match ? from + match.delta : Math.round(from);
    startLoop(7.5);
  }

  function startLoop(nextRate) {
    if (typeof nextRate === 'number') rate = nextRate;
    clearTilt();
    if (running) return;
    running = true;
    prevT = 0;
    requestAnimationFrame(frame);
  }

  function frame(now) {
    const dt = prevT ? Math.min(0.05, Math.max(0.004, (now - prevT) / 1000)) : 0.016;
    prevT = now;
    const ratio = 1 - Math.exp(-(dragging ? 20 : rate) * dt);
    const step = (target - pos) * ratio;
    speed = step / dt;
    pos += step;

    if (Math.abs(target - pos) < 0.0008) pos = target;
    render();

    if (pos !== target) {
      requestAnimationFrame(frame);
      return;
    }

    running = false;
    prevT = 0;
    speed = 0;
    velocity = 0;
    render();
    onSettled();
  }

  function onSettled() {
    intro = false;
    updateDetail(active);
    if (canHover && !reduced && lastPointer.active) {
      updateHover(lastPointer.x, lastPointer.y);
    }
  }

  function goToIndex(index, nextRate) {
    let destination = index;
    if (!enabled.has(destination)) {
      const near = nearestIndexTo(destination);
      if (near === null) return;
      destination = near;
    }
    target += shortDelta(destination, target);
    startLoop(typeof nextRate === 'number' ? nextRate : 8.5);
  }

  function stepBy(direction) {
    if (enabled.size < 2) return;
    let bestDelta = null;
    enabled.forEach((index) => {
      const delta = shortDelta(index, target);
      if (direction > 0 && delta > 0.05) {
        if (bestDelta === null || delta < bestDelta) bestDelta = delta;
      } else if (direction < 0 && delta < -0.05) {
        if (bestDelta === null || delta > bestDelta) bestDelta = delta;
      }
    });
    if (bestDelta === null) {
      enabled.forEach((index) => {
        let delta = shortDelta(index, target);
        if (direction > 0) {
          if (delta <= 0.05) delta += total;
          if (bestDelta === null || delta < bestDelta) bestDelta = delta;
        } else {
          if (delta >= -0.05) delta -= total;
          if (bestDelta === null || delta > bestDelta) bestDelta = delta;
        }
      });
    }
    if (bestDelta === null) return;
    target += bestDelta;
    startLoop(7.5);
  }

  function pageBy(direction) {
    if (!enabled.size) return;
    const wanted = target + direction * 5;
    const match = nearestMatch(wanted);
    if (!match) return;
    target = wanted + match.delta;
    startLoop(9);
  }

  function jumpEdge(first) {
    const list = Array.from(enabled).sort((a, b) => a - b);
    if (!list.length) return;
    goToIndex(first ? list[0] : list[list.length - 1], 10);
  }

  function applyFilter(value) {
    const raw = String(value || '').trim();
    const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    const next = new Set();

    cards.forEach((card, i) => {
      const haystack = (card.dataset.search || '').toLowerCase();
      const inZone = !zoneFilter || card.dataset.area === zoneFilter;
      if (inZone && words.every((word) => haystack.includes(word))) next.add(i);
    });
    enabled = next;

    cards.forEach((card, i) => {
      const isMatch = enabled.has(i);
      card.classList.toggle('wheel__card--dim', !isMatch);
      card.style.setProperty('--dim', isMatch ? '0' : '0.72');
      card.style.setProperty('--side', isMatch ? '1' : '0.12');
    });

    chips.forEach((chip) => {
      chip.setAttribute('aria-pressed', String((chip.dataset.zone || '') === zoneFilter));
    });

    if (clearBtn) clearBtn.hidden = raw.length === 0;
    if (resultsEl) {
      if (!raw && !zoneFilter) {
        resultsEl.textContent = `${total} villa siap dijelajahi`;
      } else if (!raw) {
        resultsEl.textContent = `Zona ${zoneFilter} · ${enabled.size} villa`;
      } else if (enabled.size) {
        resultsEl.textContent = zoneFilter
          ? `Zona ${zoneFilter} · ${enabled.size} villa cocok dengan “${raw}”`
          : `${enabled.size} villa cocok dengan “${raw}”`;
      } else if (zoneFilter) {
        resultsEl.textContent = `Tidak ada villa di zona ${zoneFilter} yang cocok dengan “${raw}”. Hapus pencarian atau pilih zona lain.`;
      } else {
        resultsEl.textContent = `Tidak ada villa cocok dengan “${raw}”. Coba kata lain, hapus pencarian, atau tekan Escape.`;
      }
    }

    if (range) range.disabled = enabled.size === 0;
    if (prevBtn) prevBtn.disabled = enabled.size < 2;
    if (nextBtn) nextBtn.disabled = enabled.size < 2;

    if (enabled.size && active >= 0 && !enabled.has(active)) {
      const match = nearestMatch(target);
      if (match) {
        target += match.delta;
        startLoop(9);
      }
    }
  }

  function updateDetail(index) {
    if (!detail || !detailName || index < 0 || index >= total) return;
    if (shown === index) return;
    shown = index;
    const data = cards[index].dataset;

    detailNum.textContent = pad(index + 1);
    detailZone.textContent = `${data.area} · ${data.region}`;
    detailName.textContent = data.name;
    detailDesc.textContent = data.desc || '';
    detailRooms.textContent = `${data.bedrooms} kamar`;
    detailGuests.textContent = `${data.capacity} tamu`;
    detailPrice.textContent = data.price || '';
    if (detailOld) {
      if (data.priceOld) {
        detailOld.hidden = false;
        detailOld.textContent = data.priceOld;
      } else {
        detailOld.hidden = true;
        detailOld.textContent = '';
      }
    }
    detailLink.href = data.href || '/our-villas/';
    detailBook.href = data.book || '/booking/';
    detailAmenities.textContent = data.amenities || '';

    detail.classList.remove('wheel__detail--in');
    void detail.offsetWidth;
    detail.classList.add('wheel__detail--in');
  }

  function setDetailOpen(open) {
    if (!detail) return;
    detail.classList.toggle('wheel__detail--open', open);
    if (moreBtn) {
      moreBtn.setAttribute('aria-expanded', String(open));
      moreBtn.textContent = open ? 'Tutup detail' : 'Detail lengkap';
    }
    if (closeBtn) closeBtn.hidden = !open;
    if (open) {
      updateDetail(active);
      if (typeof detail.scrollIntoView === 'function') {
        detail.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
      }
    }
  }

  function announce(message) {
    if (!announceEl) return;
    announceEl.textContent = '';
    window.setTimeout(() => {
      announceEl.textContent = message;
    }, 30);
  }

  function clearTilt() {
    if (!hovered.el) return;
    const card = hovered.el;
    hovered.el = null;
    card.classList.remove('wheel__card--tilt');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--hover-z', '0px');
    card.style.setProperty('--shadow-x', '0px');
  }

  function applyTilt(card, clientX, clientY) {
    if (!canHover || reduced) return;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (hovered.el && hovered.el !== card) clearTilt();
    hovered.el = card;

    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));

    card.classList.add('wheel__card--tilt');
    card.style.setProperty('--rx', `${((0.5 - y) * 18).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${((x - 0.5) * 24).toFixed(2)}deg`);
    card.style.setProperty('--hover-z', '28px');
    card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    card.style.setProperty('--shadow-x', `${((0.5 - x) * 18).toFixed(1)}px`);
  }

  function updateHover(clientX, clientY) {
    if (!canHover || reduced || dragging || running) return;
    const element = document.elementFromPoint(clientX, clientY);
    const card = element && element.closest ? element.closest('[data-wheel-card]') : null;
    if (!card || !stage.contains(card)) {
      clearTilt();
      return;
    }
    const index = Number(card.dataset.index);
    if (!enabled.has(index)) {
      clearTilt();
      return;
    }
    applyTilt(card, clientX, clientY);
  }

  function onPointerMove(event) {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (!dragging) {
      if (Math.abs(dx) <= 6 || Math.abs(dx) <= Math.abs(dy)) return;
      dragging = true;
      moved = true;
      startPos = pos;
      try {
        stage.setPointerCapture(event.pointerId);
      } catch (error) {
        /* pointer capture is best-effort */
      }
      root.classList.add('wheel--dragging');
      clearTilt();
    }

    const now = performance.now();
    const dt = Math.max(8, now - lastMoveT) / 1000;
    const instant = (-(event.clientX - lastMoveX) / stepPx) / dt;
    velocity = velocity * 0.72 + instant * 0.28;
    lastMoveX = event.clientX;
    lastMoveT = now;

    target = startPos - dx / stepPx;
    startLoop(20);
  }

  function endPointer(event) {
    if (pointerId === null) return;
    if (event && event.pointerId !== pointerId) return;
    const wasDragging = dragging;
    const id = pointerId;
    pointerId = null;
    dragging = false;
    root.classList.remove('wheel--dragging');

    try {
      if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
    } catch (error) {
      /* ignore */
    }

    if (wasDragging) {
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 90);
      const momentum = reduced ? 0 : Math.max(-5, Math.min(5, velocity * 0.2));
      settle(pos + momentum);
    } else if (Math.abs(pos - Math.round(pos)) > 0.02) {
      settle(pos);
    }
  }

  /* ---------- events ---------- */

  stage.addEventListener('pointerdown', (event) => {
    if (pointerId !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerId = event.pointerId;
    dragging = false;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    startPos = pos;
    lastMoveX = event.clientX;
    lastMoveT = performance.now();
    velocity = 0;
    lastPointer.x = event.clientX;
    lastPointer.y = event.clientY;
    lastPointer.active = true;
    intro = false;
    target = pos;
    clearTilt();
    try {
      stage.focus({ preventScroll: true });
    } catch (error) {
      /* ignore */
    }
  });

  stage.addEventListener('pointermove', (event) => {
    lastPointer.x = event.clientX;
    lastPointer.y = event.clientY;
    lastPointer.active = true;
    if (pointerId !== null) {
      onPointerMove(event);
      return;
    }
    if (event.pointerType && event.pointerType !== 'mouse') return;
    updateHover(event.clientX, event.clientY);
  }, { passive: true });

  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);

  stage.addEventListener('pointerleave', () => {
    lastPointer.active = false;
    clearTilt();
  });

  stage.addEventListener('click', (event) => {
    if (suppressClick) return;
    const card = event.target.closest ? event.target.closest('[data-wheel-card]') : null;
    if (!card) return;
    const index = Number(card.dataset.index);
    if (!enabled.has(index)) return;
    if (index === active) {
      setDetailOpen(true);
    } else {
      goToIndex(index, 9);
    }
  });

  stage.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key === 'ArrowRight') {
      event.preventDefault();
      stepBy(1);
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      stepBy(-1);
    } else if (key === 'PageDown') {
      event.preventDefault();
      pageBy(1);
    } else if (key === 'PageUp') {
      event.preventDefault();
      pageBy(-1);
    } else if (key === 'Home') {
      event.preventDefault();
      jumpEdge(true);
    } else if (key === 'End') {
      event.preventDefault();
      jumpEdge(false);
    }
  });

  stage.addEventListener('wheel', (event) => {
    if (event.ctrlKey) return;
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    const amount = event.deltaMode === 1 ? event.deltaX * 16 : event.deltaX;
    intro = false;
    clearTilt();
    target += amount / stepPx;
    startLoop(18);
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => settle(pos), 130);
  }, { passive: false });

  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilter(searchInput.value));
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') event.preventDefault();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      applyFilter('');
      announce('Pencarian dihapus.');
      searchInput.focus();
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const zone = chip.dataset.zone || '';
      zoneFilter = zoneFilter === zone ? '' : zone;
      applyFilter(searchInput ? searchInput.value : '');

      if (!enabled.size) {
        announce(
          zoneFilter
            ? `Belum ada villa di zona ${zoneFilter} yang cocok dengan pencarian.`
            : 'Tidak ada villa yang cocok dengan pencarian.'
        );
        return;
      }

      if (zoneFilter) {
        const match = nearestMatch(target);
        if (match) {
          target += match.delta;
          startLoop(9);
        }
        announce(`Menampilkan ${enabled.size} villa di zona ${zoneFilter}.`);
      } else {
        announce(`Menampilkan semua ${total} villa.`);
      }
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', () => stepBy(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => stepBy(1));

  if (range) {
    range.addEventListener('input', () => {
      const index = Number(range.value) - 1;
      goToIndex(index, 16);
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      setDetailOpen(!detail.classList.contains('wheel__detail--open'));
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => setDetailOpen(false));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      applyFilter('');
      announce('Pencarian dihapus.');
    } else if (zoneFilter) {
      zoneFilter = '';
      applyFilter('');
      announce('Filter zona dihapus.');
    } else if (detail && detail.classList.contains('wheel__detail--open')) {
      setDetailOpen(false);
    }
  });

  if (reduceMQ.addEventListener) {
    reduceMQ.addEventListener('change', (event) => {
      reduced = event.matches;
      clearTilt();
    });
  }
  if (hoverMQ.addEventListener) {
    hoverMQ.addEventListener('change', (event) => {
      canHover = event.matches;
      if (!canHover) clearTilt();
    });
  }

  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      measure();
      render();
    });
  });

  /* ---------- boot ---------- */

  measure();
  pos = reduced ? 0 : -10;
  target = 0;
  applyFilter('');
  render();
  updateDetail(0);

  if (reduced) {
    intro = false;
    pos = 0;
    target = 0;
    render();
    updateDetail(0);
  } else {
    startLoop(3.2);
  }
}
