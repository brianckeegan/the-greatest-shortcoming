---
title: "Website design"
permalink: /colophon/
description: "A colophon — how the chapter plate art is built, and why its Bauhaus vocabulary is a deliberate choice."
---

# Website design

Every chapter opens with a small **plate** — a geometric figure in the
constructivist manner, built from four colours (an ink black, a slate blue, a
brick red, a wheat ochre) and a short alphabet of primitives: circles, squares,
triangles, lines, arcs. The plates are less pictures than diagrams of their
chapters: a family tree of four shapes converging on a fifth for *The
Inheritance*; three forms closing on a fourth across a tactical grid for *The
Evacuation*; the Flatirons of the opening chapter mirrored into their own
reflection for the return.

## How they are made

Each plate is a scalable vector drawing defined inside a single **160×116
coordinate field**. Because every position is expressed as a ratio rather than a
pixel, a plate stays crisp at any size — a thumbnail on a card, a banner above an
article. The geometry is not embedded in each page; it lives once in a data file
(`_data/plates.yml`) as an ordered list of primitives, and a single template
renders any plate on request by chapter slug. The composition — what sits where,
in what proportion — is documented in one place and can be summoned wherever it
is needed.

## Why Bauhaus

The vocabulary is a deliberate citation, not decoration. The Bauhaus is a precise
historical address: inter-war Germany, the Weimar years — the same decades in
which this book locates the respectable origins of its subject. Eugenics, "racial
hygiene," and the arithmetic of overpopulation were not then the property of the
far right; they were ordinary furniture of post-war progressive science —
measured, optimistic, taught in universities and funded as reform. To borrow the
era's design language is to set the book's *quantitative chauvinism* back in the
room where it was once polite.

There is a sharper reason. The Bauhaus was among the very first institutions the
Nazis closed — shuttered in 1933, its work soon paraded as *entartete Kunst*,
"degenerate art." Its rational, internationalist, machine-age modernism — which
the regime denounced as rootless "cultural Bolshevism" — was intolerable to a
politics of blood and soil. So the aesthetic holds the book's central tension in
a single image: a forward-looking modernism produced by the very culture that
also perfected the machinery of exclusion, then destroyed by the state that
carried that machinery to its end. To build this argument in Bauhaus forms is to
reclaim a language the perpetrators tried to erase.
