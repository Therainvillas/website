import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC = path.resolve('./public');
const MAX_W = 1920;
const THUMB_MAX_W = 1200;
const THUMB_DIRS = new Set(['thumbnail', 'promo']);
const KEEP_PNG = new Set(['logo trv2.png', 'man-phone.png']);

let processed = 0;
let converted = 0;
let originalTotal = 0;
let newTotal = 0;

async function processFile(full, childRel) {
  const entry = path.basename(full);
  if (!/\.(jpe?g|png|webp)$/i.test(entry)) return;

  const inThumb = childRel.split(path.sep).some((s) => THUMB_DIRS.has(s));
  const maxW = inThumb ? THUMB_MAX_W : MAX_W;
  const origSize = fs.statSync(full).size;
  originalTotal += origSize;

  try {
    const meta = await sharp(full).metadata();
    const isPng = /\.png$/i.test(entry);
    const opPng = isPng && !KEEP_PNG.has(entry);

    let p = sharp(full);
    if (meta.width && meta.width > maxW) {
      p = p.resize({ width: maxW, withoutEnlargement: true });
    }

    let outFile = full;
    let kind;
    let buf;

    if (opPng) {
      // Opaque photo PNG -> JPEG (huge savings)
      outFile = full.replace(/\.png$/i, '.jpg');
      buf = await p.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      if (buf.length < origSize) {
        fs.writeFileSync(outFile, buf);
        fs.unlinkSync(full);
        converted++;
        processed++;
        newTotal += buf.length;
        report(childRel, origSize, buf.length, 'PNG->JPG');
        return;
      }
      kind = 'PNG-no-gain';
    } else if (isPng) {
      buf = await p.png({ palette: true, compressionLevel: 9, effort: 9, quality: 100 }).toBuffer();
      kind = 'PNG-opt';
    } else {
      buf = await p.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      kind = 'JPG';
    }

    if (buf.length < origSize) {
      const tmp = outFile + '.tmp';
      fs.writeFileSync(tmp, buf);
      fs.unlinkSync(outFile);
      fs.renameSync(tmp, outFile);
      processed++;
      newTotal += buf.length;
      report(childRel, origSize, buf.length, kind);
    }
  } catch (e) {
    console.error('SKIP', childRel, e.message);
  }
}

async function walk(dir, rel = '') {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    const cr = rel ? path.join(rel, e.name) : e.name;
    if (e.isDirectory()) { await walk(full, cr); continue; }
    await processFile(full, cr);
  }
}

function report(name, orig, neu, kind) {
  const saved = orig - neu;
  console.log(`[${kind} -${(saved / 1048576).toFixed(2)}MB -> ${(neu / 1048576).toFixed(2)}MB] ${name}`);
}

console.log('Mulai kompresi...');
await walk(PUBLIC);
console.log('\n=== Selesai ===');
console.log('Diproses:', processed, '| dikonversi PNG->JPG:', converted);
console.log(`Total asli: ${(originalTotal / 1048576).toFixed(1)}MB -> ${(newTotal / 1048576).toFixed(1)}MB`);
