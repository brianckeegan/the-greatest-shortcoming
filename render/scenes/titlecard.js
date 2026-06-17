/* Titlecard background — home hub (#growthfield).
   A WebGPU compute-particle reimagining of the chapter-3 "Fig. 3" exponential
   scatter: particles are born along an exponential curve — sparse/cool at the
   base, dense/hot as it goes vertical — bloom into being, hold, then fade, on a
   closed loop so the encoded video tiles seamlessly (frame N+1 == frame 0).

   Adapted from three.js examples/webgpu_compute_particles. Runs offline via
   render/harness (real GPU required). NOTE: the TSL compute/material wiring
   follows the upstream example API; tune particle count, colour ramp, and
   easing on a GPU machine — it cannot be validated in the GPU-less CI sandbox.

   Contract (see render/harness/host.html):
     default async ({THREE, TSL, renderer, width, height, aspect, totalFrames, prng})
       → { render(frameIndex), dispose() }
   Frames are requested strictly in order; the loop is a pure function of the
   normalised cycle phase t = frameIndex / totalFrames, so output is deterministic. */

export default async function init({ THREE, TSL, renderer, width, height, aspect, totalFrames }) {
  const {
    Fn, instancedArray, instanceIndex, hash, float, vec3, vec4, uniform,
    mix, smoothstep, clamp, exp, sin, cos, PI2,
  } = TSL;

  const COUNT = 60000;     // dense enough for the vertical climax; cheap offline
  const K = 5.3;           // curve "explosiveness" (matches the 2D original)

  // ---- scene + ortho camera in a normalised [-aspect/2..aspect/2] × [-0.5..0.5] box
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  const halfW = aspect / 2;
  const camera = new THREE.OrthographicCamera(-halfW, halfW, 0.5, -0.5, -10, 10);
  camera.position.z = 1;

  // ---- colour ramp (cool blue → ink → gold → alarm red), evaluated on GPU
  const C0 = vec3(40 / 255, 80 / 255, 121 / 255);
  const C1 = vec3(26 / 255, 26 / 255, 26 / 255);
  const C2 = vec3(224 / 255, 165 / 255, 47 / 255);
  const C3 = vec3(176 / 255, 56 / 255, 42 / 255);
  const rampColor = (h) =>
    mix(mix(C0, C1, smoothstep(0.0, 0.45, h)),
        mix(C2, C3, smoothstep(0.72, 1.0, h)),
        smoothstep(0.45, 0.85, h));

  // ---- per-particle static layout (curve position + birth phase), in buffers
  const positionBuffer = instancedArray(COUNT, 'vec3'); // xyz screen-space target
  const heightBuffer = instancedArray(COUNT, 'float');  // 0..1 along the curve (drives colour/size)
  const birthBuffer = instancedArray(COUNT, 'float');   // 0..1 phase at which it blooms in

  // exponential curve height fn h(x) = (e^{Kx}-1)/(e^K-1)
  const curveH = (x) => exp(x.mul(K)).sub(1.0).div(exp(float(K)).sub(1.0));

  const computeInit = Fn(() => {
    const i = instanceIndex;
    const rx = hash(i);                       // x along the curve [0,1]
    const jitterY = hash(i.add(1013)).sub(0.5).mul(0.03);
    const jitterX = hash(i.add(2027)).sub(0.5).mul(0.012);
    const h = curveH(rx);
    // map curve (x∈[0,1], h∈[0,1]) into the camera box with margins
    const px = rx.mul(aspect * 0.82).sub(aspect * 0.41).add(jitterX);
    const py = h.mul(0.74).sub(0.36).add(jitterY);
    positionBuffer.element(i).assign(vec3(px, py, 0));
    heightBuffer.element(i).assign(h);
    // particles higher up the curve are born later (the curve "draws" upward)
    birthBuffer.element(i).assign(rx.mul(0.82).add(hash(i.add(7)).mul(0.05)));
  })().compute(COUNT);
  await renderer.computeAsync(computeInit);

  // ---- cycle phase uniform (0..1 across the whole loop) drives bloom/hold/fade
  const uPhase = uniform(0.0);

  // grow until 0.62, hold to 0.82, fade to 1.0 — closed cycle
  const lifeAt = Fn(([birth]) => {
    const grow = smoothstep(birth, birth.add(0.06), uPhase);     // bloom in around birth
    const fade = float(1.0).sub(smoothstep(0.82, 1.0, uPhase));  // fade the whole field out
    return clamp(grow.mul(fade), 0.0, 1.0);
  });

  // ---- sprite material: position from buffer, size+colour+alpha from height/life
  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
  material.blending = THREE.AdditiveBlending;
  material.positionNode = positionBuffer.toAttribute();

  const h = heightBuffer.toAttribute();
  const life = lifeAt(birthBuffer.toAttribute());
  // a tiny "pop" on bloom: scale overshoots then settles
  const pop = float(1.0).add(sin(clamp(life, 0.0, 1.0).mul(PI2.mul(0.5))).mul(0.25));
  material.scaleNode = float(0.004).add(h.mul(0.02)).mul(pop).mul(smoothstep(0.0, 0.2, life));
  material.colorNode = vec4(rampColor(h), clamp(life.mul(float(0.55).add(h.mul(0.4))), 0.0, 1.0));
  void vec3; void cos; // (kept available for tuning)

  const geometry = new THREE.PlaneGeometry(1, 1);
  const particles = new THREE.InstancedMesh(geometry, material, COUNT);
  particles.frustumCulled = false;
  scene.add(particles);

  return {
    async render(frameIndex) {
      const t = (frameIndex % totalFrames) / totalFrames; // closed loop
      uPhase.value = t;
      await renderer.renderAsync(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
