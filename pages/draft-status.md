---
title: "Draft status"
kicker: "manuscript notes"
permalink: /about/draft-status/
description: "Open questions and known inconsistencies in the May 2026 draft of The Greatest Shortcoming."
---

This page surfaces the open questions in the manuscript that the website
cannot resolve unilaterally. It is intended for the author's reference and
will be removed when the manuscript is finalized.

## Era date ranges

The era stepper on the homepage uses date ranges from `_data/parts.yml` that
diverge slightly from the dates in `main.tex`. Reconcile when convenient if
the scrollytelling and the manuscript should agree.

## Generated draft content awaiting author review

These passages were drafted by Claude during site construction and are
flagged with a small &ldquo;draft&rdquo; tag in the rendered page. Each one
is a candidate to keep, edit, or replace.

- **Homepage book-summary prose** &mdash; the six era paragraphs in
  `_data/prose/home.yml` are book-altitude summaries drafted during the
  redesign. Author review pending.
- **TOC pitches (chapters 3&ndash;8)** &mdash; one-sentence chapter pitches in
  `_data/chapters.yml` are placeholder text reading
  &ldquo;DRAFT pitch &mdash; author review pending&rdquo; until generated.
- **Chapter abstracts (1&ndash;8)** &mdash; the abstract on each drafted
  chapter page is generated and flagged with `abstract_status: draft`.
- **About page** &mdash; the book description, the author bio, and the
  contact instructions all carry draft tags.

The preface and the per-chapter excerpts are <i>not</i> drafts. The preface is
verbatim from the manuscript; each excerpt is verbatim from the source
chapter and labeled with the section it came from.
