---
name: threejs
description: >
  Three.js 3D graphics — scene setup, geometry, materials, textures, lighting,
  shadows, loaders (GLTF/Draco/KTX2/HDR), animation, camera controls,
  interaction/raycasting, GLSL shaders, post-processing, the WebGPU renderer +
  TSL compute shaders, and physics. Use when building WebGL/WebGPU 3D scenes,
  writing TSL/GLSL, loading models, or debugging black screens / performance.
  Keywords: three.js, WebGLRenderer, WebGPURenderer, TSL, compute shader,
  BufferGeometry, InstancedMesh, MeshStandardMaterial, GLTFLoader, AnimationMixer,
  OrbitControls, Raycaster, EffectComposer, bloom, shadows, dispose, draw calls.
metadata:
  version: "1.0.0"
license: MIT
---

# Three.js

A single, consistent knowledge base for building 3D web experiences with
Three.js. Synthesized from three community skill collections plus the official
docs — see **Sources** at the bottom. Replaces a sprawling per-topic skill set
with one skill: read this file, then load one `references/*.md` for the task.

**Target version:** Three.js **r160+** (ESM: `import * as THREE from 'three'`,
addons from `'three/addons/*'`, the WebGPU build from `'three/webgpu'` + TSL from
`'three/tsl'`). Pin your version — TSL/WebGPU APIs still move between releases.

## How to use this skill

Each `references/*.md` follows the same shape — **Use when · ALWAYS · NEVER ·
Core API · Pattern · Gotchas · Docs** — so guidance is consistent across topics.
Load the one(s) that match the task:

| Task | Reference |
|---|---|
| Scene, camera, renderer, render loop, transforms, resize, disposal | `references/fundamentals.md` |
| Shapes, `BufferGeometry`, custom geometry, instancing, particles | `references/geometry.md` |
| Materials (PBR), texture maps, color space | `references/materials-textures.md` |
| Lights, IBL/environment maps, shadows + artifacts | `references/lighting-shadows.md` |
| Loading GLTF/GLB/FBX/OBJ, Draco/KTX2, HDR, `LoadingManager` | `references/loaders.md` |
| Keyframe/skeletal animation, `AnimationMixer`, crossfade | `references/animation.md` |
| Camera controls (Orbit/Map/Fly/…) + raycasting/picking | `references/controls-interaction.md` |
| Custom GLSL `ShaderMaterial`, uniforms, `onBeforeCompile` | `references/shaders.md` |
| `EffectComposer`, bloom, SSAO, DOF, AA, custom passes | `references/postprocessing.md` |
| WebGPURenderer, node materials, **TSL**, **compute shaders**, fallback | `references/webgpu-tsl.md` |
| Rigid-body physics, collisions, breaking (cannon-es/Rapier/Ammo) | `references/physics.md` |
| Low FPS, memory leaks, draw calls, black screen, wrong colors | `references/performance-debugging.md` |

> **This repo:** the offline background-animation pipeline in
> [`render/`](../../render/README.md) authors `three/webgpu` + TSL compute scenes
> and an Ammo beaker-break, rendered deterministically to video. The most
> relevant references here are `webgpu-tsl.md`, `physics.md`, `geometry.md`
> (instancing), and `performance-debugging.md`.

## Quick start — WebGL scene

```javascript
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); // cap DPR — never raw
renderer.outputColorSpace = THREE.SRGBColorSpace;       // default; keep it
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 5;

const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xb0382a }),
);
scene.add(mesh, new THREE.AmbientLight(0xffffff, 0.6),
  Object.assign(new THREE.DirectionalLight(0xffffff, 2), { position: { x: 3, y: 5, z: 2 } }));

renderer.setAnimationLoop(() => { mesh.rotation.y += 0.01; renderer.render(scene, camera); });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
```

## Quick start — WebGPU + TSL (see `references/webgpu-tsl.md`)

```javascript
import * as THREE from 'three/webgpu';
import { Fn, instancedArray, instanceIndex, vec3 } from 'three/tsl';

const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();                 // MUST await before first render
// node materials from 'three/webgpu'; TSL compute via Fn(...).compute(count);
// renderer.computeAsync(kernel) then renderer.renderAsync(scene, camera).
```

## Cross-cutting rules (apply everywhere)

- **ALWAYS** `dispose()` geometries, materials, textures, render targets, and
  controls you create and discard — Three.js does not GC GPU resources for you.
- **ALWAYS** cap pixel ratio (`Math.min(devicePixelRatio, 2)`).
- **ALWAYS** use `renderer.setAnimationLoop(cb)` (required for WebGPU/WebXR;
  fine for WebGL) rather than bare `requestAnimationFrame`.
- **ALWAYS** keep textures' color space correct: color/albedo + environment =
  `SRGBColorSpace`; data maps (normal/roughness/metalness/AO) = `NoColorSpace`.
- **NEVER** allocate objects (vectors, materials, geometries) inside the render
  loop — reuse module-scope temporaries.
- **For deterministic offline renders** (this repo): drive a **fixed timestep**,
  seed all randomness, take no input, and make each frame a pure function of the
  frame index. See `render/README.md`.

## Sources

Synthesized and de-duplicated from these MIT-licensed collections (full
provenance + license notices in [`../ATTRIBUTION.md`](../ATTRIBUTION.md)), then
reconciled against the official documentation:

- CloudAI-X/threejs-skills — https://github.com/CloudAI-X/threejs-skills
- Impertio-Studio/Three.js-Claude-Skill-Package — https://github.com/Impertio-Studio/Three.js-Claude-Skill-Package
- secondsky/claude-skills (`plugins/threejs`) — https://github.com/secondsky/claude-skills
- **Official Three.js docs** — https://threejs.org/docs/ · manual https://threejs.org/manual/ · examples https://threejs.org/examples/
