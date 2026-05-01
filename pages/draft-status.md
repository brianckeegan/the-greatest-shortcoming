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

The existing scrollytelling reading at
<a href="{{ '/reading/boulder/' | relative_url }}">/reading/boulder/</a> uses
date ranges in `_data/eras.yml` that diverge slightly from the dates in
`main.tex`. The landing site does not surface these ranges in its TOC, so the
discrepancy is currently invisible to readers. Reconcile when convenient if
the scrollytelling and the manuscript should agree.

## Generated draft content awaiting author review

These passages were drafted by Claude during site construction and are
flagged with a small &ldquo;draft&rdquo; tag in the rendered page. Each one
is a candidate to keep, edit, or replace.

- **Home page** &mdash; the &ldquo;What this book argues&rdquo; paragraph and the
  author bio paragraph.
- **TOC pitches (chapters 3&ndash;8)** &mdash; one-sentence chapter pitches in
  `_data/chapters.yml` are placeholder text reading
  &ldquo;DRAFT pitch &mdash; author review pending&rdquo; until generated. The pitch
  for chapters 1 and 2 are drawn from the `_data/prose.yml` opening lines.
- **Chapter abstracts (1&ndash;8)** &mdash; the abstract on each drafted
  chapter page is generated and flagged with `abstract_status: draft`.
- **About page** &mdash; the book description, the author bio, and the
  contact instructions all carry draft tags.

The preface and the per-chapter excerpts are <i>not</i> drafts. The preface is
verbatim from the manuscript; each excerpt is verbatim from the source
chapter and labeled with the section it came from.
