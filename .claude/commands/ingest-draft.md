---
description: Ingest a versioned draft PDF from source/ and populate the chapter-level metadata interface (Stages 1–2 of the reconciliation harness).
argument-hint: "[path/to/draft.pdf]   (optional; defaults to newest source/*.pdf)"
---

Run the draft-reconciliation harness, Stages 1–2.

1. Extract the draft deterministically:

   ```
   python3 bin/ingest-draft.py $ARGUMENTS
   ```

   This writes `metadata/<vN>/extract.{json,txt}` and reports which chapters have a
   drafted body in this PDF vs. which are Contents-only.

2. Then act as the **pdf-reader** subagent (see `.claude/agents/pdf-reader.md`): read
   `metadata/<vN>/extract.txt`, cross-check against `assets/js/landing.js`, and write
   `metadata/draft-metadata.json` conforming to `metadata/draft-metadata.schema.json`.
   Fill `constructs[]` (with `aliases_deprecated` and `preserve_terms`) and `chapters[]`
   (with old→new `prev_*` mappings, summaries, and `source`).

3. Validate the JSON against the schema and print a short summary of the constructs and
   chapter mapping. Do **not** edit any site files in this command — that is Stages 3–4
   (`/audit-constructs`).
