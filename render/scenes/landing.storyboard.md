# Landing storyboard — *bottle → bacteria → Bartlett*

The source-of-truth creative + technical spec for `render/scenes/landing.js`. The
landing background is a **single vanilla three.js `WebGPURenderer` scene** (TSL
compute particles + an Ammo beaker break) — **no CSS3D / `CSS3DRenderer`**, one
canvas, captured via `canvas.toBlob`. Keep narration, timing, and visual
direction **here**; the scene module implements it.

Not hyperrealistic — **stylized midcentury / Bauhaus-textbook**, matching the
site: ink void, cream light, alarm-red bacteria, brass-gold accents. A 1960s
science-film diagram that quietly turns ominous.

Palette tokens (from `assets/css/src/main.css`): ink `#111`, cream `#e9e2d0`,
red `#b0382a` (176,56,42), gold `#e0a52f` (224,165,47), blue `#285079`.

---

## 1. Verified arithmetic (the anchor numbers — do not re-derive)

The clock is grounded in real *E. coli*, so "full" lands at **11:50, not noon**:

- One *E. coli* ≈ **1 μm³** (rod, cylinder πr²h with r=0.5 μm, h=2 μm → 1.57;
  canonical ~1).
- **10¹⁵ cells per liter** (1 μm³ = 10⁻¹⁸ m³; 1 L = 10⁻³ m³).
- Start **1 cell at 11:00**, doubling every minute → the liter fills at **~11:50**
  (2⁵⁰ ≈ 1.13×10¹⁵).
- **Macro mapping** — the render draws *macro-particles*, not real cells. Seed
  **1 macro at 11:40**, double each minute:

  | clock | 11:40 | 11:45 | 11:46 | 11:49 | **11:50** | 11:51 | 11:52 | 11:53 | **11:54** |
  |---|---|---|---|---|---|---|---|---|---|
  | macro count | 1 | 32 | 64 | 512 | **1024** | 2048 | 4096 | 8192 | **16384** |
  | beaker | 0.1% | 3% | 6% | 50% | **full** | 2× | 4× | 8× | **16× (screen)** |

  So 1 macro ≈ 1.1×10¹² real cells, constant throughout. `COUNT = 16384 = 2¹⁴`
  (the hedcut resolution); "full" = `COUNT/16 = 1024`. The micro view
  (11:00–11:35, literal 1→8 cells) and the macro fluid (11:40→) are different
  scales; the **zoom-out at 11:35 hides the rebaseline**.

---

## 2. Timeline contract (must match the code + the page)

The scene renders one pass, indexed by frame; `t = frameIndex / totalFrames` ∈
[0,1]. The encoded video is **all-intra** and **scroll-scrubbed**:
`assets/js/landing.js` maps scroll → `video.currentTime`.

| timeline `t` | scroll region | act |
|---|---|---|
| `0.00 – 0.70` | Act 1 (`#act1`) | micro intro → macro fill → spill → break |
| `0.70 – 1.00` | Act 2 (`#act2`) | hedcut morph + hold |

`paramsForPhase(t)` in `landing.js` is the single mapping `t → {clock, active,
over, shatter, morph}`. The beats below are written in the same `t` so the scene,
the scrub mapping, and the page (`.pstep` text, `#clock`, `#pct`) stay in
lockstep.

**Pacing:** the `t → clock` map is deliberately **non-linear** — give the *late*
doublings (11:47→11:50) more frames than the early ones so growth reads "slow,
then all at once."

---

## 3. Beat sheet

Eight on-screen text beats (streamlined from Bartlett's lecture), each with its
3D action, camera, and transition. Text lives in `_layouts/landing.html`.

| beat | `t` | clock | active | on-screen text | 3D action |
|---|---|---|---|---|---|
| **A** | 0.00–0.06 | 11:00 | — | **Picture an empty bottle.** | glass beaker fades up from the ink void, centred, faint cream ground shadow, fresnel rim-light. Empty. |
| **B** | 0.06–0.10 | 11:00 | 1 | **Drop in one bacterium.** | one **red rod** drops from the rim, settles on the floor with a soft glow + tiny bounce. `#pct` hidden. Camera zoomed in. |
| **C** | 0.10–0.18 | 11:01–03 | 2→8 | **It divides once a minute. One becomes two.** · **Two become four. Four become eight.** | binary division along a seeded axis; daughters nudge apart. Hero rods, legible. |
| — | 0.18–0.24 | 11:35 | — | *(silent — the emptiness is the point)* | **zoom out** to the whole beaker; it looks empty. |
| — | 0.24–0.30 | 11:40 | 1 (macro) | — | macro seed appears at the floor (rebaseline); material crosses from lit rods → soft round sprites. |
| **D** | 0.30–0.40 | 11:45 | 32 | **Forty-five minutes in — still three percent full.** | fluid solver active; a thin glowing film dusts the floor; vast empty headroom above. |
| **E** | 0.40–0.46 | 11:46 | 64 | **If you were one of them, when would you feel crowded?** | the field roils gently; still mostly empty. False calm. |
| **F** | 0.46–0.52 | 11:49 | 512 | **Half full. One minute to go.** | the **late doublings race** — surface climbs fast, pressure building on the walls. Camera pushes in, tilts up. |
| **G** | 0.52–0.56 | 11:50 | 1024 | **Full.** | mass meets the rim; a held breath; light shifts warmer/redder; `#pct` 100%. Camera stops. |
| — | 0.56–0.62 | 11:51 | 2048 | *(visual payoff)* | **overflow + shatter** — fluid crests the lip and pours down the outside; the **beaker shatters** (Ammo `ConvexObjectBreaker`); the wall constraint drops. |
| — | 0.62–0.70 | 11:52–54 | 4096→16384 | — | the swarm **erupts to fill the frame** (4×→8×→16× volume); camera begins settling to portrait; **freeze** at 16384. |
| — | 0.70–0.90 | — | 16384 | — | **morph** — every particle lerps to its target sampled from the **Bartlett portrait** stipple (`buildTargets()`), red → ink-black; the brass exponential-growth detail emerges in gold. Camera settles straight-on portrait. |
| — | 0.90–1.00 | — | 16384 | epigraph fades in | hedcut **fully forms** and holds with a faint breathing jitter. Act 2's quote (already in `_layouts/landing.html`): *"…our inability to understand the exponential function." — Albert Bartlett, 1972.* |

---

## 4. Simulation model (the priority — `activeCount` doubling + spill)

- **Fixed buffer, variable active set.** Pre-allocate `instancedArray(COUNT,'vec3')`
  (positions + velocities), `COUNT = 16384`. Every compute kernel early-outs:
  `If(float(i).greaterThanEqual(uActive), () => Return())`. Inactive slots park
  offscreen and cost ~nothing.
- **`uActive = clamp(2^(clock − 11:40), 1, COUNT)`** — driven from `t`; the
  timeline owns the doubling clock. Full (rim) at `COUNT/16 = 1024`.
- **Division = activation at the parent.** On a minute tick, activate slot
  `i + active` at `position[i] + hash(i)·ε` (small deterministic offset). The
  solver's incompressibility shoves daughters apart → "divide, then pack" with no
  per-agent logic.
- **Fill level is emergent.** Constant per-particle rest volume ⇒ occupied volume
  = `active·v` ⇒ surface height tracks the count automatically (fill % =
  `active/1024`). Never keyframe the level.
- **Containment = analytic cylinder** (centre `cx`, half-width `R`, floor `bot`,
  rim `top`) in the integration kernel: project/reflect + damp particles crossing
  the wall, **only below the rim**. Past 1024 particles the column exceeds the rim
  and unconstrained particles **spill over the lip under gravity** — overflow is
  emergent, not animated.
- **Shatter at 11:51 (`t≈0.58`) is choreographed, not coupled.** On that frame:
  (1) trigger Ammo `ConvexObjectBreaker` on the glass mesh (visual only), and
  (2) drop the wall constraint so fluid pours out. **No two-way fluid↔rigid
  coupling.** Both fire on a fixed frame → deterministic.

### Render / material (vanilla WebGPU, deliberately simple)
- **Billboards via `SpriteNodeMaterial`**, `positionNode = positions.toAttribute()`,
  size via `.scaleNode`.
- **Soft round dot** = radial-falloff alpha in TSL (`smoothstep` on
  `uv().sub(0.5).length()` → `.opacityNode`) — no texture asset.
- **Blend follows density:** `AdditiveBlending` + `depthWrite=false` while sparse
  (glow); crossfade to **normal alpha** as `active/1024 → 1` so the packed fluid
  doesn't blow out to white.
- **Hero cells legible:** 1→8 (zoomed) render as red `0xb0382a` lit rods;
  `mix()` toward round soft sprites as the field scales — same material, no swap.
- **Camera scripted + deterministic:** zoom in to the seed cell (11:00), hold,
  zoom out to the whole beaker (11:35), gentle orbital parallax through the macro
  phase; settle to portrait for the morph. A subtle TSL sine "wave" shimmer in the
  setup fades out as the solver takes over (~11:45): orderly → chaotic.

---

## 5. Composition per aspect (distinct, not crops)

- **Desktop 1920×1080:** beaker centred; spill spreads horizontally; the hedcut
  fills ~90% of frame height, centred.
- **Mobile 1080×1920:** taller, narrower beaker in the **lower third** (rising
  fill has vertical room and clears the brandbar); the portrait fills the vertical
  frame. Match the 860px breakpoint intent (`transform:scale(.74)`, flask low).

---

## 6. Technical guardrails (the scene must honour)

- **Contract:** `default async ({THREE,TSL,renderer,width,height,aspect,totalFrames,prng}) → { render(i), dispose() }`; frames requested in order; render is a **pure function of `t`**.
- **Determinism:** fixed `dt = 1/30`; CPU randomness via `prng`
  (`render/harness/prng.js`); GPU randomness via `hash(instanceIndex)`; no
  wall-clock, no input.
- **Budget:** `COUNT = 16384`. Density knob: scale `COUNT` by a **power of two**
  (e.g. 65536) to pack denser — "full" stays `COUNT/16`, so the doubling math is
  unchanged. Keep scrub frame count modest (~150–240) — all-intra is heavy.
- **Assets:** portrait at `assets/img/bartlett.webp` (`.jpg` fallback).
- **Ammo:** behind `ENABLE_AMMO`; per `examples/physics_ammo_break`; deterministic
  at fixed timestep.
- **References (follow the upstream API verbatim — do not invent nodes):**
  `webgpu_compute_particles`, `webgpu_compute_particles_fluid`,
  `physics_ammo_break`, `webgl_points_dynamic`.

---

## 7. Hand-off to the page (`_layouts/landing.html` / `assets/js/landing.js`)

When this spec is shipped to the site implementation:

- **`_layouts/landing.html`:** replace the 15 `.pstep` blocks with the **8 beats**
  in §3 (A, B, C×2, D, E, F, G); swap `<canvas id="bcanvas">` → a scroll-scrubbed
  `<video>` (poster + `prefers-reduced-motion` still).
- **`assets/js/landing.js`:** **strip** the old 2D-canvas sim + hedcut stipple;
  **keep** the scroll engine, the `#clock`, the `#pct` readout, the progress bar,
  and Act-3 text. Re-time the keyframes to **11:00→11:50**. `#pct` reads
  `active/1024`.
- **Scroll↔video** via **`scrolly-video`** (dkaoster/ScrollyVideo.js) — it handles
  the cross-browser seek-on-scroll quirks (Safari/iOS) by decoding frames to a
  canvas rather than naive `video.currentTime`. **Drive it manually** with
  `setVideoPercentage(p)` from the existing Act 1/Act 2 scroll mapping (do **not**
  use its auto `trackScroll`: only the `#act1`+`#act2` span maps to the video
  `t 0→0.70→1.0`; Act 3 is separate page content). Pairs with the **all-intra**
  encode (every frame a keyframe → exact, instant seeks). On
  `prefers-reduced-motion`, don't init ScrollyVideo — show the `poster`.

---

## 8. Generating / extending the scene from this storyboard

How to turn this script into (or refine) `render/scenes/landing.js` with an LLM,
reliably — the sandbox can't run WebGPU, so the loop is render-on-GPU → screenshot
→ vision-check:

1. **One source of truth, two artefacts.** This storyboard (creative + timing) →
   the scene module (code). Never let timing drift; cite beat letters in code
   comments.
2. **Pin the API surface in the prompt.** Give the model the pinned `three`
   version (`package.json`), the exact reference examples (§6), and the node names
   (`instancedArray`, `instanceIndex`, `Fn().compute()`, `hash`,
   `SpriteNodeMaterial`, `storage`, `If`). Instruct: *follow the upstream example
   API verbatim; do not invent nodes.*
3. **Hand it the contract + invariants** from §4/§6, the palette tokens, and asset
   paths. State it runs **headless/offline** and must be deterministic.
4. **Decompose by beat, implement one at a time** (A…G) with an **acceptance
   criterion** ("at `t=0.34` the floor is lightly dusted, beaker reads ~3%").
5. **Close the loop with rendered frames.** `node render/harness/capture.mjs
   --scene=landing` for a few `t`, screenshot, feed the image back: *"Does this
   match beat D? what's off?"* Iterate.
6. **Verify determinism + scrub seams** before committing: render twice → frames
   identical; check the `0.70` Act1→Act2 handoff and morph endpoint are smooth
   (no pop) — the video is scrubbed both directions.

### Reusable prompt skeleton

```
Role: three.js r0.171 WebGPU TSL author. Output ONE scene module.
Contract: default async ({THREE,TSL,renderer,width,height,aspect,totalFrames,prng})
          → { render(frameIndex), dispose() }. Pure function of t=frameIndex/totalFrames.
Invariants: deterministic (fixed dt=1/30; prng + hash(instanceIndex); no input/clock);
            headless offline; COUNT=16384 macro-particles, full=1024 (2^(clock-11:40));
            palette {ink#111, red#b0382a, gold#e0a52f}; portrait assets/img/bartlett.webp.
Reference (follow API verbatim, don't invent nodes): <paste the 4 example URLs>.
Task: implement BEAT <X> only — <paste its §3 row>.
Acceptance: <one concrete, checkable statement about the frame at a given t>.
Return: the module diff for landing.js implementing this beat, plus t-values to screenshot.
```
</content>
</invoke>
