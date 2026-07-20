/* Offline position bake for the landing "bacteria in a bottle" opening.
   Runs the 2D packing physics + portrait stipple ONCE, deterministically, on the
   CPU (no browser, no GPU), and writes a compact binary of particle positions.
   assets/js/landing.js then reads it back and only splines + draws — no live solver.

   Determinism: every random draw comes from render/harness/prng.js seeded by a
   fixed string, so re-baking is byte-identical. Re-run after changing the portrait
   or the KF fill schedule; bump the versioned output filename when you do.

   Usage:  npm run bake:landing        (→ assets/data/landing-bake.v2.bin)

   Coordinate spaces written to the artifact (remapped to pixels at runtime):
     bottle  — (x-inL)/Wb, (y-rim)/Hb, r/Wb   [tracks the #flask element via geo()]
     fill    — x/W, y/H, r/H                   [always fills the viewport]
     hcenter — (x-W/2)/H, (y-H/2)/H, r/H       [portrait, centered + aspect-correct]
*/
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makePRNG } from './harness/prng.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const IMG = join(REPO, 'assets', 'img', 'bartlett.webp');
const OUT = join(REPO, 'assets', 'data', 'landing-bake.v2.bin');

const SCALE = 10000;                 // Int16 fixed-point: round(norm * SCALE)
const NCAP = 190;                    // slots active when the bottle is full at noon
const FILLS = [0.02, 0.03, 0.06, 0.12, 0.25, 0.50, 1.0];  // = KF fill knots
const W = 1920, H = 1080;            // reference viewport (normalized away in output)

const prng = makePRNG('bacteria-bottle-v1');
const rnd = () => prng.next();

/* ---- reference bottle geometry (mirrors geo() in assets/js/landing.js with the
   CSS flask 236x356, centered). Only the interior box shape survives normalization. */
function refGeo() {
  const fW = 236, fH = 356;
  const w = Math.min(212, fW * 0.94), h = Math.min(300, fH * 0.84), th = Math.max(18, w * 0.155);
  const cx = W / 2, top = (H - h) / 2;
  return { cx, w, h, top, th,
    inL: cx - w / 2 + th, inR: cx + w / 2 - th, outL: cx - w / 2, outR: cx + w / 2,
    bot: top + h - th, outBot: top + h, rim: top };
}
const G = refGeo();
const Wb = G.inR - G.inL, Hb = G.bot - G.rim;

/* ---- physics port (matches the live solver in landing.js) ---- */
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

// fixed-size slot table; slots 0..activeCount-1 are "born". parent[] is pre-generated.
const parent = [];          // parent[i] = index the slot budded from (-1 for the seed)
const slots = [];           // {x,y,vx,vy,r}
let activeCount = 0;

function ensureActive(n) {
  while (activeCount < n) {
    const i = activeCount;
    if (i === 0) {
      slots[i] = { x: G.cx, y: G.bot - 12, vx: 0, vy: 0, r: 6.5 };
    } else {
      const par = slots[parent[i]];
      const a = rnd() * 6.283, off = par.r * 0.5;
      slots[i] = { x: par.x + Math.cos(a) * off, y: par.y + Math.sin(a) * off,
        vx: Math.cos(a) * 0.4, vy: Math.sin(a) * 0.4 - 0.3, r: 6 + rnd() * 2.4 };
    }
    activeCount++;
  }
}

function solveFrame() {
  const GR = 0.16;
  for (let i = 0; i < activeCount; i++) { const p = slots[i]; p.vy += GR; p.x += p.vx; p.y += p.vy; }
  const PASSES = 8;         // ≤190 particles — brute-force pairwise is plenty
  for (let pass = 0; pass < PASSES; pass++) {
    for (let i = 0; i < activeCount; i++) {
      const a = slots[i];
      for (let j = i + 1; j < activeCount; j++) {
        const b = slots[j];
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, rr = a.r + b.r;
        if (d2 < rr * rr && d2 > 0.0001) {
          const d = Math.sqrt(d2), ov = (rr - d) * 0.5, nx = dx / d, ny = dy / d;
          a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
        }
      }
    }
    for (let i = 0; i < activeCount; i++) {
      const p = slots[i];
      if (p.x < p.r) { p.x = p.r; if (p.vx < 0) p.vx *= -0.3; }
      if (p.x > W - p.r) { p.x = W - p.r; if (p.vx > 0) p.vx *= -0.3; }
      if (p.y > H - p.r) { p.y = H - p.r; if (p.vy > 0) p.vy *= -0.16; }
      collideRect(p, G.outL, G.rim, G.inL, G.outBot);   // left bar
      collideRect(p, G.inR, G.rim, G.outR, G.outBot);   // right bar
      collideRect(p, G.outL, G.bot, G.outR, G.outBot);  // base
    }
  }
  for (let i = 0; i < activeCount; i++) {
    const p = slots[i];
    p.vx *= 0.84; p.vy *= 0.9;
    if (Math.abs(p.vx) < 0.03) p.vx = 0;
    if (Math.abs(p.vy) < 0.05 && p.y > H - p.r - 1.5) p.vy = 0;
  }
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

/* ---- main bake ---- */
const q = (v) => {                    // normalized → clamped Int16
  const n = Math.round(v * SCALE);
  return n < -32768 ? -32768 : n > 32767 ? 32767 : n;
};

async function main() {
  const targets = await buildTargets();
  const N = targets.length;
  console.log(`portrait stipple: N = ${N} slots`);

  // pre-generate the full birth tree (slot 0 = seed; slot i buds from a random earlier slot)
  parent[0] = -1;
  for (let i = 1; i < N; i++) parent[i] = Math.floor(rnd() * i);

  // 1) bottle packing → 7 snapshots (bottle-space), inactive slots ride their parent
  const bottle = [];                  // bottle[k] = Int16Array(NCAP*3)
  for (const f of FILLS) {
    ensureActive(Math.max(1, Math.round(NCAP * f)));
    for (let s = 0; s < 150; s++) solveFrame();
    const arr = new Int16Array(NCAP * 3);
    for (let i = 0; i < NCAP; i++) {
      let j = i; while (j >= activeCount) j = parent[j];   // pre-birth → nearest active ancestor
      const p = slots[j];
      arr[i * 3] = q((p.x - G.inL) / Wb);
      arr[i * 3 + 1] = q((p.y - G.rim) / Hb);
      arr[i * 3 + 2] = q(p.r / Wb);
    }
    bottle.push(arr);
  }
  const bFull = bottle[bottle.length - 1];

  // 2) FLUID SPILL — continue the sim past noon: the population keeps doubling and
  //    overflows the beaker under gravity, pouring down and piling up until it fills
  //    the viewport. Captured as F frames (fill-space) that the runtime replays while
  //    scrubbing the spill. Frame 0 = the full bottle; the last frame = the screen-full
  //    pile used as the morph start. Beaker walls drop at ~12:02 so dots fill freely.
  const F = 24;                 // captured spill frames
  const SUB = 14;               // solver substeps between captured frames (settle the pile)
  const DOUB = Math.log2(N / NCAP);
  const WALLS_OFF = 0.35;       // spill progress at which the beaker walls disappear

  function solveSpill(applyWalls) {
    const GR = applyWalls ? 0.24 : 0;   // gravity while the beaker pours; then the freed mass spreads to fill
    for (let i = 0; i < activeCount; i++) { const p = slots[i]; p.vy += GR; p.x += p.vx; p.y += p.vy; }
    const cell = 16, grid = new Map();
    for (let i = 0; i < activeCount; i++) { const p = slots[i]; const k = ((p.x / cell) | 0) + '_' + ((p.y / cell) | 0); let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(i); }
    for (let pass = 0; pass < 6; pass++) {
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
    for (let i = 0; i < activeCount; i++) { const p = slots[i]; p.vx *= 0.86; p.vy *= 0.92; }
  }

  function snapSpill() {
    const arr = new Int16Array(N * 2);
    for (let i = 0; i < N; i++) {
      let j = i; while (j >= activeCount) j = parent[j];   // unborn slots ride their ancestor
      const p = slots[j];
      arr[i * 2] = q(p.x / W); arr[i * 2 + 1] = q(p.y / H);
    }
    return arr;
  }

  const spillFrames = [snapSpill()];          // frame 0 = the full bottle (activeCount = NCAP)
  for (let f = 1; f < F; f++) {
    const sub = f >= F - 6 ? 30 : SUB;        // extra settling once the late burst has spawned
    for (let s = 0; s < sub; s++) {
      const over = (f - 1 + (s + 1) / sub) / (F - 1);
      ensureActive(Math.min(N, Math.round(NCAP * Math.pow(2, over * DOUB))));
      solveSpill(over < WALLS_OFF);
    }
    spillFrames.push(snapSpill());
  }
  const lastSpill = spillFrames[F - 1];

  // 3) portrait assignment — sort slots by the final pile (y,x), targets by (y,x), match k-th
  const slotOrder = Array.from({ length: N }, (_, i) => i)
    .sort((a, b) => (lastSpill[a * 2 + 1] - lastSpill[b * 2 + 1]) || (lastSpill[a * 2] - lastSpill[b * 2]));
  const tgtOrder = Array.from({ length: N }, (_, i) => i)
    .sort((a, b) => (targets[a].y - targets[b].y) || (targets[a].x - targets[b].x));
  const vPortrait = new Int16Array(N * 3);
  for (let k = 0; k < N; k++) {
    const s = slotOrder[k], t = targets[tgtOrder[k]];
    vPortrait[s * 3] = q((t.x - W / 2) / H); vPortrait[s * 3 + 1] = q((t.y - H / 2) / H); vPortrait[s * 3 + 2] = q(t.r / H);
  }

  // 4) assemble the artifact
  const states = [];
  const chunks = [];
  let off = 0;
  const push = (name, space, slotCount, arr) => { states.push({ name, space, slotCount, offset: off }); chunks.push(arr); off += arr.length; };
  const bnames = ['b_seed', 'b_03', 'b_06', 'b_12', 'b_25', 'b_50', 'b_full'];
  bottle.forEach((arr, k) => push(bnames[k], 'bottle', NCAP, arr));
  push('v_portrait', 'hcenter', N, vPortrait);
  const spillOffset = off;                      // spill frames follow the named states
  for (let f = 0; f < F; f++) { chunks.push(spillFrames[f]); off += spillFrames[f].length; }

  const header = { magic: 'TGSB', version: 2, N, NCAP, scale: SCALE, fills: FILLS, states,
    spill: { frames: F, count: N, space: 'fill', stride: 2, offset: spillOffset } };
  let headerJSON = JSON.stringify(header);
  while ((headerJSON.length) % 4 !== 0) headerJSON += ' ';
  const headerBuf = Buffer.from(headerJSON, 'utf8');

  const payload = new Int16Array(off);
  let p = 0; for (const c of chunks) { payload.set(c, p); p += c.length; }

  const out = Buffer.alloc(12 + headerBuf.length + payload.byteLength);
  out.write('TGSB', 0, 'ascii');
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(headerBuf.length, 8);
  headerBuf.copy(out, 12);
  Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength).copy(out, 12 + headerBuf.length);

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out);
  console.log(`wrote ${OUT}`);
  console.log(`  states: ${states.map((s) => s.name).join(', ')}`);
  console.log(`  spill: ${F} frames x ${N} slots`);
  console.log(`  size: ${(out.length / 1024).toFixed(1)} KB (header ${headerBuf.length} B, payload ${(payload.byteLength / 1024).toFixed(1)} KB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
