# Attribution — the `threejs` skill

The single `threejs` skill here is a **synthesis**: written for this repo by
de-duplicating and reconciling three MIT-licensed community skill collections,
then checking them against the official Three.js documentation. The raw upstream
skills are **not** vendored — only this consolidated skill is kept, for lower
complexity and consistent coverage.

## Sources

1. **CloudAI-X/threejs-skills** — https://github.com/CloudAI-X/threejs-skills
   MIT (stated in the repo README). 10 flat topic skills.
2. **Impertio-Studio/Three.js-Claude-Skill-Package** —
   https://github.com/Impertio-Studio/Three.js-Claude-Skill-Package
   MIT, Copyright (c) 2026 OpenAEC Foundation. 24 structured skills with
   ALWAYS/NEVER guidance and `references/` (the source for the WebGPU/TSL and
   physics material here).
3. **secondsky/claude-skills** (`plugins/threejs`) —
   https://github.com/secondsky/claude-skills
   MIT, Copyright (c) 2025 Claude Skills Maintainers. A single consolidated
   `threejs` skill whose "one SKILL.md + topic references" structure this
   synthesis follows.

## Official documentation reconciled against

- Three.js docs — https://threejs.org/docs/
- Three.js manual — https://threejs.org/manual/
- Three.js examples — https://threejs.org/examples/ (incl. `webgpu_compute_particles*`, `physics_ammo_break`)

## License

All three sources are MIT. This derived skill is provided under the same MIT
terms; retain this attribution if redistributing.

```
MIT License

Copyright (c) 2026 OpenAEC Foundation (Impertio-Studio/Three.js-Claude-Skill-Package)
Copyright (c) 2025 Claude Skills Maintainers (secondsky/claude-skills)
Copyright (c) CloudAI-X/threejs-skills authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
