# Performance & debugging

**Use when** a scene is slow (low FPS, leaking memory, too many draw calls) or
renders wrong (black screen, invisible objects, wrong colors, z-fighting, broken
shadows).

## Performance — ALWAYS / NEVER
**ALWAYS**
- `dispose()` geometries, materials, textures, render targets, and remove from
  the scene when discarding objects. GPU memory is not garbage-collected.
- Batch repeated meshes with `InstancedMesh` (or merge static geometry) to cut
  draw calls; cap `devicePixelRatio` at 2.
- Watch `renderer.info` (`memory.geometries/textures`, `render.calls/triangles`)
  and `Stats.js`; use LOD for distant complex meshes; compress textures (KTX2).
- Limit shadow-casting lights to one or two; tighten shadow frustums.

**NEVER**
- Allocate objects (vectors, materials, geometries) inside the render loop.
- Leave hundreds of separate draw calls when instancing/merging applies.
- Grow `renderer.info.memory.*` every frame — that's a disposal leak.

## Debugging — symptom → fix
| Symptom | Likely cause / fix |
|---|---|
| **Black screen / nothing visible** | No light (Standard/Physical need lights or `scene.environment`); camera inside/behind object; object outside `near/far`; canvas size 0. |
| **Washed-out / wrong colors** | Color texture missing `colorSpace = SRGBColorSpace`; missing `OutputPass`/tone mapping; data map tagged sRGB. |
| **Flicker / z-fighting** | `near:far` ratio too extreme — raise `near`, lower `far`; offset coplanar surfaces; use `polygonOffset`. |
| **Texture blurry/pixelated** | Low `anisotropy`; mipmaps disabled; wrong `min/magFilter`. |
| **Shadow acne / peter-panning** | Tune `shadow.bias` (small negative) + `normalBias`; tighten shadow camera; raise `mapSize`. |
| **Shadows absent** | `renderer.shadowMap.enabled`, light `.castShadow`, mesh `.castShadow/.receiveShadow` all required. |
| **Model invisible after load** | Not added (`scene.add(gltf.scene)`); scale/position off; backface culling (`material.side = DoubleSide`). |
| **WebGPU throws on first render** | `await renderer.init()` not awaited; or compute used without WebGPU support (no WebGL compute fallback). |

## Pattern — disposal helper
```javascript
function disposeObject(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose();
    const m = o.material; if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach((mat) => {
      for (const k in mat) { const v = mat[k]; if (v && v.isTexture) v.dispose(); }
      mat.dispose();
    });
  });
  obj.parent?.remove(obj);
}
```

## Docs
https://threejs.org/docs/#api/en/renderers/WebGLRenderer.info ·
https://threejs.org/manual/#en/cleanup ·
https://threejs.org/manual/#en/rendering-on-demand
