import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('public/thumb theme');
const OUT = path.resolve('public/thumbnail');
const MAX_W = 1200;

// nama file di "thumb theme" -> nama file target di /thumbnail
const MAP = {
  '4d.webp': ['4D Thumb.webp'],
  'agave.webp': ['Agave Thumb.webp'],
  'albi.webp': ['Albi Thumb.webp'],
  'aleia.webp': ['Aleia Thumb.webp'],
  'arsiyfa.webp': ['Arisyfa Thumb.webp'],
  'awan.webp': ['Awan Thumb.webp'],
  'baduo.webp': ['Baduo Thumb.webp'],
  'bodas.webp': ['Bodas Thumb.webp'],
  'calmora.webp': ['Calmora Thumb.webp'],
  'cemara.webp': ['Cemara Thumb.webp'],
  'cempaka.webp': ['Cempaka Thumb.webp'],
  'cyrena.webp': ['Cyrena Thumb.webp'],
  'de summit.webp': ['De Summit Thumb.webp'],
  'echa.webp': ['Echa Village Thumb.webp'],
  'griya arsy.webp': ['Griya Arsy Thumb.webp'],
  'hala.webp': ['Hala Thumb.webp'],
  'hariza.webp': ['Hariza Thumb.webp'],
  'herlina.webp': ['The Herlina Thumb.webp'],
  'kaca 1.webp': ['Kaca 1 Thumb.webp'],
  'kaca 2.webp': ['Kaca 2 Thumb.webp'],
  'opung.webp': ['Opung Thumb.webp'],
  'ranna.webp': ['Ranna Thumb.webp'],
  'rayya.webp': ['Rayya Thumb.webp'],
  'rio.webp': ['Rio 5 Thumb.webp'],
  'rjs 2.webp': ['RJS 2 Thumb.webp'],
  'rjs 3.webp': ['RJS 3 Thumb.webp'],
  'rjs cottage.webp': ['RJS Cottage 1 Thumb.webp', 'RJS Cottage 2 Thumb.webp', 'RJS Cottage 3 Thumb.webp'],
  'thymi.webp': ['Thymi Thumb.webp'],
  'twins.webp': ['Twins Thumb.webp'],
  'valora.webp': ['Valora Thumb.webp'],
  'wanela.webp': ['Wanela Thumb.webp'],
};

const srcFiles = fs.readdirSync(SRC).filter((f) => !f.startsWith('.'));
const missing = srcFiles.filter((f) => !MAP[f]);
if (missing.length) {
  console.error('File di "thumb theme" tanpa peta:', missing);
  process.exit(1);
}

let before = 0;
let after = 0;
let written = 0;

for (const [srcName, targets] of Object.entries(MAP)) {
  const srcPath = path.join(SRC, srcName);
  const buf = await sharp(srcPath)
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const meta = await sharp(buf).metadata();

  for (const target of targets) {
    const targetPath = path.join(OUT, target);
    const oldSize = fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0;
    fs.writeFileSync(targetPath, buf);
    before += oldSize;
    after += buf.length;
    written++;
    const delta = oldSize
      ? `${(oldSize / 1024).toFixed(0)}KB -> ${(buf.length / 1024).toFixed(0)}KB`
      : `baru ${(buf.length / 1024).toFixed(0)}KB`;
    console.log(
      `${target.padEnd(28)} ${meta.width}x${meta.height}  (${delta})`
    );
  }
}

console.log(
  `\n${written} file ditulis. Total: ${(before / 1048576).toFixed(2)}MB -> ${(after / 1048576).toFixed(2)}MB`
);