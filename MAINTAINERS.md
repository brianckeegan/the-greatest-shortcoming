# MAINTAINERS.md — operations guide for The Greatest Shortcoming site

This site is a Jekyll project for *The Greatest Shortcoming* (Brian C. Keegan).
Read this file before making changes. It is the contract between past
maintainers and you. The most important rules are at the top; operational
recipes for common tasks are in the middle; design rationale and the
where-to-edit map are at the end.

The repo presents the book through **one unified scrollytelling design**.
The React app shell drives the homepage and every chapter page identically.
Static pages share matching chrome (rendered as plain HTML) so the visual
idiom is end-to-end.

| Path | What it is | Layout | JS? |
|------|------------|--------|-----|
| `/` | Book-summary scrollytelling — hero, QC \| 6 era buttons \| EFI navbar, register def-bars, scrolly figure + book-summary prose, coda (Book / Author / News / Resources). | `scrolly` (mounts React) | Yes |
| `/chapters/<slug>/` (preface + 8 chapters) | Chapter abstract above the stepper, chapter excerpt below. The stepper pins the chapter's mapped era and lets readers jump cross-chapter. All chapters are treated identically. | `scrolly` (mounts React; chapter intro/outro captured via Liquid in `_layouts/scrolly.html`) | Yes |
| `/about/`, `/contents/`, `/bibliography/`, `/news/`, `/draft-status/` | Static pages. Same `.top-header` chrome as React surface, rendered as plain HTML. | `default` → `page` | Bibliography filter + dark-mode toggle only. |

The React app reads its content from per-page Jekyll data: the homepage
prose comes from `_data/prose/home.yml`, every chapter's stepper config
from `_data/scrolly/<slug>.yml` (chapters inherit their step set from
`home` via `steps_inherit`). The bridge is `window.PAGE_CONTEXT`, emitted
by `_includes/page-context.html`.

The shared design language is a contract; do not break it.

## Ground rules

1. **Do not break the React scrollytelling shell.** It drives every chapter
   page and the homepage. Driven by
   `_data/{eras,people,orgs,instruments,themes,documents,news}.yml`,
   `_data/prose/*.yml`, `_data/scrolly/*.yml`, and
   `assets/js/{app,scrolly-network,tweaks-panel}.jsx`. Preserve it.
2. **The preface and chapter excerpts are a contract.** Only the preface and
   curated 200–400 word excerpts may appear as body text on the site. Never
   publish more chapter prose than that, even if the manuscript is right
   there in `/tmp/tgs/tgs/Chapters/`. This is a publishing-rights guardrail.
3. **Manuscript files are read-only input.** They live at
   `/tmp/tgs/tgs/Chapters/ch00.tex` … `ch08.tex` (extracted from
   `~/Downloads/tgs.zip`). Never modify them. Treat as upstream truth.
4. **Single accent color.** It is `--tufte-red` (`#c83c3c` light,
   `#d96058` dark). Defined in `assets/css/scrolly.css`. Do not introduce a
   second accent.
5. **GitHub Pages compatibility.** The Pages Action workflow at
   `.github/workflows/github-pages.yml` builds with `jekyll-build-pages`. No
   plugin outside the [Pages allowlist](https://pages.github.com/versions/).
   Currently in use: `jekyll-seo-tag`, `jekyll-sitemap`. Both allowlisted.
6. **No new JS framework.** Vanilla JS only on the landing site. The
   bibliography filter and the dark-mode toggle are the upper bound.

## Design rationale

The site is for a serious academic book about how quantitative authority gets
abused. The visual treatment has to read as serious without reading as
pompous, and it has to share an idiom across two very different surfaces (a
restrained landing site and a scrollytelling reading). The choices below
serve that brief; understand them before changing them.

### Why this typographic system

- **Serif body, italic display headings.** All headings (`h1`, `h2`, `h3`)
  are italic et-book / EB Garamond. This is a Tufte-influenced move: the
  italic display face reads as confident-without-shouting, and italic h1
  works well at clamp(2.4rem, 6vw, 4.6rem) without competing with the body.
  A sans-serif heading face would have made the site read as an academic
  blog template, which is exactly what we are not.
- **et-book first, EB Garamond fallback.** et-book (Edward Tufte's web
  release) is the primary face — old-style figures, generous italic, made
  for long-form prose. EB Garamond is the Google Fonts fallback because
  et-book is hosted on a third-party domain and may fail.
- **JetBrains Mono for kickers and metadata only.** Monospace is reserved
  for `.kicker` overlines (the small uppercase labels above sections),
  status badges, and chapter numbers. It signals "this is metadata, not
  prose." Do not use it for body text.
- **Body at 19px / 1.6 (17px on mobile).** This sits inside the 18–19px
  comfort range with line-height tuned for serif text. Do not drop below
  17px; serifs lose legibility.
- **Measure 60–72ch.** Chapter pages use 60ch (narrower for sustained
  reading), TOC and home use 72ch (wider for scannable lists). The book is
  built around prose, not infographic-style layouts.

### Why one accent color, and why this one

The accent (`--tufte-red` = `#c83c3c`) is a muted brick red, not a vivid
fire engine red. It's used for: links on hover, kickers inside `.register`
blocks, the status badge for "Drafted" chapters, the left rule on
`.epigraphs` and `.chapter__reading-link`, and the dark-mode toggle's
hover/focus state.

Why one accent and not two:

- The book is about how false simplicity gets weaponized — adding a second
  accent introduces a visual choice the reader has to interpret. Restraint
  is part of the argument the design is making.
- Two accents tend to fight each other. With one accent and a generous
  amount of `--ink-soft` for secondary content, the page has clear
  hierarchy without theming work.

Why brick red and not ink blue: scrolly.css already used brick red. The
landing site harmonizes rather than introducing a new identity.

### Why one stylesheet, one design across all pages

The original repo had two surfaces with separate stylesheets — a static
landing site and a React scrollytelling reading. After a redesign pass
(see PR history), the homepage and every chapter page were promoted to
the React shell so the book reads as one project, not two templates.

The current invariant: `scrolly.css` is the design ground truth and is
loaded by every page (React-mounted or static). `main.css` adds layout
patterns used by both surfaces (chapter content styles, action cards,
TOC). Tokens defined in `scrolly.css` propagate everywhere — edit
`--tufte-red` once and the homepage, every chapter page, and /about/ all
update.

### Why no animation, no parallax, no reveal-on-load

The scrollytelling on the homepage (and any future chapter readings) is the
one place animation belongs — the network SVG re-arranges as the reader
scrolls. Static pages are dignified-and-still. No fade-in, no parallax, no
intersection-observer reveal. The only motion is a 0.12s color/border
transition on hover, which is functional feedback, not decoration.

### Why no images on the home page

The book argues that quantitative authority gets used to foreclose political
deliberation. The most honest way to introduce it is words: the title, the
three Bartlett epigraphs, and the "what this book argues" paragraph. An
image (other than supplied cover art) would frame the book as something
about images, which it is not.

### Why dark mode is opt-in via toggle, not strictly automatic

Dark mode reads as a courtesy — "you can read this in low light" — rather
than an aesthetic statement. The pre-paint script reads
`prefers-color-scheme` on first visit so a reader on a dark-themed OS
doesn't get a flash of warm white, but once they explicitly toggle, their
choice persists. This matches how readers actually want to control reading
environments (per their preference, not their OS's).

The dark palette is intentionally **warm dark** (`#1c1a17`), not flat black
(`#000`). Black is harsher than ink-on-paper inverted. Warm dark preserves
the manuscript-like feel.

### Why every chapter is treated identically

Every chapter renders through the same React shell with the same chrome.
The stepper pins the chapter's mapped era (`_data/scrolly/<slug>.yml`'s
`highlight_era`) and the era buttons let readers jump cross-chapter; the
chapter abstract sits above the stepper, the excerpt below. There is no
"deep dive" variant for any one chapter — uniformity is the design.

If a future chapter needs an immersive scrollytelling pass with its own
network/prose (the kind chapter 1 had at `/reading/boulder/` in earlier
drafts), the path is to author per-chapter `_data/prose/<slug>.yml` and
populate `_data/scrolly/<slug>.yml`'s `steps` (instead of inheriting from
`home`). Then enable the network on that chapter via
`network: { show: true }`. The shell already handles it.

## Design language ground truth

The single source of truth for fonts, palette, and base typography is
**`assets/css/scrolly.css`**. Both surfaces load it. The landing site adds
**`assets/css/main.css`** (compiled from `assets/css/main.scss` +
`_sass/tgs.scss`) for layout-specific patterns like `.site-header`,
`.toc__cards`, `.chapter`, `.action-card`, etc.

To change a token (color, font, etc.), edit it in **one** place in
`assets/css/scrolly.css`. Both surfaces will pick it up.

CSS custom properties from scrolly.css that the landing site consumes:
`--paper`, `--ink`, `--ink-soft`, `--rule`, `--tufte-red`, `--highlight`,
`--serif`, `--mono`, `--hand`.

## Where to edit each design element

A precise map from a visual element to the file (and the selector) that
controls it. Use this before making a CSS change so you don't fight
specificity.

### Colors (palette tokens)

| Token | Light | Dark | File |
|------:|-------|------|------|
| `--paper` (background) | `#fffff8` | `#1c1a17` | `assets/css/scrolly.css` :root · `_sass/tgs.scss` `[data-theme-mode="dark"]` |
| `--ink` (body text) | `#111111` | `#efece4` | same |
| `--ink-soft` (metadata, captions) | `#4a463c` | `#b9b3a6` | same |
| `--rule` (borders, dividers) | `#d8d2bf` | `#3d3934` | same |
| `--tufte-red` (the one accent) | `#c83c3c` | `#d96058` | same |
| `--highlight` (`.draft-tag` background, `.hl`) | `#fff0a8` | `#4a3f1e` | same |

To change a color: edit both the light value (in scrolly.css `:root`) and
the dark override (in `_sass/tgs.scss`). Skipping the dark override leaves
the dark theme stale.

### Fonts

| Family | Used for | Source | Where declared |
|-------:|----------|--------|----------------|
| `et-book` | Body, all headings | Self-hosted via Tufte CSS CDN | `@font-face` blocks in `assets/css/scrolly.css` lines 5–19 |
| `EB Garamond` | Fallback for et-book | Google Fonts | `@import url(...)` at top of `assets/css/scrolly.css` |
| `JetBrains Mono` | Kickers, badges, chapter numbers, monospace UI | Google Fonts | same `@import` |
| `Caveat`, `Kalam` | Hand-drawn labels in scrolly network only | Google Fonts | same `@import` |

To swap fonts: edit the `@import` URL and the `--serif` / `--mono` /
`--hand` variables in scrolly.css `:root`. Do not introduce a new font in
`main.scss` — the goal is one source of truth.

### Headings

| Element | Class | Definition |
|--------:|-------|------------|
| Site brand (header) | `.site-header__title` | italic 1.05rem, in `assets/css/main.scss` |
| Hero title (home) | `.hero__title` | italic clamp(2.4rem, 6vw, 4rem), in `main.scss` |
| Hero subtitle (home) | `.hero__subtitle` | italic 1.25rem ink-soft, in `main.scss` |
| Page H1 | `<h1 class="page__title">` | inherits scrolly.css base h1 — italic 3.4rem |
| Chapter title | `.chapter__title` | italic clamp(2rem, 5vw, 2.8rem), in `main.scss` |
| Section rule (`.section-rule`) | `<h2 class="section-rule">` | top border + 3rem top margin, in `main.scss` |
| TOC card title | `.ch-card__title` | italic 1.25rem, in `main.scss` |
| Action card title | `.action-card__title` | italic 1.1rem, in `main.scss` |
| Kicker overline | `.kicker` | mono 11px uppercase ink-soft, in scrolly.css line 56 |

To change a heading style: locate its selector in the table, edit in place.
Do not redeclare scrolly.css's `h1`/`h2`/`h3` rules in `main.scss` —
they're inherited, and overriding causes drift.

### Spacing and measure

| Variable | Where | Used for |
|---------:|-------|----------|
| `$measure: 72ch` | `assets/css/main.scss` (top of file) | `.page-wrap`, footer, TOC |
| `$measure-narrow: 60ch` | `assets/css/main.scss` | `.chapter` (chapter pages) |
| `padding: 48px 28px 64px` | `.page-wrap` in `main.scss` | All landing pages |
| Mobile breakpoint `600px` | inline in `main.scss` `@media` | Single-column layout, smaller body text |
| Tablet breakpoint `760px` | inline in `main.scss` `@media` | TOC stacks, registers stack, actions stack |

To change the reading measure: edit `$measure` and `$measure-narrow` in
`main.scss`. They're SASS variables, used at compile time only.

### Hero and home page

| Element | Selector | File |
|--------:|----------|------|
| Hero block | `.hero--home` | `assets/css/main.scss` |
| Hero kicker line ("forthcoming · …") | `.hero--home .kicker` | inherits scrolly.css `.kicker`; copy edit in `_layouts/home.html` |
| Bartlett epigraphs | `.epigraphs`, `.epigraph`, `.epigraph__cite` | `main.scss`; markup in `_includes/epigraph.html` |
| Argument block | `.argument`, `.argument__body` | `main.scss`; copy in `_layouts/home.html` |
| Definition cards (Quant. Chauv. / Ecofascist Imag.) | `.registers`, `.register`, `.register__title` | `main.scss`; copy in `_config.yml` `registers:` block |
| Author block | `.author` | `main.scss`; copy in `_layouts/home.html` |
| Action cards (TOC / Preface / Reading) | `.actions`, `.action-card`, `.action-card__*` | `main.scss`; markup in `_layouts/home.html` |

To rewrite the home copy without touching CSS: edit `_layouts/home.html`
(hero, argument paragraph, author bio, action cards) and `_config.yml`
(registers definitions). Never put body copy in `main.scss`.

### Chapter pages

| Element | Selector | File |
|--------:|----------|------|
| Chapter wrap (max-width) | `.chapter` | `main.scss` (`max-width: $measure-narrow`) |
| Chapter number overline | `.chapter__num` | `main.scss` |
| Chapter title | `.chapter__title` | `main.scss` |
| Source note ("Reproduced from…") | `.chapter__source-note` | `main.scss` |
| Abstract block | `.chapter__abstract`, `.abstract-body` | `main.scss` |
| Excerpt block | `.chapter__excerpt` (top + bottom rule) | `main.scss` |
| Excerpt drop cap | `.chapter__excerpt > p:first-child::first-letter` | `main.scss` |
| Section structure list | `.chapter__structure`, `.structure-list` | `main.scss` |
| Reading-link callout | `.chapter__reading-link` (left rule, accent) | `main.scss` |
| Prev/next nav | `.chapter-nav`, `.chapter-nav__prev`, `.chapter-nav__next` | `main.scss` |

The chapter page template that wires these together is `_layouts/chapter.html`.

### Header, footer, navigation

| Element | Selector | File |
|--------:|----------|------|
| Sticky site header | `.site-header`, `.site-header__inner` | `main.scss` |
| Brand block (title + subtitle) | `.site-header__brand`, `.site-header__title`, `.site-header__subtitle` | `main.scss` |
| Primary nav | `.site-nav ul`, `.site-nav a` | `main.scss` |
| Active nav state | `.site-nav a[aria-current="page"]` | `main.scss` (color → `--tufte-red`) |
| Skip link | `.skip-link`, `.skip-link:focus` | `main.scss` |
| Footer | `.site-footer`, `.site-footer__inner`, `.site-footer__line`, `.site-footer__links`, `.site-footer__fineprint` | `main.scss`; copy in `_includes/footer.html` |

To add a nav item: append to `_config.yml` under `nav:`. The header
re-renders the list automatically.

### Theme toggle

| Element | Selector / Location |
|--------:|---------------------|
| Pre-paint script (avoid flash) | `_includes/head-extra.html` |
| Button markup | `_includes/header.html` (`<button id="theme-toggle">`) |
| Click handler | inline `<script>` at bottom of `_includes/header.html` |
| Button styling | `.theme-toggle`, `.theme-toggle:hover`, `.theme-toggle:focus-visible` in `main.scss` |
| Persistence | `localStorage["tgs-theme-mode"]` |

The dark-mode tokens live in `_sass/tgs.scss` under `[data-theme-mode="dark"]`.

### TOC and chapter cards

| Element | Selector | File |
|--------:|----------|------|
| TOC grid | `.toc__cards` (2-column → 1-column at 760px) | `main.scss` |
| Chapter card | `.ch-card`, `.ch-card--drafted`, `.ch-card--forthcoming` | `main.scss` |
| Card title | `.ch-card__title` | `main.scss` |
| Card pitch line | `.ch-card__pitch` | `main.scss` |
| Status badge | `.status-badge`, `.status-badge--drafted`, `.status-badge--forthcoming` | `main.scss` |

The card markup template is `_includes/chapter-card.html`. The TOC page
calls it once per entry in `_data/chapters.yml`.

### Bibliography page

| Element | Selector | File |
|--------:|----------|------|
| Filter input | `.bib-filter input` | `main.scss` |
| Filter focus ring | `.bib-filter input:focus` (2px tufte-red outline) | `main.scss` |
| Entry list | `.bib-list`, `.bib-entry` | `main.scss` |
| Author small caps | `.bib-entry__author` | `main.scss` |
| Year, venue (muted) | `.bib-entry__year`, `.bib-entry__venue` | `main.scss` |
| Title italic | `.bib-entry__title` | `main.scss` |

The filter behavior is a vanilla `<script>` at the bottom of
`pages/bibliography.md`.

### Draft tags and notes

| Element | Selector | File |
|--------:|----------|------|
| Draft inline tag | `.draft-tag` (yellow highlight, mono uppercase) | `main.scss` |
| Note box (warning) | `.note`, `.note--warn` (left rule = accent) | `main.scss` |
| Note box (info) | `.note--info` (left rule = ink-soft) | `main.scss` |

To remove a draft tag once content is approved: delete the
`<span class="draft-tag">…</span>` element in the source page (and remove
`abstract_status: draft` from chapter front matter).

### Common edits, by goal

- **Change the accent color from brick red to ink blue.** Edit
  `--tufte-red` in `assets/css/scrolly.css` `:root` (line 26) and in
  `_sass/tgs.scss` under `[data-theme-mode="dark"]`. Done.
- **Make the body text larger.** Edit `body { font-size: 19px; }` in
  `scrolly.css` line 41 and the mobile override `body { font-size: 17px; }`
  at the bottom of `main.scss`.
- **Widen the reading measure.** Edit `$measure` / `$measure-narrow` at
  the top of `main.scss`.
- **Add a new section to the home page.** Append a `<section>` block to
  `_layouts/home.html`. If it needs a heading, use `<h2 class="section-rule">`
  for consistency.
- **Add a new register card** (next to Quantitative Chauvinism / Ecofascist
  Imaginaries). Append an entry to `_config.yml` under `registers:`. The
  home page renders all of them.
- **Change the home hero copy.** Edit `_layouts/home.html` directly.
- **Change the page nav.** Edit `_config.yml` `nav:` (top-level).
- **Make the dark mode default for everyone.** Edit
  `_includes/head-extra.html` and replace the `prefers-color-scheme` check
  with a hardcoded `mode = "dark"`. (Discouraged — let users choose.)
- **Disable dark mode entirely.** Remove the `<button id="theme-toggle">`
  block from `_includes/header.html` and the `[data-theme-mode="dark"]`
  block from `_sass/tgs.scss`. Leave the pre-paint script — it's harmless
  if no dark CSS is defined.

## Dark mode

- `_includes/head-extra.html` runs a synchronous pre-paint script that sets
  `<html data-theme-mode="light|dark">` from `localStorage` (key
  `tgs-theme-mode`) or, on first visit, from `prefers-color-scheme`.
- `_includes/header.html` renders the toggle button (landing pages only) and
  flips the attribute on click, persisting to `localStorage`.
- Dark tokens live in `_sass/tgs.scss` under `[data-theme-mode="dark"]`. The
  scrollytelling Tweaks panel's `[data-theme="warm|cool|ivory"]` themes are
  re-stated as dark variants there too, so dark mode survives a Tweaks
  switch on the React surface.
- The `prefers-color-scheme` media query is the **first-visit fallback only**.
  Once the user toggles, their explicit choice wins.

If you change tokens, update **both** the light tokens (in scrolly.css's
`:root`) and the dark overrides (in `_sass/tgs.scss`).

## Adding a chapter

1. Add an entry to `_data/chapters.yml`:
   ```yaml
   - num: "09"
     slug: 09-some-slug
     title: "Some Title"
     status: drafted          # or: forthcoming
     pitch: "One sentence."
   ```
2. Create the chapter file at `_chapters/09-some-slug.md` matching the slug:
   ```markdown
   ---
   slug: 09-some-slug
   num: "09"
   title: "Some Title"
   abstract_status: draft     # remove when human-approved
   abstract: |
     The 120–180 word abstract.
   sections:
     - "Section heading 1"
     - "Section heading 2"
   ---

   <!-- 200–400 word verbatim excerpt as Markdown. -->
   ```
3. Create `_data/scrolly/09-some-slug.yml` so the React shell knows what to
   pin in the era stepper:
   ```yaml
   highlight_era: portfolio   # the era this chapter maps to (or omit if none)
   network: { show: false }
   steps_inherit: home        # reuse the homepage stepper
   ```
4. (Optional) Add `chapter_slug: 09-some-slug` to the matching era in
   `_data/eras.yml` so cross-chapter navigation lands on this chapter when
   readers click that era from another chapter's stepper.
5. The chapter renders at `/chapters/09-some-slug/`. The TOC and the
   prev/next nav update automatically — they iterate `_data/chapters.yml`.

## Adding a news item

Append to `_data/news.yml`:

```yaml
- date: "2026-06-15"
  kind: "talk"        # talk | review | event | press | release
  title: "Title of the talk or event"
  blurb: "One sentence about it."
  link: "https://…"   # optional
```

It surfaces automatically in the homepage Coda (latest 3 by date) and in
the full archive at `/news/`. The page is sorted descending by `date`.

## Refreshing the bibliography

The site renders `_data/bibliography.yml`, generated by `scripts/bib_to_yaml.rb`
from `uploads/bibliography.bib`. Workflow:

```bash
# After updating uploads/bibliography.bib
ruby scripts/bib_to_yaml.rb
git add uploads/bibliography.bib _data/bibliography.yml
git commit -m "Refresh bibliography"
```

The script is a pure-stdlib regex parser. It handles the common BibTeX
entry types (`article`, `book`, `inproceedings`, `incollection`,
`techreport`, `phdthesis`, `misc`) and the common value forms (braced,
quoted, bare integer). It does **not** handle `@string` macros or value
concatenation — extend the script if those become necessary.

The raw `.bib` is also linked from `/bibliography/` for download.

## Swapping the accent color

Edit `--tufte-red` in `assets/css/scrolly.css`'s `:root` block (one line).
Both the landing site and the scrollytelling pick it up. If you also want
the dark variant to change, update `--tufte-red` in `_sass/tgs.scss`
under `[data-theme-mode="dark"]`.

## What's drafted vs. what's generated

The site is in the middle of a content-extraction pass. The status as of
the most recent edit:

| Item | State |
|------|-------|
| Preface (`_chapters/00-preface.md`) | **Stub** — needs verbatim extraction from `Chapters/ch00.tex`. |
| Bartlett epigraphs (`_includes/epigraph.html`) | Done, verbatim from `Chapters/ch00.tex` lines 25–30. |
| Chapter abstracts (ch01–ch08) | **Stubs flagged `abstract_status: draft`** — need generation. |
| Chapter excerpts (ch01–ch08) | **Stubs** — need 200–400 word verbatim selections. |
| Chapter section lists | **Stubs** — need `grep -E "^\\\\(section|subsection)" Chapters/chNN.tex`. |
| Bibliography | Generated (951 entries). |
| Home page draft copy | Drafted with `<span class="draft-tag">` markers. |
| About page draft copy | Drafted with draft markers. |

Whenever you add author-approved content, **remove the matching draft tag**
in the rendered page and (for chapters) remove `abstract_status: draft`
from the front matter.

## Building and previewing

GitHub Pages builds via the Action at `.github/workflows/github-pages.yml`
on push to `master`. Local preview:

```bash
bundle install
bundle exec jekyll serve --livereload
# → http://localhost:4000
```

Requires Ruby ≥ 3.0 (the `github-pages` gem won't install on older Rubies).
On macOS, `brew install ruby` and put `/opt/homebrew/opt/ruby/bin` ahead of
`/usr/bin/ruby` in `PATH`. The system Ruby that ships with macOS (`/usr/bin/ruby`)
is 2.6 and will refuse to install the `ffi` gem.

After `bundle install` runs, a `Gemfile.lock` is created. **Do not commit
`Gemfile.lock`** — the `github-pages` gem manages its own dependency graph
on the GitHub Pages build server, and a stale local lockfile can cause the
Action to fail. The repo `.gitignore` excludes it.

## Deployment

The site deploys to GitHub Pages via two paths. Pick one and stay with it.

### Path A — GitHub Actions (current)

The workflow at `.github/workflows/github-pages.yml` uses
`actions/jekyll-build-pages@v1` to build on push to `master`, then
`actions/deploy-pages@v4` to publish. Settings → Pages must be set to
**Source: GitHub Actions** for this path to work.

After a push, watch the Actions tab. Two jobs (`build` then `deploy`) run
sequentially. A green deploy job means the new content is live. A red build
job usually means a Liquid syntax error or a Pages-incompatible plugin —
read the logs.

### Path B — classic Pages branch deploy

If you'd rather skip Actions, set Settings → Pages → Source:
**Deploy from a branch**, branch `master`, folder `/ (root)`. Pages will
build with its own internal `github-pages` gem. The Action workflow then
becomes inert (you can disable or delete it). Either path is supported by
the gem; do not configure both at once.

### Verifying a deploy

After a build succeeds, the deploy job prints a URL like
`https://brianckeegan.github.io/the-greatest-shortcoming/`. Visit it and
walk:

1. The home page loads. The hero renders, the QC | 6 era buttons | EFI
   stepper appears, the network SVG draws, the prose advances on scroll,
   the coda shows Book / Author / News / Resources, the Tweaks panel opens,
   the dark-mode toggle works.
2. `/contents/` lists eight chapters and the preface.
3. `/chapters/preface/` and a couple of `/chapters/<slug>/` pages render
   the chapter abstract above the stepper, content below, with the mapped
   era pinned in the stepper.
4. `/about/`, `/news/`, `/bibliography/` render with the same `.top-header`
   chrome as the React surface (single-row brand + nav, no double row).
5. `/news/` lists every item from `_data/news.yml`, newest first; the
   homepage Coda shows the latest three.
6. `/bibliography/` lists entries and the filter input narrows them.
7. `View source` on any page — confirm there are no surviving `\textit`,
   `\cite`, `% ` LaTeX residues.

### Rolling back a bad deploy

`git revert` the offending commit and push. The Action rebuilds from the
new HEAD. **Avoid `git push --force` to `master`** — it disrupts the
deploy queue and can break the cache. Always revert forward.

If a deploy went out with content that needs to come down immediately
(e.g., a paste of more chapter prose than the contract allows), do this in
order: (1) revert the commit, (2) push, (3) confirm the rebuild on the
live URL, (4) only then investigate what went wrong.

### Setting a custom domain

Create a file named `CNAME` (no extension) at the repo root containing the
domain on a single line, e.g.:

```
greatestshortcoming.com
```

Then in the domain registrar, add:

- An `A` record for the apex pointing to the GitHub Pages IPs
  (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).
- A `CNAME` record for `www` pointing to `brianckeegan.github.io`.

Wait for DNS propagation (5 minutes to a few hours), then enable
**Enforce HTTPS** under Settings → Pages.

If you set a custom domain, also set `url:` in `_config.yml` to the full
domain (e.g. `url: "https://greatestshortcoming.com"`) and leave `baseurl`
empty.

## Troubleshooting

### Site builds but pages render with stray `{{ … }}` or `{% … %}`

Liquid is being misinterpreted. The most common cause is the `{{ DOC:foo }}`
and `{{ QUOTE:bar }}` macros in `_data/prose.yml`, which are meant for the
React renderer to interpret on the client. Jekyll already handles these
correctly because YAML data files are not Liquid-templated — but if you
accidentally paste those macros into a `.html` or `.md` page, wrap them in
`{% raw %}…{% endraw %}` or rename the variable.

### `\textit`, `\cite`, or `%` LaTeX comments survive in chapter pages

The LaTeX-to-Markdown conversion missed something. Re-run a manual scan:

```bash
grep -RIE '\\\\textit|\\\\textbf|\\\\textsc|\\\\cite|\\\\section|^%' \
  _chapters/ pages/ _includes/ _layouts/
```

If anything matches, fix it in the source page before redeploying.

### Bibliography filter shows zero results despite the input being empty

The `data-haystack` attribute didn't get populated, usually because a
required field was nil and Liquid rendered `null` into the haystack. Check
`_data/bibliography.yml` for entries missing `author` or `title` and either
re-run `ruby scripts/bib_to_yaml.rb` after fixing the BibTeX, or add a
`| default: ''` in the haystack interpolation in `pages/bibliography.md`.

### Dark mode flashes light briefly on load

The pre-paint script in `_includes/head-extra.html` is supposed to set
`<html data-theme-mode>` synchronously before the body paints. If you
moved the include later in `<head>` or wrapped it in `defer`/`async`, the
flash returns. The include must run synchronously at the top of `<head>`.

### Homepage or a chapter page shows a blank shell

Open the browser console.

- `ReferenceError: React is not defined` — the React UMD `<script>` tag
  failed (network, integrity hash mismatch). Check the integrity attributes
  in `_layouts/scrolly.html` against the version pinned. If you bumped the
  version, regenerate the SRI hashes from https://www.srihash.org/.
- A Babel parse error — your edit to `assets/js/app.jsx` (or another `.jsx`)
  has a syntax error. Babel-standalone reports line numbers; fix in source.
- `Cannot read properties of undefined (reading 'steps')` — `PAGE_CONTEXT`
  isn't set. Confirm `_includes/page-context.html` runs after
  `site-data.html` and before any `.jsx` script tag in
  `_layouts/scrolly.html`.
- The `<noscript>` fallback shows but the React render doesn't — JavaScript
  is disabled or blocked by a content blocker. Not a site bug.

### `bundle install` fails with `ffi requires Ruby >= 3.0`

You're on system Ruby (2.6). `brew install ruby` (or `rbenv install 3.2`),
then put the new Ruby first in `PATH`:

```bash
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
ruby -v   # should print 3.x
```

### A merge conflict in `_data/bibliography.yml`

Don't try to resolve it by hand. Take the version from whichever branch
has the newer `uploads/bibliography.bib`, then re-run
`ruby scripts/bib_to_yaml.rb` to regenerate from scratch. The YAML is a
build artifact; the BibTeX is the source of truth.

## Periodic maintenance

A short checklist for whoever inherits the repo. Pick one frequency and
keep to it.

**Monthly**
- Run `bundle update github-pages` locally to track the gem version Pages
  is currently serving (https://pages.github.com/versions/). If the major
  version bumped, do a smoke build.
- Click through every page on the live site. Look specifically for layout
  shifts after Pages bumped its rendering pipeline.

**On every chapter draft update**
- Re-extract the chapter's section list (`grep` for `\section` and
  `\subsection` in the `.tex` file) into the `sections:` front matter of
  the matching `_chapters/NN-…md`.
- If the chapter's argument changed materially, regenerate the abstract
  (it stays flagged `abstract_status: draft` until the author signs off).
- If a new excerpt is needed because the chosen passage moved or was
  rewritten, replace the body of the chapter Markdown file. Stay within
  200–400 words.

**On every bibliography update**
- Drop the new `.bib` into `uploads/`, run `ruby scripts/bib_to_yaml.rb`,
  commit `uploads/bibliography.bib` and `_data/bibliography.yml`
  together as one commit.

**Once before public launch**
- Search for and remove every `<span class="draft-tag">` and every
  `abstract_status: draft` in the rendered output. Check
  `/about/draft-status/` is updated or deleted.
- Confirm the `description` in `_config.yml` and the social-card meta
  tags (via `jekyll-seo-tag`) read well in a Twitter/Mastodon preview.
- Walk the site with screen reader (VoiceOver on macOS: Cmd+F5) — the
  skip link, the nav landmarks, the dark-mode toggle's `aria-pressed`,
  and the chapter prev/next nav should all behave.

**Yearly**
- Audit the bibliography for citations that were only used in early
  drafts and are no longer referenced. The `.bib` is meant to be a
  manuscript-aligned record, not a reading list.
- Refresh the License date and the footer fineprint year (`{{ 'now' | date: '%Y' }}`
  is dynamic so this is automatic, but verify it actually rendered).

## Git and contribution conventions

- **Branch:** all Pages deploys come off `master`. Long work goes on a
  topic branch and merges in. Do not push WIP directly to `master`.
- **Commit messages:** imperative mood, ≤ 72 chars in the subject. Body
  explains *why* if non-obvious. Example: `Wire all chapter pages to the scrolly layout`.
- **Atomic commits:** scaffold, content, layout, deploy config — each its
  own commit. Avoid mixing layout edits with copy edits in one commit;
  diffs become hard to review.
- **Never commit `Gemfile.lock`** (already in `.gitignore`).
- **Never commit `_site/`** (Jekyll's build output, `.gitignore`).
- **Never commit `node_modules/`** (this repo doesn't use Node, but if you
  add dev tooling that does, gitignore it).
- **Pull requests:** if Brian invites contributors, the PR template should
  ask: (1) which surface is touched (landing / reading / both), (2) does
  the change preserve the contract that no chapter prose beyond preface +
  excerpts is added, (3) was it tested in light + dark mode at desktop +
  375px mobile.

## License and content rights

The repo's site code (layouts, includes, JS, CSS, scripts) is licensed
under the terms in `LICENSE.md`. The chapter prose, the entity-graph data
in `_data/`, the preface text, and `bibliography.bib` describe the content
of the manuscript and are **not licensed for reuse without the author's
written permission**. The `LICENSE.md` notes this distinction.

Practical consequence: if someone forks the repo and ports the design to a
different book, the layouts and styles travel with them. The text content
does not.

## Where to file issues and get help

This is a personal academic project. There is no on-call rotation. To
flag a bug or suggest an edit:

1. **Fastest:** open an issue at
   https://github.com/brianckeegan/the-greatest-shortcoming/issues with a
   clear title and steps-to-reproduce. Tag the surface (`landing`,
   `reading`, `bibliography`, `build`) in brackets at the start of the
   title.
2. **Slower:** email Brian via the contact information on the
   [About page]({{ '/about/' | relative_url }}).

For general Jekyll questions, the [Jekyll docs](https://jekyllrb.com/docs/)
and the [GitHub Pages docs](https://docs.github.com/en/pages) are the
authoritative references. Avoid Stack Overflow answers older than
~2 years; the Pages dependency graph has changed.

## Recovering from a serious breakage

If the site is broken on `master` and you don't know why:

1. **First:** verify it's actually broken. Hard-refresh the live URL
   (Cmd+Shift+R / Ctrl+Shift+F5) — the previous version may be cached.
2. **Find the last known good commit** with `git log` and the green Actions
   timestamps. `git checkout <good-commit>` locally and `bundle exec jekyll
   serve` — confirm the site loads.
3. **Revert forward**, do not reset:
   ```bash
   git checkout master
   git revert HEAD~N..HEAD   # where N is how many commits back
   git push origin master
   ```
4. Watch the Action rebuild. The site should come back.
5. **Then** investigate the breaking commit on a topic branch. Don't fix
   forward on `master` while the site is down.

If the React reading is the only thing broken (landing pages render fine):

- Check `_includes/site-data.html`'s and `_includes/page-context.html`'s
  JSON serialization. Liquid filters occasionally produce invalid JSON when
  a YAML field has unescaped quotes or newlines. Look at the page source
  and find the `<script>window.SITE = …</script>` and
  `<script>(function(){... window.PAGE_CONTEXT = ... })();</script>` blocks
  — if either is malformed, Babel fails silently.
- Try setting `assets/js/app.jsx` aside and loading a minimal hello-world
  React component first. If that mounts, the issue is in your data; if
  not, the issue is in the React/Babel CDN load.

If the Pages build itself is failing (Action red across multiple commits):

- Check https://www.githubstatus.com — Pages outages are rare but happen.
- Check https://pages.github.com/versions/ — a gem version may have been
  retired. Run `bundle update github-pages` and commit the new
  `Gemfile.lock`... wait, the lockfile is gitignored. Skip the lockfile;
  the Action regenerates it.
- If a plugin moved off the allowlist, remove it from `_config.yml`. The
  current allowlisted plugins (`jekyll-seo-tag`, `jekyll-sitemap`) are
  long-standing and unlikely to be retired.

## Files NOT to touch

- `assets/js/*.jsx` — the React scrollytelling code. Edits here change the
  homepage and every chapter page's behavior. Edit only with intent and only
  if you know React + the in-page Babel compilation flow.
- `_data/{people,orgs,instruments,themes,documents,eras}.yml` and
  `_data/prose/*.yml`, `_data/scrolly/*.yml` — the entity graph and per-page
  prose/step configs that drive the React surface. Edits here change the
  homepage and chapter content.
- `assets/css/scrolly.css` — the design language. Edit deliberately, since
  the landing site inherits from it.
- `bibliography.bib` (in `uploads/`) — manuscript artifact. Source of truth
  is the author's BibTeX manager; refresh by overwriting the file and
  re-running the script, not by editing in-place.

## Stop points (per the original spec)

The original task specification asks for explicit author check-ins at
three moments. Future sessions should respect these:

1. **After scaffolding**, before any Phase 3 content extraction starts —
   show the empty shell.
2. **After the preface and the ch01 abstract + excerpt**, before generating
   the same for ch02–ch08 — confirm tone.
3. **Before any `git push`** — confirm public-now vs. private-preview.

## File layout reference

```
.
├── _config.yml             # site identity, nav, nav_reading, registers, coda (with News),
│                           #   theme defaults, collections, defaults (chapters → scrolly + page_kind: chapter)
├── Gemfile                 # github-pages gem
├── README.md               # high-level reference (run, deploy, customize, troubleshoot)
├── MAINTAINERS.md          # this file
├── LICENSE.md
├── _data/
│   ├── chapters.yml        # drives TOC, chapter cards, prev/next nav
│   ├── bibliography.yml    # generated by scripts/bib_to_yaml.rb
│   ├── eras.yml            # the 6 eras + chapter_slug mapping (era → chapter URL)
│   ├── people.yml          # entity graph
│   ├── orgs.yml            # entity graph
│   ├── themes.yml          # entity graph (incl. QC, EFI)
│   ├── instruments.yml     # entity graph
│   ├── documents.yml       # entity graph
│   ├── news.yml            # news/event items (latest 3 in homepage Coda; full list at /news/)
│   ├── prose/              # per-page era prose
│   │   └── home.yml        # book-summary (homepage)
│   └── scrolly/            # per-page step (nodes/focus) configs
│       ├── home.yml        # homepage book-summary (was hard-coded in scrolly-network.jsx)
│       ├── preface.yml     # chapter stub (no era pinned)
│       ├── 01-boulder.yml  # chapter stubs — `steps_inherit: home` reuses home steps
│       ├── 02-the-free-fall.yml
│       └── …
├── _includes/
│   ├── head-extra.html     # pre-paint dark-mode setter
│   ├── header.html         # static-page top header (HTML mirror of React <Header>)
│   ├── footer.html         # static-page footer
│   ├── chapter-card.html   # one TOC card
│   ├── epigraph.html       # the three Bartlett epigraphs (legacy; not used in current home)
│   ├── site-data.html      # Jekyll → window.SITE / window.GS_DATA bridge (page-invariant)
│   └── page-context.html   # Jekyll → window.PAGE_CONTEXT bridge (per-page steps/prose/intro/outro)
├── _layouts/
│   ├── default.html        # static-page shell (no React)
│   ├── scrolly.html        # React mount + chapter intro/outro Liquid capture
│   └── page.html           # about, contents, bibliography, news, draft-status
├── _sass/
│   └── tgs.scss            # dark-mode tokens (overrides scrolly.css)
├── assets/
│   ├── css/
│   │   ├── scrolly.css     # design ground truth (fonts, palette, base typography, top-header,
│   │   │                   #   stepper, news-list, page-intro/outro, register def-bars, …)
│   │   └── main.scss       # layout patterns shared by both shells; compiles to main.css
│   ├── js/
│   │   ├── app.jsx                  # main React app — reads window.PAGE_CONTEXT
│   │   ├── scrolly-network.jsx      # network SVG — reads STEPS from PAGE_CONTEXT.steps
│   │   └── tweaks-panel.jsx         # in-page Tweaks UI
│   └── img/                # optional cover art / social cards
├── _chapters/              # collection: 00-preface.md … 08-boulder-again.md (page_kind: chapter via _config defaults)
├── pages/                  # static pages: about, contents, bibliography, news, draft-status
├── scripts/
│   └── bib_to_yaml.rb      # bibliography.bib → _data/bibliography.yml
├── uploads/
│   ├── bibliography.bib    # downloadable from /bibliography/
│   └── ch_01.pdf           # original chapter PDF
├── index.md                # / (page_kind: home, page_id: home — uses scrolly layout)
└── .github/
    ├── FUNDING.yml
    └── workflows/github-pages.yml
```
