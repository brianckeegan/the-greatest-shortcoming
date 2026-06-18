/* Landing background — scroll-scrubbed (#bcanvas).
   See render/scenes/landing.storyboard.md for the full spec + verified E. coli
   arithmetic. Clock grounded in real cells, so "full" lands at 11:50, not noon.

   Implements the storyboard beats (A…I). Frame-indexed across the loop:
     t 0.00–0.06  A  beaker fades up, empty (11:00)
     t 0.06–0.10  B  one red rod drops in (11:00)
     t 0.10–0.18  C  binary division 1→2→4→8, hero rods (11:01–03)
     t 0.18–0.24     zoom out, beaker reads empty (11:35)
     t 0.24–0.30     macro seed appears, rods→soft sprites (11:40)
     t 0.30–0.40  D  fill ~3%, vast headroom (11:45)
     t 0.40–0.46  E  false calm ~6% (11:46)
     t 0.46–0.52  F  late doublings race to half (11:49)
     t 0.52–0.56  G  full at the rim (11:50)
     t 0.56–0.62     overflow + beaker shatter (11:51)
     t 0.62–0.70     erupt to 16× volume, fills frame (11:52–54)
     t 0.70–0.90     morph → Bartlett hedcut
     t 0.90–1.00     resolve + gold trophy + epigraph

   The encoded video is ALL-INTRA (render/encode.mjs) so the site drives
   video.currentTime from scroll (ScrollyVideo.js) and seeks any frame instantly.

   Runs offline via render/harness on a real GPU. Two deliberate render-safety
   choices vs. the storyboard's ideal (both upgradeable in iteration):
     • "fluid" = position-based VOLUME FILL (particles ease to volume-proportional
       home slots; level is emergent from active count) rather than a full SPH port
       of examples/webgpu_compute_particles_fluid — predictable first render.
     • Ammo break is wrapped in try/catch; on any failure the scene falls back to a
       shader-only eruption so the video never blanks. */

const ENABLE_AMMO = true;

export default async function init({ THREE, TSL, renderer, width, height, aspect, totalFrames, prng }) {
  const {
    Fn, instancedArray, instanceIndex, hash, float, vec2, vec3, vec4, uv, uniform,
    mix, smoothstep, clamp, If,
  } = TSL;

  const COUNT = 65536;        // 2^16 macro-particles (dense fill); hedcut resolution
  const FULL = COUNT / 16;    // 4096 macro-particles = beaker full at the rim (11:50)
  const RED = vec3(176 / 255, 56 / 255, 42 / 255);
  const CREAMV = vec3(233 / 255, 226 / 255, 208 / 255); // hedcut ink reads light on dark bg
  const GOLD = vec3(224 / 255, 165 / 255, 47 / 255);
  const CREAM = 0xe9e2d0;

  // ---- world: beaker is a cylinder centred on the origin, open top ----
  // camera space ≈ x∈[-aspect/2,aspect/2], y∈[-0.5,0.5] at the default distance.
  const BK = { cx: 0, r: 0.13, bot: -0.34, top: 0.30 };       // beaker bounds
  const RIM = BK.top;
  const FILL_H = RIM - BK.bot;                                  // interior height

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  // perspective camera (animated per frame) — distance chosen so the z=0 plane
  // frames the same [-0.5,0.5] vertical extent the morph targets assume.
  const FOV = 35;
  const camDist = 0.5 / Math.tan((FOV * Math.PI) / 360);
  const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.01, 100);

  // ---- lights (key upper-left, cool fill) ----
  scene.add(new THREE.AmbientLight(0xbfc8d4, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-3, 5, 4);
  scene.add(key);

  // ---- glass beaker mesh + cream rim + faint ground shadow ----
  const glassMat = new THREE.MeshStandardNodeMaterial({
    color: 0x9fb2c8, transparent: true, opacity: 0.12,
    roughness: 0.25, metalness: 0, side: THREE.DoubleSide, depthWrite: false,
  });
  const beaker = new THREE.Mesh(
    new THREE.CylinderGeometry(BK.r, BK.r * 0.96, FILL_H, 48, 1, true),
    glassMat,
  );
  beaker.position.y = (BK.top + BK.bot) / 2;
  scene.add(beaker);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(BK.r, 0.006, 8, 48),
    new THREE.MeshStandardNodeMaterial({ color: CREAM, roughness: 0.5 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = BK.top;
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(BK.r * 2.2, 48),
    new THREE.MeshBasicNodeMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = BK.bot - 0.001;
  scene.add(ground);
  const beakerGroup = [beaker, rim];

  // ---- hedcut targets + volume-fill homes ----
  const targets = await buildTargets({ count: COUNT, prng });
  const targetBuffer = instancedArray(targets, 'vec3');
  const homes = buildHomes({ count: COUNT, full: FULL, BK, RIM, prng });
  const homeBuffer = instancedArray(homes, 'vec3');

  // ---- sim state ----
  const positionBuffer = instancedArray(COUNT, 'vec3');
  const velocityBuffer = instancedArray(COUNT, 'vec3');

  const computeInit = Fn(() => {
    const i = instanceIndex;
    // Seed every cell AT its volume-fill home (+ tiny jitter). Because a cell
    // becomes visible the instant it is "active" (index < uActive) and the homes
    // are sorted bottom-up, the surface level = active/FULL with no travel time —
    // this is the fix for "balls never fill / pile underneath".
    const h = homeBuffer.element(i);
    const jx = hash(i).sub(0.5).mul(0.005);
    const jy = hash(i.add(1)).sub(0.5).mul(0.005);
    const jz = hash(i.add(2)).sub(0.5).mul(0.005);
    positionBuffer.element(i).assign(h.add(vec3(jx, jy, jz)));
    velocityBuffer.element(i).assign(vec3(0, 0, 0));
  })().compute(COUNT);
  await renderer.computeAsync(computeInit);

  // ---- per-frame uniforms ----
  const uActive = uniform(1.0);
  const uOver = uniform(0.0);   // 0..1 overflow/eruption
  const uDt = uniform(1 / 30);
  const uMorph = uniform(0.0);
  const uHalo = uniform(1.0);   // glow halo opacity (sparse→1, packed→0)
  const uRod = uniform(1.0);    // 1 = rod aspect (micro), 0 = round (macro)

  // Update: during the FILL the cells simply rest at their homes (set at init),
  // so the level tracks active/FULL exactly. Only once the beaker overflows do
  // they integrate ballistically — bursting outward from centre to fill the
  // frame (storyboard §4). No containment needed: homes are already inside the
  // cylinder, and the spill is meant to escape it.
  const computeUpdate = Fn(() => {
    const i = instanceIndex;
    If(float(i).lessThan(uActive), () => {
      If(uOver.greaterThan(0.001), () => {
        const pos = positionBuffer.element(i);
        const vel = velocityBuffer.element(i);
        vel.addAssign(vec3(0, float(-0.9).mul(uDt), 0));            // gravity
        const dir = pos.sub(vec3(BK.cx, 0.0, 0.0));                 // burst from centre
        const len = dir.length().max(0.0001);
        vel.addAssign(dir.div(len).mul(uOver.mul(uDt).mul(1.6)));
        pos.addAssign(vel.mul(uDt));
        vel.mulAssign(vec3(0.93, 0.96, 0.93));                      // drag
      });
    });
  })().compute(COUNT);

  // ---- particle materials: additive halo pass + alpha core pass ----
  const simPos = positionBuffer.toAttribute();
  const tgtPos = targetBuffer.toAttribute();
  const drawPos = mix(simPos, tgtPos, smoothstep(0.0, 1.0, uMorph));
  const isActive = float(instanceIndex).lessThan(uActive).select(float(1.0), float(0.0));
  // soft round dot (radial falloff); gold for a small subset in the morph (trophy)
  const d = uv().sub(vec2(0.5, 0.5)).length();
  const radial = smoothstep(0.5, 0.08, d);
  const goldPick = hash(instanceIndex.add(99)).lessThan(0.04).select(float(1.0), float(0.0));
  // hedcut: red bacteria → CREAM ink (light, so the portrait reads on the dark bg)
  const baseCol = mix(RED, CREAMV, uMorph);
  const col = mix(baseCol, GOLD, goldPick.mul(uMorph));

  function makeParticles({ additive, scaleMul, opacityMul }) {
    const m = new THREE.SpriteNodeMaterial({
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    m.positionNode = drawPos;
    m.colorNode = vec4(col, 1.0);
    m.opacityNode = radial.mul(isActive).mul(opacityMul);
    // rod aspect (tall) when uRod=1 → round when uRod=0
    m.scaleNode = mix(vec2(0.004, 0.011), vec2(0.006, 0.006), float(1.0).sub(uRod)).mul(scaleMul);
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), m, COUNT);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  }
  const halo = makeParticles({ additive: true, scaleMul: 2.4, opacityMul: uHalo.mul(0.5) });
  const core = makeParticles({ additive: false, scaleMul: 1.0, opacityMul: float(1.0) });

  // ---- optional Ammo beaker break (guarded) ----
  let ammo = null;
  if (ENABLE_AMMO) {
    try { ammo = await ammoBreak({ THREE, scene, beakerGroup, BK, prng }); }
    catch (e) { console.warn('[landing] Ammo unavailable, shader eruption only:', e.message); }
  }

  // ---- camera keyframes (deterministic) ----
  // mobile (portrait) frames the beaker lower; desktop centres it.
  const portrait = aspect < 1;
  function camForT(t) {
    // distance: zoomed in early, out by 11:35, settle for morph
    const zIn = camDist * 0.85, zMid = camDist * 1.2, zPortrait = camDist * 1.0;
    let dist, lookY, orbit;
    if (t < 0.10) { dist = lerp(zIn, zIn * 1.05, t / 0.10); lookY = BK.bot + 0.02; orbit = 0; }
    else if (t < 0.24) { dist = lerp(zIn, zMid, sstep(t, 0.10, 0.24)); lookY = lerp(BK.bot + 0.02, 0, sstep(t, 0.10, 0.24)); orbit = 0; }
    else if (t < 0.70) { dist = zMid; lookY = 0; orbit = Math.sin((t - 0.24) * 3.0) * 0.18; }
    else { const u = sstep(t, 0.70, 0.88); dist = lerp(zMid, zPortrait, u); lookY = 0; orbit = lerp(Math.sin((0.70 - 0.24) * 3.0) * 0.18, 0, u); }
    const ly = portrait ? lookY + 0.12 : lookY;     // bias beaker into lower third on mobile
    camera.position.set(Math.sin(orbit) * dist, ly + Math.cos(orbit) * 0.0, Math.cos(orbit) * dist);
    camera.position.y = ly + (portrait ? 0.06 : 0.0);
    camera.lookAt(0, ly, 0);
    camera.updateProjectionMatrix();
  }

  function paramsForPhase(t) {
    let active;
    if (t < 0.10) active = 1;
    else if (t < 0.18) active = pow2Ramp(t, 0.10, 0.18, 1, 8);
    else if (t < 0.30) active = 1;
    else if (t < 0.56) active = pow2Ramp(t, 0.30, 0.56, 1, FULL);
    else active = pow2Ramp(t, 0.56, 0.70, FULL, COUNT);
    const over = clampJS((t - 0.56) / 0.06, 0, 1);
    const shatter = t >= 0.58;
    const morph = sstep(t, 0.70, 1.0);
    const halo = 1 - clampJS((Number(active) / FULL), 0, 1) * 0.9; // glow fades as it packs
    const rod = 1 - clampJS((t - 0.18) / 0.12, 0, 1);              // rods → round by 11:40
    return { active: Math.max(1, Math.round(active)), over, shatter, morph, halo, rod };
  }

  let broken = false;
  return {
    async render(frameIndex) {
      const t = frameIndex / totalFrames;
      const p = paramsForPhase(t);
      uActive.value = p.active;
      uOver.value = p.over;
      uMorph.value = p.morph;
      uHalo.value = p.halo;
      uRod.value = p.rod;
      camForT(t);

      // hide the beaker the moment it shatters — regardless of whether Ammo is
      // available — so the eruption/morph is never occluded by a phantom vessel.
      const showBeaker = !p.shatter;
      beaker.visible = showBeaker; rim.visible = showBeaker;

      if (p.morph < 0.999) await renderer.computeAsync(computeUpdate);
      if (ammo && p.shatter && t < 0.74) { if (!broken) { ammo.fracture(); broken = true; } ammo.step(1 / 30); }

      await renderer.renderAsync(scene, camera);
    },
    dispose() {
      [halo, core].forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
      beaker.geometry.dispose(); beaker.material.dispose();
      rim.geometry.dispose(); rim.material.dispose();
      ground.geometry.dispose(); ground.material.dispose();
      ammo?.dispose?.();
    },
  };

  // ---- CPU helpers ----
  function clampJS(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * clampJS(u, 0, 1); }
  function sstep(x, e0, e1) { const u = clampJS((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); }
  function pow2Ramp(t, t0, t1, a, b) { const u = clampJS((t - t0) / (t1 - t0), 0, 1); return a * Math.pow(b / a, u); }
}

/* Volume-fill home slots (camera space): random points inside the beaker cylinder
   for the first `full`, then stacked above the rim for the overflow remainder,
   sorted bottom-up so activation order (index 0..N) fills the vessel from the
   floor — makes the surface level emergent from the active count. */
function buildHomes({ count, full, BK, RIM, prng }) {
  const out = new Float32Array(count * 3);
  const pts = [];
  for (let k = 0; k < count; k++) {
    const inside = k < full;
    const ang = prng.next() * Math.PI * 2;
    const rr = Math.sqrt(prng.next()) * BK.r * (inside ? 0.94 : 1.6);
    const x = BK.cx + Math.cos(ang) * rr;
    const z = Math.sin(ang) * rr;
    // y range: inside fills bot→rim; overflow stacks rim→ above (up to ~16x volume)
    const y = inside
      ? BK.bot + prng.next() * (RIM - BK.bot)
      : RIM + prng.next() * (RIM - BK.bot) * 3.2;
    pts.push([x, y, z]);
  }
  pts.sort((a, b) => a[1] - b[1]); // bottom-up
  for (let k = 0; k < count; k++) { out[k * 3] = pts[k][0]; out[k * 3 + 1] = pts[k][1]; out[k * 3 + 2] = pts[k][2]; }
  return out;
}

/* Build hedcut target positions (camera space) by luminance-sampling the Bartlett
   portrait — ported from assets/js/landing.js buildTargets(). */
async function buildTargets({ count, prng }) {
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

  const ph = 0.9, pw = ph * (img.width / img.height);
  const samples = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = (j * cols + i) * 4;
      const L = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
      let ink = clamp01((0.82 - L) / 0.82);
      ink = ink * ink * (3 - 2 * ink);
      if (ink < 0.08) continue;
      const x = (i / cols - 0.5) * pw + (prng.next() - 0.5) * (pw / cols) * 0.5;
      const y = (0.5 - j / rows) * ph + (prng.next() - 0.5) * (ph / rows) * 0.5;
      samples.push([x, y]);
    }
  }
  for (let k = 0; k < count; k++) {
    const s = samples[k % Math.max(1, samples.length)];
    if (!s) break;
    out[k * 3] = s[0]; out[k * 3 + 1] = s[1]; out[k * 3 + 2] = 0;
  }
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

/* Ammo.js convex break of the beaker, following three.js examples/physics_ammo_break.
   fracture() subdivides the beaker mesh into convex fragments on the overflow
   impulse; step(dt) advances the world and syncs fragment transforms. Deterministic
   at fixed dt from fixed initial conditions. Guarded by try/catch at the call site. */
async function ammoBreak({ THREE, scene, beakerGroup, BK, prng }) {
  const AmmoLib = (await import('three/addons/libs/ammo.wasm.js')).default;
  const Ammo = await AmmoLib();
  const { ConvexObjectBreaker } = await import('three/addons/misc/ConvexObjectBreaker.js');

  const config = new Ammo.btDefaultCollisionConfiguration();
  const world = new Ammo.btDiscreteDynamicsWorld(
    new Ammo.btCollisionDispatcher(config),
    new Ammo.btDbvtBroadphase(),
    new Ammo.btSequentialImpulseConstraintSolver(),
    config,
  );
  world.setGravity(new Ammo.btVector3(0, -9.8, 0));
  const breaker = new ConvexObjectBreaker();
  const tmp = new Ammo.btTransform();
  const bodies = [];
  const meshes = [];

  // a thin-walled shatterable shell approximated as a convex glass mesh
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(BK.r, BK.r, BK.top - BK.bot, 24, 1, false),
    new THREE.MeshStandardNodeMaterial({ color: 0x9fb2c8, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }),
  );
  shell.position.y = (BK.top + BK.bot) / 2;
  breaker.prepareBreakableObject(shell, 1, new THREE.Vector3(), new THREE.Vector3(), true);

  function addFragment(mesh) {
    mesh.geometry.computeBoundingBox();
    const sz = new THREE.Vector3();
    mesh.geometry.boundingBox.getSize(sz);
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(sz.x / 2, sz.y / 2, sz.z / 2));
    const tr = new Ammo.btTransform(); tr.setIdentity();
    tr.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
    const mass = mesh.userData.mass || 0.2;
    const inertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, inertia);
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(mass, new Ammo.btDefaultMotionState(tr), shape, inertia),
    );
    world.addRigidBody(body);
    bodies.push(body); meshes.push(mesh); scene.add(mesh);
  }

  return {
    fracture() {
      beakerGroup.forEach((m) => (m.visible = false));
      const normal = new THREE.Vector3(0, 1, 0);
      const point = new THREE.Vector3(0, BK.top, 0);
      const frags = breaker.subdivideByImpact(shell, point, normal, 2, 0);
      frags.forEach((f) => {
        // give each fragment a small deterministic outward kick
        const a = prng.next() * Math.PI * 2;
        f.userData.mass = 0.15 + prng.next() * 0.1;
        addFragment(f);
        const b = bodies[bodies.length - 1];
        b.setLinearVelocity(new Ammo.btVector3(Math.cos(a) * 1.5, 1.0, Math.sin(a) * 1.5));
      });
    },
    step(dt) {
      world.stepSimulation(dt, 4, 1 / 120);
      for (let i = 0; i < bodies.length; i++) {
        const ms = bodies[i].getMotionState();
        if (!ms) continue;
        ms.getWorldTransform(tmp);
        const o = tmp.getOrigin(), q = tmp.getRotation();
        meshes[i].position.set(o.x(), o.y(), o.z());
        meshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
    },
    dispose() { meshes.forEach((m) => { m.geometry.dispose(); m.material.dispose(); }); },
  };
}
