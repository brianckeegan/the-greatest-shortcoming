# Attribution — bundled Three.js skills

The Three.js skills under `.claude/skills/` are incorporated from two
third-party, MIT-licensed collections. Only the skill content (each
`SKILL.md` and its `references/`) was vendored; repository scaffolding (build
configs, roadmaps, research notes, CI, social previews, etc.) was not.

## Sources

1. **CloudAI-X/threejs-skills** — https://github.com/CloudAI-X/threejs-skills
   License: MIT (stated in the repository README; no `LICENSE` file present
   upstream). Provides 10 flat single-file skills (`threejs-animation`,
   `threejs-fundamentals`, `threejs-geometry`, `threejs-interaction`,
   `threejs-lighting`, `threejs-loaders`, `threejs-materials`,
   `threejs-postprocessing`, `threejs-shaders`, `threejs-textures`).

2. **Impertio-Studio/Three.js-Claude-Skill-Package** —
   https://github.com/Impertio-Studio/Three.js-Claude-Skill-Package
   License: MIT, Copyright (c) 2026 OpenAEC Foundation. Provides 24 structured
   skills (each with `references/{anti-patterns,examples,methods}.md`) under the
   `threejs-{agents,core,errors,impl,syntax}-*` naming scheme. Flattened here
   from the upstream `skills/source/<category>/<skill>/` layout into
   `.claude/skills/<skill>/` (the upstream `name:` already matches the leaf dir).

## License texts

Both collections are MIT licensed. The MIT terms below apply to the vendored
content; retain this notice if redistributing.

### CloudAI-X/threejs-skills (MIT)

> MIT License — per the upstream README. Feel free to use, modify, and
> distribute. Copyright belongs to the CloudAI-X/threejs-skills authors.

### Impertio-Studio/Three.js-Claude-Skill-Package (MIT)

```
MIT License

Copyright (c) 2026 OpenAEC Foundation

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
