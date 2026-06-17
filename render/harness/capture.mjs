/* Offline frame capture harness.
   Launches headless Chrome (with WebGPU) via Playwright, serves the repo over a
   tiny static HTTP server, loads render/harness/host.html for each
   {scene × resolution}, and screenshots every frame to PNGs under render/.frames.

   Requires a real GPU on the machine running this (macOS Metal, or a Linux box
   with a GPU). three.js WebGPU *compute* will not software-rasterise on a
   GPU-less CI runner — see render/README.md. After this, run `npm run encode`.

   Usage:
     node render/harness/capture.mjs                 # all scenes, both aspects
     node render/harness/capture.mjs --scene=titlecard
     node render/harness/capture.mjs --only=desktop  # or --only=mobile
*/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const FRAMES_ROOT = join(REPO_ROOT, 'render', '.frames');

/* ----- scene / rendition matrix ------------------------------------------- */
// Frame counts: titlecard is a closed loop (~11s @ 30fps). landing is
// scroll-scrubbed and encoded all-intra, so it stays deliberately short.
const RENDITIONS = [
  { key: 'desktop', width: 1920, height: 1080 },
  { key: 'mobile', width: 1080, height: 1920 },
];
const SCENES = {
  titlecard: { frames: 330 },
  landing: { frames: 220 },
};

/* ----- args --------------------------------------------------------------- */
const argv = process.argv.slice(2);
const arg = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
};
const onlyScene = arg('scene', null);
const onlyRendition = arg('only', null);

/* ----- static server (serves repo root, including node_modules) ----------- */
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};
function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const filePath = join(REPO_ROOT, url);
      if (!filePath.startsWith(REPO_ROOT)) { res.writeHead(403).end(); return; }
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/* ----- main --------------------------------------------------------------- */
const pad = (n) => String(n).padStart(5, '0');

async function captureScene(browser, baseURL, sceneName, rendition) {
  const { frames } = SCENES[sceneName];
  const { key, width, height } = rendition;
  const outDir = join(FRAMES_ROOT, sceneName, key);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', (m) => console.log(`  [page:${sceneName}/${key}] ${m.text()}`));
  page.on('pageerror', (e) => console.error(`  [page:${sceneName}/${key}] ERROR ${e.message}`));

  const url = `${baseURL}/render/harness/host.html?scene=${sceneName}&width=${width}&height=${height}&frames=${frames}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready', null, { timeout: 120000 });
  await page.evaluate('window.__ready');

  console.log(`→ ${sceneName} / ${key} (${width}×${height}, ${frames} frames)`);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((n) => window.__renderFrame(n), i);
    await page.screenshot({ path: join(outDir, `frame_${pad(i)}.png`), clip: { x: 0, y: 0, width, height } });
    if (i % 30 === 0) process.stdout.write(`  ${i}/${frames}\r`);
  }
  console.log(`  ${frames}/${frames} ✓`);
  await context.close();
}

async function main() {
  if (!existsSync(join(REPO_ROOT, 'node_modules', 'three'))) {
    console.error('three.js not installed. Run `npm install` first.');
    process.exit(1);
  }
  const server = await startServer();
  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({
    args: [
      '--enable-unsafe-webgpu',
      '--enable-features=Vulkan',
      '--use-angle=default',
      // On a GPU-less runner you would additionally need xvfb + lavapipe; this
      // pipeline is designed to run on a machine with a real GPU instead.
    ],
  });

  try {
    for (const [sceneName, cfg] of Object.entries(SCENES)) {
      if (onlyScene && sceneName !== onlyScene) continue;
      void cfg;
      for (const rendition of RENDITIONS) {
        if (onlyRendition && rendition.key !== onlyRendition) continue;
        await captureScene(browser, baseURL, sceneName, rendition);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log('\nFrames written to render/.frames — now run `npm run encode`.');
}

main().catch((e) => { console.error(e); process.exit(1); });
