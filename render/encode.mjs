/* Encode captured PNG frames into web-optimised background media.

   Reads render/.frames/<scene>/<rendition>/frame_%05d.png and writes, into
   assets/video/:
     <scene>.<W>x<H>.mp4   (H.264, yuv420p, +faststart — Safari/iOS baseline)
     <scene>.<W>x<H>.webm  (VP9 — better compression for Chromium/Firefox)
     <scene>.<W>x<H>.jpg   (poster / prefers-reduced-motion still)

   Looping scenes (titlecard) use a normal GOP and loop seamlessly because the
   source animation is a closed cycle. Scroll-scrubbed scenes (landing) are
   encoded ALL-INTRA (every frame a keyframe) so video.currentTime seeks are
   instant and frame-accurate.

   Also writes assets/video/.render-hash so we can tell when committed assets
   are stale relative to render/** + the three.js version.

   Requires ffmpeg on PATH (preinstalled on macOS via brew / ubuntu runners).
   Usage: node render/encode.mjs [--scene=titlecard]
*/
import { spawnSync, execSync } from 'node:child_process';
import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FRAMES_ROOT = join(REPO_ROOT, 'render', '.frames');
const OUT_DIR = join(REPO_ROOT, 'assets', 'video');

const FPS = 30;
// Per-scene encoding intent. `scrub: true` ⇒ all-intra (MP4-only) for seek accuracy.
const SCENES = {
  landing: { scrub: true, crf: 30 },
};

const argv = process.argv.slice(2);
const onlyScene = (argv.find((a) => a.startsWith('--scene=')) || '').split('=')[1] || null;

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ffmpeg ${args.join(' ')}`);
}

function ensureFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (r.status !== 0) { console.error('ffmpeg not found on PATH.'); process.exit(1); }
}

function encodeOne(scene, renditionKey, cfg) {
  const dir = join(FRAMES_ROOT, scene, renditionKey);
  if (!existsSync(dir)) { console.warn(`skip ${scene}/${renditionKey} (no frames)`); return; }
  const frames = readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  if (!frames.length) { console.warn(`skip ${scene}/${renditionKey} (empty)`); return; }

  // Probe dimensions from the first frame with ffprobe.
  const probe = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${join(dir, frames[0])}"`
  ).toString().trim();
  const [W, H] = probe.split(',').map((n) => parseInt(n, 10));
  const base = `${scene}.${W}x${H}`;
  const input = ['-framerate', String(FPS), '-i', join(dir, 'frame_%05d.png')];
  const allIntra = cfg.scrub ? ['-x264-params', 'keyint=1:scenecut=0'] : [];

  console.log(`encode ${base} (${frames.length} frames, scrub=${cfg.scrub})`);

  // H.264 MP4
  ffmpeg([...input, '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-crf', String(cfg.crf), ...allIntra, '-movflags', '+faststart', '-an',
    join(OUT_DIR, `${base}.mp4`)]);

  // VP9 WebM — only for looping (non-scrub) scenes. All-intra VP9 for the scrub
  // rendition ballooned to 18–24 MB (postmortem); ScrollyVideo drives the MP4
  // fine, so scrub scenes ship MP4-only.
  if (!cfg.scrub) {
    ffmpeg([...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(cfg.crf + 2),
      '-row-mt', '1', '-an', join(OUT_DIR, `${base}.webm`)]);
  }

  // Poster / reduced-motion still — the "full beaker" beat (~55% through).
  const posterIdx = frames[Math.min(frames.length - 1, Math.floor(frames.length * 0.55))];
  ffmpeg(['-i', join(dir, posterIdx), '-q:v', '4', join(OUT_DIR, `${base}.jpg`)]);
}

function renderHash() {
  // Hash render/** sources + three.js version so we can detect stale assets.
  const h = createHash('sha256');
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.frames' || e.name === 'node_modules') continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else h.update(readFileSync(p));
    }
  };
  walk(join(REPO_ROOT, 'render'));
  try {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'node_modules', 'three', 'package.json')));
    h.update(`three@${pkg.version}`);
  } catch { /* three not installed; hash render sources only */ }
  return h.digest('hex');
}

function main() {
  ensureFfmpeg();
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  for (const [scene, cfg] of Object.entries(SCENES)) {
    if (onlyScene && scene !== onlyScene) continue;
    for (const key of ['desktop', 'mobile']) encodeOne(scene, key, cfg);
  }

  writeFileSync(join(OUT_DIR, '.render-hash'), renderHash() + '\n');
  console.log(`\nWrote ${OUT_DIR}. Commit assets/video/* (and .render-hash).`);
}

main();
