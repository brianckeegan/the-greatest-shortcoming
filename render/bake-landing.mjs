/* Offline position bake for the landing "bacteria in a bottle" opening.
   Runs the whole arc ONCE, deterministically, on the CPU (no browser, no GPU), and
   writes a compact binary of particle positions. assets/js/landing.js reads it back
   and only replays frames + morphs to the portrait — no live solver.

   ONE continuous frame sequence, ONE coordinate space (hcenter — centred, normalized
   by viewport height, same space as the portrait), ONE dot radius. The beaker is a
   fixed hcenter rectangle (drawn the same way at runtime), so the beaker and its dots
   always coincide and there is no seam anywhere across fill → overflow → burst →
   screen-fill → hedcut.

   Usage:  npm run bake:landing        (→ assets/data/landing-bake.v3.bin)

   hcenter: nx=(x-W/2)/H, ny=(y-H/2)/H  → runtime px: x=W/2+nx·H, y=H/2+ny·H
*/
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makePRNG } from './harness/prng.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const IMG = join(REPO, 'assets', 'img', 'bartlett.webp');
const OUT = join(REPO, 'assets', 'data', 'landing-bake.v3.bin');

const SCALE = 10000;                 // Int16 fixed-point: round(norm * SCALE)
const NCAP = 190;                    // dots active when the bottle is full at noon
const W = 1920, H = 1080;            // reference; the screen-fill spreads to cover it (16:9 and narrower)
const DOTR = 7;                      // single dot radius (px in the reference)

// beaker geometry in H-units (hcenter). The runtime rebuilds the exact same rect.
const BK = { halfWN: 0.098, thN: 0.030, rimN: -0.138, hN: 0.277 };
function refGeo() {
  const cx = W / 2, halfW = BK.halfWN * H, th = BK.thN * H, rim = H / 2 + BK.rimN * H, h = BK.hN * H;
  return { cx, w: 2 * halfW, h, th,
    outL: cx - halfW, outR: cx + halfW, inL: cx - halfW + th, inR: cx + halfW - th,
    rim, bot: rim + h - th, outBot: rim + h };
}
const G = refGeo();
const BURST_CX = G.cx, BURST_CY = (G.rim + G.bot) / 2;

const prng = makePRNG('bacteria-bottle-v3');
const rnd = () => prng.next();

/* ---- physics ---- */
function collideRect(p, x0, y0, x1, y1) {
  const cx = Math.max(x0, Math.min(p.x, x1)), cy = Math.max(y0, Math.min(p.y, y1));
  const dx = p.x - cx, dy = p.y - cy, d2 = dx * dx + dy * dy;
  if (d2 < p.r * p.r) {
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2), ov = p.r - d, nx = dx / d, ny = dy / d;
      p.x += nx * ov; p.y += ny * ov;
      const vn = p.vx * nx + p.vy * ny; if (vn < 0) { p.vx -= nx * vn * 1.1; p.vy -= ny * vn * 1.1; }
    } else {
      const dl = p.x - x0, dr = x1 - p.x, dt = p.y - y0, db = y1 - p.y, m = Math.min(dl, dr, dt, db);
      if (m === dl) p.x = x0 - p.r; else if (m === dr) p.x = x1 + p.r;
      else if (m === dt) p.y = y0 - p.r; else p.y = y1 + p.r;
    }
  }
}

const parent = [];          // parent[i] = index the slot budded from (-1 for the seed)
const slots = [];           // {x,y,vx,vy,r}
let activeCount = 0;

function ensureActive(n) {
  while (activeCount < n) {
    const i = activeCount;
    if (i === 0) {
      slots[i] = { x: G.cx, y: G.bot - 12, vx: 0, vy: 0, r: DOTR };
    } else {
      const par = slots[parent[i]];
      const a = rnd() * 6.283, off = DOTR * 0.5;
      // children inherit the parent's velocity so newborns ride the burst outward
      slots[i] = { x: par.x + Math.cos(a) * off, y: par.y + Math.sin(a) * off,
        vx: par.vx + Math.cos(a) * 0.4, vy: par.vy + Math.sin(a) * 0.4 - 0.3, r: DOTR };
    }
    activeCount++;
  }
}

function solve(applyWalls, gravity, burst) {
  for (let i = 0; i < activeCount; i++) {
    const p = slots[i];
    if (gravity) p.vy += gravity;
    if (burst) { const dx = p.x - BURST_CX, dy = p.y - BURST_CY, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * burst; p.vy += dy / d * burst; }
    p.x += p.vx; p.y += p.vy;
  }
  const cell = 16, grid = new Map();
  for (let i = 0; i < activeCount; i++) { const p = slots[i]; const k = ((p.x / cell) | 0) + '_' + ((p.y / cell) | 0); let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(i); }
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < activeCount; i++) {
      const a = slots[i], gx = (a.x / cell) | 0, gy = (a.y / cell) | 0;
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        const arr = grid.get((gx + ox) + '_' + (gy + oy)); if (!arr) continue;
        for (let m = 0; m < arr.length; m++) {
          const j = arr[m]; if (j <= i) continue; const b = slots[j];
          const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, rr = a.r + b.r;
          if (d2 < rr * rr && d2 > 0.0001) { const d = Math.sqrt(d2), ov = (rr - d) * 0.5, nx = dx / d, ny = dy / d; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov; }
        }
      }
    }
    for (let i = 0; i < activeCount; i++) {
      const p = slots[i];
      if (p.x < p.r) { p.x = p.r; if (p.vx < 0) p.vx *= -0.3; }
      if (p.x > W - p.r) { p.x = W - p.r; if (p.vx > 0) p.vx *= -0.3; }
      if (p.y > H - p.r) { p.y = H - p.r; if (p.vy > 0) p.vy *= -0.16; }
      if (p.y < p.r) { p.y = p.r; if (p.vy < 0) p.vy *= -0.3; }
      if (applyWalls) {
        collideRect(p, G.outL, G.rim, G.inL, G.outBot);
        collideRect(p, G.inR, G.rim, G.outR, G.outBot);
        collideRect(p, G.outL, G.bot, G.outR, G.outBot);
      }
    }
  }
  for (let i = 0; i < activeCount; i++) { const p = slots[i]; p.vx *= 0.88; p.vy *= 0.9; }
}

/* ---- portrait stipple (port of buildTargets() in landing.js, via sharp) ---- */
async function buildTargets() {
  const meta = await sharp(IMG).metadata();
  const aspect = meta.width / meta.height;
  const rows = 150, cols = Math.round(rows * aspect);
  const buf = await sharp(IMG).resize(cols, rows, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  const ph = H * 0.94, pw = ph * aspect, px = (W - pw) / 2, py = (H - ph) / 2;
  const sx = pw / cols, sy = ph / rows, maxR = Math.min(sx, sy) * 0.60;
  const faceCX = 0.50, faceCY = 0.30, faceRX = 0.20, faceRY = 0.22;
  const T = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = (j * cols + i) * 3;
      const r = buf[idx], gC = buf[idx + 1], bC = buf[idx + 2];
      const L = (0.299 * r + 0.587 * gC + 0.114 * bC) / 255;
      const cx = px + (i + 0.5) * sx, cy = py + (j + 0.5) * sy;
      const ndx = (cx - W / 2) / (pw * 0.55), ndy = (cy - H / 2) / (ph * 0.62);
      const vig = Math.min(1, Math.max(0, 1.16 - Math.sqrt(ndx * ndx + ndy * ndy)));
      const warm = (j / rows) > 0.42 && (r - bC) > 52 && gC > 92 && bC < gC * 0.66 && r > 138;
      let ink;
      if (warm) {
        ink = Math.min(1, 0.5 + (r - bC) / 240);
      } else {
        const fx = (i / cols - faceCX) / faceRX, fy = (j / rows - faceCY) / faceRY;
        const inFace = (fx * fx + fy * fy) < 1;
        const hi = inFace ? 0.94 : 0.80, lo = inFace ? 0.0 : 0.08;
        ink = Math.min(1, Math.max(0, (hi - L) / (hi - lo))) * vig;
        if (inFace) ink = Math.pow(ink, 0.68);
      }
      if (ink < 0.07) continue;
      T.push({ x: cx + (rnd() - 0.5) * sx * 0.45, y: cy + (rnd() - 0.5) * sy * 0.45, r: Math.max(1.0, ink * maxR) });
    }
  }
  return T;
}

const q = (v) => { const n = Math.round(v * SCALE); return n < -32768 ? -32768 : n > 32767 ? 32767 : n; };

async function main() {
  const targets = await buildTargets();
  const N = targets.length;
  console.log(`portrait stipple: N = ${N} slots`);

  parent[0] = -1;
  for (let i = 1; i < N; i++) parent[i] = Math.floor(rnd() * i);

  // ---- one continuous sim: fill → overflow (walls) → radial burst → screen-fill ----
  const F = 30;                       // captured frames across the whole arc
  const T_NOON = 0.42;                // t at which the bottle is full (noon)
  const T_WALLS = 0.52;              // t at which the beaker walls vanish (12:02)
  const BURST_T = 0.10;               // burst window after the walls drop
  const DOUB = Math.log2(N / NCAP);
  const hc = (p, out, i) => { out[i * 2] = q((p.x - W / 2) / H); out[i * 2 + 1] = q((p.y - H / 2) / H); };

  function snapHC() {
    const arr = new Int16Array(N * 2);
    for (let i = 0; i < N; i++) { let j = i; while (j >= activeCount) j = parent[j]; hc(slots[j], arr, i); }
    return arr;
  }
  function targetAt(t) {
    if (t <= 0) return 1;
    if (t <= T_NOON) return Math.max(1, Math.round(NCAP * Math.pow(t / T_NOON, 6)));  // slow, then all at once
    const s = (t - T_NOON) / (1 - T_NOON);
    return Math.min(N, Math.round(NCAP * Math.pow(2, s * DOUB)));
  }

  // the bottle fill is a clean hex pack (no physics needed); the spill runs physics FROM it.
  function packBeaker() {
    const iw = G.inR - G.inL, sp = DOTR * 1.9, cols = Math.max(1, Math.floor((iw - DOTR) / sp)), rowH = sp * 0.87;
    const arr = [];
    for (let i = 0; i < NCAP; i++) {
      const row = (i / cols) | 0, col = i % cols, xoff = (row % 2) ? sp / 2 : 0;
      arr.push({ x: Math.min(G.inR - DOTR, G.inL + DOTR + col * sp + xoff), y: G.bot - DOTR - row * rowH });
    }
    return arr;
  }
  const pack = packBeaker();

  const frames = [], actives = [];
  let spillStarted = false;
  for (let f = 0; f < F; f++) {
    const t = f / (F - 1);
    if (t <= T_NOON) {                            // FILL — reveal the packed beaker bottom-up
      const n = targetAt(t); activeCount = n;
      for (let i = 0; i < n; i++) { const pk = pack[Math.min(i, NCAP - 1)]; slots[i] = { x: pk.x, y: pk.y, vx: 0, vy: 0, r: DOTR }; }
    } else {                                      // SPILL — physics from the packed state
      if (!spillStarted) {
        for (let i = 0; i < NCAP; i++) slots[i] = { x: pack[i].x, y: pack[i].y, vx: 0, vy: 0, r: DOTR };
        activeCount = NCAP; spillStarted = true;
      }
      const SUB = f >= F - 8 ? 40 : 22;           // settle hard through the late burst
      for (let s = 1; s <= SUB; s++) {
        const tt = (f - 1 + s / SUB) / (F - 1);
        ensureActive(targetAt(tt));
        const walls = tt < T_WALLS;
        const burst = (!walls && tt < T_WALLS + BURST_T) ? 0.6 : 0;
        solve(walls, walls ? 0.30 : 0, burst);
      }
    }
    frames.push(snapHC());
    actives.push(activeCount);
  }
  const lastF = frames[F - 1];

  // ---- portrait assignment: sort slots by the final frame (y,x), targets by (y,x) ----
  const nyOf = (i) => lastF[i * 2 + 1], nxOf = (i) => lastF[i * 2];
  const slotOrder = Array.from({ length: N }, (_, i) => i).sort((a, b) => (nyOf(a) - nyOf(b)) || (nxOf(a) - nxOf(b)));
  const tgtOrder = Array.from({ length: N }, (_, i) => i).sort((a, b) => (targets[a].y - targets[b].y) || (targets[a].x - targets[b].x));
  const vPortrait = new Int16Array(N * 3);
  for (let k = 0; k < N; k++) {
    const s = slotOrder[k], t = targets[tgtOrder[k]];
    vPortrait[s * 3] = q((t.x - W / 2) / H); vPortrait[s * 3 + 1] = q((t.y - H / 2) / H); vPortrait[s * 3 + 2] = q(t.r / H);
  }

  // ---- assemble ----
  const chunks = []; let off = 0;
  const framesOffset = off;
  for (let f = 0; f < F; f++) { chunks.push(frames[f]); off += frames[f].length; }
  const portraitOffset = off; chunks.push(vPortrait); off += vPortrait.length;

  const header = {
    magic: 'TGSB', version: 3, N, NCAP, scale: SCALE, dotR: DOTR / H, beaker: BK,
    tNoon: T_NOON, tWalls: T_WALLS,
    frames: { count: F, slots: N, stride: 2, offset: framesOffset, active: actives },
    portrait: { offset: portraitOffset }
  };
  let headerJSON = JSON.stringify(header);
  while (headerJSON.length % 4 !== 0) headerJSON += ' ';
  const headerBuf = Buffer.from(headerJSON, 'utf8');

  const payload = new Int16Array(off);
  let p = 0; for (const c of chunks) { payload.set(c, p); p += c.length; }

  const out = Buffer.alloc(12 + headerBuf.length + payload.byteLength);
  out.write('TGSB', 0, 'ascii');
  out.writeUInt32LE(3, 4);
  out.writeUInt32LE(headerBuf.length, 8);
  headerBuf.copy(out, 12);
  Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength).copy(out, 12 + headerBuf.length);

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out);
  console.log(`wrote ${OUT}`);
  console.log(`  ${F} frames x ${N} slots  (noon@${T_NOON}, walls@${T_WALLS})`);
  console.log(`  size: ${(out.length / 1024).toFixed(1)} KB (header ${headerBuf.length} B)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
