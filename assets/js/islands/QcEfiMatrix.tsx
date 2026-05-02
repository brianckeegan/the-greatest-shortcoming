// QC × EFI matrix — the unifying graphic.
//
// Shows every step-kind part as a horizontal date-range bar on a shared
// time axis (1890s through the late 21st century), so a reader can see
// the whole hundred-year arc at a glance and the governing concept
// (Prelude / Will to Simplify / Rule of Expertise / Politics of
// Inevitability / Demography as Asset Class / Climate Triage) attached
// to each interval. When `highlight` matches a part id, that bar is
// drawn in the accent color and pulled forward; the others fade.
//
// Data source: window.GS_DATA.parts (set by _includes/site-data.html).
// Render: Observable Plot.

import { useEffect, useMemo, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import type { Part } from './types';

interface Row {
  id: string;
  title: string;
  kicker: string;
  start: number;
  end: number;
  isHighlight: boolean;
}

function buildRows(parts: readonly Part[], highlight: string | null): Row[] {
  return parts
    .filter((p): p is Part & { start: number; end: number } => {
      const isStep = (p.kind ?? 'step') === 'step';
      return isStep && typeof p.start === 'number' && typeof p.end === 'number';
    })
    .map((p) => ({
      id: p.id,
      title: p.title ?? p.id,
      kicker: p.kicker ?? '',
      start: p.start,
      end: p.end,
      isHighlight: highlight !== null && p.id === highlight,
    }));
}

export interface QcEfiMatrixProps {
  // Optional: id of a part to highlight (e.g. on a chapter page, the chapter's
  // mapped part). When null, every bar is shown at equal weight.
  highlight?: string | null;
}

export const QcEfiMatrix = ({ highlight = null }: QcEfiMatrixProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const rows = useMemo<Row[]>(() => {
    const parts = window.GS_DATA?.parts ?? [];
    return buildRows(parts, highlight);
  }, [highlight]);

  const yDomain = useMemo(() => rows.map((r) => r.title), [rows]);

  useEffect(() => {
    if (!ref.current) return;
    if (rows.length === 0) return;

    // Use CSS custom properties from scrolly.css so light/dark themes
    // automatically match the rest of the page chrome.
    const ink = 'var(--ink, #111111)';
    const inkSoft = 'var(--ink-soft, #4a463c)';
    const tufte = 'var(--tufte-red, #c83c3c)';
    const rule = 'var(--rule, #d8d2bf)';

    const anyHighlight = rows.some((r) => r.isHighlight);

    const chart = Plot.plot({
      width: ref.current.clientWidth || 720,
      height: 320,
      marginLeft: 110,
      marginRight: 24,
      marginTop: 32,
      marginBottom: 36,
      style: {
        background: 'transparent',
        color: ink,
        fontFamily: 'var(--serif)',
        fontSize: '12px',
      },
      x: {
        label: 'year →',
        labelOffset: 28,
        grid: true,
        nice: true,
        tickFormat: (d: number) => String(d),
      },
      y: {
        label: null,
        domain: yDomain,
      },
      marks: [
        // baseline ruler
        Plot.ruleY(yDomain, { stroke: rule, strokeOpacity: 0.4 }),

        // part bars
        Plot.barX(rows, {
          x1: 'start',
          x2: 'end',
          y: 'title',
          fill: (d: Row) => (anyHighlight ? (d.isHighlight ? tufte : inkSoft) : ink),
          fillOpacity: (d: Row) => (anyHighlight ? (d.isHighlight ? 0.95 : 0.18) : 0.7),
          stroke: (d: Row) => (d.isHighlight ? tufte : 'transparent'),
          strokeWidth: 1.5,
          insetTop: 6,
          insetBottom: 6,
          rx: 2,
        }),

        // kicker labels (governing concept) at the right edge of each bar
        Plot.text(rows, {
          x: 'end',
          y: 'title',
          text: 'kicker',
          textAnchor: 'start',
          dx: 6,
          fontSize: 10,
          fontFamily: 'var(--mono)',
          fill: (d: Row) => (anyHighlight && !d.isHighlight ? inkSoft : ink),
          fillOpacity: (d: Row) => (anyHighlight && !d.isHighlight ? 0.5 : 0.85),
        }),
      ],
    });

    ref.current.replaceChildren(chart);

    return () => {
      chart.remove();
    };
  }, [rows, yDomain]);

  if (rows.length === 0) {
    return (
      <div className="qc-efi-matrix qc-efi-matrix--empty" role="figure" aria-label="QC × EFI matrix (no parts available)">
        <p style={{ fontStyle: 'italic', color: 'var(--ink-soft)' }}>
          No part data available.
        </p>
      </div>
    );
  }

  return (
    <figure className="qc-efi-matrix" role="figure" aria-label="QC × EFI matrix: the parts on a shared timeline">
      <figcaption className="qc-efi-matrix__caption" style={{ marginBottom: 8 }}>
        <span className="kicker">Figure ·</span>{' '}
        the six parts on one timeline, each labeled by its governing concept.
        {highlight && rows.some((r) => r.isHighlight) && (
          <>
            {' '}
            <em>
              (Highlighting {rows.find((r) => r.isHighlight)?.title}.)
            </em>
          </>
        )}
      </figcaption>
      <div ref={ref} className="qc-efi-matrix__plot" />
    </figure>
  );
};
