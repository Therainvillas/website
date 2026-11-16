#!/usr/bin/env node
/**
 * Validasi alt/title gambar pada HTML hasil build (dist/).
 *
 * Gagal (exit 1) jika:
 * - ada <img> tanpa atribut alt
 * - alt lebih dari 125 karakter
 * - alt yang sama dipakai dua gambar berbeda di satu halaman
 * - alt diawali "gambar", "foto dari", atau "image of"
 * - title lebih dari 70 karakter
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const MAX_ALT = 125;
const MAX_TITLE = 70;
const BAD_PREFIX = /^(gambar|foto dari|image of)\b/i;

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(value) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1].toLowerCase() === 'x';
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function attr(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'),
  );
  if (!match) return { present: false, value: '' };
  return { present: true, value: decodeEntities(match[1] ?? match[2] ?? match[3] ?? '') };
}

function htmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...htmlFiles(full));
    else if (entry.endsWith('.html')) files.push(full);
  }
  return files;
}

if (!statSync(DIST, { throwIfNoEntry: false })) {
  console.error('❌ Folder dist/ tidak ditemukan. Jalankan `npm run build` dulu.');
  process.exit(1);
}

const errors = [];
let pageCount = 0;
let imageCount = 0;
let decorativeCount = 0;

for (const file of htmlFiles(DIST)) {
  pageCount += 1;
  const page = `/${relative(DIST, file).replace(/\\/g, '/')}`;
  const html = readFileSync(file, 'utf8')
    // Jangan memindai contoh <img> di dalam script/style atau komentar HTML.
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const seenAlt = new Map();

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    imageCount += 1;

    const alt = attr(tag, 'alt');
    if (!alt.present) {
      errors.push(`${page}: <img> tanpa atribut alt -> ${tag.slice(0, 160)}`);
      continue;
    }

    const src = attr(tag, 'src').value;
    const title = attr(tag, 'title');

    if (alt.value === '') {
      decorativeCount += 1;
    } else {
      if (alt.value.length > MAX_ALT) {
        errors.push(
          `${page}: alt ${alt.value.length} karakter (maks ${MAX_ALT}) -> "${alt.value}"`,
        );
      }
      if (BAD_PREFIX.test(alt.value)) {
        errors.push(`${page}: alt diawali kata terlarang -> "${alt.value}"`);
      }

      const previousSrc = seenAlt.get(alt.value);
      if (previousSrc !== undefined && previousSrc !== src) {
        errors.push(
          `${page}: alt dipakai dua gambar berbeda -> "${alt.value}" (${previousSrc || 'tanpa src'} vs ${src || 'tanpa src'})`,
        );
      } else {
        seenAlt.set(alt.value, src);
      }
    }

    if (title.present && title.value.length > MAX_TITLE) {
      errors.push(
        `${page}: title ${title.value.length} karakter (maks ${MAX_TITLE}) -> "${title.value}"`,
      );
    }
  }
}

console.log(
  `Diperiksa ${imageCount} gambar di ${pageCount} halaman ` +
    `(${decorativeCount} gambar dekoratif dengan alt="").`,
);

if (errors.length) {
  console.error(`\n❌ ${errors.length} masalah alt/title gambar:\n`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('✅ Semua alt/title gambar lolos validasi.');
