---
title: "Colophon"
permalink: /colophon/
description: "A colophon — how the chapter plate art is built, and why its Bauhaus vocabulary is a deliberate choice."
---

# Colophon

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

The vocabulary is a deliberate citation, not decoration. The Bauhaus was, above
all, **an attempt at recombination** — Walter Gropius built the school to "unify
art, craft, and technology," dissolving the old hierarchy that walled the fine
artist off from the craftsman and the engineer, and fusing them into a single
*total work*. That instinct is also how this site is built: as Simon Collison
argues in [*Bauhaus, ideology and the future of web
design*](https://colly.com/journal/bauhaus-ideology-and-the-future-of-web-design),
"we don't design pages, we design systems," bringing "independent tools" — HTML,
CSS, the DOM, and here SVG and a plate-geometry data file — to work together.

Recombination also fixes the Bauhaus to a precise historical address: inter-war
Germany, the Weimar years — the same decades in which this book locates the
respectable origins of its subject. Eugenics, "racial hygiene," and the
arithmetic of overpopulation were not then the property of the far right; they
were ordinary furniture of post-war progressive science. To borrow the era's
design language is to set the book's *quantitative chauvinism* back in the room
where it was once polite.

And recombination is exactly what made the school intolerable. A politics of
**blood and soil** is a politics of purity and separation — fixed hierarchies,
native essences, sorted populations. A school devoted to mixing — disciplines,
nations, media, the rational and the handmade — was its negation in miniature.
So the Bauhaus was among the very first institutions the Nazis closed: shuttered
in 1933, its work soon paraded as *entartete Kunst*, "degenerate art," its
rootless internationalism denounced as "cultural Bolshevism." The aesthetic thus
holds the book's central tension in one image — a forward-looking modernism made
by the same culture that perfected the machinery of exclusion, then destroyed by
the state that carried that machinery to its end. To build this argument in
Bauhaus forms is to reclaim a language the perpetrators tried to erase.

## Typography, and where it breaks

Type was the Bauhaus at its most doctrinaire. Herbert Bayer's *universal*
alphabet reduced letters to "as few geometric forms as possible" — a single
lowercase sans, no serif, no flourish — because "type must be an expression of
our times, like cinema, architecture and machines." The future was to be set in
the grotesque.

This site keeps that as its dominant voice: geometric and grotesque sans-serifs
(Josefin Sans across the display, Archivo in the running text) carry the
structure — headings, labels, the measured argument. But it **breaks**,
deliberately and sparingly, into an old-style serif — EB Garamond, set in italic.
The rule for the break is semantic, not decorative. The serif is held back for
emphasis and for the book's charged terms; it is the older, humanist, pre-modern
voice surfacing *through* the rational modernist grid. Read it as a small
enactment of the argument: the confident sans-serif plane of measurement and
progress, and the older pattern that keeps erupting through it. Where the type
turns to serif — as it does on the words you just read — the prose is turning
toward the thing underneath.
