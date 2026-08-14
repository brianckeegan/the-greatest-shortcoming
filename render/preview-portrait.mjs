/* Rasterize the portrait stipple on its own (no sim) so the hedcut can be eyeballed. */
import sharp from 'sharp';
import { buildTargets, W, H } from './bake-landing.mjs';

const OUT = process.argv[2] || '/tmp/hedcut.png';
const t0 = Date.now();
const T = await buildTargets();
console.log(`N = ${T.length} dots   (${Date.now() - t0} ms)`);
const rs = T.map(p => p.r).sort((a, b) => a - b);
console.log(`radius  min ${rs[0].toFixed(2)}  med ${rs[rs.length >> 1].toFixed(2)}  max ${rs[rs.length - 1].toFixed(2)}`);

// nearest-neighbour spacing histogram — confirms the density actually varies
const cell = 16, grid = new Map();
T.forEach((p, i) => { const k = ((p.x / cell) | 0) + '_' + ((p.y / cell) | 0); let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(i); });
const nn = [];
for (let i = 0; i < T.length; i += 7) {
  const a = T[i], gx = (a.x / cell) | 0, gy = (a.y / cell) | 0; let best = 1e9;
  for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
    const arr = grid.get((gx + ox) + '_' + (gy + oy)); if (!arr) continue;
    for (const j of arr) { if (j === i) continue; const d = Math.hypot(T[j].x - a.x, T[j].y - a.y); if (d < best) best = d; }
  }
  if (best < 1e8) nn.push(best);
}
nn.sort((a, b) => a - b);
const pct = (p) => nn[Math.min(nn.length - 1, Math.floor(nn.length * p))].toFixed(2);
console.log(`nearest-neighbour spacing  p05 ${pct(0.05)}  p50 ${pct(0.5)}  p95 ${pct(0.95)}  max ${nn[nn.length - 1].toFixed(2)}`);

const circles = T.map(p => `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${p.r.toFixed(2)}"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#e9e2d0"/><g fill="#111">${circles}</g></svg>`;
await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log('wrote', OUT);
