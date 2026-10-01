<script setup>
import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick } from 'vue';
import { villas as villaCatalog } from '../data/villas';
import { DRIVE_MINUTES } from '../data/driveTimes';

const LEAF_VERSION = '1.9.4';

function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector('link[href*="leaflet@' + LEAF_VERSION + '/dist/leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://unpkg.com/leaflet@${LEAF_VERSION}/dist/leaflet.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = `https://unpkg.com/leaflet@${LEAF_VERSION}/dist/leaflet.js`;
    script.onload = () => resolve(window.L);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

const props = defineProps({
  office: { type: Object, required: true },
  villas: { type: Array, required: true },
  title: { type: String, default: 'Peta Jarak Villa' },
  subtitle: { type: String, default: 'Jarak dari kantor The Rain Villas, Puncak' },
});

function crPath(pts) {
  const n = pts.length;
  if (n < 2) return '';
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function windingPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const amp = Math.min(46, Math.max(18, len * 0.1));
  const lobes = 1.5;
  const steps = Math.max(16, Math.round(len / 14));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const off = amp * Math.sin(t * Math.PI * 2 * lobes);
    pts.push([x1 + dx * t + px * off, y1 + dy * t + py * off]);
  }
  return crPath(pts);
}

const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${km.toFixed(0)} km`;
}

const mapEl = ref(null);
const ready = ref(false);
const viewport = ref({ w: 0, h: 0 });
const activeId = ref(null);
const line = ref(null);
const cardOpen = ref(false);
const selectedId = ref(null);
const cardEl = ref(null);

let map = null;
let onResize = null;
const markers = new Map();

function updateLine(id) {
  if (!map || !mapEl.value) return;
  const villa = props.villas.find((v) => String(v.id) === String(id));
  if (!villa) return;

  const op = map.latLngToContainerPoint([props.office.lat, props.office.lng]);
  const dp = map.latLngToContainerPoint([villa.lat, villa.lng]);
  const w = mapEl.value.clientWidth;
  const h = mapEl.value.clientHeight;

  viewport.value =
    viewport.value.w === w && viewport.value.h === h ? viewport.value : { w, h };
  line.value = {
    x1: op.x,
    y1: op.y,
    x2: dp.x,
    y2: dp.y,
    d: windingPath(op.x, op.y, dp.x, dp.y),
    cx: (op.x + dp.x) / 2,
    cy: (op.y + dp.y) / 2,
    name: villa.name,
    distLabel: formatDistance(
      haversineKm(props.office.lat, props.office.lng, villa.lat, villa.lng),
    ),
  };
}

function onMapMove() {
  if (activeId.value != null) updateLine(activeId.value);
  else line.value = null;
}

function setActive(id) {
  activeId.value = id == null ? null : String(id);
  if (id == null) line.value = null;
  else updateLine(id);
}

watch(activeId, (id) => {
  const el = mapEl.value;
  if (!el) return;
  el.querySelectorAll('.vdm-villa').forEach((n) => n.classList.remove('vdm-villa--active'));
  if (id != null) {
    const target = el.querySelector(`[data-vdm-id="${String(id)}"]`);
    if (target) target.classList.add('vdm-villa--active');
  }
});

watch(selectedId, (id) => {
  const el = mapEl.value;
  if (!el) return;
  el.querySelectorAll('.vdm-villa').forEach((n) => n.classList.remove('vdm-villa--selected'));
  if (id != null) {
    const target = el.querySelector(`[data-vdm-id="${String(id)}"]`);
    if (target) target.classList.add('vdm-villa--selected');
  }
});

// Card di samping kanan membuat lebar peta berubah → segarkan ukuran Leaflet.
watch(cardOpen, async () => {
  await nextTick();
  if (!map) return;
  map.invalidateSize();
  setTimeout(() => {
    if (!map) return;
    map.invalidateSize();
    onMapMove();
  }, 420);
});

function goTo(href) {
  if (href) window.location.href = href;
}

function driveLabelFor(id) {
  const known = DRIVE_MINUTES[String(id)];
  if (known != null) return `${known} MIN DRIVE BY CAR`;
  const loc = props.villas.find((v) => String(v.id) === String(id));
  const km = loc
    ? haversineKm(props.office.lat, props.office.lng, loc.lat, loc.lng)
    : 1;
  const minutes = Math.max(3, Math.round((km * 1.6) / 30 * 60));
  return `${minutes} MIN DRIVE BY CAR`;
}

function villaCardInfo(id) {
  const loc = props.villas.find((v) => String(v.id) === String(id));
  if (!loc) return null;
  const cat =
    villaCatalog.find((v) => String(v.id) === String(id)) ||
    villaCatalog.find((v) => v.name === loc.name) ||
    {};
  return {
    id: String(loc.id),
    name: loc.name,
    href: loc.href || '#',
    image: cat.image || '/pin.png',
    description: cat.description || '',
    driveLabel: driveLabelFor(loc.id),
  };
}

const card = computed(() => (selectedId.value == null ? null : villaCardInfo(selectedId.value)));

function openLocation(id) {
  selectedId.value = String(id);
  cardOpen.value = true;
  setActive(id);
  nextTick(() => {
    if (cardEl.value && cardEl.value.scrollIntoView) {
      setTimeout(() => {
        cardEl.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    }
  });
}

function closeLocation() {
  cardOpen.value = false;
  selectedId.value = null;
  activeId.value = null;
  line.value = null;
}

function onDocClick(e) {
  if (!cardOpen.value) return;
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;
  if (target.closest('.vdm-mapwrap') || target.closest('.vdm-location')) return;
  closeLocation();
}

function onDocKey(e) {
  if (e.key === 'Escape') closeLocation();
}

onMounted(async () => {
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onDocKey);
  // Leaflet dimuat dari CDN (client-only), mengikuti pola LocationMap.vue,
  // agar konsisten dan terhindar dari error import UMD saat bundle Astro.
  const L = await loadLeaflet();
  if (!L || !mapEl.value) return;

  map = L.map(mapEl.value, { scrollWheelZoom: false }).setView(
    [props.office.lat, props.office.lng],
    12,
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const officeIcon = L.divIcon({
    className: 'vdm-icon',
    html:
      '<div class="vdm-office">' +
      '<span class="vdm-office-pulse"></span>' +
      '<span class="vdm-office-pulse vdm-office-pulse--2"></span>' +
      `<span class="vdm-office-body"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg></span>` +
      '<span class="vdm-office-cap">Kantor</span>' +
      '</div>',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
  const officeMarker = L.marker([props.office.lat, props.office.lng], {
    icon: officeIcon,
    zIndexOffset: 2000,
  }).addTo(map);
  officeMarker.on('click', () => goTo(props.office.mapsUrl));

  props.villas.forEach((v) => {
    const icon = L.divIcon({
      className: 'vdm-icon',
      html: `<button type="button" class="vdm-villa" data-vdm-id="${String(v.id)}" tabindex="0" aria-label="Lihat detail ${v.name}"><span class="vdm-villa-icon"><img class="vdm-villa-pin vdm-villa-pin--close" src="/pin%20close%20new.png" alt="" /><img class="vdm-villa-pin vdm-villa-pin--open" src="/pin%20open.png" alt="" /></span><span class="vdm-villa-name">${v.name}</span></button>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
    const hoverActive = () => {
      if (!cardOpen.value) setActive(v.id);
    };
    const hoverIdle = () => {
      if (!cardOpen.value) setActive(null);
    };
    marker.on('mouseover', hoverActive);
    marker.on('mouseout', hoverIdle);
    marker.on('click', () => openLocation(v.id));
    const markerEl = marker.getElement();
    if (markerEl) {
      const btn = markerEl.querySelector('.vdm-villa');
      if (btn) {
        btn.addEventListener('focus', hoverActive);
        btn.addEventListener('blur', hoverIdle);
      }
    }
    markers.set(String(v.id), marker);
  });

  const latlngs = [
    [props.office.lat, props.office.lng],
    ...props.villas.map((v) => [v.lat, v.lng]),
  ];
  map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 14 });

  map.on('move zoom', onMapMove);

  onResize = () => {
    if (map) {
      map.invalidateSize();
      onMapMove();
    }
  };
  window.addEventListener('resize', onResize);

  await nextTick();
  viewport.value = { w: mapEl.value.clientWidth, h: mapEl.value.clientHeight };
  ready.value = true;
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onDocKey);
  if (onResize) window.removeEventListener('resize', onResize);
  markers.forEach((m) => m.remove());
  markers.clear();
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <section class="vdm" :class="{ 'vdm--card-open': cardOpen }">
    <div class="vdm-mapwrap">
      <div ref="mapEl" class="vdm-map"></div>

      <svg
        v-if="line && activeId !== null && viewport.w"
        class="vdm-lines"
        :viewBox="`0 0 ${viewport.w} ${viewport.h}`"
        aria-hidden="true"
      >
        <path class="vdm-line" :d="line.d" />
        <circle class="vdm-dot" :cx="line.cx" :cy="line.cy" r="4.5" />
      </svg>

      <div
        v-if="line && activeId !== null && viewport.w"
        class="vdm-label"
        :style="{
          left: `${(line.cx / viewport.w) * 100}%`,
          top: `${(line.cy / viewport.h) * 100}%`,
        }"
      >
        <span class="vdm-label-name">{{ line.name }}</span>
        <span class="vdm-label-dist">{{ line.distLabel }} dari kantor</span>
      </div>

      <div v-if="!ready" class="vdm-loading">Memuat peta…</div>

      <div class="vdm-legend">
        <span class="vdm-legend-item">
          <span class="vdm-legend-dot vdm-legend-office"></span>
          Kantor Pusat
        </span>
        <span class="vdm-legend-item">
          <span class="vdm-legend-dot vdm-legend-villa"></span>
          {{ villas.length }} Villa
        </span>
      </div>
    </div>

    <div
      ref="cardEl"
      class="vdm-location"
      :class="{ 'vdm-location--open': cardOpen }"
      v-show="cardOpen"
      data-vdm-card
    >
      <button
        v-if="cardOpen"
        type="button"
        class="vdm-location__close"
        aria-label="Tutup kartu lokasi"
        @click.stop="closeLocation"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <transition name="vdm-swap" mode="out-in">
        <div
          v-if="card && cardOpen"
          :key="card.id"
          class="vdm-location__box"
          role="region"
          aria-live="polite"
        >
          <img class="vdm-location__media" :src="card.image" :alt="card.name" loading="lazy" />
          <div class="vdm-location__content">
            <span class="vdm-location__dist">{{ card.driveLabel }}</span>
            <h4 class="vdm-location__name">{{ card.name }}</h4>
            <p class="vdm-location__desc">{{ card.description }}</p>
            <a class="vdm-location__link" :href="card.href">Lihat Detail Villa</a>
          </div>
        </div>
      </transition>
    </div>
  </section>
</template>

<style>
.vdm {
  --vdm-pine: #1f3526;
  --vdm-pine-deep: #14271a;
  --vdm-sage: #a9b58a;
  --vdm-sage-deep: #71845a;
  --vdm-sage-soft: #eef2e6;
  --vdm-gold: #d5a62e;
  --vdm-gold-soft: #e8c76a;
  --vdm-ink: #2c3a2e;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  color: var(--vdm-ink);
  font-family: inherit;
}

.vdm--card-open {
  grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
}

.vdm-mapwrap {
  position: relative;
  min-height: 560px;
  border-radius: 18px;
  overflow: hidden;
  background: #e8efe4;
  box-shadow: 0 10px 32px rgba(20, 39, 26, 0.18);
}
.vdm-map {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.vdm-loading {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vdm-sage-soft);
  color: var(--vdm-sage-deep);
  font-size: 13px;
  font-weight: 600;
}

.vdm-icon {
  background: transparent;
  border: none;
}

.vdm-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  overflow: visible;
}
.vdm-line {
  fill: none;
  stroke: var(--vdm-gold);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 12 10;
  filter: drop-shadow(0 0 5px rgba(213, 166, 46, 0.6));
  opacity: 0;
  animation:
    vdm-in 0.25s ease 0.05s forwards,
    vdm-march 0.9s linear 0.05s infinite;
}
.vdm-dot {
  fill: var(--vdm-gold);
  stroke: #fff;
  stroke-width: 1.5;
  filter: drop-shadow(0 0 4px rgba(213, 166, 46, 0.7));
  opacity: 0;
  animation: vdm-in 0.25s ease 0.05s forwards;
}
@keyframes vdm-march {
  to {
    stroke-dashoffset: -44px;
  }
}
@keyframes vdm-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.vdm-label {
  position: absolute;
  z-index: 3;
  transform: translate(-50%, -135%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(20, 39, 26, 0.92);
  color: #fff;
  border: 1px solid rgba(232, 199, 106, 0.45);
  box-shadow: 0 8px 24px rgba(20, 39, 26, 0.35);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  animation: vdm-in 0.2s ease both;
}
.vdm-label-name {
  color: var(--vdm-gold-soft);
  font-weight: 800;
}
.vdm-label-dist {
  color: #fff;
  opacity: 0.92;
}

.vdm-office {
  position: relative;
  width: 0;
  height: 0;
}
.vdm-office-body {
  position: absolute;
  left: -20px;
  top: -20px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #2d4d3a, var(--vdm-pine) 70%);
  border: 3px solid #fff;
  box-shadow:
    0 6px 18px rgba(20, 39, 26, 0.5),
    0 0 0 4px rgba(31, 53, 38, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.vdm-office-body svg {
  width: 20px;
  height: 20px;
  stroke: #fff;
}
.vdm-office-cap {
  position: absolute;
  left: -25px;
  top: 22px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--vdm-pine);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(20, 39, 26, 0.35);
  z-index: 2;
}
.vdm-office-pulse {
  position: absolute;
  left: -25px;
  top: -25px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(31, 53, 38, 0.55);
  animation: vdm-pulse 2.4s ease-out infinite;
  z-index: 1;
}
.vdm-office-pulse--2 {
  animation-delay: 0.9s;
}
@keyframes vdm-pulse {
  0% {
    transform: scale(0.55);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.9);
    opacity: 0;
  }
}

.vdm-villa {
  position: relative;
  width: 0;
  height: 0;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.vdm-villa-icon {
  position: absolute;
  left: -15px;
  top: -15px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(20, 39, 26, 0.4));
  transition:
    transform 0.15s ease,
    filter 0.15s ease;
  cursor: pointer;
  z-index: 1;
}
.vdm-villa-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.vdm-villa-pin {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: opacity 0.16s ease;
}
.vdm-villa-pin--open {
  opacity: 0;
}
.vdm-villa:hover .vdm-villa-pin--close,
.vdm-villa--active .vdm-villa-pin--close,
.vdm-villa--selected .vdm-villa-pin--close,
.vdm-villa:focus-visible .vdm-villa-pin--close {
  opacity: 0;
}
.vdm-villa:hover .vdm-villa-pin--open,
.vdm-villa--active .vdm-villa-pin--open,
.vdm-villa--selected .vdm-villa-pin--open,
.vdm-villa:focus-visible .vdm-villa-pin--open {
  opacity: 1;
}
.vdm-villa-name {
  position: absolute;
  left: 0;
  top: 20px;
  transform: translateX(-50%);
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(20, 39, 26, 0.85);
  border: 1px solid rgba(168, 181, 138, 0.4);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(20, 39, 26, 0.3);
  cursor: pointer;
  line-height: 1.25;
  z-index: 1;
}
.vdm-villa:hover .vdm-villa-icon,
.vdm-villa--active .vdm-villa-icon {
  transform: scale(1.22);
  filter: drop-shadow(0 5px 10px rgba(20, 39, 26, 0.45));
}
.vdm-villa:hover .vdm-villa-name,
.vdm-villa--active .vdm-villa-name {
  background: var(--vdm-gold);
  border-color: rgba(213, 166, 46, 0.5);
  color: var(--vdm-pine-deep);
}
.vdm-villa--selected .vdm-villa-icon {
  transform: scale(1.28);
  filter: drop-shadow(0 6px 12px rgba(20, 39, 26, 0.5));
}
.vdm-villa--selected .vdm-villa-name {
  background: var(--vdm-gold);
  border-color: rgba(213, 166, 46, 0.55);
  color: var(--vdm-pine-deep);
}
.vdm-villa:focus-visible .vdm-villa-name {
  box-shadow:
    0 3px 10px rgba(20, 39, 26, 0.3),
    0 0 0 3px rgba(213, 166, 46, 0.55);
}

.vdm-legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 5;
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 14px rgba(20, 39, 26, 0.15);
  font-size: 11px;
  font-weight: 600;
  color: var(--vdm-ink);
}
.vdm-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.vdm-legend-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
}
.vdm-legend-office {
  background: var(--vdm-pine);
  box-shadow: inset 0 0 0 2px #fff, 0 0 0 1px rgba(31, 53, 38, 0.4);
}
.vdm-legend-villa {
  background: var(--vdm-sage);
  box-shadow: inset 0 0 0 2px #fff, 0 0 0 1px rgba(113, 132, 90, 0.4);
}

.vdm-location {
  position: relative;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #e2e8dd;
  box-shadow: 0 10px 32px rgba(20, 39, 26, 0.12);
  overflow: hidden;
}
.vdm--card-open .vdm-location {
  align-self: stretch;
}
.vdm-location--open .vdm-location__box {
  animation: vdm-card-in 0.4s ease both;
}
@keyframes vdm-card-in {
  from {
    opacity: 0;
    transform: translateX(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.vdm-location__box {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}
.vdm-location__media {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  flex: 0 0 auto;
}
.vdm-location__content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 18px 20px 20px;
}
.vdm-location__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #5c6b58;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.vdm-location__dist {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #a77e14;
  background: #fff8e6;
  border: 1px solid rgba(213, 166, 46, 0.45);
  padding: 4px 10px;
  border-radius: 999px;
  text-transform: uppercase;
}
.vdm-location__name {
  margin: 0;
  font-size: clamp(1.15rem, 2.4vw, 1.6rem);
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--vdm-pine-deep);
}
.vdm-location__desc {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: #5c6b58;
}
.vdm-location__link {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 10px;
  background: var(--vdm-pine);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  box-shadow: 0 8px 18px rgba(20, 39, 26, 0.22);
  transition:
    background 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.vdm-location__link:hover {
  background: var(--vdm-pine-deep);
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(20, 39, 26, 0.3);
}
.vdm-location__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: rgba(20, 39, 26, 0.78);
  color: #fff;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}
.vdm-location__close:hover {
  background: var(--vdm-pine-deep);
  transform: scale(1.08);
}
.vdm-location__close svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}
.vdm-swap-enter-active {
  transition:
    opacity 0.38s ease,
    transform 0.38s ease;
}
.vdm-swap-leave-active {
  transition: opacity 0.15s ease;
}
.vdm-swap-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.vdm-swap-leave-to {
  opacity: 0;
}

.vdm .leaflet-container {
  font-family: inherit;
}

@media (max-width: 900px) {
  .vdm,
  .vdm--card-open {
    grid-template-columns: 1fr;
  }
  .vdm-mapwrap {
    min-height: 400px;
  }
  .vdm--card-open .vdm-location {
    align-self: start;
  }
  .vdm-location__desc {
    -webkit-line-clamp: none;
  }
}
</style>