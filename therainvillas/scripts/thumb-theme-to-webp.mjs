import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('./public/thumb theme');
const OUT = path.resolve('./public/thumbnail');
const MAX_W = 1200;

// peta: nama file di "thumb theme" -> nama file target di /thumbnail
const MAP = {
  'thumb 4d.PNG': ['4D Thumb.webp'],
  'thumb agave.PNG': ['Agave Thumb.webp'],
  'thumb aleia.PNG': ['Aleia Thumb.webp'],
  'thumb arisyfa.PNG': ['Arisyfa Thumb.webp'],
  'thumb arsy.PNG': ['Griya Arsy Thumb.webp'],
  'thumb awan.PNG': ['Awan Thumb.webp'],
  'thumb baduo.PNG': ['Baduo Thumb.webp'],
  'thumb bodas.PNG': ['Bodas Thumb.webp'],
  'thumb calmora.PNG': ['Calmora Thumb.webp'],
  'thumb cemara.PNG': ['Cemara Thumb.webp'],
  'thumb cempaka.PNG': ['Cempaka Thumb.webp'],
  'thumb cyrena.PNG': ['Cyrena Thumb.webp'],
  'thumb de summit.PNG': ['De Summit Thumb.webp'],
  'thumb echa.PNG': ['Echa Village Thumb.webp'],
  'thumb hala.PNG': ['Hala Thumb.webp'],
  'thumb hariza.PNG': ['Hariza Thumb.webp'],
  'thumb kaca 1.PNG': ['Kaca 1 Thumb.webp'],
  'thumb kaca 2.PNG': ['Kaca 2 Thumb.webp'],
  'thumb opung.PNG': ['Opung Thumb.webp'],
  'thumb ranna.PNG': ['Ranna Thumb.webp'],
  'thumb rayya.PNG': ['Rayya Thumb.webp'],
  'thumb rio.PNG': ['Rio 5 Thumb.webp'],
  'thumb rjs 2.PNG': ['RJS 2 Thumb.webp'],
  'thumb rjs 3.PNG': ['RJS 3 Thumb.webp'],
  'thumb rjs cottage.PNG': ['RJS Cottage 1 Thumb.webp', 'RJS Cottage 2 Thumb.webp', 'RJS Cottage 3 Thumb.webp'],
  'thumb the herlina.PNG': ['The Herlina Thumb.webp'],
  'thumb thymi.PNG': ['Thymi Thumb.webp'],
  'thumb twins.PNG': ['Twins Thumb.webp'],
  'thumb valora.PNG': ['Valora Thumb.webp'],
  'thumb wanela.PNG': ['Wanela Thumb.webp'],
};

const srcFiles = fs.readdirSync(SRC);
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

  for (const target of targets) {
    const targetPath = path.join(OUT, target);
    const oldSize = fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0;
    fs.writeFileSync(targetPath, buf);
    before += oldSize;
    after += buf.length;
    written++;
    const delta = oldSize ? `${(oldSize / 1024).toFixed(0)}KB -> ${(buf.length / 1024).toFixed(0)}KB` : `baru ${(buf.length / 1024).toFixed(0)}KB`;
    console.log(`${target}  (${delta})`);
  }
}

console.log(`\n${written} file ditulis. Total thumbnail: ${(before / 1048576).toFixed(2)}MB -> ${(after / 1048576).toFixed(2)}MB`);