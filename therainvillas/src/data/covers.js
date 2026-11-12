/** @type {Record<string, string>} */
export const villaCovers = {
  'Villa 4D': '/4D/cover.webp',
  'Villa Agave': '/Agave/Cover.webp',
  'Villa Albi': '/Albi/Cover.webp',
  'Villa Aleia': '/Aleia/Cover.webp',
  'Villa Arisyfa': '/arisyfa/cover.webp',
  'Villa Arsy': '/arsy/cover.webp',
  'Villa Awan': '/Awan/Cover.webp',
  'Villa Baduo': '/Baduo/Cover.webp',
  'Villa Bodas': '/Bodas/Cover.webp',
  'Villa Calmora': '/Calmora/Cover.webp',
  'Villa Cemara': '/cemara/cover.webp',
  'Villa Cempaka': '/cempaka/cover.webp',
  'Villa Cyrena': '/cyrena/cover.webp',
  'Villa De Summit': '/De Summit/Cover.webp',
  'Echa Village': '/Echa Village/Cover.webp',
  'Villa Hala': '/Hala/Cover.webp',
  'Villa Elora': '/Elora/Cover.webp',
  'Villa Kaca 1': '/Kaca 1/Cover.webp',
  'Villa Kaca 2': '/Kaca 2/Cover.webp',
  'Villa Opung': '/Opung/Cover.webp',
  'Villa Ranna': '/Ranna/Cover.webp',
  'Villa Rayya': '/Rayya/Cover.webp',
  'Villa Rio 5': '/Rio 5/Cover.webp',
  'Rjs Cottage 2': '/RJS 2/Cover.webp',
  'Rjs Cottage 3': '/RJS 3/Cover.webp',
  'Rjs Cottage 1': '/RJS Cottage 1/Cover.webp',
  'The Herlina': '/The Herlina/Cover.webp',
  'Villa Thymi': '/Thymi/Cover.webp',
  'Villa Twins': '/Twins/cover.webp',
  'Villa Valora': '/Valora/Cover.webp',
  'Villa Wanela': '/wanela/cover.webp',
};

// Varian hero (1000x563, crop tengah 16:9) untuk slideshow di /our-villas,
// /availability, dan /tentang. Dipakai di layar kecil (<=768px) supaya hero
// tidak mengunduh gambar besar (dulu ~390 KiB, sekarang ~60-100 KiB).
/** @type {Record<string, string>} */
export const villaHeroCovers = {
  'Villa Agave': '/hero-sm/Agave.webp',
  'Villa Wanela': '/hero-sm/wanela.webp',
  'Villa Cemara': '/hero-sm/cemara.webp',
  'Villa Aleia': '/hero-sm/Aleia.webp',
  'Villa 4D': '/hero-sm/4D.webp',
  'Villa Calmora': '/hero-sm/Calmora.webp',
  'Villa Twins': '/hero-sm/Twins.webp',
  'Villa Cyrena': '/hero-sm/cyrena.webp',
  'Villa Arisyfa': '/hero-sm/arisyfa.webp',
  'Villa Cempaka': '/hero-sm/cempaka.webp',
  'Villa Arsy': '/hero-sm/arsy.webp',
  'Villa Rayya': '/hero-sm/Rayya.webp',
};

// Varian hero untuk halaman detail villa (crop tengah rasio 0,55, tinggi 1440).
// Hero villa setinggi penuh layar, jadi di ponsel hanya ~55% lebar cover yang
// terlihat; varian ini memuat bagian yang terlihat saja (cover 393 KiB -> 198 KiB
// pada Villa Agave) tanpa perubahan tampilan.
/** @type {Record<string, string>} */
export const villaHeroSm = {
  'Villa 4D': '/villa-hero-sm/4D.webp',
  'Villa Agave': '/villa-hero-sm/Agave.webp',
  'Villa Albi': '/villa-hero-sm/Albi.webp',
  'Villa Aleia': '/villa-hero-sm/Aleia.webp',
  'Villa Arisyfa': '/villa-hero-sm/arisyfa.webp',
  'Villa Arsy': '/villa-hero-sm/arsy.webp',
  'Villa Awan': '/villa-hero-sm/Awan.webp',
  'Villa Baduo': '/villa-hero-sm/Baduo.webp',
  'Villa Bodas': '/villa-hero-sm/Bodas.webp',
  'Villa Calmora': '/villa-hero-sm/Calmora.webp',
  'Villa Cemara': '/villa-hero-sm/cemara.webp',
  'Villa Cempaka': '/villa-hero-sm/cempaka.webp',
  'Villa Cyrena': '/villa-hero-sm/cyrena.webp',
  'Villa De Summit': '/villa-hero-sm/De_Summit.webp',
  'Echa Village': '/villa-hero-sm/Echa_Village.webp',
  'Villa Hala': '/villa-hero-sm/Hala.webp',
  'Villa Elora': '/villa-hero-sm/Elora.webp',
  'Villa Kaca 1': '/villa-hero-sm/Kaca_1.webp',
  'Villa Kaca 2': '/villa-hero-sm/Kaca_2.webp',
  'Villa Opung': '/villa-hero-sm/Opung.webp',
  'Villa Ranna': '/villa-hero-sm/Ranna.webp',
  'Villa Rayya': '/villa-hero-sm/Rayya.webp',
  'Villa Rio 5': '/villa-hero-sm/Rio_5.webp',
  'Rjs Cottage 2': '/villa-hero-sm/RJS_2.webp',
  'Rjs Cottage 3': '/villa-hero-sm/RJS_3.webp',
  'Rjs Cottage 1': '/villa-hero-sm/RJS_Cottage_1.webp',
  'The Herlina': '/villa-hero-sm/The_Herlina.webp',
  'Villa Thymi': '/villa-hero-sm/Thymi.webp',
  'Villa Twins': '/villa-hero-sm/Twins.webp',
  'Villa Valora': '/villa-hero-sm/Valora.webp',
  'Villa Wanela': '/villa-hero-sm/wanela.webp'
};

// Kartu portrait khusus roda villa 3D (/card wheel). Rasio 1080x1500 dan
// sudah memuat nama, harga, serta kapasitas di dalam gambar.
/** @type {Record<string, string>} */
export const villaWheelCovers = {
  'Villa Agave': '/card%20wheel/agave.webp',
  'Villa Wanela': '/card%20wheel/wanella.webp',
  'Villa Cemara': '/card%20wheel/cemara.webp',
  'Villa Aleia': '/card%20wheel/aleia.webp',
  'Villa 4D': '/card%20wheel/4d.webp',
  'Villa Calmora': '/card%20wheel/calmora.webp',
  'Villa Twins': '/card%20wheel/twins.webp',
  'Villa Cyrena': '/card%20wheel/cyrena.webp',
  'Villa Arisyfa': '/card%20wheel/arisyfa.webp',
  'Villa Cempaka': '/card%20wheel/cempaka.webp',
  'Villa Arsy': '/card%20wheel/arsy.webp',
  'Villa Rayya': '/card%20wheel/rayya.webp',
  'Villa Opung': '/card%20wheel/opung.webp',
  'Rjs Cottage 1': '/card%20wheel/rjs_cottage.webp',
  'Rjs Cottage 2': '/card%20wheel/rjs_2.webp',
  'Rjs Cottage 3': '/card%20wheel/rjs_3.webp',
  'Villa Kaca 1': '/card%20wheel/kaca_1.webp',
  'Villa Kaca 2': '/card%20wheel/kaca_2.webp',
  'Villa De Summit': '/card%20wheel/de_summit.webp',
  'Villa Bodas': '/card%20wheel/bodas.webp',
  'Villa Thymi': '/card%20wheel/thymi.webp',
  'Villa Albi': '/card%20wheel/albi.webp',
  'Villa Valora': '/card%20wheel/valora.webp',
  'Echa Village': '/card%20wheel/echa.webp',
  'Villa Awan': '/card%20wheel/awan.webp',
  'Villa Baduo': '/card%20wheel/baduo.webp',
  'Villa Hala': '/card%20wheel/hala.webp',
  'Villa Ranna': '/card%20wheel/ranna.webp',
  'Villa Rio 5': '/card%20wheel/rio.webp',
  'The Herlina': '/card%20wheel/herlina.webp',
  'Villa Elora': '/card%20wheel/elora.webp'
};
