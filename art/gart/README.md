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

### Echo fragments (rounds two to five, all flagged)

Built on a four-armed hooked figure (`tgs/echo/`), turned 45° and cropped so the frame
never holds the whole emblem. The arms follow historical growth laws (`Law` in
`Fragments.kt`: exponential, logistic, hyperbolic, plus parabolic as a foil), and
stroke widths, sizes or colormaps scale geometrically.

| Piece | After gart | Growth law | Geometric scaling |
|---|---|---|---|
| `echo-a-swing-exponential` (**cover**) | lines, circledots/gentle | exponential bundle width | per-line weight ×2 per class at ½ odds; opacity ×0.78; keylined |
| `echo-c-bubbles-exponential` | bubbles (Bubbles2, BubbleStripe) | exponential bubble size, small at the tips → ×100+ at the centre | colour per radius doubling; nested holes |
| `echo-g-four-laws-flowforce` | flowforce/flowforce3 + bubble chamber | swirls and dotted tracks curving by exp / hyperbolic / parabolic / logistic laws | width ×2 per class at ½ odds; dot size ×1.6 |

In `echo-g` the cross is never drawn: it is a soft-edged void that no mark enters.

### Cover

`cover-a-swing` recomposes echo A for a 6×9 in portrait cover: 1875 × 2775 px, which is
300 dpi with a 0.125 in bleed on every side, full bleed and no border. The crossing sits
low and right, and the title goes in the dark field upper-left. `cover/cover-mock.cjs`
sets a type mock over it in the site's faces with Playwright:

```bash
./gradlew render -Ppiece=cover
node cover/cover-mock.cjs renders/cover-a-swing.png renders/cover-a-swing-mock.png
# set PW_CHROMIUM=/path/to/chromium if Playwright's own browser isn't installed
```

To try other framings, pass `-Pframe=ax,ay,zoom`. This puts the crossing at (ax·W, ay·H).

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
