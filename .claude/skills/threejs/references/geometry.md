# Geometry — BufferGeometry, built-ins, instancing, particles

**Use when** creating shapes, building custom geometry from vertex data, drawing
many copies efficiently, or making point clouds / particle systems.

**ALWAYS**
- Use `InstancedMesh` for many identical meshes (one draw call, per-instance
  matrices/colors). Set `instanceMatrix.needsUpdate = true` after edits.
- Mark dynamic attributes: `attr.setUsage(THREE.DynamicDrawUsage)` and set
  `attr.needsUpdate = true` after writing.
- Prefer **indexed** geometry to share vertices; call `computeVertexNormals()`
  after building positions if you need lighting.
- `dispose()` geometries you replace.

**NEVER**
- Rebuild a geometry every frame to animate vertices — mutate a
  `BufferAttribute` in place and flag `needsUpdate`.
- Forget `geometry.computeBoundingSphere()` after large position changes
  (raycasting/culling rely on it).

## Core API
- Built-ins: `Box`, `Sphere`, `Plane`, `Cylinder`, `Cone`, `Torus`,
  `Circle`, `Ring`, `Tube`, `Extrude`, `Lathe`, `Icosahedron`, … (`*Geometry`).
- `BufferGeometry`: `setAttribute('position', new THREE.BufferAttribute(Float32Array, 3))`,
  `setIndex([...])`, `setDrawRange`, `computeVertexNormals`, `computeBoundingSphere`.
- `InstancedMesh(geometry, material, count)`: `setMatrixAt(i, m)`,
  `setColorAt(i, c)`, `instanceMatrix`, `instanceColor`.
- `Points(geometry, PointsMaterial)` for particles; positions in a `position` attribute.

## Pattern — InstancedMesh
```javascript
const mesh = new THREE.InstancedMesh(geo, mat, N);
const m = new THREE.Matrix4();
for (let i = 0; i < N; i++) { m.setPosition(x(i), y(i), z(i)); mesh.setMatrixAt(i, m); }
mesh.instanceMatrix.needsUpdate = true;
```

## Gotchas
- Tens of thousands of particles: prefer `Points` or `InstancedMesh`, and for GPU
  simulation move the per-particle update into a compute pass (`webgpu-tsl.md`).
- Non-indexed geometry duplicates vertices (flat shading); indexed shares them.

## Docs
https://threejs.org/docs/#api/en/core/BufferGeometry ·
https://threejs.org/docs/#api/en/objects/InstancedMesh
