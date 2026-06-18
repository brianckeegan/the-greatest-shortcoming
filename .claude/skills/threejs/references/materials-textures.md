# Materials & textures — PBR, maps, color space

**Use when** choosing/configuring a material, loading textures, or fixing
washed-out / wrong-colored / blurry textures.

**ALWAYS**
- Set color space per map: albedo/`map`, `emissiveMap`, environment →
  `texture.colorSpace = SRGBColorSpace`; data maps (`normalMap`, `roughnessMap`,
  `metalnessMap`, `aoMap`, `displacementMap`) → `NoColorSpace` (linear).
- After changing a material's defines/flags (not uniforms), set
  `material.needsUpdate = true`.
- For PBR use `MeshStandardMaterial` (metalness/roughness) or
  `MeshPhysicalMaterial` (clearcoat, transmission, sheen, iridescence).
- Provide an environment map (`scene.environment`) so metals/roughness read right.

**NEVER**
- Use `MeshBasicMaterial` and expect lighting (it's unlit).
- Leave textures undisposed when swapping them.
- Set `transparent: true` without need — it disables depth-write ordering; prefer
  `alphaTest` for cutouts.

## Core API
- Materials: `MeshBasic`, `MeshLambert`, `MeshPhong`, `MeshStandard`,
  `MeshPhysical`, `MeshToon`, `MeshNormal`, `MeshDepth`, `Points`, `Line(Basic|Dashed)`,
  `Sprite`, `Shader`/`RawShader`. Common: `.color`, `.map`, `.transparent`,
  `.opacity`, `.side` (`FrontSide`/`BackSide`/`DoubleSide`), `.alphaTest`,
  `.depthTest/Write`, `.blending`.
- Texture maps: `map`, `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`
  (needs a 2nd UV set), `emissiveMap`, `displacementMap`, `alphaMap`, `envMap`.
- Texture settings: `.wrapS/.wrapT` (`RepeatWrapping`), `.repeat`, `.flipY`,
  `.anisotropy = renderer.capabilities.getMaxAnisotropy()`, `.minFilter`/`.magFilter`.

## Pattern — load a color texture correctly
```javascript
const tex = await new THREE.TextureLoader().loadAsync('albedo.jpg');
tex.colorSpace = THREE.SRGBColorSpace;
tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
```

## Gotchas
- Blurry/pixelated at angles → raise `anisotropy`; ensure mipmaps (power-of-two
  not required in modern Three, but `generateMipmaps` should stay on for minified textures).
- Black model under lights → likely missing environment for metalness, or a
  data map tagged as sRGB.
- WebGPU: use the `*NodeMaterial` equivalents (see `webgpu-tsl.md`).

## Docs
https://threejs.org/docs/#api/en/materials/MeshStandardMaterial ·
https://threejs.org/manual/#en/textures
