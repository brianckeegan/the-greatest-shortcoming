# art/gart — generative studies

Square art studies for the chapter plates, the home-page title card and the cover,
made with [gart](https://github.com/igr/gart) (Kotlin + Skia, BSD-2-Clause). Every
piece uses **four-way symmetry** and a reading of **exponential growth**, in
mid-century palettes anchored on red / white / black.

| Piece | After gart gallery | Growth reads as | Symmetry |
|---|---|---|---|
| `inscribed` | retro | countable (area ×2 per ring) | mirror, 8-way |
| `colony` | pixelmania | countable (Eden-model generations; last = half) | mirror, 8-way |
| `twelve-oclock` | sf | mathematical (exponential envelope, √2 rings) | mirror, 8-way |
| `undamped` | harmongraph | mathematical (amplitude e^+gt) | mirror, 4-way |
| `meander` | lines | countable (fret hook ×2) | mirror, 8-way |
| `partition` | rects | countable (quadtree ×4, size halves per 130 px) | mirror, 8-way |
| `ugunskrusts-field` | flowforce | felt (speed and weight grow with radius) | **rotation, 4-way: flagged deliberate echo** |

### Echo fragments (rounds two and three, all flagged)

Crops of a four-armed hooked figure (`tgs/echo/`), turned 45° and off-centre so the
frame never holds a clean isolated emblem. The arms follow one of three growth laws
(`Law` in `Fragments.kt`), and stroke widths, grids or colormaps scale geometrically.

| Piece | After gart | Growth law | Geometric scaling |
|---|---|---|---|
| `echo-a-swing-exponential` | lines, circledots/gentle | exponential bundle width | stroke ×1.02 per line |
| `echo-c-halftone-logistic` | retro | logistic dot radius | grid pitch ×1.5 per radius doubling; colour per area doubling |
| `echo-d-whirl-logistic` | retro | three logistic twists | sizes ×1.07–1.11; three stroke profiles |
| `echo-f-flip-hyperbolic` | retro, bubbles/holes, cell/rugae | hyperbolic front + Ising agreement on C4 orbits | disc size ×2^−¼ per disagreeing neighbour; colour by log₂ age |
| `echo-g-three-laws-flowforce` | flowforce/flowforce3 | all three, dealt by sector | per-trail turn grows by law |

`previews/` holds committed 1200 px JPEGs. The 2048 px masters in `renders/` are
gitignored: every piece is seeded and deterministic, so they rebuild exactly.

## Build

Needs JDK 21. gart isn't on Maven, so `setup.sh` clones it at a pinned commit into
`vendor/` (gitignored) and Gradle builds it as a composite build.

```bash
cd art/gart
./setup.sh                          # once: fetch gart @ 8cd8548
./gradlew render                    # all pieces → renders/*.png (headless)
./gradlew render -Ppiece=colony     # just one (prefix match: -Ppiece=echo renders the series)
```

## Symmetry rule

`Symmetry.kt` keeps the two kinds of four-way symmetry apart on purpose. Mirror
symmetry (`mirror4`, `mirror8`) has no spin. Rotation (`rotate4`) turns one way,
and a four-armed figure under rotation drifts toward a hooked cross, which is loaded
for a book about *Lebensraum*. Only pieces flagged as a **deliberate echo** may use
`rotate4`, and they must let the shape emerge from the growth rather than state it as
an emblem: no red field, no white disc, and no isolated 45° hooked cross.

## Roadmap

Port the chosen title-card piece to vanilla canvas JS (the site has no JS build step),
so it can animate the way the landing page's dots do.
