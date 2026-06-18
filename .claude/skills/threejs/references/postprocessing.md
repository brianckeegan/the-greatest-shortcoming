# Post-processing — EffectComposer, passes, effects

**Use when** adding bloom, SSAO, depth of field, outlines, or anti-aliasing as
screen-space passes.

**ALWAYS**
- Start the chain with a `RenderPass(scene, camera)`; end by rendering to screen
  (the last pass has `renderToScreen = true` implicitly as the final pass).
- Resize the composer too: `composer.setSize(w, h)` and update pass resolutions
  (e.g. `bloomPass.resolution` / `setSize`) on window resize.
- Pick **one** stack: either Three's `EffectComposer` (`three/addons`) **or**
  `pmndrs/postprocessing` (`EffectComposer` + `EffectPass`) — not both.
- Replace the post-FXAA/SMAA pass for AA when MSAA isn't available through the composer.

**NEVER**
- Mix `three/addons` passes with `pmndrs/postprocessing` effects in one chain.
- Use the WebGL `EffectComposer` with **WebGPURenderer** — use the WebGPU
  `PostProcessing` class with TSL nodes (`webgpu-tsl.md`).
- Forget `RenderPass` first — otherwise later passes have nothing to read.

## Core API (three/addons)
- `EffectComposer(renderer)`, `RenderPass`, `ShaderPass`, `UnrealBloomPass`,
  `SSAOPass`, `BokehPass` (DOF), `OutlinePass`, `SMAAPass`, `FXAAShader` via
  `ShaderPass`, `OutputPass` (tone mapping + color space, add last).
- `composer.addPass(pass)`, `composer.render(delta)` (call instead of
  `renderer.render`), `composer.setSize`, `composer.setPixelRatio`.

## Pattern — bloom
```javascript
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.8, 0.4, 0.85));
composer.addPass(new OutputPass());
renderer.setAnimationLoop(() => composer.render());
```

## Gotchas
- Add `OutputPass` last so tone mapping/sRGB happen after effects (avoids washed
  colors).
- Bloom thresholds interact with HDR/tone mapping — tune `strength/radius/threshold`.

## Docs
https://threejs.org/docs/#manual/en/introduction/How-to-use-post-processing ·
https://threejs.org/examples/?q=postprocessing
