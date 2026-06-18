# `render/` — offline background-animation pipeline

High-fidelity background animations for the site are **simulated and rendered
offline on a GPU machine**, encoded to responsive looping/scrubbable video, and
the resulting files committed under [`assets/video/`](../assets/video). The
visitor's browser only ever plays lightweight video — no live physics. The
Jekyll/GitHub-Pages deploy is unchanged and just serves the committed assets.

## Quickstart (for dummies)

You render the animation **once on a computer with a GPU** (a Mac is ideal), the
video files get **committed to the repo**, and the website's normal build just
serves them. CI never renders. You only repeat this when the animation changes.

```bash
# 0. one-time tools: Node 22, Google Chrome, and ffmpeg
#    (macOS: brew install ffmpeg | Linux: sudo apt install ffmpeg)

# 1. get the code + the working branch
git clone <repo-url> && cd the-greatest-shortcoming
git checkout claude/webgl-animation-generation-v8gt66

# 2. install JS tools (first time, and after package.json changes)
npm install

# 3. render on the GPU, then encode to video → assets/video/
npm run render:all

# 4. (optional) preview the real site
npm run build:css && bundle exec jekyll serve     # http://localhost:4000

# 5. ship it back: commit ONLY the generated videos, then push
git add assets/video/
git commit -m "Render background videos"
git push                                          # the PR updates automatically
```

Merging the PR to `master` deploys the videos with the normal Pages build — **you
never touch CI**. Re-render only when something in `render/` changes; the build
writes `assets/video/.render-hash`, and if it differs from your current `render/`
the committed videos are stale. (If step 3 says *no WebGPU adapter*, you're on a
machine without a usable GPU — render on the Mac. If it says *ffmpeg: command not
found*, do step 0.)

## Why local, not CI

The scenes use **three.js `WebGPURenderer` compute shaders** (+ Ammo.js for the
beaker break). three.js WebGPU **compute** does not software-rasterise on a
GPU-less GitHub Actions runner the way WebGL does — it would need `xvfb` + Mesa
`lavapipe` (slow, flaky), and `WebGPURenderer` compute nodes have **no WebGL
fallback**. On a machine with a real GPU (e.g. macOS Metal) the exact scene code
runs natively and fast, so we render there and commit the output.

## Requirements

- Node 20+ and a machine **with a GPU**.
- `npm install` (installs `three` and `playwright`).
- `npx playwright install chromium` (one-time).
- `ffmpeg` on `PATH` (`brew install ffmpeg` / `apt install ffmpeg`).

## Render

```bash
npm run render        # capture PNG frames → render/.frames/<scene>/<rendition>/
npm run encode        # ffmpeg → assets/video/*.{mp4,webm,jpg} + .render-hash
npm run render:all    # both of the above
```

Useful flags:

```bash
node render/harness/capture.mjs --scene=titlecard      # one scene
node render/harness/capture.mjs --only=mobile          # one rendition
node render/encode.mjs --scene=landing                 # re-encode one scene
```

Then **commit** the changed files in `assets/video/` (plain git — no Git LFS).

## Layout

```
render/
  scenes/      titlecard.js   exponential-growth compute-particle loop (home)
               landing.js     bacteria fill → spill → (Ammo break) → hedcut morph
  harness/     host.html      importmap host page; exposes window.__renderFrame(i)
               capture.mjs    Playwright + static server; screenshots each frame
               prng.js        deterministic seeded RNG (CPU side)
  encode.mjs   ffmpeg encode (titlecard: looping GOP; landing: all-intra for scrubbing)
```

## Determinism

Each frame is a pure function of its index: fixed timestep (`dt = 1/30`), seeded
PRNG (`prng.js`) CPU-side, and `hash(instanceIndex)` GPU-side. Re-rendering the
same scene on the same GPU/driver reproduces the frames; `assets/video/.render-hash`
records a hash of `render/**` + the three.js version so stale assets are detectable.

## Renditions

| scene     | desktop     | mobile      | encoding                       |
|-----------|-------------|-------------|--------------------------------|
| titlecard | 1920×1080   | 1080×1920   | looping (closed cycle)         |
| landing   | 1920×1080   | 1080×1920   | all-intra (scroll-scrubbable)  |

## Status / TODO (validate + tune on a GPU machine)

The scenes are faithful adaptations of the upstream three.js examples but were
authored in a GPU-less sandbox and **need a local pass to validate and tune**:

- `titlecard.js` — confirm TSL `SpriteNodeMaterial` wiring; tune count, colour
  ramp, bloom/hold/fade timing for a seamless loop.
- `landing.js` — tune the fill/spill parameters and the hedcut morph; add
  inter-particle repulsion if the packing reads too sparse; portrait at
  `assets/img/bartlett.webp`.
- `landing.js` Ammo beaker-break is scaffolded behind `ENABLE_AMMO = false` —
  finish per `examples/physics_ammo_break` and enable once validated.

Until `assets/video/*` exists, the site falls back to the poster image / a solid
background (see the `<video poster>` wiring in the layouts), so nothing breaks.
