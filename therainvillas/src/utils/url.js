/**
 * Utilitas URL internal.
 *
 * Situs memakai trailing slash ("/villa-agave/") sebagai bentuk kanonik.
 * Semua tautan internal yang dibuat secara dinamis harus lewat helper ini
 * supaya tidak ada versi tanpa slash yang memicu redirect 301.
 *
 * Yang TIDAK diubah:
 *  - URL eksternal (https://, //host), mailto:, tel:
 *  - anchor murni (#bagian)
 *  - aset dengan ekstensi file (/_astro/..., .webp, .txt, .xml, ...)
 *  - query string dan hash dipertahankan apa adanya.
 */
export function withTrailingSlash(url) {
  if (!url || typeof url !== 'string') return url;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) return url;
  if (!url.startsWith('/')) return url;

  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = beforeHash.indexOf('?');
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : '';
  let path = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;

  // File statis (punya ekstensi) bukan halaman → jangan tambah slash.
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return url;

  if (path !== '/' && !path.endsWith('/')) path += '/';
  return path + query + hash;
}
