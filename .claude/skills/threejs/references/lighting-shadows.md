# Lighting & shadows

**Use when** lighting a scene, setting up image-based lighting, or fixing dark
scenes / shadow acne / peter-panning / missing shadows.

**ALWAYS**
- Combine a soft fill (`AmbientLight` or `HemisphereLight`) with one key
  `DirectionalLight`; add an environment map for PBR realism.
- For shadows: `renderer.shadowMap.enabled = true`; set `light.castShadow`,
  mesh `.castShadow`/`.receiveShadow`, and **tighten the shadow camera frustum**
  to the scene bounds (sharper maps).
- Tune `light.shadow.bias` (small negative, e.g. `-0.0005`) and
  `shadow.normalBias` to kill acne without peter-panning.
- Generate a PMREM environment from an HDR for reflections.

**NEVER**
- Use many shadow-casting lights (each is a full extra render). Prefer one.
- Use a giant `shadow.camera` frustum — resolution is wasted, edges get blocky.
- Expect `PointLight` shadows to be cheap (6 faces).

## Core API
- Lights: `AmbientLight`, `HemisphereLight`, `DirectionalLight`, `PointLight`,
  `SpotLight`, `RectAreaLight` (needs `RectAreaLightUniformsLib`). Intensity is
  physically based since r155 (watts-ish); expect larger numbers than legacy.
- Shadows: `light.shadow.mapSize.set(2048,2048)`, `light.shadow.camera` (an
  ortho cam for directional), `.bias`, `.normalBias`, `renderer.shadowMap.type =
  PCFSoftShadowMap`.
- IBL: `PMREMGenerator.fromEquirectangular(hdrTexture)` → `scene.environment`.

## Pattern — directional key + shadows
```javascript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(5, 8, 4); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 30 });
key.shadow.bias = -0.0005;
scene.add(key, new THREE.HemisphereLight(0xbfd4ff, 0x202020, 0.4));
```

## Gotchas
- Debug shadow frustum with `new THREE.CameraHelper(light.shadow.camera)`.
- Scene too dark after upgrading Three → intensities changed with physical
  lighting; raise them or add an environment.

## Docs
https://threejs.org/docs/#api/en/lights/DirectionalLight ·
https://threejs.org/manual/#en/shadows
