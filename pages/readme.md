---
title: "The socio-technical stack"
permalink: /readme/
description: "The socio-technical stack behind the site: a reproducible Jekyll + Tailwind build, a responsible-AI disclosure, and the documentation and source on GitHub."
---

# The socio-technical stack

This website is a static [Jekyll](https://jekyllrb.com/) site, styled with Tailwind
CSS and deployed to GitHub Pages. The chapters, the homepage scrollytelling, the
data-driven plate art (`_data/plates.yml`), and a draft-reconciliation harness that
keeps the site in step with the manuscript all live in a single repository.

## Reproducible by design

Every build is reproducible from source. Continuous integration compiles the CSS and
rebuilds the site on each push, so what you read is the output of a documented,
inspectable pipeline rather than something assembled by hand — nothing on the page is
generated at read time.

## Responsible-AI disclosure

Parts of this site — copy, layout, the plate-art system, and supporting tooling —
were drafted with the assistance of a large language model (Anthropic's Claude, via
Claude Code), under human direction and review. Commits made with that assistance
carry a `Co-Authored-By` trailer, so the collaboration is legible in the version
history. The argument, the sources, and the editorial judgment remain the author's.

## Documentation and source

The full documentation and source for this website are on GitHub:
**[github.com/brianckeegan/the-greatest-shortcoming](https://github.com/brianckeegan/the-greatest-shortcoming)**.
