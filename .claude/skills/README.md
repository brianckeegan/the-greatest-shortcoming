# Three.js skills

34 project-level Three.js skills for Claude Code, incorporated from two
MIT-licensed collections (see `ATTRIBUTION.md`). They give Claude API-accurate
Three.js knowledge — directly useful for the offline render pipeline in
[`render/`](../../render/README.md), which authors `three/webgpu` + TSL compute
scenes and Ammo physics.

Each skill is a directory with a `SKILL.md` (loaded on demand via its frontmatter
`name`/`description`); the Impertio set also ships `references/` with
`anti-patterns.md`, `examples.md`, and `methods.md`.

## Most relevant to this repo's render pipeline

- `threejs-impl-webgpu` — WebGPU renderer / TSL (the render scenes use this)
- `threejs-impl-post-processing`, `threejs-postprocessing`
- `threejs-impl-physics` — physics engines (the landing beaker break uses Ammo)
- `threejs-impl-animation`, `threejs-animation` — animation loops, timing
- `threejs-syntax-geometries` / `threejs-geometry`, `threejs-syntax-materials` / `threejs-materials`
- `threejs-core-renderer`, `threejs-core-scene-graph`, `threejs-core-math`

## Inventory

**CloudAI-X/threejs-skills (10, flat):** `threejs-animation`,
`threejs-fundamentals`, `threejs-geometry`, `threejs-interaction`,
`threejs-lighting`, `threejs-loaders`, `threejs-materials`,
`threejs-postprocessing`, `threejs-shaders`, `threejs-textures`.

**Impertio-Studio/Three.js-Claude-Skill-Package (24, with `references/`):**
`threejs-agents-{model-optimizer,scene-builder}`,
`threejs-core-{math,raycaster,renderer,scene-graph}`,
`threejs-errors-{performance,rendering}`,
`threejs-impl-{animation,audio,drei,ifc-viewer,lighting,physics,post-processing,react-three-fiber,shadows,webgpu,xr}`,
`threejs-syntax-{controls,geometries,loaders,materials,shaders}`.

## Note on overlap

The two sources overlap by topic (e.g. `threejs-animation` vs
`threejs-impl-animation`; `threejs-shaders` vs `threejs-syntax-shaders`). They're
complementary: the CloudAI set leans toward quick-start API references; the
Impertio set is deeper, with deterministic ALWAYS/NEVER guidance plus
`references/` (anti-patterns, methods, worked examples). Both are kept; prefer the
Impertio variant when you need the reference material, the CloudAI variant for a
fast pattern.
