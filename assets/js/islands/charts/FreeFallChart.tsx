// Free Fall (1968–1994): Bartlett's exponential curve as the
// archetypal will-to-simplify instrument. Plots a clean doubling-time
// curve over a 70-year window so the visual is immediately legible as
// the same shape Bartlett brought to every public lecture.
//
// Future iterations: switch to live Boulder population data, add the
// "bottle fills" annotation Bartlett drew on chalkboards, layer
// Bartlett's published US-population projections from the 1970s.

import { useEffect, useMemo, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { PartChartShell } from './PartChartShell';

interface Point {
  year: number;
  population: number; // arbitrary units; Bartlett's lectures normalized to "one"
}

function buildCurve(): Point[] {
  // Doubling time = 35 years (one of Bartlett's working figures for late-20th-c.
  // global population growth). y = base * 2^((year - start) / doublingYears).
  const start = 1900;
  const end = 2050;
  const doublingYears = 35;
  const base = 1;
  const points: Point[] = [];
  for (let y = start; y <= end; y += 2) {
    points.push({ year: y, population: base * Math.pow(2, (y - start) / doublingYears) });
  }
  return points;
}

export const FreeFallChart = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const curve = useMemo(buildCurve, []);

  useEffect(() => {
    if (!ref.current) return;
    const ink = 'var(--ink, #111111)';
    const inkSoft = 'var(--ink-soft, #4a463c)';
    const tufte = 'var(--tufte-red, #c83c3c)';

    const chart = Plot.plot({
      width: ref.current.clientWidth || 640,
      height: 280,
      marginLeft: 48,
      marginBottom: 36,
      style: { background: 'transparent', color: ink, fontFamily: 'var(--serif)' },
      x: { label: 'year →', grid: true, tickFormat: (d: number) => String(d) },
      y: { label: '↑ population (relative)', grid: true, type: 'log' },
      marks: [
        Plot.areaY(curve, { x: 'year', y: 'population', fill: inkSoft, fillOpacity: 0.12 }),
        Plot.lineY(curve, { x: 'year', y: 'population', stroke: ink, strokeWidth: 1.5 }),
        Plot.ruleX([1968, 1994], { stroke: tufte, strokeOpacity: 0.6, strokeDasharray: '3 3' }),
        Plot.text([{ year: 1968, label: 'Free Fall begins' }], {
          x: 'year',
          y: () => Math.pow(2, (1968 - 1900) / 35),
          text: 'label',
          fill: tufte,
          textAnchor: 'start',
          dx: 6,
          fontSize: 10,
          fontFamily: 'var(--mono)',
        }),
      ],
    });

    ref.current.replaceChildren(chart);
    return () => chart.remove();
  }, [curve]);

  return (
    <PartChartShell partTitle="Free Fall" governingConcept="The Will to Simplify" status="live">
      <div ref={ref} />
    </PartChartShell>
  );
};
