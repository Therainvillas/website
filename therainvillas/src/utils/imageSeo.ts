import imageSeo from '../data/image-seo.json';

type VillaImageType = 'thumbnail' | 'wheel';

interface VillaImageRecord {
  slug: string;
  name: string;
  location: string;
  wheelImage?: string;
  suggestedFileName?: string;
  altThumbnail: string;
  altWheel: string;
  title: string;
}

interface GeneralImageRecord {
  key?: string;
  label: string;
  file?: string;
  alt: string;
  title: string;
  note?: string;
}

interface GalleryTemplate {
  type: string;
  altPattern: string;
  fileNamePattern: string;
}

export interface ImageSeo {
  alt: string;
  title: string;
}

export interface GeneralImageSeo extends ImageSeo {
  file?: string;
}

const villas = imageSeo.villas as VillaImageRecord[];
const generalImages = imageSeo.general as GeneralImageRecord[];
const galleryTemplates = imageSeo.galleryTemplates as GalleryTemplate[];

const warned = new Set<string>();

/** Tampilkan peringatan sekali per masalah, supaya log build tidak banjir. */
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[image-seo] ${message}`);
}

function normalise(value: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^\/+|\/+$/g, '');
}

/** Nama villa cadangan saat slug tidak ada di data. */
function humaniseSlug(slug: string) {
  const last = normalise(slug).split('/').pop() ?? '';
  if (!last) return 'Villa';
  return last
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const villaByKey = new Map<string, VillaImageRecord>();
for (const villa of villas) {
  villaByKey.set(normalise(villa.slug), villa);
  villaByKey.set(normalise(villa.name), villa);
  if (villa.wheelImage) {
    villaByKey.set(normalise(villa.wheelImage), villa);
  }
}

const generalByKey = new Map<string, GeneralImageRecord>();
for (const image of generalImages) {
  const keys = [image.key, image.label, image.file]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => {
      const normalised = normalise(value);
      return [normalised, normalised.split('/').pop() ?? normalised];
    });
  for (const key of keys) {
    if (key) generalByKey.set(key, image);
  }
}

function findVilla(slug: string) {
  return villaByKey.get(normalise(slug));
}

/**
 * Alt/title untuk foto villa di kartu (thumbnail) atau roda villa (wheel).
 * Data diambil dari src/data/image-seo.json.
 */
export function getVillaImageSeo(
  slug: string,
  type: VillaImageType = 'thumbnail',
): ImageSeo {
  const villa = findVilla(slug);
  if (!villa) {
    const fallbackName = humaniseSlug(slug);
    warnOnce(
      `Villa "${slug}" tidak ditemukan di image-seo.json; memakai nama villa sebagai alt.`,
    );
    return { alt: fallbackName, title: '' };
  }

  return {
    alt: type === 'wheel' ? villa.altWheel : villa.altThumbnail,
    title: villa.title,
  };
}

/**
 * Alt/title untuk gambar umum (hero, logo, ilustrasi, og:image).
 * `key` boleh berupa key, label, atau nama file dari data JSON.
 */
export function getGeneralImageSeo(key: string): GeneralImageSeo {
  const image = generalByKey.get(normalise(key));
  if (!image) {
    warnOnce(
      `Gambar umum "${key}" tidak ditemukan di image-seo.json; alt dibiarkan kosong.`,
    );
    return { alt: '', title: '' };
  }

  return { alt: image.alt, title: image.title, file: image.file };
}

function fillTemplate(pattern: string, villa: VillaImageRecord) {
  return pattern
    .replaceAll('{Nama Villa}', villa.name)
    .replaceAll('{Lokasi}', villa.location)
    .replaceAll('{slug}', villa.slug);
}

/**
 * Alt untuk foto galeri villa. `type` dicocokkan dengan galleryTemplates.
 * Bila jenis foto tidak diketahui, alt memakai nama villa + lokasi + nomor urut.
 */
export function getGalleryAlt(
  slug: string,
  type?: string | null,
  index = 1,
): string {
  const villa = findVilla(slug);
  if (!villa) {
    const fallbackName = humaniseSlug(slug);
    warnOnce(
      `Villa "${slug}" tidak ditemukan di image-seo.json; alt galeri memakai nama villa.`,
    );
    return `${fallbackName} – Foto ${index}`;
  }

  const wanted = normalise(type ?? '');
  if (wanted) {
    const template = galleryTemplates.find(
      (item) =>
        normalise(item.type) === wanted ||
        normalise(item.fileNamePattern) === wanted ||
        normalise(item.fileNamePattern).split('/').pop() === wanted,
    );
    if (template) {
      return fillTemplate(template.altPattern, villa);
    }
    warnOnce(
      `Jenis foto "${type}" tidak ada di galleryTemplates; memakai alt nomor urut.`,
    );
  }

  return `${villa.name} di ${villa.location}, Puncak – Foto ${index}`;
}
