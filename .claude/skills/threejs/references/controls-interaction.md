# Controls & interaction — camera controls + raycasting

**Use when** adding camera navigation (orbit/pan/zoom/fly/first-person) or
mouse/touch picking, hover, selection, and line-of-sight checks.

**ALWAYS**
- Call `controls.update()` in the loop when `enableDamping` (or autoRotate) is on.
- `dispose()` controls on teardown (they bind DOM listeners).
- Raycast from normalized device coords: `raycaster.setFromCamera(ndc, camera)`,
  where `ndc.x = (e.clientX/innerWidth)*2-1`, `ndc.y = -(e.clientY/innerHeight)*2+1`.
- Throttle picking — raycast on click or rAF, not on every `mousemove`.

**NEVER**
- Combine two camera controllers on the same camera.
- Raycast the whole scene every frame; restrict with `layers` or a candidate list,
  and pass `recursive` correctly.

## Core API
- Controls (`three/addons/controls/*`): `OrbitControls`, `MapControls`,
  `TrackballControls`, `FlyControls`, `FirstPersonControls`,
  `PointerLockControls`, `TransformControls`, `ArcballControls`. Common:
  `.enableDamping`, `.dampingFactor`, `.target`, `.minDistance/.maxDistance`,
  `.update()`, `.dispose()`.
- `Raycaster`: `.setFromCamera`, `.intersectObject(s)(obj, recursive)`,
  `.params`, `.layers`, `.near/.far`. Hit = `{ distance, point, face, object,
  instanceId, uv }` sorted nearest-first.

## Pattern — pick on click
```javascript
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
renderer.domElement.addEventListener('click', (e) => {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(scene.children, true)[0];
  if (hit) select(hit.object, hit.instanceId);   // instanceId set for InstancedMesh
});
```

## Gotchas
- `OrbitControls` with `enableDamping` requires `update()` every frame.
- `InstancedMesh` picking returns `instanceId`; map it back to your data.
- For offline/headless renders there is no input — controls aren't used; set the
  camera explicitly.

## Docs
https://threejs.org/docs/#examples/en/controls/OrbitControls ·
https://threejs.org/docs/#api/en/core/Raycaster
