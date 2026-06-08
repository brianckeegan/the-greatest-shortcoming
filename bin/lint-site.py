#!/usr/bin/env python3
"""
lint-site.py — offline pre-push verification gate for the harness (#9).

The local Jekyll build is broken (native gems), so build breakage is otherwise
only caught in CI after it hits a branch. This script runs a fast, dependency-light
**offline** lint that catches the cheap failures before you push:

  * _config.yml and every _data/*.yml parse as valid YAML
  * every _chapters/*.md and _landing/*.md has a well-formed YAML front-matter
    block (delimited by --- / ---) that parses to a mapping with required keys
  * cross-reference integrity: each slug keyed in _data/cards.yml resolves to a
    chapter file on disk, and each chapter's front-matter `slug` matches its
    filename
  * (best-effort) no deprecated construct id/slug/alias from a settled rename
    survives in a build-scope file — a reverse-drift guard mirroring the audit

It does NOT replace the CI Jekyll build; it's a final local gate. Exit 0 = clean,
exit 1 = problems (printed). Uses PyYAML if present; degrades to a structural
front-matter check otherwise.

    python3 bin/lint-site.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

try:
    import yaml  # PyYAML
    HAVE_YAML = True
except ImportError:  # pragma: no cover
    HAVE_YAML = False

FRONT_MATTER = re.compile(r"^---\n(.*?)\n---\n?", re.S)


def rel(p: Path) -> str:
    return str(p.relative_to(REPO))


def parse_yaml(text: str, where: str, problems: list[str]):
    """Parse YAML text; record a problem and return None on failure."""
    if not HAVE_YAML:
        return None
    try:
        return yaml.safe_load(text)
    except yaml.YAMLError as e:
        msg = str(e).replace("\n", " ")
        problems.append(f"{where}: invalid YAML — {msg[:200]}")
        return None


def lint_data(problems: list[str]) -> None:
    for p in sorted((REPO / "_data").glob("*.yml")):
        text = p.read_text(encoding="utf-8")
        if HAVE_YAML:
            doc = parse_yaml(text, rel(p), problems)
            if doc is None and text.strip():
                # parse_yaml already recorded the error; nothing more to add
                pass


def lint_config(problems: list[str]) -> None:
    cfg = REPO / "_config.yml"
    if not cfg.exists():
        problems.append("_config.yml: missing")
        return
    parse_yaml(cfg.read_text(encoding="utf-8"), "_config.yml", problems)


def front_matter(path: Path, problems: list[str], required: tuple[str, ...]) -> dict | None:
    text = path.read_text(encoding="utf-8")
    m = FRONT_MATTER.match(text)
    if not m:
        problems.append(f"{rel(path)}: missing or malformed front matter (--- ... ---)")
        return None
    fm = parse_yaml(m.group(1), f"{rel(path)} front matter", problems)
    if HAVE_YAML:
        if not isinstance(fm, dict):
            problems.append(f"{rel(path)}: front matter is not a mapping")
            return None
        for key in required:
            if key not in fm:
                problems.append(f"{rel(path)}: front matter missing required key '{key}'")
    return fm if isinstance(fm, dict) else None


def lint_collections(problems: list[str]) -> dict[str, dict]:
    """Lint chapter + landing front matter; return {slug: front_matter} for chapters."""
    chapter_fm: dict[str, dict] = {}
    for p in sorted((REPO / "_chapters").glob("*.md")):
        fm = front_matter(p, problems, required=("slug", "num", "title"))
        if fm and HAVE_YAML:
            slug = fm.get("slug")
            stem = p.stem
            # filename is either '<slug>.md' or 'NN-<slug-or-name>.md'; the preface
            # is keyed 'preface' but filed as '00-preface.md'. Accept both forms.
            stem_unprefixed = re.sub(r"^\d{2}-", "", stem)
            if slug and slug not in (stem, stem_unprefixed):
                problems.append(f"{rel(p)}: front-matter slug '{slug}' ≠ filename "
                                f"'{stem}' (nor its unprefixed form '{stem_unprefixed}')")
            if slug:
                chapter_fm[slug] = fm
    # Landing pages are typed by `kind`; title is required only for some kinds.
    for p in sorted((REPO / "_landing").glob("*.md")):
        front_matter(p, problems, required=("kind",))
    return chapter_fm


def lint_cards_xref(chapter_fm: dict[str, dict], problems: list[str]) -> None:
    """Every slug keyed in cards.yml must resolve to a chapter file on disk."""
    cards = REPO / "_data" / "cards.yml"
    if not (cards.exists() and HAVE_YAML):
        return
    doc = parse_yaml(cards.read_text(encoding="utf-8"), "_data/cards.yml", problems)
    if not isinstance(doc, dict):
        return
    for slug in doc:
        # 'preface' is keyed without the 00- numeric prefix
        candidates = [REPO / "_chapters" / f"{slug}.md"]
        if slug == "preface":
            candidates.append(REPO / "_chapters" / "00-preface.md")
        if not any(c.exists() for c in candidates):
            problems.append(f"_data/cards.yml: card slug '{slug}' has no chapter file "
                            f"(_chapters/{slug}.md)")


def lint_reverse_drift(problems: list[str]) -> None:
    """Best-effort: no deprecated id/slug/alias from a settled rename survives in a
    build-scope file. Mirrors the audit's reverse-drift invariant so a stale spelling
    can't silently ship. Skipped if metadata is absent/unreadable."""
    meta_path = REPO / "metadata" / "draft-metadata.json"
    if not meta_path.exists():
        return
    try:
        meta = json.loads(meta_path.read_text())
    except (json.JSONDecodeError, OSError):
        return
    deprecated: list[str] = []
    for c in meta.get("constructs", []):
        for k in ("prev_id", "prev_slug", "prev_short_label"):
            v = c.get(k)
            # only flag a prev_* that has actually been renamed away from current
            cur = {"prev_id": c.get("id"), "prev_slug": c.get("slug"),
                   "prev_short_label": c.get("short_label")}[k]
            if v and v != cur:
                deprecated.append(v)
        deprecated += list(c.get("aliases_deprecated", []))
    deprecated = sorted(set(d for d in deprecated if d), key=len, reverse=True)
    if not deprecated:
        return
    rx = re.compile("|".join(re.escape(d) for d in deprecated))
    build_globs = ["_config.yml", "_data/*.yml", "_chapters/*.md", "_landing/*.md",
                   "_includes/*.html", "_layouts/*.html", "index.html"]
    seen = set()
    for g in build_globs:
        for p in sorted(REPO.glob(g)):
            r = rel(p)
            if r in seen or not p.is_file():
                continue
            seen.add(r)
            for i, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                # redirect_from intentionally preserves OLD slugs — not drift
                if re.match(r"\s*redirect_from\s*:", line):
                    continue
                m = rx.search(line)
                if m:
                    problems.append(f"{r}:{i}: deprecated term '{m.group(0)}' survives "
                                    f"in a build-scope file (reverse drift)")


def main() -> None:
    problems: list[str] = []
    if not HAVE_YAML:
        print("⚠ PyYAML not installed — YAML validity checks are structural only "
              "(install pyyaml for full linting).", file=sys.stderr)

    lint_config(problems)
    lint_data(problems)
    chapter_fm = lint_collections(problems)
    lint_cards_xref(chapter_fm, problems)
    lint_reverse_drift(problems)

    n_data = len(list((REPO / "_data").glob("*.yml")))
    n_ch = len(list((REPO / "_chapters").glob("*.md")))
    n_land = len(list((REPO / "_landing").glob("*.md")))
    print(f"✓ lint-site: checked _config.yml + {n_data} data file(s) + "
          f"{n_ch} chapter(s) + {n_land} landing page(s)")
    if problems:
        print(f"  ✗ {len(problems)} problem(s):")
        for p in problems:
            print(f"    - {p}")
        sys.exit(1)
    print("  no problems — YAML valid, front matter well-formed, slugs resolve, "
          "no reverse drift.")


if __name__ == "__main__":
    main()
