// Scroll-driven entity network. Faithful TypeScript port of the legacy
// assets/js/scrolly-network.jsx — same SVG shapes, same band layout,
// same edge-and-focus logic. Replaces the .jsx file at runtime via the
// window.ScrollyNetwork / window.NodeShape globals so app.jsx (loaded
// separately as Babel-runtime JSX) can keep using <window.ScrollyNetwork ...>.
//
// STEPS comes from window.PAGE_CONTEXT.steps (set by _includes/page-context.html
// from per-page _data/scrolly/{key}.yml + _data/parts.yml).

import { useMemo, type CSSProperties } from 'react';
import type { EntityKind, Step } from './types';

interface NodeShapeProps {
  kind: EntityKind | string | undefined;
  r?: number;
}

export const NodeShape = ({ kind, r = 11 }: NodeShapeProps) => {
  if (kind === 'person') return <circle className="node-shape" r={r} />;
  if (kind === 'org')
    return <rect className="node-shape" x={-r} y={-r * 0.78} width={r * 2} height={r * 1.55} />;
  if (kind === 'instrument')
    return (
      <rect
        className="node-shape"
        x={-r}
        y={-r * 0.78}
        width={r * 2}
        height={r * 1.55}
        strokeDasharray="2 2"
      />
    );
  if (kind === 'theme')
    return <polygon className="node-shape" points={`0,${-r} ${r},0 0,${r} ${-r},0`} />;
  if (kind === 'document')
    return (
      <path
        className="node-shape"
        d={`M ${-r} ${-r * 0.9} L ${r * 0.7} ${-r * 0.9} L ${r} ${-r * 0.55} L ${r} ${r * 0.9} L ${-r} ${r * 0.9} Z`}
      />
    );
  return <circle className="node-shape" r={r} />;
};

interface Position {
  x: number;
  y: number;
}

interface CumNode {
  id: string;
  part: number;
}

function computeLayout(steps: readonly Step[], W: number, H: number): Record<string, Position> {
  const cumNodes: CumNode[] = [];
  const seen = new Set<string>();
  steps.forEach((s, si) => {
    s.nodes.forEach((id) => {
      if (!seen.has(id)) {
        seen.add(id);
        cumNodes.push({ id, part: si });
      }
    });
  });

  const bands = steps.length;
  const positions: Record<string, Position> = {};
  const padX = 60;
  const padY = 60;
  const bandW = bands > 0 ? (W - padX * 2) / bands : 0;
  steps.forEach((_s, si) => {
    const inBand = cumNodes.filter((n) => n.part === si);
    if (!inBand.length) return;
    const cx = padX + bandW * (si + 0.5);
    inBand.forEach((n, i) => {
      const t = (i + 0.5) / inBand.length;
      const y = padY + (H - padY * 2) * t;
      const c0 = n.id.charCodeAt(0);
      const c1 = n.id.charCodeAt(1);
      const xJit = (((c0 + i) * 13) % 50) - 25;
      const yJit = (((Number.isNaN(c1) ? 60 : c1) * 7) % 30) - 15;
      positions[n.id] = { x: cx + xJit, y: y + yJit };
    });
  });
  return positions;
}

function computeEdges(visibleIds: readonly string[]): Array<[string, string]> {
  const D = window.GS_DATA;
  const set = new Set<string>(visibleIds);
  const edges: Array<[string, string]> = [];
  const seenPairs = new Set<string>();
  visibleIds.forEach((id) => {
    const e = D.byId[id];
    if (!e || !e.links) return;
    e.links.forEach((l) => {
      if (!set.has(l)) return;
      const k = [id, l].sort().join('::');
      if (seenPairs.has(k)) return;
      seenPairs.add(k);
      edges.push([id, l]);
    });
  });
  return edges;
}

export interface ScrollyNetworkProps {
  stepIndex: number;
  activeId?: string | null;
  hoveredId?: string | null;
  onNodeClick?: (id: string) => void;
  setHoveredId?: (id: string | null) => void;
}

export const ScrollyNetwork = ({
  stepIndex,
  activeId,
  hoveredId,
  onNodeClick,
  setHoveredId,
}: ScrollyNetworkProps) => {
  const D = window.GS_DATA;
  const STEPS: Step[] = (window.PAGE_CONTEXT && window.PAGE_CONTEXT.steps) || [];

  const W = 800;
  const H = 600;
  const layout = useMemo(() => computeLayout(STEPS, W, H), [STEPS]);

  // visible nodes = union of step 0..stepIndex
  const visibleIds = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (let i = 0; i <= stepIndex; i++) {
      const step = STEPS[i];
      if (!step) continue;
      step.nodes.forEach((id) => {
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      });
    }
    return ids;
  }, [STEPS, stepIndex]);

  const edges = useMemo(() => computeEdges(visibleIds), [visibleIds]);
  const focusSet = useMemo(() => new Set<string>(STEPS[stepIndex]?.focus ?? []), [STEPS, stepIndex]);
  const visibleSet = useMemo(() => new Set<string>(visibleIds), [visibleIds]);

  // Effective active = drawer active OR hovered OR step focus
  const eff = activeId || hoveredId || null;
  const linkedToActive = useMemo(() => {
    if (!eff) return null;
    const out = new Set<string>([eff]);
    edges.forEach(([a, b]) => {
      if (a === eff) out.add(b);
      if (b === eff) out.add(a);
    });
    return out;
  }, [eff, edges]);

  const padX = 60;
  const bandW = STEPS.length > 0 ? (W - padX * 2) / STEPS.length : 0;
  const bandLabelStyle: CSSProperties = { letterSpacing: '.1em', textTransform: 'uppercase' };

  return (
    <svg className="sketch" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {/* faint part band labels */}
      {STEPS.map((s, si) => {
        const cx = padX + bandW * (si + 0.5);
        const passed = si <= stepIndex;
        return (
          <g key={s.id} opacity={passed ? 0.5 : 0.18}>
            <line
              x1={cx}
              y1={20}
              x2={cx}
              y2={H - 20}
              stroke="var(--rule)"
              strokeDasharray="2 4"
            />
            <text
              x={cx}
              y={32}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono)"
              fill="var(--ink-soft)"
              style={bandLabelStyle}
            >
              {s.title}
            </text>
          </g>
        );
      })}

      {/* edges */}
      {edges.map(([a, b], i) => {
        const A = layout[a];
        const B = layout[b];
        if (!A || !B) return null;
        const isActive = !!(eff && (a === eff || b === eff));
        const dim = !!(eff && !isActive);
        const mx = (A.x + B.x) / 2 + (i % 2 ? 6 : -6);
        const my = (A.y + B.y) / 2 + (i % 2 ? -6 : 6);
        return (
          <path
            key={i}
            className={'edge visible' + (isActive ? ' active' : '')}
            style={{
              opacity: dim ? 0.08 : undefined,
              strokeDasharray: 'none',
              strokeDashoffset: 0,
            }}
            d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`}
          />
        );
      })}

      {/* nodes */}
      {Object.entries(layout).map(([id, pos]) => {
        const ent = D.byId[id];
        if (!ent) return null;
        const isVisible = visibleSet.has(id);
        const isFocus = focusSet.has(id);
        const isHover = hoveredId === id;
        const isActive = activeId === id || isHover;
        const dim = !!(linkedToActive && !linkedToActive.has(id));
        const cls =
          'node' +
          (isVisible ? ' visible' : '') +
          (isActive || isFocus ? ' active' : '') +
          (dim ? ' dim' : '');
        return (
          <g
            key={id}
            className={cls}
            transform={`translate(${pos.x},${pos.y})`}
            onClick={() => onNodeClick && onNodeClick(id)}
            onMouseEnter={() => setHoveredId && setHoveredId(id)}
            onMouseLeave={() => setHoveredId && setHoveredId(null)}
          >
            <NodeShape kind={ent.kind} r={isFocus ? 13 : 10} />
            {isVisible && (isFocus || isActive) && (
              <text className="label" y={22} textAnchor="middle" fontSize="11">
                {ent.name.length > 22 ? ent.name.slice(0, 20) + '…' : ent.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
