# Fundamentals — scene, camera, renderer, loop, transforms

**Use when** setting up a scene, choosing/aligning a camera, configuring the
WebGL renderer, writing the render loop, transforming objects, or handling
resize/disposal.

**ALWAYS**
- Cap pixel ratio: `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- Call `camera.updateProjectionMatrix()` after changing `aspect`/`fov`/`near`/`far`.
- Drive the loop with `renderer.setAnimationLoop(cb)`.
- Use a `THREE.Clock` (`getDelta()`) for time-based motion, not frame counts.

**NEVER**
- Set `near` to 0 or an extreme `near:far` ratio → z-fighting. Keep the ratio
  modest (e.g. `0.1 … 1000`, not `0.001 … 1e6`).
- Reparent with `add()` if you want to preserve world transform — use `attach()`.
- Allocate `Vector3`/matrices per frame in hot paths; reuse temporaries.

## Core API
- `Scene`, `PerspectiveCamera(fov, aspect, near, far)`, `OrthographicCamera(l,r,t,b,near,far)`.
- `WebGLRenderer({ antialias, alpha })`; `.setSize(w,h,updateStyle=true)`,
  `.setPixelRatio`, `.outputColorSpace = SRGBColorSpace` (default),
  `.toneMapping = ACESFilmicToneMapping`, `.setAnimationLoop`, `.render(scene,camera)`.
- `Object3D`: `.position`, `.rotation` (Euler), `.quaternion`, `.scale`,
  `.add/.remove/.attach`, `.traverse`, `.matrixAutoUpdate`,
  `.getWorldPosition(target)`, `.lookAt`.

## Pattern — resize
```javascript
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
```

## Pattern — math (reuse temporaries)
```javascript
const _v = new THREE.Vector3();                 // module scope
function update() { _v.set(0, 1, 0).applyQuaternion(obj.quaternion); /* … */ }
```
- Euler rotation order matters (`'XYZ'` default); for chained rotations prefer
  quaternions (`slerp`) to avoid gimbal lock. Angles in radians (`MathUtils.degToRad`).

## Gotchas
- Nothing visible? Usually no light (Standard/Physical need lights or an
  environment), camera inside/behind the object, or `near/far` clipping. See
  `performance-debugging.md`.
- For offline/deterministic rendering, advance by a constant `dt` instead of
  `clock.getDelta()`.

## Docs
https://threejs.org/docs/#api/en/core/Object3D ·
https://threejs.org/manual/#en/fundamentals
