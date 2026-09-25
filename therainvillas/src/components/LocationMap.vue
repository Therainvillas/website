<template>
  <div class="lm">
    <div class="lm__legend">
      <span class="lm__legend-label">Peta Villa di Puncak</span>
      <span class="lm__legend-hint">Klik marker untuk membuka villa</span>
    </div>
    <div class="lm__map" ref="mapEl"></div>
  </div>
</template>

<script>
import { OFFICE, locations } from '../data/locations.js';
import { slugify } from '../lib/slugify.js';

export default {
  props: {
    villaId: {
      type: [Number, String],
      default: 0,
    },
  },
  data() {
    return {
      map: null,
      markers: [],
    };
  },
  mounted() {
    this.loadLeaflet();
  },
  beforeUnmount() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.forEach((m) => {
      m._icon && m._icon.remove && m._icon.remove();
    });
    this.markers = [];
  },
  methods: {
    loadLeaflet() {
      if (window.L) {
        this.initMap();
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => this.initMap();
      document.head.appendChild(script);
    },
    initMap() {
      const L = window.L;
      this.map = L.map(this.$refs.mapEl, { scrollWheelZoom: false }).setView(
        [OFFICE.lat, OFFICE.lng],
        12,
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.map);

      const officePin = L.divIcon({
        className: 'lm__pin-shell',
        html: `<div class="lm__pin lm__pin--office"><span class="lm__pin-dot"></span><span class="lm__pin-label">Kantor Pusat</span></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      this.markers.push(L.marker([OFFICE.lat, OFFICE.lng], { icon: officePin }).addTo(this.map));

      const currentId = Number(this.villaId) || 0;
      let currentMarker = null;

      locations.forEach((v) => {
        const isCurrent = Number(v.id) === currentId;

        const divIcon = L.divIcon({
          className: 'lm__pin-shell',
          html: `<div class="lm__pin ${isCurrent ? 'lm__pin--active' : ''}">
                  <span class="lm__pin-dot"></span>
                  <span class="lm__pin-label">${this.shortName(v.name)}</span>
                </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([v.lat, v.lng], { icon: divIcon })
          .addTo(this.map)
          .on('click', () => {
            this.openVilla(v);
          });

        marker.bindPopup(
          `<div class="lm__pop">
             <strong>${v.name}</strong>
             <span>Buka detail villa</span>
           </div>`,
          { closeButton: false, offset: L.point(0, -22) }
        );
        this.markers.push(marker);

        if (isCurrent) {
          currentMarker = marker;
          marker.openPopup();
        }
      });

      if (currentMarker) {
        setTimeout(() => this.fitToCurrent(currentMarker), 250);
      }
    },
    fitToCurrent(marker) {
      if (this.map && marker) {
        this.map.panTo(marker.getLatLng(), { animate: true });
        this.map.setZoom(14);
      }
    },
    shortName(name) {
      return String(name || '')
        .replace(/^Villa\s+/i, '')
        .replace(/^Rjs\s+cottage\s+/i, 'RJS ');
    },
    openVilla(v) {
      window.location.href = `/${slugify(v.name)}`;
    },
  },
};
</script>

<style scoped>
.lm {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  background: #eef1f4;
}
.lm__legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}
.lm__legend-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #141519;
}
.lm__legend-hint {
  font-size: 0.72rem;
  color: #918e86;
}
.lm__map {
  width: 100%;
  height: 360px;
  z-index: 0;
}
.lm__map :deep(.leaflet-container) {
  font-family: inherit;
}
.lm__pin-shell {
  background: transparent;
  border: none;
}
.lm__pin {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #cbd5e1;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.lm__pin-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
}
.lm__pin:hover {
  transform: translate(-50%, -50%) scale(1.08);
}
.lm__pin--active {
  background: linear-gradient(135deg, #5b8def, #7a5ce0);
  border-color: #7a5ce0;
  color: #fff;
}
.lm__pin--active .lm__pin-dot {
  background: #fff;
}
.lm__pin--office {
  background: #1f3526;
  border-color: #14271a;
  color: #fff;
}
.lm__pin--office .lm__pin-dot {
  background: #d5a62e;
}
.lm__pop {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: inherit;
}
.lm__pop strong {
  font-size: 0.85rem;
  color: #141519;
}
.lm__pop span {
  font-size: 0.75rem;
  color: #64748b;
}

@media (max-width: 640px) {
  .lm__map {
    height: 280px;
  }
}
</style>
