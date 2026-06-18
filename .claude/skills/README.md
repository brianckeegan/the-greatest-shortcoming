# Project skills

## `threejs`

One consolidated Three.js skill for Claude Code — `threejs/SKILL.md` plus topic
files under `threejs/references/`. It gives Claude API-accurate Three.js
knowledge, directly supporting the offline render pipeline in
[`render/`](../../render/README.md) (`three/webgpu` + TSL compute, Ammo physics).

It is a **synthesis** of three MIT-licensed community collections reconciled with
the official Three.js docs — see [`ATTRIBUTION.md`](ATTRIBUTION.md). Earlier this
directory briefly vendored all 34 raw upstream skills; those were replaced by this
single skill for lower complexity and consistent coverage.

### Structure

```
threejs/
  SKILL.md                       # overview, quick starts, "when to load references", cross-cutting rules
  references/
    fundamentals.md              # scene, camera, renderer, loop, transforms, resize, disposal
    geometry.md                  # BufferGeometry, built-ins, InstancedMesh, particles
    materials-textures.md        # PBR materials, texture maps, color space
    lighting-shadows.md          # light types, IBL/PMREM, shadows + artifacts
    loaders.md                   # GLTF/Draco/KTX2/HDR, FBX/OBJ, LoadingManager
    animation.md                 # AnimationMixer, clips, crossfade, procedural
    controls-interaction.md      # camera controls + raycasting/picking
    shaders.md                   # GLSL ShaderMaterial, uniforms, onBeforeCompile
    postprocessing.md            # EffectComposer, bloom, SSAO, DOF, AA
    webgpu-tsl.md                # WebGPURenderer, node materials, TSL, compute shaders
    physics.md                   # cannon-es / Rapier / Ammo (incl. ConvexObjectBreaker)
    performance-debugging.md     # FPS/memory/draw calls + black-screen/color/z-fight fixes
```

Every reference follows the same shape — **Use when · ALWAYS · NEVER · Core API ·
Pattern · Gotchas · Docs** — so guidance stays consistent across topics.

### Most relevant to this repo
`webgpu-tsl.md`, `physics.md`, `geometry.md` (instancing), `performance-debugging.md`.
