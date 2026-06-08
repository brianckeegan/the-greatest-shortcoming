# The Greatest Shortcoming — Jekyll site

A scrollytelling reading of chapter 1, *Boulder*. Built as a Jekyll site so the
text, the entity graph, the colors, the typography, and the structure of the
page are all editable from a handful of YAML and CSS files — no JavaScript
required to retitle a section, add a person to the network, or rewrite a
paragraph.

This page is a complete reference for customizing the site. If you are looking
for the short version: edit `_config.yml` to retitle and renavigate, edit
`_data/*.yml` to grow the network, edit `assets/css/scrolly.css` to change how
it looks. Push to `main` and GitHub Pages will rebuild.

---

## Contents

1. [Run it locally](#run-it-locally)
2. [Deploy to GitHub Pages](#deploy-to-github-pages)
3. [How the site is wired](#how-the-site-is-wired)
4. [Customizing the chrome (`_config.yml`)](#customizing-the-chrome-_configyml)
5. [Customizing the network (`_data/*.yml`)](#customizing-the-network-_datayml)
6. [Customizing the prose (`_data/prose.yml`)](#customizing-the-prose-_dataproseyml)
7. [Customizing the look (`assets/css/scrolly.css`)](#customizing-the-look-assetscssscrollycss)
8. [Customizing behavior (`assets/js/*.jsx`)](#customizing-behavior-assetsjsjsx)
9. [Adding a new era](#adding-a-new-era)
10. [Adding a new entity](#adding-a-new-entity)
11. [Adding a new page](#adding-a-new-page)
12. [Troubleshooting](#troubleshooting)

---

## Run it locally

Requires Ruby 3.0+. The Gemfile pins to the `github-pages` gem so what builds
locally is what builds on Pages.

```bash
bundle install
bundle exec jekyll serve --livereload
```

Then visit <http://localhost:4000>.

---

## Deploy to GitHub Pages

Two options.

**Option A — GitHub Actions (recommended).** A workflow at
`.github/workflows/pages.yml` builds and deploys on every push to `main`. To
enable, go to **Settings → Pages → Build and deployment → Source** and choose
**GitHub Actions**.

**Option B — classic Pages.** Push to `main` and let GitHub build with the
`github-pages` gem automatically. Set **Source** to **Deploy from a branch**
and pick `main` / `/ (root)`.

If you deploy under a sub-path (e.g. `username.github.io/greatest-shortcoming`),
set `baseurl: "/greatest-shortcoming"` in `_config.yml`.

---

## How the site is wired

```
.
├── _config.yml              # site identity, hero, nav, registers, coda, theme defaults
├── _data/
│   ├── eras.yml             # the five (or N) eras — drives timeline + scrolly steps
│   ├── people.yml           # individuals in the network
│   ├── orgs.yml             # organizations
│   ├── themes.yml           # concepts / theoretical scaffolding
│   ├── instruments.yml      # policy or measurement instruments
│   ├── documents.yml        # primary-source documents (with excerpts)
│   └── prose.yml            # body text for each era step
├── _layouts/
│   ├── default.html         # base shell — head, scripts, footer
│   └── home.html             # homepage layout (mounts the React app)
├── _includes/
│   ├── site-data.html       # bridges Jekyll YAML → window.SITE / GS_DATA / GS_PROSE
│   └── head-extra.html      # add fonts, analytics, etc here
├── assets/
│   ├── css/scrolly.css      # all visual styling (themes, typography, layout)
│   └── js/
│       ├── app.jsx          # main React app (header, hero, stepper, prose, drawer)
│       ├── scrolly-network.jsx  # the era-stepped sketchy network SVG
│       └── tweaks-panel.jsx     # the in-page Tweaks panel framework
├── index.html               # entrypoint, just front-matter (uses home layout)
├── Gemfile                  # github-pages gem
└── .github/workflows/pages.yml  # GH Actions build + deploy
```

The pipeline:

1. Jekyll reads `_config.yml` and every `_data/*.yml` file.
2. `_layouts/default.html` includes `_includes/site-data.html`, which serializes
   the YAML to JSON inside a `<script>` tag as `window.SITE`, `window.GS_DATA`,
   and `window.GS_PROSE`.
3. `assets/js/app.jsx` reads those globals and renders the page with React.
4. The Tweaks panel (toolbar toggle in the host) lets a viewer change the theme
   live, persisted via `__edit_mode_set_keys`.

Because all interpretation happens client-side, you never have to touch JS to
edit content. Everything that *changes* what the site says lives in YAML.

---

## Customizing the chrome (`_config.yml`)

Open `_config.yml`. Sections are commented inline. The keys you'll most often
edit:

### `title` / `subtitle` / `description`

Used in `<title>`, header, SEO meta, and footer.

```yaml
title: "The Greatest Shortcoming"
subtitle: "a network reading"
description: "..."
```

### `hero`

Drives the homepage hero block.

```yaml
hero:
  title_lines: ["The Greatest", "Shortcoming"]   # one <br> between lines
  deck: "..."                                     # paragraph beneath
  scroll_cue: "scroll to begin"
```

### `nav`

The header nav. Items are either anchor links (`url: "#book"`) or the special
`{ kind: "eras-menu" }` which renders a dropdown of all eras.

```yaml
nav:
  - { label: "Eras",      kind: "eras-menu" }
  - { label: "Book",      url: "#book" }
  - { label: "Author",    url: "#author" }
  - { label: "Resources", url: "#resources" }
```

To link to a separate page instead of an anchor: `url: "/about/"`.

### `registers`

The two definition bars beneath the hero. Each has an `id` (anchored from the
hero kicker), a `kicker` overline, a `title`, and an HTML `body`. Add or remove
freely — the hero kicker auto-rebuilds links to whatever is here.

### `coda`

Sections at the bottom of the page (Book / Author / Resources by default). Same
shape as `registers`. Add an entry → it appears as a section AND as a nav target.

### `theme_defaults`

Initial values for the Tweaks panel. Tweaks override these per visitor and
persist while editing.

```yaml
theme_defaults:
  theme: "cool"        # "warm" | "ivory" | "cool"
  net: "rough"         # "rough" | "clean"
  fontSize: 18
```

### `footer`

Two strings, left and right.

---

## Customizing the network (`_data/*.yml`)

The entity graph is split across one file per kind. Each entity has the same
shape:

```yaml
- id: bartlett                      # required, must be unique across all files
  name: "Albert Bartlett"           # display name
  role: "Nuclear physicist"         # optional — appears under the name in drawer
  dates: "1923–2013"                # optional
  era: [free_fall, quarantine]      # optional — eras this entity is active in
  blurb: "..."                      # short paragraph in drawer
  links: [mckelvey, plan_boulder]   # other entity ids to surface as cross-refs
```

Documents add two more fields:

```yaml
  excerpt: "…direct quote…"         # rendered as italicized pull text
  pages: "p. 65"                    # citation hint
```

`kind` is inferred from the file (`people.yml` → person, `orgs.yml` → org, etc.)
and from `kind:` in `themes.yml` (default `theme`, but you can use `instrument`
if a theme is also a measurement instrument — see `carrying_capacity`).

**The `links` field is bidirectional in spirit but unidirectional in storage** —
list links from one side and the drawer surfaces them. List from both sides if
you want them to show up in both drawers.

---

## Customizing the prose (`_data/prose.yml`)

The body text of each scrollytelling step lives here, keyed by era id. Each
value is an HTML string with three special bits of markup:

### Entity references

`<span class="ent" data-ent="ID">label</span>` renders as a styled inline
reference. Click it → the entity drawer opens.

```html
The work of <span class="ent" data-ent="bartlett">Albert Bartlett</span>…
```

### Inline document vignette

`{{ DOC:document_id }}` (on its own line) renders as a full-width document card
with the excerpt and metadata pulled from `_data/documents.yml`.

### Pull quote

`{{ QUOTE:cite | body }}` renders as a styled pull quote. Pipe-separated, and
both halves can contain HTML.

```yaml
quarantine: |
  <p>…paragraph…</p>
  {{ QUOTE:Theodore Porter, <i>Trust in Numbers</i> | Numerical objectivity… }}
  <p>…next paragraph…</p>
```

### Other markup

* `<p class="dropcap">…</p>` — first paragraph gets a dropcap.
* `<span class="hl">…</span>` — highlighted phrase (subtle background tint).
* Plain HTML is fine: `<em>`, `<strong>`, `<i>`, `<b>`, etc.

---

## Customizing the look (`assets/css/scrolly.css`)

All visual decisions live in one file. Three things you'll most likely change:

### Theme tokens

The three themes are defined by CSS custom properties at the top of the file,
keyed off `[data-theme="…"]` on `<html>`. Tweak ink colors, paper colors, accent
red, etc:

```css
:root {
  --paper: #f4f1e8;
  --ink: #1a1a1a;
  --ink-soft: #6b665c;
  --rule: #d6cfb8;
  --tufte-red: #b3001b;
  --highlight: #ffe066;
  --serif: 'EB Garamond', Georgia, serif;
  --mono: 'JetBrains Mono', monospace;
}

[data-theme="cool"]  { --paper: #eef2f5; --ink: #1c2530; … }
[data-theme="ivory"] { --paper: #faf7ee; --ink: #2a2620; … }
```

Add a new theme by adding a `[data-theme="moss"] { … }` block, then adding it to
the `<TweakRadio>` options in `assets/js/app.jsx` (or just set the default in
`_config.yml`).

### Typography

Body type, headings, dropcap, pull-quote, and the network's hand-drawn labels
are all separate selectors — search for `font-family:` and `font-size:`.

### Layout

The scrollytelling stage is two columns: a sticky left figure (`.sticky-figure`)
and a right prose column (`.prose`). The split ratio and breakpoints are in the
`.scrolly { display: grid; grid-template-columns: … }` rule.

---

## Customizing behavior (`assets/js/*.jsx`)

You shouldn't need to touch these for content edits. If you want to change
*how* the page works:

* **`app.jsx`** — composition of header, hero, stepper, prose, drawer, coda.
  Reads `window.SITE`, `window.GS_DATA`, `window.GS_PROSE`. Add or remove
  components here.
* **`scrolly-network.jsx`** — the SVG network drawing. The `STEPS` const at the
  top of the file controls *which nodes appear in which era*. If you add a new
  entity to `_data/people.yml`, you also need to add its id to the appropriate
  `STEPS[i].nodes` array here, otherwise it won't appear on the chart (it will
  still be reachable as a drawer cross-reference).
* **`tweaks-panel.jsx`** — the in-page Tweaks UI framework. Don't edit unless
  you want to change how Tweaks themselves render.

---

## Adding a new era

1. Add an entry to `_data/eras.yml`:
   ```yaml
   - id: aftermath
     title: "Aftermath"
     subtitle: "2069 — 2090"
     start: 2069
     end: 2090
     num: "06"
     kicker: "Ledger"
     blurb: "The accounting that follows."
   ```
2. Add a matching prose key in `_data/prose.yml`:
   ```yaml
   aftermath: |
     <p class="dropcap">…</p>
   ```
3. Add a matching `STEPS` entry in `assets/js/scrolly-network.jsx` so the
   network knows which nodes to add in this era:
   ```js
   { id: 'aftermath', title: 'Aftermath', subtitle: '2069 — 2090',
     nodes: ['…ids of entities to introduce…'],
     focus: ['…ids to highlight while reader is in this era…'] }
   ```

That's it — nav, stepper, hero kicker, and section anchors all rebuild.

---

## Adding a new entity

1. Add it to the appropriate `_data/*.yml` file with a unique `id`.
2. Reference it from prose with `<span class="ent" data-ent="my_id">label</span>`.
3. List it under `links:` from any related entity.
4. Optionally add the id to the `nodes` list of one or more eras in
   `assets/js/scrolly-network.jsx` so it appears on the network diagram.

---

## Adding a new page

Drop a Markdown or HTML file at the project root (or in a `pages/` subfolder)
with front-matter:

```yaml
---
layout: default
title: "About"
permalink: /about/
---

Body content here, in Markdown or HTML.
```

Link it from `_config.yml`:

```yaml
nav:
  - { label: "About", url: "/about/" }
```

The default layout gives you the header, footer, and stylesheet — write any
HTML inside.

---

## Troubleshooting

**Build fails on GitHub Actions with a Gem version error.**
Bump `Gemfile.lock` by running `bundle update github-pages` locally.

**A new entity isn't showing on the network diagram, only in cross-references.**
You also need to add its id to the appropriate era's `nodes` array in
`assets/js/scrolly-network.jsx`. The network is intentionally curated, not
auto-generated from the data files.

**My Tweaks panel changes don't persist.**
Tweaks persist into `_config.yml` only when running through the design host;
on a deployed site they're per-session. To change defaults permanently, edit
`theme_defaults:` in `_config.yml`.

**Liquid `{% raw %}{{ DOC:foo }}{% endraw %}` syntax is being interpreted by Jekyll.**
That's expected — those macros are defined inside `_data/prose.yml`, which
Jekyll treats as raw YAML data, not a template. They're only rendered by the
client-side prose renderer in `app.jsx`. You're safe to use them in prose.

**Anchor links in `nav` aren't scrolling.**
Make sure the corresponding section has the same `id` (e.g. `url: "#book"`
needs `id: "book"` in `coda`).

---

## License

The site code (layouts, includes, JS, CSS) is yours to reuse. The chapter
prose and entity data describe the content of *The Greatest Shortcoming* and
are not licensed for reuse without permission.
