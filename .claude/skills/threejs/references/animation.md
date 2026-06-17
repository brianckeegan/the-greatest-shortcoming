# Animation — mixer, clips, crossfade, procedural

**Use when** playing GLTF/skeletal animations, blending between states, or
driving procedural/keyframe motion.

**ALWAYS**
- Create one `AnimationMixer` per animated root and call
  `mixer.update(delta)` **every frame** with `clock.getDelta()`.
- Drive time-based motion from delta, not per-frame constants (frame-rate
  independence) — except deterministic offline renders, which use a fixed `dt`.
- Crossfade with `action.crossFadeTo(next, duration, warp)` (or
  `prepareCrossFade`), and `next.play()` before fading.

**NEVER**
- Forget `mixer.update()` — animations simply won't move.
- Share one `AnimationAction` across mixers; actions belong to their mixer.
- Mutate a clip's tracks at runtime expecting a live update — rebuild the action.

## Core API
- `AnimationMixer(root)`, `mixer.clipAction(clip)` → `AnimationAction`
  (`.play`, `.stop`, `.fadeIn/Out`, `.crossFadeTo`, `.setLoop(LoopOnce|Repeat)`,
  `.clampWhenFinished`, `.timeScale`, `.weight`).
- `AnimationClip`, `KeyframeTrack` (`VectorKeyframeTrack`, `QuaternionKeyframeTrack`…),
  `AnimationUtils`, `Clock`.

## Pattern — play + crossfade GLTF clips
```javascript
const mixer = new THREE.AnimationMixer(gltf.scene);
const idle = mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, 'Idle'));
const run  = mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, 'Run'));
idle.play();
function toRun() { run.reset().play(); idle.crossFadeTo(run, 0.3, false); }
// loop:
renderer.setAnimationLoop(() => { mixer.update(clock.getDelta()); renderer.render(scene, camera); });
```

## Pattern — procedural / camera tween
- Simple: lerp/slerp toward a target each frame. Complex sequencing: a tween lib
  (e.g. GSAP) or your own eased keyframes. For a scrubbable timeline, map a
  normalized `t` → poses (this repo scrubs a pre-rendered video instead).

## Gotchas
- Morph targets need `mesh.morphTargetInfluences`; the mixer animates them via
  `NumberKeyframeTrack`.
- `clampWhenFinished + LoopOnce` holds the last frame instead of snapping back.

## Docs
https://threejs.org/docs/#api/en/animation/AnimationMixer ·
https://threejs.org/manual/#en/animation
