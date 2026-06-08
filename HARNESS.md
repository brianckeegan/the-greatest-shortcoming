# Draft-reconciliation harness

Keep the website in sync with the book as the manuscript evolves. Drop a new
versioned PDF in `source/`, and the harness reads it, captures chapter-level
summaries and the canonical construct names into a metadata "interface" file,
audits the live site against that interface, and renames stale
constructs / definitions / chapter titles — **without** clobbering terms that
only *look* related (e.g. "ecofascism" the movement vs. "Lebensraum imaginaries"
the construct).

```
source/<Title>-<N>.pdf  ·or·  source/<YYYYMMDD>.pdf
   │  ① bin/ingest-draft.py            deterministic extract (PyMuPDF) — no LLM
   ▼
metadata/v<N>/extract.{json,txt}       per-chapter text; flags partial drafts
   │  ② /ingest-draft → pdf-reader     the PDF-reading agent
   ▼
metadata/draft-metadata.json           THE interface (source of truth) ── schema: draft-metadata.schema.json
   │  ③ bin/audit-site.py              JSON-driven audit of the site
   ▼
metadata/audit-report.md  +  rename-plan.json     review gate + executable plan
   │  ④ bin/apply-rename.py --apply    idempotent reconcile (dry-run by default)
   ▼
edited _config.yml / _data/* / _chapters/* / _landing/* / _includes/* / _layouts/*  (+ redirects)
```

## Run it

```bash
# Stage 1 — extract (auto-picks newest source/*.pdf if no arg)
python3 bin/ingest-draft.py source/The_Greatest_Shortcoming-1.pdf
python3 bin/ingest-draft.py source/20260607.pdf   # date-stamped drafts also work

# Stage 2 — populate the interface (run as the pdf-reader agent)
/ingest-draft                      # in Claude Code; writes metadata/draft-metadata.json

# Stage 3 — audit (read-only) → review metadata/audit-report.md
python3 bin/audit-site.py

# Stage 4 — dry run, then apply on a branch
python3 bin/apply-rename.py        # dry run: prints planned ops, writes nothing
git switch -c reconcile/v1
python3 bin/apply-rename.py --apply
```

Or, in Claude Code, the two slash commands wrap the stages: `/ingest-draft` then
`/audit-constructs` (add `--apply` to execute).

### Source filenames & version slots

`ingest-draft.py` resolves a stable version ordinal `v<N>` from the filename:

- `…-<N>.pdf` (e.g. `The_Greatest_Shortcoming-2.pdf`) → that explicit ordinal.
- `<YYYYMMDD>.pdf` (e.g. `20260607.pdf`) → ranked **chronologically** among the
  date-stamped PDFs in `source/`, so multiple dated drafts get distinct,
  date-ordered `metadata/v<N>/` dirs (`20260530`→v1, `20260607`→v2, …).
- anything else → a warned fallback to mtime rank (never a silent collapse to v1).

`metadata/v<N>/` is git-ignored (a local working artifact); the authoritative
`version` lives in `draft-metadata.json`, written by the Stage-2 agent.
Re-ingesting an **identical** PDF (same sha256) into an occupied slot is a warned
no-op; a **different** PDF in an occupied slot is refused unless you pass
`--force`.

### Re-running on an already-reconciled site

The audit is tolerant of **already-applied** renames: if a chapter's `prev_slug`
file is gone *and* its new `slug` file is present (the committed steady state),
the move is treated as done — it is not planned again and is not a coverage
error. The same holds for construct `_landing/` moves. So a straight
`audit → apply` second pass is clean with **no manual metadata surgery**.

Optionally, after a real `--apply`, settle the committed metadata so it mirrors
the site for the *next* draft:

```bash
python3 bin/apply-rename.py --apply --finalize   # rewrites prev_* == current, status → unchanged
```

`--finalize` keeps each construct's `aliases_deprecated` / `preserve_terms` as
regression guards (they still protect after a rename settles) and clears the
one-shot `extra_renames`. Without `--apply` it only previews the settling diff.

## The metadata interface

`metadata/draft-metadata.json` (validated by `draft-metadata.schema.json`) is the
only thing the audit/apply stages read. It is content + intent:

- **`constructs[]`** — canonical name + definition; for a rename, the `prev_*`
  values, every deprecated `aliases_deprecated` spelling, and `preserve_terms`
  (bare words that must **not** be renamed).
- **`chapters[]`** — authoritative title/order, old→new `prev_slug`/`prev_title`/
  `prev_era_id`, plus `concept` / `teaser` / `pitch` / `summary` (the new copy
  written into the site) and `source` provenance.
- **`extra_renames`** / **`definition_blocks`** — escape hatches for special cases.

Because intent lives in this file, the apply step is a deterministic, idempotent
executor with no hard-coded book content — re-running it on a new draft just needs
a fresh metadata file.

## Why not `sed s/old/new/`

The rename is semantic. The current draft renamed the construct **Ecofascist
Imaginaries → Lebensraum Imaginaries**, but deliberately keeps "ecofascism /
ecofascist" as a *movement* descriptor ("whether Bartlett was an ecofascist").
The harness only matches the construct **phrase** and its **machine ids**, and the
audit's coverage check proves the bare movement terms were left untouched and that
no deprecated alias survives. Renames run as a single longest-first pass so
overlapping keys (e.g. `The Free Fall` vs `Free Fall`) never double-apply.

`aliases_deprecated` is emitted as a phrase guard **regardless of a construct's
`status`** — so once a rename settles you can keep the construct at
`status: "unchanged"` and retain its deprecated spellings as a standing
regression guard that re-canonicalizes any reintroduced spelling on the next
apply, without the construct having to masquerade as `"renamed"` forever.

## Verification (local Jekyll build is broken — validate via CI + offline checks)

1. **Validity** — `python3 -m json.tool metadata/*.json`; load every edited
   `_data/*.yml` and chapter front matter with a YAML parser.
2. **Invariants** — after `--apply`: no `ecofascist imaginar*` / `ecofascist_imaginary`
   / `ecofascist-imaginaries` / `EFI` remain; bare `ecofascism`/`ecofascist` still
   present where expected; no `links:`/`era:`/`data-ent` references a now-undefined id;
   every chapter slug referenced by `_data` / `_includes` exists on disk.
3. **Idempotence** — a second `bin/apply-rename.py --apply` yields an empty `git diff`.
4. **Reverse-drift** — re-running `bin/audit-site.py` reports zero drift vs. the metadata.
5. **Build** — push the branch; the `.github/workflows/github-pages.yml` Actions build
   is the real Jekyll validation.

## Files

| Path | Role |
|------|------|
| `source/` | drop zone for versioned draft PDFs |
| `bin/ingest-draft.py` | Stage 1 — PDF → per-chapter extract (robust to partial drafts) |
| `metadata/draft-metadata.schema.json` | the interface contract |
| `metadata/draft-metadata.json` | Stage 2 output — source of truth |
| `.claude/agents/pdf-reader.md` | the PDF-reading agent |
| `bin/audit-site.py` | Stage 3 — audit → `audit-report.md` + `rename-plan.json` |
| `bin/apply-rename.py` | Stage 4 — idempotent reconcile (dry-run by default) |
| `.claude/commands/ingest-draft.md`, `audit-constructs.md` | slash-command triggers |
