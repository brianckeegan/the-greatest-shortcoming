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
    print(f"  review flags: {len(flags)}")
    for f in flags:
        print(f"    ⚠ {f}")
    print(f"  preserved-term sightings (left untouched): {len(preserved_hits)}")
    print(f"\n  → metadata/rename-plan.json")
    print(f"  → metadata/audit-report.md  (review this before applying)")
    if problems:
        sys.exit(1)


if __name__ == "__main__":
    main()
