# Loaders — GLTF/GLB, Draco, KTX2, HDR, FBX/OBJ

**Use when** loading 3D models, compressed meshes/textures, HDR environments, or
managing load progress and caching.

**ALWAYS**
- Prefer **glTF/GLB**. Configure `DRACOLoader` (mesh compression) and
  `KTX2Loader` (GPU texture compression) decoder paths before loading.
- Use `await loader.loadAsync(url)` (or the callback form) and handle the error
  callback — network/parse failures are common.
- Share a `LoadingManager` across loaders for unified progress/`onLoad`.
- `KTX2Loader` needs `.detectSupport(renderer)` before use.

**NEVER**
- Ship a Draco/KTX2 GLB without the matching decoder path (silent failure / throw).
- Re-instantiate loaders per asset — reuse one configured loader.
- Forget to dispose a model's geometries/materials/textures when removing it.

## Core API
- `GLTFLoader` (+ `DRACOLoader`, `KTX2Loader`, `MeshoptDecoder`),
  `RGBELoader`/`EXRLoader` (HDR → env), `TextureLoader`, `FBXLoader`,
  `OBJLoader` + `MTLLoader`, `LoadingManager`, `GLTFExporter`.
- glTF result: `{ scene, scenes, animations, cameras }` — add `gltf.scene`;
  feed `gltf.animations` to an `AnimationMixer` (see `animation.md`).

## Pattern — GLTF with Draco + KTX2
```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const draco = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const ktx2 = new KTX2Loader().setTranscoderPath('https://unpkg.com/three/examples/jsm/libs/basis/').detectSupport(renderer);
const loader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2);
const gltf = await loader.loadAsync('/model.glb');
scene.add(gltf.scene);
```

## Pattern — HDR environment
```javascript
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
const hdr = await new RGBELoader().loadAsync('/env.hdr');
const env = new THREE.PMREMGenerator(renderer).fromEquirectangular(hdr).texture;
scene.environment = env; hdr.dispose();
```

## Gotchas
- Decoder paths must be reachable (host them or pin a CDN). KTX2 transcoder is
  separate from Draco.
- Large IFC/BIM is a separate ecosystem (`web-ifc`); not covered here.

## Docs
https://threejs.org/docs/#examples/en/loaders/GLTFLoader ·
https://threejs.org/manual/#en/load-gltf
