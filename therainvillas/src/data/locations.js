/**
 * Data lokasi kantor & 31 villa (sumber tunggal untuk peta beranda & detail).
 *
 * Sumber: "maps.md" (folder web trv 2) — berisi koordinat & tautan Google Maps
 * kantor dan setiap villa. Villa yang dikelompokkan di maps.md
 * (Villa Kaca 1 & 2, RJS 1-3) berbagi tautan maps.md yang sama, tetapi diberi
 * nudge koordinat kecil agar marker tidak menumpuk di titik yang sama.
 *
 * Villa Arsy (id 11) memakai entri "Villa Griya Arsy" yang tercantum di maps.md.
 */
export const OFFICE = {
  id: 'office',
  name: 'The Rain Villas (Kantor Pusat)',
  lat: -6.6821574768910805,
  lng: 106.95660148565966,
  mapsUrl: 'https://maps.app.goo.gl/mGghdcBHjNJ1DZ2f9',
};

export const locations = [
  { id: 1, name: 'Villa Agave', lat: -6.6790739530115095, lng: 106.95188136789119, href: '/villas/villa-agave', mapsUrl: 'https://maps.app.goo.gl/9UiPfN9B71ZXuvDC6' },
  { id: 2, name: 'Villa Wanela', lat: -6.701963971517161, lng: 106.91619320967736, href: '/villas/villa-wanela', mapsUrl: 'https://maps.app.goo.gl/AwVg63njJYZ2dudB7' },
  { id: 3, name: 'Villa Cemara', lat: -6.700336659971097, lng: 106.94574227529155, href: '/villas/villa-cemara', mapsUrl: 'https://maps.app.goo.gl/TNcT2GzbMQmVWfUc9' },
  { id: 4, name: 'Villa Aleia', lat: -6.694091390838108, lng: 106.95955356919865, href: '/villas/villa-aleia', mapsUrl: 'https://maps.app.goo.gl/jH7e2PLbAYA7CxRx7' },
  { id: 5, name: 'Villa 4D', lat: -6.688304967654033, lng: 106.95851726974144, href: '/villas/villa-4d', mapsUrl: 'https://maps.app.goo.gl/N4x239LgVRrKofAp6' },
  { id: 6, name: 'Villa Calmora', lat: -6.678895960807071, lng: 106.95898284036271, href: '/villas/villa-calmora', mapsUrl: 'https://maps.app.goo.gl/aJA4zwTg6hmVm22V8' },
  { id: 7, name: 'Villa Twins', lat: -6.671535094375612, lng: 106.95446539618409, href: '/villas/villa-twins', mapsUrl: 'https://maps.app.goo.gl/yyxNPzcvP9DDhwK4A' },
  { id: 8, name: 'Villa Cyrena', lat: -6.707333917647203, lng: 106.94411781779978, href: '/villas/villa-cyrena', mapsUrl: 'https://maps.app.goo.gl/pHVfEoSgqZHQ4ZzJ7' },
  { id: 9, name: 'Villa Arisyfa', lat: -6.707096985129583, lng: 106.94474062817739, href: '/villas/villa-arisyfa', mapsUrl: 'https://maps.app.goo.gl/Z8B4tgx9HcKvT6ZR8' },
  { id: 10, name: 'Villa Cempaka', lat: -6.6825009100713, lng: 106.95975910227703, href: '/villas/villa-cempaka', mapsUrl: 'https://maps.app.goo.gl/FpbJC1SwgqTXsd7e7' },
  { id: 11, name: 'Villa Arsy', lat: -6.663891579028717, lng: 106.92618897104819, href: '/villas/villa-arsy', mapsUrl: 'https://maps.app.goo.gl/BrXt4E9a6DQc7Xkd6' },
  { id: 12, name: 'Villa Rayya', lat: -6.672734631729965, lng: 106.94676310597693, href: '/villas/villa-rayya', mapsUrl: 'https://maps.app.goo.gl/SGQbCoTCfofsv89D9' },
  { id: 13, name: 'Villa Opung', lat: -6.698760537081032, lng: 106.90267497899156, href: '/villas/villa-opung', mapsUrl: 'https://maps.app.goo.gl/zAyzhmEyojauChWb6' },
  { id: 14, name: 'Rjs Cottage 1', lat: -6.69400022372825, lng: 106.92123823296289, href: '/villas/rjs-cottage-1', mapsUrl: 'https://maps.app.goo.gl/BG4iC7Pj6mqsLcyBA' },
  { id: 15, name: 'Rjs Cottage 2', lat: -6.69400022372825, lng: 106.92163823296289, href: '/villas/rjs-cottage-2', mapsUrl: 'https://maps.app.goo.gl/BG4iC7Pj6mqsLcyBA' },
  { id: 16, name: 'Rjs Cottage 3', lat: -6.69400022372825, lng: 106.92203823296289, href: '/villas/rjs-cottage-3', mapsUrl: 'https://maps.app.goo.gl/BG4iC7Pj6mqsLcyBA' },
  { id: 17, name: 'Villa Kaca 1', lat: -6.6945388682955205, lng: 106.97579197899148, href: '/villas/villa-kaca-1', mapsUrl: 'https://maps.app.goo.gl/VxdfdAE2EXFxKtLX6' },
  { id: 18, name: 'Villa Kaca 2', lat: -6.6945388682955205, lng: 106.97659197899148, href: '/villas/villa-kaca-2', mapsUrl: 'https://maps.app.goo.gl/VxdfdAE2EXFxKtLX6' },
  { id: 19, name: 'Villa De Summit', lat: -6.713566677427913, lng: 106.95379380967746, href: '/villas/villa-de-summit', mapsUrl: 'https://maps.app.goo.gl/NZCDCFKD8NYiBKv9A' },
  { id: 20, name: 'Villa Bodas', lat: -6.668921588175983, lng: 106.91877677450701, href: '/villas/villa-bodas', mapsUrl: 'https://maps.app.goo.gl/pSNmxLAjdU8xA88o9' },
  { id: 21, name: 'Villa Thymi', lat: -6.681534473994694, lng: 106.96150025994852, href: '/villas/villa-thymi', mapsUrl: 'https://maps.app.goo.gl/g39dLNdx3XxgqUBt8' },
  { id: 22, name: 'Villa Albi', lat: -6.644415998523295, lng: 106.8889357538551, href: '/villas/villa-albi', mapsUrl: 'https://maps.app.goo.gl/NPBadpidnJNZve4HA' },
  { id: 23, name: 'Villa Valora', lat: -6.702291671609925, lng: 106.91628856734881, href: '/villas/villa-valora', mapsUrl: 'https://maps.app.goo.gl/qqf8rUHftWLN1Y2u5' },
  { id: 24, name: 'Echa Village', lat: -6.660838546765414, lng: 106.92411914039627, href: '/villas/echa-village', mapsUrl: 'https://maps.app.goo.gl/DSbsfNPLcRQ7v2iW8' },
  { id: 25, name: 'Villa Awan', lat: -6.683243510297153, lng: 106.9259480268699, href: '/villas/villa-awan', mapsUrl: 'https://maps.app.goo.gl/Q2DvDYKAVBCYXjiUA' },
  { id: 26, name: 'Villa Baduo', lat: -6.66500329210955, lng: 106.93357236364817, href: '/villas/villa-baduo', mapsUrl: 'https://maps.app.goo.gl/kfBbmftJsV9duHKg9' },
  { id: 27, name: 'Villa Hala', lat: -6.684372998835884, lng: 106.96281019063423, href: '/villas/villa-hala', mapsUrl: 'https://maps.app.goo.gl/QppsBEG7WSqLeZSKA' },
  { id: 28, name: 'Villa Ranna', lat: -6.672362294662724, lng: 106.92289315200537, href: '/villas/villa-ranna', mapsUrl: 'https://maps.app.goo.gl/DeJrBjuW1UEwj4xh8' },
  { id: 29, name: 'Villa Rio 5', lat: -6.687706348661518, lng: 106.9280156858721, href: '/villas/villa-rio-5', mapsUrl: 'https://maps.app.goo.gl/EkZBSKzMgtteRFCB8' },
  { id: 30, name: 'The Herlina', lat: -6.648271486314955, lng: 106.91512615200512, href: '/villas/the-herlina', mapsUrl: 'https://maps.app.goo.gl/zbdPUju4BcZatyi3A' },
  { id: 31, name: 'Villa Hariza', lat: -6.6625425040113235, lng: 106.92399322501966, href: '/villas/villa-hariza', mapsUrl: 'https://maps.app.goo.gl/VKCL77QvgBWYMmBi9' },
];