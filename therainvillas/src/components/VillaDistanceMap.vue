<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';

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

function goTo(href) {
  if (href) window.location.href = href;
}

onMounted(async () => {
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
      html: `<div class="vdm-villa" data-vdm-id="${String(v.id)}"><span class="vdm-villa-icon"><img src="/pin.png" alt="" /></span><span class="vdm-villa-name">${v.name}</span></div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
    marker.on('mouseover', () => setActive(v.id));
    marker.on('mouseout', () => setActive(null));
    marker.on('focus', () => setActive(v.id));
    marker.on('blur', () => setActive(null));
    marker.on('click', () => goTo(v.href));
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
  <section class="vdm">
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

    <aside class="vdm-sidebar">
      <header class="vdm-sidebar-head">
        <div class="vdm-sidebar-titlewrap">
          <h3 class="vdm-sidebar-title">{{ title }}</h3>
          <p v-if="subtitle" class="vdm-sidebar-sub">{{ subtitle }}</p>
        </div>
        <span class="vdm-count">{{ villas.length }} villa</span>
      </header>

      <ul class="vdm-list">
        <li v-for="(v, i) in villas" :key="String(v.id)">
          <a
            :href="v.href || '#'"
            class="vdm-item"
            :class="{ 'vdm-item--active': activeId === String(v.id) }"
            @mouseenter="setActive(v.id)"
            @mouseleave="setActive(null)"
            @focus="setActive(v.id)"
            @blur="setActive(null)"
          >
            <span class="vdm-item-name">{{ v.name }}</span>
            <span class="vdm-item-dist">
              {{ formatDistance(haversineKm(office.lat, office.lng, v.lat, v.lng)) }}
            </span>
          </a>
        </li>
      </ul>

      <footer class="vdm-sidebar-foot">
        Jarak dihitung real-time dari koordinat (rumus Haversine)
      </footer>
    </aside>
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
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  align-items: stretch;
  color: var(--vdm-ink);
  font-family: inherit;
}

.vdm-mapwrap {
  position: relative;
  min-height: 480px;
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
  transform: scale(1.25);
  filter: drop-shadow(0 4px 10px rgba(20, 39, 26, 0.45)) drop-shadow(0 0 6px rgba(213, 166, 46, 0.9));
}
.vdm-villa:hover .vdm-villa-name,
.vdm-villa--active .vdm-villa-name {
  background: var(--vdm-gold);
  border-color: rgba(213, 166, 46, 0.5);
  color: var(--vdm-pine-deep);
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

.vdm-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #e2e8dd;
  box-shadow: 0 10px 32px rgba(20, 39, 26, 0.12);
  overflow: hidden;
}
.vdm-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #eef1e6;
}
.vdm-sidebar-titlewrap {
  min-width: 0;
}
.vdm-sidebar-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--vdm-pine);
  margin: 0;
}
.vdm-sidebar-sub {
  font-size: 11.5px;
  color: #6f7d68;
  margin: 3px 0 0;
}
.vdm-count {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--vdm-sage-soft);
  color: var(--vdm-sage-deep);
  font-size: 11px;
  font-weight: 800;
}
.vdm-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.vdm-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}
.vdm-item:hover,
.vdm-item--active {
  background: var(--vdm-sage-soft);
  border-color: #dbe4c9;
}
.vdm-item--active {
  background: #f5eed7;
  border-color: rgba(213, 166, 46, 0.55);
}
.vdm-item-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--vdm-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vdm-item-dist {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--vdm-sage-deep);
  background: #fff;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #e3e9d5;
}
.vdm-item:hover .vdm-item-dist,
.vdm-item--active .vdm-item-dist {
  color: #a77e14;
  border-color: rgba(213, 166, 46, 0.5);
  background: #fff8e6;
}
.vdm-sidebar-foot {
  padding: 10px 14px;
  border-top: 1px solid #eef1e6;
  font-size: 11px;
  color: #94a08b;
  text-align: center;
  background: #fbfcf8;
}

.vdm .leaflet-container {
  font-family: inherit;
}

@media (max-width: 900px) {
  .vdm {
    grid-template-columns: 1fr;
  }
  .vdm-mapwrap {
    min-height: 380px;
  }
  .vdm-list {
    max-height: 320px;
  }
}
</style>