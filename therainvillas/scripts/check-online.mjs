import fs from 'fs';
import path from 'path';

const OUT = path.resolve('public/thumbnail');
const names = fs.readdirSync(OUT);

const remote = new Map();

for (const n of names) {
  const enc = n.replace(/ /g, '%20');
  const r = await fetch(`https://therainvillas.com/thumbnail/${enc}`, { method: 'HEAD' });
  const len = Number(r.headers.get('content-length'));
  const lm = r.headers.get('last-modified');
  const cc = r.headers.get('cache-control');
  const local = fs.statSync(path.join(OUT, n)).size;
  remote.set(n, { len, lm, cc });
  const same = local === len;
  console.log(
    `${same ? 'SAMA    ' : 'BEDA    '}${n.padEnd(26)} lokal=${String(local).padStart(7)}  online=${String(len).padStart(7)}  ${lm}  ${cc || ''}`
  );
}

console.log('\ncache-control uniq:', [...new Set([...remote.values()].map((v) => v.cc))]);
console.log('last-modified uniq:', [...new Set([...remote.values()].map((v) => v.lm))]);