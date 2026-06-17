# Landing storyboard — *bottle → bacteria → Bartlett*

The source-of-truth creative + technical spec for `render/scenes/landing.js`. Now
that the landing background is a real 3D WebGPU scene (not abstract circles in a
2D beaker), this is the shot-by-shot script it renders. Keep narration, timing,
and visual direction **here**; the scene module implements it.

Not hyperrealistic — **stylized midcentury / Bauhaus-textbook**, matching the
site: ink void, cream light, alarm-red bacteria, brass-gold accents. Think a
1960s science-film diagram that quietly turns ominous.

---

## 1. Timeline contract (must match the code + the page)

The scene renders one pass, indexed by frame; `phase t = frameIndex / totalFrames`
∈ [0,1]. The encoded video is **all-intra** and **scroll-scrubbed**:
`assets/js/landing.js` maps scroll → `window.__scrubTarget` → `video.currentTime`.

| timeline `t` | scroll region | act |
|---|---|---|
| `0.00 – 0.70` | Act 1 (`#act1`) | fill + spill + break |
| `0.70 – 1.00` | Act 2 (`#act2`) | hedcut morph + hold |

This is the contract `paramsForPhase(t)` in `landing.js` already encodes
(`fill 0–0.55`, `over 0.55–0.70`, `morph 0.70–1.0`). The storyboard beats below
are written in the same `t` so the scene, the scrub mapping, and the narration
beats (`.pstep` text, the digital `#clock`, the `#pct` readout) stay in lockstep.

Palette tokens (from `assets/css/src/main.css`): ink `#111`, cream `#e9e2d0`,
red `#b0382a` (176,56,42), gold `#e0a52f` (224,165,47), blue `#285079`.

---

## 2. Beat sheet

Each beat: the narration it underscores (already in `_layouts/landing.html`), the
3D action, camera, material/light, and the transition out.

### A — "Picture a bottle." · `t 0.00–0.06` · 11:00
- **3D:** a single stylized **glass beaker** fades up out of the ink void, dead
  centre on a faint cream ground-plane shadow. Empty. Thin rim-light traces the
  silhouette (the Bauhaus "U" from the old 2D version, now a translucent solid).
- **Camera:** establishing, slightly low; almost still, a slow 2% push.
- **Material/light:** matte-frosted glass — fake refraction (a dim env tint + a
  fresnel rim), no raytracing. One key light upper-left, cool fill.
- **Out:** hold; the void stays empty so emptiness reads.

### B — "…drop in a single bacterium." · `t 0.06–0.12` · 11:00
- **3D:** one **red capsule** (rod bacterium) drops from the rim and settles on
  the floor, with a soft glow and a tiny bounce. `#pct` hidden (a lone cell isn't
  "1% full").
- **Camera:** small push toward the floor of the beaker.
- **Out:** the cell pulses once — about to divide.

### C — "one becomes two → two become four …" → "11:55, three percent" · `t 0.12–0.45`
- **3D:** **binary division** — each cell splits into two along a random axis
  (seeded), the pair nudging apart, falling, packing under gravity. The count
  doubles but the **fill line barely rises** for most of this stretch — the whole
  deception of the thought experiment. By 11:55 the floor is dusted, ~3%.
- **Camera:** held **wide** — the visible emptiness is the point.
- **Material/light:** bacteria read as a glowing red granular mass; subtle
  additive bloom in the crowd.
- **Out:** a beat of false calm at ~3%.

### D — "11:56 6% · 11:57 12% · 11:58 quarter · 11:59 half" · `t 0.45–0.55`
- **3D:** the **late doublings race** — the surface climbs fast and roils;
  pressure visibly building against the glass walls.
- **Camera:** push in ~8%, tilt up slightly to follow the rising line.
- **Out:** the surface reaches just under the rim.

### E — "Noon. The bottle is full." · `t 0.55–0.58` · 12:00
- **3D:** the mass meets the rim; a **held breath**. Light shifts warmer/redder;
  the watch flips to 12:00; `#pct` reads 100%.
- **Camera:** stop. A micro-hold.
- **Out:** the first cells crest the lip.

### F — "12:01 spills out · 12:02 doubles again" · `t 0.58–0.66`
- **3D:** **overflow** — bacteria pour over the rim and cascade down the outside,
  fluid-like (optionally the MPM fluid pass from `webgpu_compute_particles_fluid`),
  outward radial push + gravity. The vessel can no longer contain the curve.
- **Camera:** ease back to reveal the spill spreading past the beaker's base.
- **Out:** pressure peaks.

### G — "the circles fill the screen · one last doubling, and they keep coming" · `t 0.66–0.70` · 12:03–12:04
- **3D:** **the beaker shatters** under exponential pressure — Ammo
  `ConvexObjectBreaker` fractures the glass; shards fly; the swarm **erupts to
  fill the frame**. (Scaffolded behind `ENABLE_AMMO`; until then, a shader-only
  eruption stands in.)
- **Camera:** a restrained shake, then begins settling to portrait framing.
- **Out:** the screen is full of red — the bridge into the morph.

### H — morph: swarm → hedcut · `t 0.70–0.90`
- **3D:** the erupted cloud **decelerates, freezes, and migrates**: every
  particle lerps to its target sampled from the **Bartlett portrait** stipple
  (`assets/img/bartlett.webp`, `buildTargets()`), red → ink-black. The brass
  **exponential-growth trophy** detail emerges in gold in the lower foreground.
- **Camera:** settles to a straight-on **portrait** frame, centred.
- **Out:** the face resolves.

### I — resolve + quote · `t 0.90–1.00`
- **3D:** the **hedcut fully forms** and holds with a faint breathing jitter.
- **Page:** Act 2's epigraph fades in over it — *"The greatest shortcoming of the
  human race is our inability to understand the exponential function." — Albert
  Bartlett, 1972* (already in `_layouts/landing.html`).
- **Out:** hold on the portrait into the rest of the page.

---

## 3. Composition per aspect (distinct, not crops)

- **Desktop 1920×1080:** beaker centred; spill spreads horizontally; the hedcut
  fills ~90% of frame height, centred.
- **Mobile 1080×1920:** taller, narrower beaker placed in the **lower third** (so
  the rising fill has vertical room and clears the brandbar); the portrait fills
  the vertical frame. Match the old 860px breakpoint intent (`transform:scale(.74)`,
  flask dropped low).

---

## 4. Technical guardrails (the scene must honour)

- **Contract:** `default async ({THREE,TSL,renderer,width,height,aspect,totalFrames,prng}) → { render(i), dispose() }`; frames requested in order; render is a **pure function of `t`**.
- **Determinism:** fixed `dt = 1/30`; CPU randomness via `prng` (`render/harness/prng.js`); GPU randomness via `hash(instanceIndex)`; no wall-clock, no input.
- **Budget:** ~50k particles (`COUNT` in `landing.js`); tune for the spill density vs. encode size. Keep scrub frame count modest (~150–240) — all-intra is heavy.
- **Assets:** portrait at `assets/img/bartlett.webp` (`.jpg` fallback).
- **Ammo:** behind `ENABLE_AMMO`; per `examples/physics_ammo_break`; deterministic at fixed timestep.

---

## 5. Generating / extending the scene from this storyboard (scaffolding + prompting)

How to turn this script into (or refine) `render/scenes/landing.js` with an LLM,
reliably:

1. **One source of truth, two artefacts.** This storyboard (creative + timing) →
   the scene module (code). Never let timing drift between them; cite beat letters
   in code comments.
2. **Pin the API surface in the prompt.** three.js TSL/WebGPU drifts between
   versions. Always give the model: the pinned `three` version (`package.json`),
   the **exact** reference examples
   (`webgpu_compute_particles`, `webgpu_compute_particles_fluid`,
   `physics_ammo_break`, `webgl_points_dynamic`), and the node names to use
   (`instancedArray`, `instanceIndex`, `Fn().compute()`, `hash`, `SpriteNodeMaterial`,
   `storage`, `If`). Instruct: *follow the upstream example API verbatim; do not
   invent nodes.*
3. **Hand it the contract + invariants** from §4 as hard constraints, plus the
   palette tokens and asset paths. State that it runs **headless/offline** and
   must be deterministic.
4. **Decompose by beat, implement one at a time.** Prompt per beat (A…I) with its
   §2 row as the spec and an **acceptance criterion** ("at `t=0.40` the floor is
   lightly dusted and the beaker still reads near-empty"). Smaller scope → far
   higher hit rate than "write the whole scene."
5. **Close the loop with rendered frames.** After each beat: `node
   render/harness/capture.mjs --scene=landing` for a few `t` values, screenshot,
   and feed the image back to a vision model: *"Does this match beat D? what's
   off?"* Iterate. This is the only real validator — the sandbox can't run WebGPU.
6. **Verify determinism + scrub seams** before committing: render twice → frames
   identical; check the `0.70` Act1→Act2 handoff and the morph endpoint are smooth
   (no pop), since the video is scrubbed both directions.

### Reusable prompt skeleton

```
Role: three.js r0.171 WebGPU TSL author. Output ONE scene module.
Contract: default async ({THREE,TSL,renderer,width,height,aspect,totalFrames,prng})
          → { render(frameIndex), dispose() }. Pure function of t=frameIndex/totalFrames.
Invariants: deterministic (fixed dt=1/30; prng + hash(instanceIndex); no input/clock);
            runs headless offline; ~50k particles; palette {ink#111, red#b0382a, gold#e0a52f};
            portrait assets/img/bartlett.webp.
Reference (follow API verbatim, don't invent nodes): <paste the 4 example URLs>.
Task: implement BEAT <X> only — <paste the §2 row>.
Acceptance: <one concrete, checkable statement about the frame at a given t>.
Return: the module diff for landing.js implementing this beat, plus the t-values to screenshot.
```
