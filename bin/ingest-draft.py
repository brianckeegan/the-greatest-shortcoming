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

import argparse
import datetime
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


DATE_RE = re.compile(r"(?:^|[^\d])(\d{8})\.pdf$")
ORDINAL_RE = re.compile(r"-(\d+)\.pdf$")


def _date_key(name: str) -> str | None:
    """Return the YYYYMMDD date stamp embedded in a filename, or None."""
    m = DATE_RE.search(name)
    if not m:
        return None
    d = m.group(1)
    # sanity: plausible calendar date (year 19xx–20xx, month 01–12, day 01–31)
    if re.match(r"(?:19|20)\d\d(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])$", d):
        return d
    return None


def parse_version(pdf: Path, sources: list[Path] | None = None) -> tuple[int, str, str | None]:
    """Resolve a stable, monotonic version ordinal for ``pdf``.

    Returns ``(version, kind, warning)`` where *kind* is one of
    ``"ordinal"`` (``…-N.pdf``), ``"date"`` (``…YYYYMMDD.pdf``, ranked
    chronologically among the date-stamped PDFs in ``source/``), or
    ``"fallback"`` (no recognized pattern). *warning* is a human message when
    the name matched no version pattern, else ``None``.

    Date-stamped drafts are ordered by their calendar date so two dated PDFs map
    to distinct, date-ordered version dirs; explicit ``-N`` ordinals are honored
    verbatim. We never silently collapse an unrecognized name to v1 — we warn.
    """
    name = pdf.name
    m = ORDINAL_RE.search(name)
    if m:
        return int(m.group(1)), "ordinal", None

    if sources is None:
        sources = sorted(SOURCE.glob("*.pdf"))
    dated = sorted({_date_key(p.name) for p in sources if _date_key(p.name)})
    dk = _date_key(name)
    if dk:
        # 1-based chronological rank among all date-stamped drafts present
        return dated.index(dk) + 1, "date", None

    # no recognized pattern — order by mtime rank rather than defaulting to 1
    others = sorted(sources, key=lambda p: p.stat().st_mtime)
    try:
        rank = others.index(pdf) + 1
    except ValueError:
        rank = len(others) + 1
    return rank, "fallback", (
        f"filename {name!r} matches no version pattern (-N.pdf or YYYYMMDD.pdf); "
        f"falling back to mtime rank v{rank}. Rename to a versioned/dated form "
        f"to make ordering explicit.")


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


def find_openings(pages: list[str], chapters: list[dict]) -> dict[str, int]:
    """Map chapter title -> pdf page index of its opening page.

    A chapter opening renders at the very top of its page as
    ``<chapter-number> <Title> <body lead-in>`` — the chapter's *own* number,
    immediately followed by its title, then the first words of prose. That form
    is unique to openings: the running headers are ``<page-number> Chapter <n>
    <Title> …`` on verso pages and ``<page-number> <body> …`` on recto pages,
    and a mid-chapter section header is ``<page-number> <Section Title> …`` —
    none of which begins with the chapter's own number followed by its title.

    So we key on the *exact* chapter number + title at the start of the
    normalized page. An earlier heuristic instead matched any ``\\d{1,2}`` and
    required a SMALL-CAPS lead-in (``[A-Z]{3,}``) right after the title to tell
    an opening from a header. That silently missed chapters whose first words
    aren't a small-caps run — e.g. ones opening on a quotation
    (``3 The Bottle “I looked…``) or a short lead word
    (``4 The Quarantine IN September…``). Their bodies were then absorbed into
    the preceding chapter and they were mis-flagged "Contents-only".
    See metadata/HARNESS-FEEDBACK.md (#10).
    """
    # Longest titles first so "Boulder Again" is considered before "Boulder";
    # the per-chapter number already disambiguates, this is belt-and-braces.
    ordered = sorted(chapters, key=lambda c: len(c["title"]), reverse=True)
    found: dict[str, int] = {}
    for i, raw in enumerate(pages):
        head = _norm(raw)
        for c in ordered:
            title = c["title"]
            if title in found:
                continue
            # exact chapter number, the title as a whole token, then body prose
            if re.match(rf"^{int(c['num'])}\s+{re.escape(title)}\s+\S", head):
                found[title] = i
                break
    return found


def chapter_ranges(openings: dict[str, int], body_end: int) -> dict[str, tuple[int, int]]:
    """Half-open ``[start, end)`` pdf-page span for each opened chapter.

    Each chapter runs from its opening page up to (but not including) the next
    chapter's opening; the last opened chapter runs to ``body_end`` (the first
    Notes/Bibliography page). A chapter whose opening was never found does not
    appear here — correct boundary detection is therefore what keeps a missed
    opening from silently extending the previous chapter over the gap.
    """
    present = sorted(((idx, t) for t, idx in openings.items()), key=lambda x: x[0])
    ranges: dict[str, tuple[int, int]] = {}
    for j, (idx, title) in enumerate(present):
        end = present[j + 1][0] if j + 1 < len(present) else body_end
        ranges[title] = (idx, end)
    return ranges


def section_start(pages: list[str], name: str) -> int | None:
    """First page whose body *starts* with ``name`` (not a TOC mention of it)."""
    for i, raw in enumerate(pages):
        n = _norm(raw)
        if n.startswith(name) and len(n) > len(name) + 8:
            return i
    return None


def _today() -> str:
    return datetime.date.today().isoformat()


def existing_sha(out_dir: Path) -> str | None:
    """sha256 recorded by a prior extract in ``out_dir`` (None if absent)."""
    ej = out_dir / "extract.json"
    if not ej.exists():
        return None
    try:
        return json.loads(ej.read_text()).get("draft", {}).get("sha256")
    except (json.JSONDecodeError, OSError):
        return None


def provenance_warnings(sha: str, version: int, this_dir: Path) -> list[str]:
    """Re-ingest provenance guard (#8): warn if this PDF's sha was already
    extracted under a *different* version slot, and if the resolved version is
    not newer than the last reconciled draft recorded in draft-metadata.json."""
    warns: list[str] = []

    # same content already seen under another metadata/v<N>/ dir?
    meta_root = REPO / "metadata"
    for d in sorted(meta_root.glob("v*")):
        if d == this_dir or not d.is_dir():
            continue
        if existing_sha(d) == sha:
            warns.append(f"identical content (sha {sha[:12]}) was already ingested as "
                         f"{d.relative_to(REPO)}/ — this looks like a re-ingest under a "
                         f"different name/version.")

    # version not advancing past the last reconciled draft?
    dm = meta_root / "draft-metadata.json"
    if dm.exists():
        try:
            last = json.loads(dm.read_text()).get("draft", {})
            last_v, last_sha = last.get("version"), last.get("sha256")
        except (json.JSONDecodeError, OSError):
            last_v = last_sha = None
        if isinstance(last_v, int) and last_sha != sha and version <= last_v:
            warns.append(f"resolved version v{version} ≤ last reconciled v{last_v} "
                         f"(draft-metadata.json) — ingesting an older/equal draft; "
                         f"the reconcile harness expects forward progress.")
    return warns


def _self_test() -> int:
    """Offline regression check for chapter-boundary detection.

    Guards HARNESS-FEEDBACK #10. The hermetic half needs no PDF: it builds pages
    that reproduce every opening shape this book uses — including the two that
    the old small-caps heuristic missed, a quotation opening ("The Bottle") and
    a short-lead-word opening ("The Quarantine") — interleaved with the running
    headers and a mid-chapter section header that must NOT be mistaken for
    openings, then asserts every chapter is found at its own page, no decoy is,
    and the segmenter closes each chapter at the next opening (no absorption).
    When ``source/20260607.pdf`` is present it also re-checks the exact evidence
    from the bug report against the real draft.
    """
    fails: list[str] = []

    # --- hermetic fixture -------------------------------------------------
    toc = [
        {"num": "01", "title": "Boulder"},
        {"num": "02", "title": "The Inheritance"},
        {"num": "03", "title": "The Bottle"},
        {"num": "04", "title": "The Quarantine"},
        {"num": "05", "title": "The Swarm"},
        {"num": "06", "title": "The Portfolio"},
        {"num": "07", "title": "The Evacuation"},
        {"num": "08", "title": "The Long Term"},
        {"num": "09", "title": "Boulder Again"},
    ]
    # opening lead-ins mirror the real draft's styling (PyMuPDF text order)
    leadins = [
        "BOULDER IS NOT A SAFE PLACE. Beneath the open space lies risk.",
        "ALBERT BARTLETT DID NOT INVENT THE POPULATION question, but he framed it.",
        "“I looked at the arithmetic I had known my whole professional life.",  # quotation
        "IN September 1994, delegates from 179 nations gathered in Cairo.",      # short lead word
        "ON AUGUST 14, 2008, the Population Division released its revision.",
        "The Fertility Tables IN THE WINTER OF 2024, an actuary sat down.",      # subtitle, then small caps
        "OPEN THE HUMAN MOBILITY CHAPTER of the latest assessment report.",
        "“THE CHIEF CAUSE OF PROBLEMS IS SOLUTIONS” is the epigraph here.",      # quote + small caps
        "TWO VERY DIFFERENT KINDS OF OBITUARIES circulated after his death.",
    ]
    contents = ("Contents Preface ix 1 Boulder 1 2 The Inheritance 17 3 The Bottle 43 "
                "4 The Quarantine 67 5 The Swarm 101 6 The Portfolio 133 7 The Evacuation "
                "167 8 The Long Term 199 9 Boulder Again 213 Notes 231 Bibliography 263")
    pages = [contents]
    expected: dict[str, int] = {}
    book_page = 2
    for c, lead in zip(toc, leadins):
        n, title = int(c["num"]), c["title"]
        expected[title] = len(pages)
        pages.append(f"{n} {title} {lead}")                                       # opening
        pages.append(f"{book_page} Chapter {n} {title} continues in lowercase body text")  # verso header
        pages.append(f"{book_page + 1} more lowercase body spilling onto the recto page")  # recto header
        book_page += 10
    # mid-chapter section header: 2-digit page no. + words from a title — must not match
    pages.append("91 The Quarantine Era’s Lebensraum Imaginary reads off the record. "
                 "The Quarantine era was over by the chapter's close.")
    notes_idx = len(pages)
    pages.append("Notes 1. Albert A. Bartlett, “Arithmetic, Population and Energy.”")

    parsed = parse_contents(pages)
    if [c["title"] for c in parsed] != [c["title"] for c in toc]:
        fails.append(f"parse_contents → {[c['title'] for c in parsed]!r}")

    found = find_openings(pages, toc)
    for title, idx in expected.items():
        if found.get(title) != idx:
            fails.append(f"opening {title!r}: expected page {idx}, got {found.get(title)}")
    decoys = {i for i in range(len(pages)) if i not in expected.values() and i != 0}
    for title, idx in found.items():
        if idx in decoys:
            fails.append(f"{title!r} matched non-opening page {idx} (running header / section head)")

    ranges = chapter_ranges(found, notes_idx)
    if ranges.get("The Inheritance", (0, -1))[1] != expected["The Bottle"]:
        fails.append("ch2 does not close at ch3's opening — body absorbed across the gap")
    if "The Bottle" not in ranges or "The Quarantine" not in ranges:
        fails.append("ch3/ch4 produced no span — still flagged Contents-only")

    # --- integration check against the real draft, when available ---------
    real = SOURCE / "20260607.pdf"
    if real.exists():
        try:
            import fitz  # noqa: F811
            rpages = [p.get_text() for p in fitz.open(real)]
            rtoc = parse_contents(rpages)
            ropen = find_openings(rpages, rtoc)
            notes_at = section_start(rpages, "Notes")
            rranges = chapter_ranges(ropen, notes_at if notes_at is not None else len(rpages))
            seg = {c["num"]: _norm("\n".join(rpages[slice(*rranges[c["title"]])]))
                   for c in rtoc if c["title"] in rranges}
            for num in ("03", "04"):
                if len(seg.get(num, "")) < 20000:
                    fails.append(f"[real] ch{num} body missing/short "
                                 f"({len(seg.get(num, ''))} chars) — still mis-segmented")
            ch2 = seg.get("02", "")
            if "The Quarantine era was over" in ch2:
                fails.append("[real] ch2 still contains ch4 prose ('The Quarantine era was over')")
            if "3 The Bottle" in ch2:
                fails.append("[real] ch2 still runs past the '3 The Bottle' boundary")
            if len(ch2) > 120000:
                fails.append(f"[real] ch2 is {len(ch2)} chars — absorbing later chapters (~75k expected)")
        except ImportError:
            print("  (PyMuPDF unavailable — skipped real-PDF integration check)")
    else:
        print("  (source/20260607.pdf absent — skipped real-PDF integration check)")

    if fails:
        print("✗ chapter-boundary self-test FAILED:")
        for f in fails:
            print(f"    - {f}")
        return 1
    print("✓ chapter-boundary self-test passed — every opening found (incl. quotation- "
          "and short-lead openings), running headers ignored, no chapter absorbed.")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser(description="Stage 1 — PDF → per-chapter extract")
    ap.add_argument("pdf", nargs="?", help="source PDF (default: newest source/*.pdf)")
    ap.add_argument("--force", action="store_true",
                    help="overwrite an existing metadata/v<N>/ even if its sha256 differs")
    ap.add_argument("--self-test", action="store_true",
                    help="run the offline chapter-boundary regression check and exit")
    args = ap.parse_args()

    if args.self_test:
        raise SystemExit(_self_test())

    pdf = pick_pdf(args.pdf)
    if not pdf.exists():
        sys.exit(f"not found: {pdf}")

    doc = fitz.open(pdf)
    pages = [p.get_text() for p in doc]
    sha = hashlib.sha256(pdf.read_bytes()).hexdigest()
    version, vkind, vwarn = parse_version(pdf)
    if vwarn:
        print(f"⚠ {vwarn}", file=sys.stderr)

    # Overwrite guard: refuse to clobber a prior extract for this version slot
    # whose source differs, unless --force. An identical sha is a warned no-op.
    out_dir = REPO / "metadata" / f"v{version}"
    prior = existing_sha(out_dir)
    if prior is not None and prior != sha and not args.force:
        sys.exit(
            f"refusing to overwrite {out_dir.relative_to(REPO)}/ — it holds a "
            f"different draft (sha {prior[:12]} ≠ {sha[:12]}). This version slot "
            f"is already taken; re-run with --force to replace it, or rename the "
            f"PDF so it resolves to a free version.")
    if prior == sha:
        print(f"⚠ {out_dir.relative_to(REPO)}/ already holds this exact draft "
              f"(sha {sha[:12]}); re-extracting (no-op for provenance).",
              file=sys.stderr)

    # Re-ingest provenance guard (#8): same content under another slot / non-advancing version
    for w in provenance_warnings(sha, version, out_dir):
        print(f"⚠ {w}", file=sys.stderr)

    toc = parse_contents(pages)
    openings = find_openings(pages, toc)
    notes_at = section_start(pages, "Notes")

    # Body boundary = first Notes/Bibliography page (chapters end there).
    body_end = notes_at if notes_at is not None else len(pages)

    # Per-chapter [start, end) page spans for the chapters whose opening we found.
    ranges = chapter_ranges(openings, body_end)

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
    first_ch = min(openings.values()) if openings else body_end
    preface_text = ""
    if preface_idx is not None and preface_idx < first_ch:
        preface_text = _norm("\n".join(pages[preface_idx:first_ch]))

    out_dir.mkdir(parents=True, exist_ok=True)

    extract = {
        "draft": {
            "source_pdf": str(pdf.relative_to(REPO)),
            "version": version,
            "version_kind": vkind,
            "pages": len(pages),
            "sha256": sha,
            "ingested": _today(),
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
    print(f"  version {version} ({vkind}) · {len(pages)} pp · sha {sha[:12]}")
    print(f"  {len(chapters)} chapters in TOC · {drafted} with a drafted body in this PDF")
    for c in chapters:
        mark = "●" if c["present"] else "○"
        print(f"    {mark} {c['num']} {c['title']}"
              + ("" if c["present"] else "   (Contents-only)"))
    print(f"\nNext: run the PDF-reading agent (/ingest-draft) to write "
          f"metadata/draft-metadata.json from {out_dir.relative_to(REPO)}/extract.txt")


if __name__ == "__main__":
    main()
