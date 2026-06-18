# Physics — rigid bodies, collisions, breaking

**Use when** adding rigid-body simulation, collisions, constraints, or fracturing
to a Three.js scene. Three.js has **no built-in physics**; pair it with an engine
and sync transforms each frame.

**Engine choice**
- **Rapier** (`@dimforge/rapier3d`, WASM) — fast, modern, deterministic; good default.
- **cannon-es** — pure JS, simple API, fine for light scenes.
- **Ammo.js** (Bullet, WASM) — heavyweight; needed for `ConvexObjectBreaker`
  fracturing (this repo's beaker break, per `examples/physics_ammo_break`).

**ALWAYS**
- Step the world on a **fixed timestep**: `world.step()` / `stepSimulation(dt, n)`
  with constant `dt`; accumulate leftover time for variable frame rates.
- Copy body transforms → mesh each frame (`mesh.position.copy(...)`,
  `mesh.quaternion.copy(...)`).
- Match collider shape to the visual roughly (box/sphere/convex hull/trimesh).
- Convert vector types at the boundary (engine `Vec3` ↔ `THREE.Vector3`).

**NEVER**
- Use a trimesh collider for a dynamic body (use convex hulls; trimesh = static only).
- Forget `world.step()` — nothing moves.
- Drive physics from a variable `dt` if you need reproducibility — fix the step.

## Pattern — Rapier sync
```javascript
import RAPIER from '@dimforge/rapier3d';
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0));
world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5), body);
function frame(dt) {
  world.timestep = dt; world.step();
  const t = body.translation(), r = body.rotation();
  mesh.position.set(t.x, t.y, t.z); mesh.quaternion.set(r.x, r.y, r.z, r.w);
}
```

## Pattern — Ammo convex break (fracturing)
- Load Ammo (`three/addons/libs/ammo.wasm.js`), build a
  `btDiscreteDynamicsWorld`, add the object as a breakable convex body, and on a
  large impact impulse call `ConvexObjectBreaker.subdivideByImpact()` and re-add
  the fragments as new bodies. Step with a constant `dt` for deterministic
  offline capture. See `three/examples/physics_ammo_break`.

## Gotchas
- WASM engines need async init before first step.
- Determinism varies by engine/build; Rapier and a fixed step are the most
  reproducible. For offline renders, seed initial conditions and fix `dt`.

## Docs
Rapier https://rapier.rs/docs/user_guides/javascript/getting_started_js ·
cannon-es https://pmndrs.github.io/cannon-es/ ·
Ammo break example https://threejs.org/examples/#physics_ammo_break
