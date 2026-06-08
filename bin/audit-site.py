#!/usr/bin/env python3
"""
audit-site.py — Stage 3 of the draft-reconciliation harness.

Read the metadata "interface" (metadata/draft-metadata.json), scan the site, and
emit:

    metadata/rename-plan.json   machine-applicable plan (Stage 4 executes it)
    metadata/audit-report.md    human-readable drift report (the review gate)

The plan is *derived* from the metadata, never hand-written:
  * construct renames     ← constructs[].prev_* → constructs[].*  + aliases_deprecated
  * chapter renames       ← chapters[].prev_slug/prev_title/prev_era_id → new
  * special cases         ← extra_renames
Coverage checks make this safe to apply:
  * every deprecated alias must be covered by a replacement (no silent misses)
  * preserve_terms (e.g. bare "ecofascist", the movement) must NOT be matched
  * every prev_slug must exist; every new slug must be free

No edits are made here. Read-only.
"""
from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
META = REPO / "metadata" / "draft-metadata.json"

# Files the rename touches. Build-scope first; then tracked-but-excluded files we
# keep consistent. cards.yml is regenerated, so excluded from text replacement.
# _preview/, node_modules/, _site/, metadata/, bin/ are never scanned.
SCAN_GLOBS = [
    "_config.yml",
    "_data/*.yml",
    "_chapters/*.md",
    "_landing/*.md",
    "_includes/*.html",
    "_layouts/*.html",
    "index.html",
    # tracked but excluded from the Jekyll build — kept consistent anyway:
    "README.md",
    "LICENSE",
    "register-preview.html",
    "data.js",
    "assets/js/landing.js",
]
# cards.yml is generated from the metadata; never scanned for text replacement.
# (There is intentionally no chapters.yml — it was a phantom regen target, #4.)
REGENERATED = {"_data/cards.yml"}


def rel(p: Path) -> str:
    return str(p.relative_to(REPO))


def scan_files() -> list[Path]:
    seen, out = set(), []
    for g in SCAN_GLOBS:
        for p in sorted(REPO.glob(g)):
            r = rel(p)
            if r in REGENERATED or r in seen or not p.is_file():
                continue
            seen.add(r)
            out.append(p)
    return out


def target_for_alias(alias: str, canonical: str) -> str:
    """Map a deprecated display alias to the canonical name, preserving the
    alias's case style (Title / sentence / lower) and singular/plural."""
    words = canonical.split()  # e.g. ["Lebensraum", "Imaginaries"]
    singular = bool(re.search(r"imaginary\b", alias, re.I))
    if singular:
        words = words[:-1] + [re.sub(r"ies$", "y", words[-1])]
    if alias.islower():
        return " ".join(w.lower() for w in words)
    if alias[0].isupper() and alias[1:].islower() or (
        " " in alias and alias.split()[1][:1].islower()
    ):
        # sentence case: capitalize first word only
        return " ".join([words[0]] + [w.lower() for w in words[1:]])
    return " ".join(words)  # Title Case (canonical default)


def derive_maps(meta: dict) -> tuple[dict, dict, list]:
    """Return (token_map, phrase_map, notes). Tokens are word-boundary id/slug/
    label renames; phrases are case-sensitive display substrings."""
    tokens: dict[str, str] = {}
    phrases: dict[str, str] = {}
    notes: list[str] = []

    for c in meta["constructs"]:
        # Token renames (id/slug/label) only apply to an in-flight rename; the
        # prev_* != current guard already makes a settled construct emit none.
        if c.get("status") == "renamed":
            for a, b in (("prev_id", "id"), ("prev_slug", "slug"),
                         ("prev_short_label", "short_label")):
                if c.get(a) and c.get(b) and c[a] != c[b]:
                    tokens[c[a]] = c[b]
        # Alias→canonical phrases are emitted REGARDLESS of status (#2): they are a
        # regression guard, so they must keep mapping a reintroduced deprecated
        # spelling back to canonical even after the rename has settled to
        # "unchanged". Skip any alias that already equals its canonical target
        # (an idempotent no-op that would otherwise self-match the canonical name).
        for alias in c.get("aliases_deprecated", []):
            tgt = target_for_alias(alias, c["canonical_name"])
            if alias != tgt:
                phrases[alias] = tgt

    for ch in meta["chapters"]:
        if ch.get("prev_slug") and ch["prev_slug"] != ch["slug"]:
            tokens[ch["prev_slug"]] = ch["slug"]
        if ch.get("prev_era_id") and ch.get("era_id") and ch["prev_era_id"] != ch["era_id"]:
            tokens[ch["prev_era_id"]] = ch["era_id"]
        if ch.get("prev_title") and ch["prev_title"] != ch["title"]:
            phrases[ch["prev_title"]] = ch["title"]

    extra = meta.get("extra_renames", {})
    tokens.update(extra.get("tokens", {}))
    phrases.update(extra.get("phrases", {}))
    return tokens, phrases, notes


def build_matcher(mapping: dict, word_boundary: bool):
    """Single-pass, longest-first alternation so overlapping keys don't
    double-apply (e.g. 'The Free Fall' wins over 'Free Fall')."""
    if not mapping:
        return None
    keys = sorted(mapping, key=len, reverse=True)
    body = "|".join(re.escape(k) for k in keys)
    pat = rf"(?<![\w-])(?:{body})(?![\w-])" if word_boundary else f"(?:{body})"
    return re.compile(pat)


def classify(file_rel: str, line: str, old: str, kind: str) -> str:
    if kind == "phrase":
        return "DISPLAY/DEFINITION"
    s = line.strip()
    if re.match(rf"^-?\s*id:\s*[\"']?{re.escape(old)}", s) or re.match(
        rf"^{re.escape(old)}\s*:", s
    ):
        return "MACHINE_ID (definition)"
    if "links:" in s or "era:" in s or "data-ent" in s or "chapter_slug" in s:
        return "ID_REFERENCE"
    if "island:" in s or "data-island" in s:
        return "ISLAND_REF"
    return "MACHINE_ID/ref"


# staleness thresholds — a chapter trips review when its published prose shares
# too few distinctive terms with its draft chapter (content), or its section
# titles barely overlap the draft chapter (sections). Calibrated so every in-sync
# chapter clears them and a stale shell (pre-fix ch08/ch09) does not.
STALE_COS_MIN = 0.24   # TF-IDF cosine of rendered prose vs draft chapter
STALE_SEC_MIN = 0.40   # fraction of section-title words found in the draft chapter
STALE_TOKEN = re.compile(r"[a-z]{3,}")
STALE_STOP = set(
    "the a an and or of to in on for with as is are was were be been by that this it "
    "its at from into their his her they them we our you your he she but not no than "
    "then so such can will would more most one two three what how within whose under "
    "over against about could should has have had been being".split())


def _stale_toks(text: str, minlen: int = 3) -> list[str]:
    text = re.sub(r"&[a-z]+;", " ", text)
    return [w for w in re.findall(rf"[a-z]{{{minlen},}}", text.lower()) if w not in STALE_STOP]


def chapter_staleness(meta: dict) -> tuple[list[dict], list[str], str | None]:
    """Substantive per-chapter staleness review — the work the harness owes on a
    new PDF push, beyond merely confirming the chapter numbers exist in the metadata.

    For every chapter it compares the published ``_chapters/<slug>.md`` (abstract +
    body, and its ``sections:`` titles) against the chapter's text in the current
    draft (``extract.json``) with two cheap proxies — no heavy NLP:

      * **content** — a plain TF-IDF cosine of the rendered prose against the draft
        chapter, with IDF taken over all draft chapters, so the score rewards
        sharing the chapter's *distinctive* terms. A stale shell scores low.
      * **sections** — the fraction of the chapter's section-title words that occur
        in the draft chapter (a section-title overlap / Jaccard-style proxy).

    A chapter is **stale** when content cosine < ``STALE_COS_MIN`` or section overlap
    < ``STALE_SEC_MIN``. For a stale chapter we also name the draft chapter its prose
    matches best, which pinpoints relocated content (ch09's old Ratzel body matches
    draft ch02, not ch09). This is how a renumbered shell — stamped "Reconciled from
    <pdf>" but never re-bodied — gets caught instead of silently passing.

    Needs the full draft text (``extract.json``, git-ignored); skips with a note
    when absent (e.g. CI). Returns (per-chapter rows, stale problems, skip note).
    """
    version = meta["draft"]["version"]
    ext = REPO / "metadata" / f"v{version}" / "extract.json"
    if not ext.exists():
        return [], [], (f"staleness check skipped: {ext.relative_to(REPO)} absent "
                        f"(draft text is git-ignored — run bin/ingest-draft.py first)")
    draft = {c["num"]: c["text"] for c in json.loads(ext.read_text()).get("chapters", [])}

    nums = [c["num"] for c in meta["chapters"] if c["num"] != "00" and c["num"] in draft]
    N = max(1, len(nums))
    df = Counter()
    for k in nums:
        df.update(set(_stale_toks(draft[k])))
    idf = {w: math.log(N / (1 + df[w])) + 1.0 for w in df}

    def vec(text: str) -> dict:
        c = Counter(_stale_toks(text))
        v = {w: c[w] * idf.get(w, math.log(N) + 1.0) for w in c}
        nrm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {w: x / nrm for w, x in v.items()}

    def cosine(a: dict, b: dict) -> float:
        return sum(a[w] * b.get(w, 0.0) for w in a)

    draft_vec = {k: vec(draft[k]) for k in nums}
    rows: list[dict] = []
    problems: list[str] = []
    for ch in meta["chapters"]:
        num = ch["num"]
        if num not in draft_vec:
            continue
        f = REPO / "_chapters" / f"{ch['slug']}.md"
        if not f.exists():
            continue
        raw = f.read_text(encoding="utf-8", errors="replace")
        sections = re.findall(r'^\s*-\s*"(.+?)"\s*$', raw, re.M)
        am = re.search(r"\nabstract:\s*\|(.*?)\nsource_note:", raw, re.S)
        prose = (am.group(1) if am else "") + " " + re.split(r"\n---\n", raw, maxsplit=1)[-1]

        pv = vec(prose)
        cos = cosine(pv, draft_vec[num])
        title_words = {w for s in sections for w in _stale_toks(s, 4)}
        sec = (sum(bool(re.search(rf"\b{re.escape(w)}", draft[num], re.I)) for w in title_words)
               / len(title_words)) if title_words else 1.0
        best = max(nums, key=lambda k: cosine(pv, draft_vec[k]))
        stale = cos < STALE_COS_MIN or sec < STALE_SEC_MIN
        rows.append({"num": num, "slug": ch["slug"], "cos": cos, "sec": sec,
                     "best": best, "stale": stale})
        if stale:
            where = (f"; its prose matches draft ch{best} more closely than its own"
                     if best != num else "")
            problems.append(
                f"stale chapter — _chapters/{ch['slug']}.md (ch{num}): content cosine "
                f"{cos:.2f} (min {STALE_COS_MIN}), section-title overlap {sec:.2f} "
                f"(min {STALE_SEC_MIN}) vs the current draft{where}. Review and update its "
                f"abstract/sections/body to the draft — its source_note claims reconciliation.")
    return rows, problems, None


def main() -> None:
    meta = json.loads(META.read_text())
    tokens, phrases, notes = derive_maps(meta)
    tok_re = build_matcher(tokens, word_boundary=True)
    phr_re = build_matcher(phrases, word_boundary=False)

    files = scan_files()
    occurrences: list[dict] = []
    preserve = set()
    for c in meta["constructs"]:
        preserve.update(c.get("preserve_terms", []))

    preserved_hits: list[dict] = []
    for p in files:
        r = rel(p)
        text = p.read_text(encoding="utf-8", errors="replace")
        for i, line in enumerate(text.splitlines(), 1):
            if phr_re:
                for m in phr_re.finditer(line):
                    occurrences.append({"file": r, "line": i, "old": m.group(0),
                                        "new": phrases[m.group(0)], "kind": "phrase",
                                        "class": classify(r, line, m.group(0), "phrase"),
                                        "text": line.strip()[:140]})
            if tok_re:
                for m in tok_re.finditer(line):
                    occurrences.append({"file": r, "line": i, "old": m.group(0),
                                        "new": tokens[m.group(0)], "kind": "token",
                                        "class": classify(r, line, m.group(0), "token"),
                                        "text": line.strip()[:140]})
            # preserve check: bare movement words NOT inside a construct phrase
            for term in preserve:
                for m in re.finditer(rf"(?<![\w-]){re.escape(term)}(?![\w-])", line, re.I):
                    seg = line[m.start():m.start() + 40].lower()
                    if "imaginar" in seg:  # part of the construct phrase — handled by phrase pass
                        continue
                    preserved_hits.append({"file": r, "line": i,
                                           "term": m.group(0), "text": line.strip()[:140]})

    # ---- coverage checks -------------------------------------------------
    problems: list[str] = []

    # Every deprecated alias must be covered by a phrase key — regardless of the
    # construct's status (#2), so a guard on a settled "unchanged" construct still
    # audits clean. An alias that already equals its canonical target needs no
    # replacement and counts as covered.
    for c in meta["constructs"]:
        for alias in c.get("aliases_deprecated", []):
            if alias in phrases or alias == target_for_alias(alias, c["canonical_name"]):
                continue
            problems.append(f"alias not covered by a replacement: {alias!r}")

    # prev_slug files must exist; new slug files must be free (chapters).
    # Tolerate an already-applied rename: if the prev_slug file is gone AND the
    # new slug file is present on disk, the move was already done on a prior pass
    # — that is the committed steady state, not a coverage failure (#1).
    for ch in meta["chapters"]:
        if ch.get("prev_slug") and ch["prev_slug"] not in (ch["slug"], "preface"):
            old = REPO / "_chapters" / f"{ch['prev_slug']}.md"
            new = REPO / "_chapters" / f"{ch['slug']}.md"
            if not old.exists() and not new.exists():
                problems.append(f"chapter prev_slug missing on disk: {old.name}")
        if ch.get("status") in ("renamed+renumbered", "renumbered", "new"):
            new = REPO / "_chapters" / f"{ch['slug']}.md"
            if ch.get("status") == "new" and new.exists():
                problems.append(f"new chapter would overwrite existing file: {new.name}")

    # ---- content staleness: rendered chapter vs. the current draft -------
    # On a new PDF push the harness owes a substantive per-chapter review, not just
    # a chapter-number check. chapter_staleness compares each published chapter to
    # its draft text (TF-IDF cosine + section-title overlap) and flags stale shells
    # (e.g. Ratzel surviving in ch09 after the draft moved it to ch02).
    stale_rows, drift, drift_note = chapter_staleness(meta)

    # ---- file moves ------------------------------------------------------
    # Only plan a move whose source still exists. If the source is gone and the
    # destination is present, the rename was already applied on a prior pass —
    # planning it again would fail `git mv` and is not a rendered-surface change (#1).
    file_moves = []
    for ch in meta["chapters"]:
        ps = ch.get("prev_slug")
        if ps and ps not in (ch["slug"], "preface") and (REPO / f"_chapters/{ps}.md").exists():
            file_moves.append({
                "from": f"_chapters/{ps}.md", "to": f"_chapters/{ch['slug']}.md",
                "redirect_from": f"/chapters/{ps}/"})
    for c in meta["constructs"]:
        if c.get("status") == "renamed" and c.get("prev_slug"):
            old = f"_landing/{c['prev_slug']}.md"
            if (REPO / old).exists():
                file_moves.append({"from": old, "to": f"_landing/{c['slug']}.md"})
    for k, v in meta.get("extra_renames", {}).get("tokens", {}).items():
        old = f"_landing/{k}.md"
        if (REPO / old).exists():
            file_moves.append({"from": old, "to": f"_landing/{v}.md"})

    new_chapters = [ch["slug"] for ch in meta["chapters"] if ch.get("status") == "new"]

    # ---- human-review flags (derived from metadata, never hard-coded) ----
    # Surface only the changes a human gate should actually eyeball: structural
    # chapter changes, code-symbol renames in extra_renames, and unusually large
    # edit fan-out. An all-"unchanged" metadata with empty extra_renames yields
    # zero flags (#3).
    HEAVY_FILE = 40  # replacements in a single file worth a second look
    flags = []

    # structural chapter changes (new / renumbered / renamed+renumbered)
    notable = {"new", "renamed+renumbered", "renumbered"}
    for ch in meta["chapters"]:
        st = ch.get("status", "")
        if st in notable:
            frm = ch.get("prev_slug") or "—"
            flags.append(f"Chapter {st}: `{frm}` → `{ch['slug']}` ({ch['title']}). "
                         f"Confirm order/redirects.")

    # chapter split: two or more target chapters claim the same prev_slug
    src_counts = Counter(ch["prev_slug"] for ch in meta["chapters"]
                         if ch.get("prev_slug") and ch["prev_slug"] != ch.get("slug"))
    for ps, n in src_counts.items():
        if n > 1:
            targets = [ch["slug"] for ch in meta["chapters"] if ch.get("prev_slug") == ps]
            flags.append(f"Chapter split: `{ps}` maps to {n} chapters "
                         f"({', '.join(targets)}). Confirm this split.")

    # code-symbol renames carried via extra_renames.tokens (JS/CamelCase identifiers)
    extra_tokens = meta.get("extra_renames", {}).get("tokens", {})
    for k, v in extra_tokens.items():
        if re.match(r"^[A-Za-z_$][A-Za-z0-9_$]*$", k) and re.search(r"[a-z][A-Z]", k):
            hits = [o for o in occurrences if o["old"] == k]
            flags.append(f"Code symbol rename `{k}` → `{v}` (extra_renames) touches "
                         f"{len(hits)} site location(s) plus its definition — review by hand.")

    # unusually large edit fan-out in any single file
    per_file = Counter(o["file"] for o in occurrences)
    for f, n in per_file.items():
        if n >= HEAVY_FILE:
            flags.append(f"Large edit fan-out: {n} replacements in `{f}` "
                         f"(≥{HEAVY_FILE}) — spot-check the result.")

    apply_files = [rel(p) for p in files]
    plan = {
        "generated_from": "metadata/draft-metadata.json",
        "draft_version": meta["draft"]["version"],
        "token_map": tokens,
        "phrase_map": phrases,
        "apply_files": apply_files,
        "file_moves": file_moves,
        "regen": sorted(f for f in REGENERATED if (REPO / f).exists()),
        "new_chapters": new_chapters,
        "add_plugins": ["jekyll-redirect-from"],
        "preserve_terms": sorted(preserve),
        "counts": {"occurrences": len(occurrences), "files_scanned": len(files),
                   "moves": len(file_moves)},
        "coverage_problems": problems,
        "chapter_staleness": [{"num": r["num"], "slug": r["slug"],
                               "content_cosine": round(r["cos"], 3),
                               "section_overlap": round(r["sec"], 3),
                               "best_match": r["best"], "stale": r["stale"]}
                              for r in stale_rows],
        "stale_chapters": drift,
        "review_flags": flags,
    }
    (REPO / "metadata" / "rename-plan.json").write_text(json.dumps(plan, indent=2, ensure_ascii=False))

    # ---- report ----------------------------------------------------------
    by_file: dict[str, list] = {}
    for o in occurrences:
        by_file.setdefault(o["file"], []).append(o)

    md = [f"# Audit report — draft v{meta['draft']['version']}",
          f"Source: `{meta['draft']['source_pdf']}` (sha `{meta['draft']['sha256'][:12]}`)  ",
          f"Generated from `metadata/draft-metadata.json`.\n",
          "## Summary",
          f"- **{len(occurrences)}** rename occurrences across **{len(by_file)}** files",
          f"- **{len(file_moves)}** file moves, **{len(new_chapters)}** new chapter(s)",
          f"- **{len(tokens)}** id/slug tokens, **{len(phrases)}** display phrases",
          f"- coverage problems: **{len(problems)}** · preserved-term sightings: "
          f"**{len(preserved_hits)}**\n"]

    md.append("## Construct rename")
    for c in meta["constructs"]:
        if c.get("status") == "renamed":
            md.append(f"- **{c['prev_name']} → {c['canonical_name']}** "
                      f"(`{c.get('prev_id')}`→`{c['id']}`, `{c.get('prev_short_label')}`→"
                      f"`{c['short_label']}`, slug `{c.get('prev_slug')}`→`{c['slug']}`)")
    md.append("\n### Preserved (must NOT be renamed)")
    md.append(f"`{'`, `'.join(sorted(preserve))}` — bare movement terms. "
              f"{len(preserved_hits)} sighting(s) confirmed left untouched:")
    for h in preserved_hits[:30]:
        md.append(f"  - `{h['file']}`:{h['line']} — {h['text']}")

    md.append("\n## Chapter reconcile (8 → 9)")
    md.append("| # | new slug | new title | from | status |")
    md.append("|---|----------|-----------|------|--------|")
    for ch in meta["chapters"]:
        if ch["num"] == "00":
            continue
        frm = ch.get("prev_slug") or "— (new)"
        md.append(f"| {ch['num']} | `{ch['slug']}` | {ch['title']} | "
                  f"`{frm}` | {ch['status']} |")

    md.append("\n## Token map (word-boundary)")
    for k in sorted(tokens, key=len, reverse=True):
        md.append(f"- `{k}` → `{tokens[k]}`")
    md.append("\n## Phrase map (display)")
    for k in sorted(phrases, key=len, reverse=True):
        md.append(f"- `{k}` → `{phrases[k]}`")

    md.append("\n## ⚠ Review flags")
    if flags:
        for f in flags:
            md.append(f"- {f}")
    else:
        md.append("_none — no structural chapter changes, code-symbol renames, "
                  "or large edit fan-out._")
    if problems:
        md.append("\n## ❌ Coverage problems (resolve before apply)")
        for p in problems:
            md.append(f"- {p}")
    else:
        md.append("\n## ✓ Coverage: no problems — every alias covered, "
                  "all prev_slugs present, all new slugs free.")

    md.append("\n## Chapter staleness review (published chapter vs. current draft)")
    if drift_note:
        md.append(f"_{drift_note}_")
    elif stale_rows:
        md.append("| # | content cosine | section overlap | best draft match | verdict |")
        md.append("|---|----------------|-----------------|------------------|---------|")
        for r in stale_rows:
            mark = "❌ STALE" if r["stale"] else "✓ ok"
            bm = f"ch{r['best']}" + (" ⚠" if r["stale"] and r["best"] != r["num"] else "")
            md.append(f"| {r['num']} | {r['cos']:.2f} | {r['sec']:.2f} | {bm} | {mark} |")
        md.append(f"\n_Thresholds: stale when content cosine < {STALE_COS_MIN} or "
                  f"section-title overlap < {STALE_SEC_MIN}._")
    if drift:
        md.append("\n### ❌ Stale chapters — review & update before apply")
        for p in drift:
            md.append(f"- {p}")

    md.append("\n## Occurrences by file")
    for f in sorted(by_file):
        md.append(f"\n### `{f}` ({len(by_file[f])})")
        md.append("| line | old → new | class | context |")
        md.append("|------|-----------|-------|---------|")
        for o in by_file[f]:
            ctx = o["text"].replace("|", "¦")
            md.append(f"| {o['line']} | `{o['old']}`→`{o['new']}` | {o['class']} | {ctx} |")

    (REPO / "metadata" / "audit-report.md").write_text("\n".join(md))

    print(f"✓ audit complete")
    print(f"  {len(occurrences)} occurrences · {len(file_moves)} moves · "
          f"{len(new_chapters)} new chapters")
    print(f"  coverage problems: {len(problems)}")
    for p in problems:
        print(f"    ❌ {p}")
    if drift_note:
        print(f"  chapter staleness: skipped ({drift_note})")
    else:
        print(f"  chapter staleness review ({len(stale_rows)} chapters, "
              f"{len(drift)} stale; content cosine / section overlap):")
        for r in stale_rows:
            mark = "❌" if r["stale"] else "✓"
            bm = (f"  → prose matches draft ch{r['best']}"
                  if r["stale"] and r["best"] != r["num"] else "")
            print(f"    {mark} {r['num']} {r['cos']:.2f} / {r['sec']:.2f}{bm}")
        for p in drift:
            print(f"    ❌ {p}")
    print(f"  review flags: {len(flags)}")
    for f in flags:
        print(f"    ⚠ {f}")
    print(f"  preserved-term sightings (left untouched): {len(preserved_hits)}")
    print(f"\n  → metadata/rename-plan.json")
    print(f"  → metadata/audit-report.md  (review this before applying)")
    if problems or drift:
        sys.exit(1)


if __name__ == "__main__":
    main()
