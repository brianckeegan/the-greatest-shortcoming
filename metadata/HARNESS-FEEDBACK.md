# Harness improvement backlog

Stability + functionality feedback for the draft-reconciliation harness
(`bin/ingest-draft.py`, `bin/audit-site.py`, `bin/apply-rename.py`, `HARNESS.md`),
captured re-ingesting `source/20260607.pdf` (284 pp) on 2026-06-08 against an
already-reconciled site. Items are grouped by priority and tagged with their
original feedback IDs.

## North-star acceptance test
A **second full pass** of the pipeline (ingest → audit → apply) on an
already-reconciled site must be **clean and idempotent with no manual metadata
surgery**: `audit-site.py` exits 0 with 0 coverage problems, the `apply-rename.py`
dry run shows **no rendered-surface change** (0 moves, 0 text replacements,
`cards.yml` regenerates byte-identical), and a second `--apply` leaves an empty
`git diff`. Every fix below must preserve this steady state.

## Works as designed — do not regress
- Phrase/token + `preserve_terms` separation (bare "ecofascist" the movement is
  preserved while the construct phrase renames). 5 preserved sightings confirmed.
- Idempotence of `--apply`; zero-drift re-audit.
- Coverage gate halts `apply` on `exit 1`.

---

## P1 — do first (makes re-runs clean; supports the real filename convention)

### [x] #1 Re-running on an already-reconciled site fails the audit (stale `prev_*`)  — STABILITY, highest
- **Problem:** the committed `draft-metadata.json` is post-rename, but chapter
  `prev_slug` values still point at pre-rename files. The audit requires every
  `prev_slug` to exist on disk (`audit-site.py:192`), so a straight re-audit fails
  ("prev_slug missing on disk"). This run only passed because Stage 2 manually
  remapped all 10 chapters' `prev_*` → current.
- **Fix (primary):** make the audit tolerant of already-applied renames — if a
  chapter's `prev_slug` file is missing **and** the new `slug` file exists, treat
  that rename as already done: skip the move, skip the coverage error. Apply the
  same tolerance to construct `prev_slug`/`_landing` moves.
- **Fix (optional enhancement):** add a `--finalize` step/flag to `apply-rename.py`
  that, after a successful apply, rewrites the interface so `prev_* = new` (and
  settles construct status), keeping the committed metadata an honest mirror of the
  current site for the next draft.
- **Acceptance:** with the current committed metadata's `prev_*` reset to the
  *pre-reconcile* values, `audit-site.py` still exits 0 and plans 0 moves.
- **Files:** `bin/audit-site.py` (coverage check + `file_moves`), optionally
  `bin/apply-rename.py`, `HARNESS.md`.

### [ ] #2 Construct guards can't coexist with `status: "unchanged"`  — STABILITY
- **Problem:** the alias-coverage check loops over **all** constructs
  (`audit-site.py:185`) but `derive_maps` only emits alias→canonical phrases for
  `status=="renamed"` (`audit-site.py:93`). Keeping `aliases_deprecated` as a
  regression guard on a settled construct throws a false "alias not covered,"
  forcing the construct to stay `"renamed"` forever (emitting phantom no-op renames).
- **Fix:** decouple guard from action — either run alias-coverage only for renamed
  constructs, or have `derive_maps` always emit the alias→canonical phrase map so
  guards work regardless of status. Prefer the latter so the guard keeps protecting
  even after the rename settles.
- **Acceptance:** a construct with `status:"unchanged"` + non-empty
  `aliases_deprecated` audits clean (0 coverage problems) and still produces a
  phrase map that would catch a reintroduced deprecated spelling.
- **Files:** `bin/audit-site.py`.

### [ ] #5 Date-stamped filenames silently collapse to v1  — FUNCTIONALITY
- **Problem:** `parse_version` only matches `-(\d+)\.pdf$` (`ingest-draft.py:54`),
  so `20260607.pdf` parses as **v1** and overwrites `metadata/v1/`, clobbering the
  prior extract. The naming convention actually in use (dates) is unsupported.
- **Fix:** also parse `YYYYMMDD.pdf` (date-ordered version) and/or derive ordering
  from a sorted scan of `source/*.pdf`; **warn** instead of silently defaulting when
  a filename matches no pattern; and refuse to overwrite an existing `metadata/v<N>/`
  whose `sha256` differs without `--force`.
- **Acceptance:** ingesting `20260607.pdf` and `20260530.pdf` yields distinct,
  date-ordered version dirs; re-ingesting an identical sha is a warned no-op;
  `Title-2.pdf` still parses as v2.
- **Files:** `bin/ingest-draft.py`, `HARNESS.md`.

---

## P2 — trust/clarity (prevents misleading "republishes")

### [ ] #3 Stale, hard-coded, book-specific review flags  — STABILITY
- **Problem:** `audit-site.py:223` unconditionally appends the "Chapter split:
  'The Free Fall' → 'The Inheritance' + 'The Bottle'" flag; it fired this run with
  **zero** chapter changes, telling the human gate to review a split that isn't
  happening. Contradicts the "no hard-coded book content" design goal.
- **Fix:** derive review flags from the metadata — flag chapters whose `status`
  contains `new`/`split`/`renamed+renumbered`, JS-symbol renames present in
  `extra_renames`, or change counts over a threshold. Remove the literals.
- **Acceptance:** a metadata with all chapters `unchanged` and empty `extra_renames`
  emits **zero** review flags.
- **Files:** `bin/audit-site.py`.

### [ ] #6 Interface copy edits silently don't publish  — FUNCTIONALITY
- **Problem:** `summary` only renders into *new* chapter stubs
  (`apply-rename.py:135`); `pitch` targets the non-existent `chapters.yml`; construct
  `definition` is never written to `_landing/`. Stage-2 copy refreshes produced a
  large metadata diff with **zero** rendered effect.
- **Fix:** either propagate these fields (write `definition` into the managed region
  of `_landing/<slug>.md`; render `summary`/`pitch` onto chapter/landing pages), or
  explicitly mark them interface-only and have apply report which fields are
  rendered vs. metadata-only. Pairs with #7.
- **Acceptance:** changing a propagated field in the metadata produces a
  corresponding rendered-file diff on `--apply`; metadata-only fields are documented
  as such.
- **Files:** `bin/apply-rename.py`, `HARNESS.md` (+ a managed-region marker
  convention in `_landing/*.md` if propagating definitions).

### [ ] #7 No "did this change the site?" signal  — FUNCTIONALITY
- **Problem:** apply output didn't distinguish provenance/interface churn from
  rendered-surface change, so "republish" looked substantive but wasn't.
- **Fix:** have `apply-rename.py` print a **rendered-surface delta** summary (moves +
  text replacements + `cards.yml` changed Y/N + new chapters) separate from
  `source_note`/interface churn, in both dry-run and apply.
- **Acceptance:** a provenance-only run reports "rendered-surface changes: 0".
- **Files:** `bin/apply-rename.py`.

---

## P3 — cleanup / hardening

### [ ] #4 `chapters.yml` is a phantom regen target  — STABILITY
- **Problem:** `REGENERATED` lists `_data/chapters.yml` (`audit-site.py:50`) but the
  file doesn't exist, so the `pitch` written by `regen_file` (`apply-rename.py:115`)
  goes nowhere. Dead path / latent inconsistency.
- **Fix:** restore/create the file if it should drive nav, or drop it from
  `REGENERATED` and remove the dead `regen_file` branch. Decide alongside #6.
- **Files:** `bin/audit-site.py`, `bin/apply-rename.py`.

### [ ] #8 No re-ingest provenance guard  — FUNCTIONALITY
- **Problem:** re-ingesting the same or an older PDF overwrites silently.
- **Fix:** record `sha256`/`ingested`; warn/skip on an already-seen sha; warn when
  the version ≤ the last reconciled one. (Overlaps the #5 overwrite guard.)
- **Files:** `bin/ingest-draft.py`.

### [ ] #9 Everything rides on CI  — STABILITY
- **Problem:** local Jekyll build is broken; breakage is only caught after it hits
  `master`.
- **Fix:** add a lightweight pre-push offline check — containerized `jekyll build`,
  or a liquid/front-matter + `_data` YAML lint script the harness can run as a final
  verification gate.
- **Files:** new `bin/` script and/or `HARNESS.md` verification section.

---

## Implementation order
P1 (`#1`, `#2`, `#5`) → P2 (`#3`, `#6`, `#7`) → P3 (`#4`, `#8`, `#9`).
After each item: re-run `audit-site.py` + `apply-rename.py` (dry run) and confirm the
north-star steady state still holds. Commit each item (or tight group) directly to
`master`. Update `HARNESS.md` and `metadata/draft-metadata.schema.json` when behavior
or the interface changes; check the box here as each lands.
