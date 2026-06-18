/* Landing background — scroll-scrubbed (#bcanvas).
   See render/scenes/landing.storyboard.md for the full spec + verified E. coli
   arithmetic. Clock grounded in real cells, so "full" lands at 11:50, not noon.
   The narrative the video must carry, frame-indexed across the loop:
     phase 0.00–0.30  intro  — 1 cell (11:00) → 1→8 hero rods (11:01–03) → zoom out
                               (11:35 empty) → macro seed (11:40)
     phase 0.30–0.56  fill   — macro count doubles 1→1024 (11:40→11:50), full at rim
     phase 0.56–0.62  spill  — vessel overflows; particles erupt outward (11:51)
     phase ~0.58      break  — (optional, ENABLE_AMMO) the beaker shatters
     phase 0.62–0.70  erupt  — 1024→16384 (11:52→11:54, 16× volume), fill frame
     phase 0.70–1.00  morph  — particles reorganise into the Bartlett hedcut

   The encoded video is ALL-INTRA (see render/encode.mjs) so the site can drive
   video.currentTime from scroll position (ScrollyVideo.js) and seek any frame
   instantly — preserving the original scroll-scrubbed feel with zero live sim.

   Compute particles adapted from three.js examples/webgpu_compute_particles
   (+ _fluid for the spill); the beaker break follows examples/physics_ammo_break.
   The hedcut morph ports the luminance-stipple sampling from the original
   assets/js/landing.js (buildTargets). Runs offline via render/harness (real GPU).

   NOTE: physics fidelity (inter-particle repulsion, true division, the Ammo
   break) is scaffolded to the upstream APIs but must be tuned on a GPU machine —
   it cannot be validated in the GPU-less CI sandbox. ENABLE_AMMO defaults off so
   the scene renders end-to-end without the WASM physics step. */

const ENABLE_AMMO = false; // flip on once validated locally (see ammoBreak() below)

export default async function init({ THREE, TSL, renderer, width, height, aspect, totalFrames, prng }) {
  const {
    Fn, instancedArray, instanceIndex, hash, float, vec3, vec4, uniform,
    mix, smoothstep, clamp, If,
  } = TSL;

  const COUNT = 16384;        // 2^14 macro-particles = hedcut resolution
  const FULL = COUNT / 16;    // 1024 macro-particles = beaker full at the rim (11:50)
  const RED = vec3(176 / 255, 56 / 255, 42 / 255);
  const BLACK = vec3(17 / 255, 17 / 255, 17 / 255);

  // normalised camera box: x∈[-aspect/2,aspect/2], y∈[-0.5,0.5]
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  const halfW = aspect / 2;
  const camera = new THREE.OrthographicCamera(-halfW, halfW, 0.5, -0.5, -10, 10);
  camera.position.z = 1;

  // vessel geometry in camera space (a centred beaker)
  const VES = { cx: 0, halfW: 0.10, top: 0.30, bot: -0.34 };

  // ---- hedcut targets: sample the Bartlett portrait into target positions ----
  const targets = await buildTargets({ width, height, aspect, count: COUNT, prng });
  const targetBuffer = instancedArray(targets, 'vec3');

  // ---- sim state buffers ----
  const positionBuffer = instancedArray(COUNT, 'vec3');
  const velocityBuffer = instancedArray(COUNT, 'vec3');

  const computeInit = Fn(() => {
    const i = instanceIndex;
    // seed inside the vessel near the floor, spread horizontally
    const sx = hash(i).sub(0.5).mul(VES.halfW * 1.7);
    const sy = float(VES.bot).add(hash(i.add(31)).mul(0.04));
    positionBuffer.element(i).assign(vec3(sx, sy, 0));
    velocityBuffer.element(i).assign(vec3(0, 0, 0));
  })().compute(COUNT);
  await renderer.computeAsync(computeInit);

  // ---- uniforms driven per frame ----
  const uActive = uniform(1.0);   // active particle count (float, compared to index)
  const uOver = uniform(0.0);     // 0..1 overflow amount
  const uDt = uniform(1 / 30);

  // fill/spill update: gravity + integrate + vessel bounds (or eruption when over)
  const computeUpdate = Fn(() => {
    const i = instanceIndex;
    If(float(i).lessThan(uActive), () => {
      const pos = positionBuffer.element(i);
      const vel = velocityBuffer.element(i);
      const erupt = uOver.greaterThan(0.001);

      const g = mix(float(-0.6), float(-0.08), uOver); // gentler when erupting
      vel.addAssign(vec3(0, g.mul(uDt), 0));

      If(erupt, () => {
        // push outward from the vessel centre (fluid-like spread)
        const dir = pos.sub(vec3(VES.cx, 0.0, 0.0));
        const len = dir.length().max(0.0001);
        vel.addAssign(dir.div(len).mul(uOver.mul(0.04).mul(uDt).mul(30.0)));
      });

      pos.addAssign(vel.mul(uDt));

      // vessel containment while not yet overflowing much
      If(uOver.lessThan(0.12), () => {
        const lx = float(VES.cx - VES.halfW);
        const rx = float(VES.cx + VES.halfW);
        If(pos.x.lessThan(lx), () => { pos.x.assign(lx); vel.x.mulAssign(-0.3); });
        If(pos.x.greaterThan(rx), () => { pos.x.assign(rx); vel.x.mulAssign(-0.3); });
        If(pos.y.lessThan(VES.bot), () => { pos.y.assign(VES.bot); vel.y.mulAssign(-0.2); });
      });

      vel.mulAssign(vec3(0.9, 0.92, 0.9)); // drag
    });
  })().compute(COUNT);

  // ---- material ----
  const uMorph = uniform(0.0);
  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });

  const simPos = positionBuffer.toAttribute();
  const tgtPos = targetBuffer.toAttribute();
  const drawPos = mix(simPos, tgtPos, smoothstep(0.0, 1.0, uMorph));
  material.positionNode = drawPos;

  const active = float(instanceIndex).lessThan(uActive).select(float(1.0), float(0.0));
  const col = mix(RED, BLACK, uMorph);
  material.colorNode = vec4(col, active);
  material.scaleNode = mix(float(0.006), float(0.004), uMorph);

  const geometry = new THREE.PlaneGeometry(1, 1);
  const particles = new THREE.InstancedMesh(geometry, material, COUNT);
  particles.frustumCulled = false;
  scene.add(particles);

  // ---- optional Ammo beaker break (scaffold; see physics_ammo_break) ----
  let ammo = null;
  if (ENABLE_AMMO) ammo = await ammoBreak({ THREE, scene, prng });

  // ---- phase → sim parameters (storyboard §1/§3: powers-of-two doubling) ----
  // active = 2^(clock-11:40) macro-particles, full (rim) at FULL=1024 (11:50),
  // 16384 (16× volume) at 11:54. The t→clock map is non-linear so the late
  // doublings (11:47→11:50) get more frames — "slow, then all at once".
  function paramsForPhase(t) {
    let active;
    if (t < 0.10) active = 1;                                  // 11:00 single cell
    else if (t < 0.18) active = pow2Ramp(t, 0.10, 0.18, 1, 8); // 11:01–03: 1→8 hero rods
    else if (t < 0.30) active = 1;                             // 11:35 empty → 11:40 macro seed
    else if (t < 0.56) active = pow2Ramp(t, 0.30, 0.56, 1, FULL);     // 11:40→11:50: 1→1024
    else active = pow2Ramp(t, 0.56, 0.70, FULL, COUNT);              // 11:50→11:54: 1024→16384
    const over = clampJS((t - 0.56) / 0.06, 0, 1);   // overflow ramps once full (11:51+)
    const shatter = t >= 0.58;                        // beaker break (11:51)
    const morph = smoothstepJS(0.70, 1.0, t);
    return { active: Math.max(1, Math.round(active)), over, shatter, morph };
  }

  return {
    async render(frameIndex) {
      const t = frameIndex / totalFrames;
      const p = paramsForPhase(t);
      uActive.value = p.active;
      uOver.value = p.over;
      uMorph.value = p.morph;

      // step the sim only while not fully morphed (frozen during morph)
      if (p.morph < 0.999) await renderer.computeAsync(computeUpdate);
      if (ammo && p.shatter && t < 0.72) ammo.step(1 / 30);

      await renderer.renderAsync(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      ammo?.dispose?.();
    },
  };

  // tiny CPU easing helpers (uniform-side math)
  function clampJS(v, a, b) { return v < a ? a : v > b ? b : v; }
  // exponential (doubling) interpolation a→b across t∈[t0,t1] — equal minutes
  // map to equal doublings, so a*2,*4,… steps land evenly on the clock.
  function pow2Ramp(t, t0, t1, a, b) {
    const u = clampJS((t - t0) / (t1 - t0), 0, 1);
    return a * Math.pow(b / a, u);
  }
  function smoothstepJS(e0, e1, x) {
    const t = clampJS((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }
}

/* Build hedcut target positions (camera space) by luminance-sampling the
   Bartlett portrait — ported from assets/js/landing.js buildTargets(). Returns a
   Float32Array of length count*3 (unused slots park offscreen). */
async function buildTargets({ width, height, aspect, count, prng }) {
  const out = new Float32Array(count * 3);
  for (let k = 0; k < count; k++) out[k * 3 + 1] = -10; // park offscreen by default

  const img = await loadImage('/assets/img/bartlett.webp').catch(() =>
    loadImage('/assets/img/bartlett.jpg'),
  );
  if (!img) return out;

  const rows = 156, cols = Math.round((rows * img.width) / img.height);
  const off = new OffscreenCanvas(cols, rows);
  const octx = off.getContext('2d');
  octx.drawImage(img, 0, 0, cols, rows);
  const data = octx.getImageData(0, 0, cols, rows).data;

  // portrait box in camera space (centred, ~0.9 of the height)
  const ph = 0.9, pw = ph * (img.width / img.height);
  const samples = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = (j * cols + i) * 4;
      const L = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
      let ink = clamp01((0.82 - L) / 0.82);
      ink = ink * ink * (3 - 2 * ink);
      if (ink < 0.08) continue;
      // camera coords: x right, y up; image y is top-down
      const x = (i / cols - 0.5) * pw + (prng.next() - 0.5) * (pw / cols) * 0.5;
      const y = (0.5 - j / rows) * ph + (prng.next() - 0.5) * (ph / rows) * 0.5;
      samples.push([x, y]);
    }
  }
  // assign samples to particles (repeat/shuffle to fill count where possible)
  for (let k = 0; k < count; k++) {
    const s = samples[k % Math.max(1, samples.length)];
    if (!s) break;
    out[k * 3] = s[0];
    out[k * 3 + 1] = s[1];
    out[k * 3 + 2] = 0;
  }
  void aspect; void width; void height;
  return out;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

/* Ammo.js convex break of the beaker — scaffold following three.js
   examples/physics_ammo_break. Left disabled (ENABLE_AMMO) until validated on a
   GPU/desktop machine: load Ammo, build a btDiscreteDynamicsWorld, add the
   beaker as a breakable convex body, and on the spill impulse call
   ConvexObjectBreaker.subdivideByImpact() and re-add the fragments. step(dt)
   advances physicsWorld.stepSimulation(dt, 10) and syncs fragment meshes. */
async function ammoBreak({ THREE, scene, prng }) {
  const AmmoLib = (await import('three/addons/libs/ammo.wasm.js')).default;
  const Ammo = await AmmoLib();
  // TODO (local GPU pass): construct the physics world + ConvexObjectBreaker,
  // add the beaker mesh, fracture on impulse, sync transforms. See upstream
  // examples/physics_ammo_break.html. Kept minimal so the scene still renders.
  void THREE; void scene; void prng; void Ammo;
  return {
    step() { /* stepSimulation + transform sync goes here */ },
    dispose() {},
  };
}
