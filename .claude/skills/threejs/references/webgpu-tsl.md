# WebGPU renderer + TSL + compute shaders

**Use when** using `WebGPURenderer`, node materials, **TSL** (Three Shading
Language), or **GPU compute** (particle sims, GPGPU). This is the most relevant
reference for this repo's `render/` pipeline.

> **EXPERIMENTAL** — TSL/WebGPU APIs move between Three.js releases. **Pin the
> version** and follow the matching `examples/webgpu_*` verbatim.

**ALWAYS**
- Import the WebGPU build + node materials from `'three/webgpu'` and TSL from
  `'three/tsl'`.
- `await renderer.init()` before the first render/compute.
- Use `renderer.setAnimationLoop(cb)` (online) and
  `await renderer.computeAsync(kernel)` / `await renderer.renderAsync(scene, cam)`.
- Check support online: `WebGPU.isAvailable()`; provide a `WebGLRenderer`
  fallback for **rendering** (note: **compute has no WebGL fallback**).

**NEVER**
- Write raw GLSL/WGSL strings — author shaders in **TSL** (compiled to WGSL).
- Use `ShaderMaterial` — use a `*NodeMaterial` with TSL node inputs.
- Use `requestAnimationFrame`, `EffectComposer`, or expect compute to
  software-rasterize on a GPU-less CI runner (this repo renders on a real GPU).

## Core API
- `WebGPURenderer({ antialias })`, `.init()`, `.computeAsync`, `.renderAsync`.
- Node materials: `MeshStandardNodeMaterial`, `MeshBasicNodeMaterial`,
  `SpriteNodeMaterial`, `PointsNodeMaterial`, … inputs: `.colorNode` (vec4),
  `.positionNode` (vec3), `.emissiveNode`, `.scaleNode`, `.opacityNode`,
  `.fragmentNode`, `.outputNode`.
- TSL: `Fn`, `instancedArray(count,'vec3')`, `instanceIndex`, `uniform`, `hash`,
  `storage`, `If`, vec/mat constructors + ops (`.add/.mul/.assign/.addAssign`),
  `mix`, `smoothstep`, `clamp`, `sin/cos/exp`; build a kernel with
  `Fn(() => { … })().compute(count)`.
- WebGPU post: the `PostProcessing` class with TSL passes (not `EffectComposer`).

## Pattern — GPGPU particles (ping-free storage buffers)
```javascript
import * as THREE from 'three/webgpu';
import { Fn, instancedArray, instanceIndex, hash, vec3, uniform } from 'three/tsl';

const COUNT = 100000;
const positions = instancedArray(COUNT, 'vec3');
const velocities = instancedArray(COUNT, 'vec3');

const init = Fn(() => {
  const p = positions.element(instanceIndex);
  p.assign(vec3(hash(instanceIndex).sub(0.5), 0, hash(instanceIndex.add(1)).sub(0.5)));
})().compute(COUNT);
await renderer.computeAsync(init);

const uDt = uniform(1 / 30);
const update = Fn(() => {
  const p = positions.element(instanceIndex);
  const v = velocities.element(instanceIndex);
  v.addAssign(vec3(0, -0.98, 0).mul(uDt));   // gravity
  p.addAssign(v.mul(uDt));
})().compute(COUNT);

const mat = new THREE.SpriteNodeMaterial();
mat.positionNode = positions.toAttribute();
const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.01, 0.01), mat, COUNT);
mesh.frustumCulled = false; scene.add(mesh);

// per frame: await renderer.computeAsync(update); await renderer.renderAsync(scene, camera);
```

## Determinism (offline render — this repo)
- Fixed `dt` uniform; seed CPU randomness; GPU randomness via `hash(instanceIndex)`
  (deterministic per index). Request frames in order so compute can step
  incrementally. Each frame must be a pure function of the frame index.

## Gotchas
- Classic materials auto-convert under WebGPURenderer, but only `*NodeMaterial`
  exposes TSL inputs.
- Headless/offline needs a real GPU; on macOS use Metal-backed WebGPU.

## Docs
https://threejs.org/docs/#api/en/renderers/webgpu/WebGPURenderer ·
TSL guide https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language ·
examples https://threejs.org/examples/?q=webgpu
