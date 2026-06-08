#!/usr/bin/env python3
"""
ingest-draft.py — Stage 1 of the draft-reconciliation harness.

Deterministically turn a versioned manuscript PDF dropped in ``source/`` into a
per-chapter text bundle that the *PDF-reading agent* (Stage 2) reads to populate
``metadata/draft-metadata.json`` (the metadata "interface").

    Usage:
        python3 bin/ingest-draft.py source/The_Greatest_Shortcoming-1.pdf
        python3 bin/ingest-draft.py            # auto-pick newest source/*.pdf

    Output:
        metadata/<version>/extract.json   structured: toc + per-chapter text
        metadata/<version>/extract.txt    human-skimmable

No LLM, no network. Robust to PARTIAL drafts: it records which chapters actually
have a drafted body in *this* PDF and which are Contents-only, so downstream
stages know where a summary can come from the PDF vs. another source.

Only dependency is PyMuPDF (``fitz``), already present in this environment.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover
    sys.exit("PyMuPDF is required: pip install pymupdf")

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / "source"


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def pick_pdf(arg: str | None) -> Path:
    if arg:
        p = Path(arg)
        return p if p.is_absolute() else (REPO / p)
    pdfs = sorted(SOURCE.glob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not pdfs:
        sys.exit(f"no PDFs found in {SOURCE}")
    return pdfs[0]


def parse_version(name: str) -> int:
    """`The_Greatest_Shortcoming-1.pdf` -> 1; default 1."""
    m = re.search(r"-(\d+)\.pdf$", name)
    return int(m.group(1)) if m else 1


def parse_contents(pages: list[str]) -> list[dict]:
    """Find the Contents page and extract the authoritative chapter list.

    Returns ordered [{num, title, printed_page}] for numbered chapters. Page
    numbers in the TOC are the *book's* printed pages and may exceed the PDF
    length when the draft is partial — that's fine, they're advisory here.
    """
    toc_text = ""
    for t in pages:
        n = _norm(t)
        if n.startswith("Contents"):
            toc_text = n
            break
    if not toc_text:
        return []
    # "1 Boulder 1 2 The Inheritance 17 ... 9 Boulder Again 213 Notes 231 ..."
    # (?<!\d) keeps a chapter number from being the tail of a page number
    # (e.g. the "31" inside "231 Bibliography"). "Notes"/"Bibliography" are not
    # numbered, so they never match as chapters.
    pat = re.compile(
        r"(?<!\d)(\d{1,2})\s+([A-Z][A-Za-z'’]+(?:\s+[A-Za-z'’]+)*?)\s+(\d{1,3})"
        r"(?=\s+\d{1,2}\s+[A-Z]|\s+Notes\b|\s+Bibliography\b|\s*$)"
    )
    out = []
    for m in pat.finditer(toc_text):
        out.append(
            {"num": f"{int(m.group(1)):02d}", "title": m.group(2).strip(),
             "printed_page": int(m.group(3))}
        )
    return out


def find_openings(pages: list[str], titles: list[str]) -> dict[str, int]:
    """Map chapter title -> pdf page index of its opening page.

    A chapter opening renders as ``<num> <Title> <SMALL-CAPS lead-in>`` at the
    very top of a page; the small-caps lead distinguishes it from a running
    header (which continues in lowercase).
    """
    # longest titles first so "Boulder Again" wins over "Boulder"
    ordered = sorted(titles, key=len, reverse=True)
    found: dict[str, int] = {}
    for i, raw in enumerate(pages):
        head = _norm(raw)[:80]
        for title in ordered:
            if title in found:
                continue
            m = re.match(rf"^\d{{1,2}}\s+{re.escape(title)}\s+(.{{0,40}})", head)
            if m and re.search(r"[A-Z]{3,}", m.group(1)):
                found[title] = i
                break
    return found


def section_start(pages: list[str], name: str) -> int | None:
    """First page whose body *starts* with ``name`` (not a TOC mention of it)."""
    for i, raw in enumerate(pages):
        n = _norm(raw)
        if n.startswith(name) and len(n) > len(name) + 8:
            return i
    return None


def main() -> None:
    pdf = pick_pdf(sys.argv[1] if len(sys.argv) > 1 else None)
    if not pdf.exists():
        sys.exit(f"not found: {pdf}")

    doc = fitz.open(pdf)
    pages = [p.get_text() for p in doc]
    sha = hashlib.sha256(pdf.read_bytes()).hexdigest()
    version = parse_version(pdf.name)

    toc = parse_contents(pages)
    titles = [c["title"] for c in toc]
    openings = find_openings(pages, titles)
    notes_at = section_start(pages, "Notes")

    # Body boundary = first Notes/Bibliography page (chapters end there).
    body_end = notes_at if notes_at is not None else len(pages)

    # Build ordered list of (title, opening_idx) for present chapters.
    present = sorted(((idx, t) for t, idx in openings.items()), key=lambda x: x[0])
    ranges: dict[str, tuple[int, int]] = {}
    for j, (idx, title) in enumerate(present):
        end = present[j + 1][0] if j + 1 < len(present) else body_end
        ranges[title] = (idx, end)

    chapters = []
    for c in toc:
        title = c["title"]
        if title in ranges:
            a, b = ranges[title]
            text = _norm("\n".join(pages[a:b]))
            chapters.append({**c, "present": True, "pdf_pages": [a, b - 1],
                             "chars": len(text), "text": text})
        else:
            chapters.append({**c, "present": False, "pdf_pages": None,
                             "chars": 0, "text": ""})

    # Front matter (preface) as its own segment, if detectable.
    preface_idx = section_start(pages, "Preface")
    first_ch = present[0][0] if present else body_end
    preface_text = ""
    if preface_idx is not None and preface_idx < first_ch:
        preface_text = _norm("\n".join(pages[preface_idx:first_ch]))

    out_dir = REPO / "metadata" / f"v{version}"
    out_dir.mkdir(parents=True, exist_ok=True)

    extract = {
        "draft": {
            "source_pdf": str(pdf.relative_to(REPO)),
            "version": version,
            "pages": len(pages),
            "sha256": sha,
            "title_page": _norm(pages[0])[:200] if pages else "",
        },
        "preface_text": preface_text,
        "chapters": chapters,
    }

    (out_dir / "extract.json").write_text(json.dumps(extract, indent=2, ensure_ascii=False))

    lines = [
        f"# Extract — {pdf.name} (v{version}, {len(pages)} pp, sha {sha[:12]})",
        f"# title page: {extract['draft']['title_page']}",
        "",
        "## Table of contents (authoritative chapter list)",
    ]
    for c in chapters:
        flag = "drafted" if c["present"] else "TOC-only (no body in this PDF)"
        rng = f"pdf p{c['pdf_pages'][0]}–{c['pdf_pages'][1]}" if c["present"] else "—"
        lines.append(f"  {c['num']}  {c['title']:<18} [{flag}] {rng}")
    lines += ["", "## Preface", preface_text[:4000], ""]
    for c in chapters:
        if c["present"]:
            lines += [f"## {c['num']} {c['title']}  ({c['chars']} chars)", c["text"][:8000], ""]
    (out_dir / "extract.txt").write_text("\n".join(lines))

    drafted = sum(c["present"] for c in chapters)
    print(f"✓ ingested {pdf.name}  →  {out_dir.relative_to(REPO)}/")
    print(f"  version {version} · {len(pages)} pp · sha {sha[:12]}")
    print(f"  {len(chapters)} chapters in TOC · {drafted} with a drafted body in this PDF")
    for c in chapters:
        mark = "●" if c["present"] else "○"
        print(f"    {mark} {c['num']} {c['title']}"
              + ("" if c["present"] else "   (Contents-only)"))
    print(f"\nNext: run the PDF-reading agent (/ingest-draft) to write "
          f"metadata/draft-metadata.json from {out_dir.relative_to(REPO)}/extract.txt")


if __name__ == "__main__":
    main()
