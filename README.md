# The Greatest Shortcoming — Jekyll site

A scrollytelling reading of *The Greatest Shortcoming: Quantitative Chauvinism
and Lebensraum Imaginaries*. The site is data-driven: the text, structure,
navigation, and colors are edited from a handful of YAML, Markdown, and config
files. It builds with **Jekyll 4** and deploys to **GitHub Pages via GitHub
Actions** on every push to `master`.

## Stack

| Concern        | Tool                                                              |
| -------------- | ---------------------------------------------------------------- |
| Static site    | Jekyll 4.4 (standalone — not the `github-pages` gem)             |
| Ruby           | 4.0 (see `.github/workflows/github-pages.yml`)                   |
| Markdown       | kramdown with GFM input                                          |
| Plugins        | `jekyll-seo-tag`, `jekyll-sitemap`                               |
| Styling        | Tailwind CSS, built with the `tailwindcss` CLI via npm           |
| Homepage motion| Vanilla JS (`assets/js/landing.js`)                             |
| Hosting        | GitHub Pages (GitHub Actions deployment)                         |

> **Why standalone Jekyll, not the `github-pages` gem?** The site deploys with
> its own Actions workflow, so it doesn't need the gem's "build exactly like
> classic Pages" guarantee — and dropping the gem lets the build run on Ruby 4.

## Quick start (local development)

Requires **Ruby 4.x** and **Node 20+**.

```bash
# 1. JavaScript deps (Tailwind) + Ruby deps (Jekyll)
npm install
bundle install

# 2. Build the CSS (Tailwind is a separate step from Jekyll)
npm run build:css        # one-off
# or, while editing styles, watch in a second terminal:
npm run dev:css

# 3. Serve the site
bundle exec jekyll serve
```

Then visit <http://localhost:4000>.

`assets/css/dist/main.css` is a generated build artifact (git-ignored) — run
`npm run build:css` at least once before `jekyll serve`, or the page will be
unstyled.

## Project structure

```
.
├── _config.yml                     # site identity, hero, nav, registers, collections, excludes
├── _data/                          # structured content consumed by includes
│   ├── people.yml  orgs.yml  eras.yml  themes.yml
│   ├── instruments.yml  documents.yml  parts.yml
│   └── cards.yml  prose.yml
├── _chapters/                      # chapter pages (Markdown collection → /chapters/:name/)
├── _landing/                       # homepage prose snippets (Markdown collection, not output)
├── _layouts/
│   ├── default.html                # base shell (head, footer, stylesheet)
│   ├── home.html                   # homepage — the scrollytelling layout
│   └── chapter.html                # individual chapter page
├── _includes/                      # partials: header, footer, hero, chapter-card, …
├── assets/
│   ├── css/src/main.css            # Tailwind source → built to assets/css/dist/main.css
│   ├── js/landing.js               # homepage scroll engine (bottle / hedcut animation)
│   └── img/                        # images
├── index.html                      # homepage entry (layout: home, permalink: /)
├── tailwind.config.js              # Tailwind configuration
├── package.json                    # npm scripts (build:css, dev:css, …)
├── Gemfile                         # Jekyll 4 + plugins + webrick
└── .github/
    ├── workflows/github-pages.yml  # build + deploy to Pages (and PR build checks)
    └── dependabot.yml              # automated dependency updates
```

## Editing content

You can change everything the site *says* without touching layout code.

- **Site chrome** — `_config.yml`: `title`, `subtitle`, `description`, `hero`,
  `nav`, and `registers` (the definition bars). Sections are commented inline.
- **The network / entities** — `_data/*.yml`: one file per kind (`people`,
  `orgs`, `eras`, `themes`, `instruments`, `documents`). Each entity has a
  unique `id`.
- **Chapters** — add a Markdown file to `_chapters/` with front matter; it
  publishes at `/chapters/<name>/` using the `chapter` layout.
- **Homepage prose** — `_landing/*.md` snippets and the data the homepage reads
  from `_config.yml` / `_data/`.
- **Look** — Tailwind utility classes in the templates, plus
  `assets/css/src/main.css` for custom layers. Rebuild with `npm run build:css`.

## Build & deploy

Deployment is handled by [`.github/workflows/github-pages.yml`](.github/workflows/github-pages.yml):

1. **On push to `master`** (or manual `workflow_dispatch`): install npm deps →
   `npm run build:css` → `bundle install` → `jekyll build` → upload artifact →
   **deploy** to GitHub Pages.
2. **On pull requests to `master`**: the same build runs as a check, but the
   deploy step is skipped — so a broken build is caught before it can reach
   `master`.

One-time setup: **Settings → Pages → Build and deployment → Source → GitHub
Actions**.

Dependencies are kept current by `.github/dependabot.yml` (monthly grouped PRs
for Actions, npm, and Bundler), each validated by the PR build before merge.

## License

The site code (layouts, includes, JS, CSS, config) is released under the **MIT
License**. The book content — chapter prose, entity data, and the manuscript in
`source/` — is © 2026 Brian C. Keegan, **all rights reserved**, and is not
licensed for reuse without permission. See [LICENSE](LICENSE).
