/**
 * Background tema kalender per villa.
 * -------------------------------------------------------------------------
 * Sumber gambar: public/jadwal  theme/ (nama folder mengandung dua spasi,
 * jadi URL-nya harus di-encode menjadi /jadwal%20%20theme/...).
 * Dipakai oleh halaman /availability (AvailabilityGrid) dan kalender di
 * detail villa (CalendarPicker) supaya tampilannya sama.
 */

export const CALENDAR_THEME = {
  "Villa Agave": "agave",
  "Villa Wanela": "wanela",
  "Villa Cemara": "cemara",
  "Villa Aleia": "aleia",
  "Villa 4D": "4d",
  "Villa Calmora": "calmora",
  "Villa Twins": "twins",
  "Villa Cyrena": "cyrena",
  "Villa Arisyfa": "arisyfa",
  "Villa Cempaka": "cempaka",
  "Villa Arsy": "arsy",
  "Villa Rayya": "rayya",
  "Villa Opung": "opung",
  "Rjs Cottage 1": "rjs_cottage",
  "Rjs Cottage 2": "rjs_2",
  "Rjs Cottage 3": "rjs_3",
  "Villa Kaca 1": "kaca_1",
  "Villa Kaca 2": "kaca_2",
  "Villa De Summit": "de_summit",
  "Villa Bodas": "bodas",
  "Villa Thymi": "thymi",
  "Villa Albi": "albi",
  "Villa Valora": "valora",
  "Echa Village": "echa_village",
  "Villa Awan": "awan",
  "Villa Baduo": "baduo",
  "Villa Hala": "hala",
  "Villa Ranna": "ranna",
  "Villa Rio 5": "rio",
  "The Herlina": "herlina",
  "Villa Hariza": "hariza",
};

/** URL background tema kalender untuk sebuah villa. */
export function calendarThemeImage(villa) {
  const file = CALENDAR_THEME[villa?.name];
  if (!file) return villa?.image || "";
  return `/jadwal%20%20theme/${file}.webp`;
}
