---
description: Audit the site against the draft metadata interface and (after review) apply the renames — construct, definition, chapter, slug (Stages 3–4 of the harness).
argument-hint: "[--apply]   (omit for a dry run / review only)"
---

Run the draft-reconciliation harness, Stages 3–4. Requires `metadata/draft-metadata.json`
(produce it first with `/ingest-draft`).

1. **Audit** (read-only) — derive the rename plan from the metadata, scan the site,
   classify every occurrence, and run coverage checks:

   ```
   python3 bin/audit-site.py
   ```

   Then **open `metadata/audit-report.md` and review it** as the human gate. Confirm:
   - the construct rename and chapter mapping table are correct;
   - the **Preserved** section shows the movement terms (e.g. bare "ecofascist") left
     untouched;
   - **Coverage** reports zero problems;
   - the **⚠ Review flags** (e.g. a chapter split, or a JS code-symbol rename) are acceptable.

   If `audit-site.py` exits non-zero, there are coverage problems — fix the metadata and
   re-run before applying.

2. **Dry-run the apply** to see exactly what would change (writes nothing):

   ```
   python3 bin/apply-rename.py
   ```

3. **Apply** — only after the report looks right, and on a dedicated branch:

   ```
   python3 bin/apply-rename.py --apply
   ```

   If `$ARGUMENTS` contains `--apply`, proceed to this step; otherwise stop after the
   dry run and summarize the diff for approval.

4. **Verify** (see `HARNESS.md` → Verification): YAML/JSON validity, grep invariants
   (no stale construct strings remain; preserved terms still present; no dangling id
   references; every referenced chapter slug exists), idempotence (a second `--apply` is
   a no-op), and a re-audit reporting zero drift. Then show `git diff --stat`.
