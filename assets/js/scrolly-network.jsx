/* Scroll-driven network — nodes/edges activate by step.
 * STEPS comes from window.PAGE_CONTEXT.steps (set by _includes/page-context.html
 * from per-page _data/scrolly/{key}.yml + _data/eras.yml). */

const D = window.GS_DATA;
const STEPS = (window.PAGE_CONTEXT && window.PAGE_CONTEXT.steps) || [];

// kind shape
const NodeShape = ({ kind, r = 11 }) => {
  if (kind === 'person')      return <circle className="node-shape" r={r} />;
  if (kind === 'org')         return <rect className="node-shape" x={-r} y={-r*0.78} width={r*2} height={r*1.55} />;
  if (kind === 'instrument')  return <rect className="node-shape" x={-r} y={-r*0.78} width={r*2} height={r*1.55} strokeDasharray="2 2" />;
  if (kind === 'theme')       return <polygon className="node-shape" points={`0,${-r} ${r},0 0,${r} ${-r},0`} />;
  if (kind === 'document')    return <path className="node-shape" d={`M ${-r} ${-r*0.9} L ${r*0.7} ${-r*0.9} L ${r} ${-r*0.55} L ${r} ${r*0.9} L ${-r} ${r*0.9} Z`} />;
  return <circle className="node-shape" r={r} />;
};

/* Compute layout once: a wide network with regions per era */
function computeLayout(W, H) {
  // Place each era's new nodes in a vertical band; build cumulatively.
  const cumNodes = [];
  const seen = new Set();
  STEPS.forEach((s, si) => {
    s.nodes.forEach(id => {
      if (!seen.has(id)) {
        seen.add(id);
        cumNodes.push({ id, era: si });
      }
    });
  });

  // Group nodes by era and lay out per band
  const bands = STEPS.length;
  const positions = {};
  const padX = 60, padY = 60;
  const bandW = (W - padX*2) / bands;
  STEPS.forEach((s, si) => {
    const inBand = cumNodes.filter(n => n.era === si);
    if (!inBand.length) return;
    const cx = padX + bandW * (si + 0.5);
    inBand.forEach((n, i) => {
      // arrange in a loose vertical jitter
      const t = (i + 0.5) / inBand.length;
      const y = padY + (H - padY*2) * t;
      const xJit = (((n.id.charCodeAt(0) + i) * 13) % 50) - 25;
      const yJit = (((n.id.charCodeAt(1) || 60) * 7) % 30) - 15;
      positions[n.id] = { x: cx + xJit, y: y + yJit };
    });
  });
  return positions;
}

/* Compute edges from data */
function computeEdges(visibleIds) {
  const set = new Set(visibleIds);
  const edges = [];
  const seen = new Set();
  visibleIds.forEach(id => {
    const e = D.byId[id];
    if (!e || !e.links) return;
    e.links.forEach(l => {
      if (!set.has(l)) return;
      const k = [id, l].sort().join('::');
      if (seen.has(k)) return;
      seen.add(k);
      edges.push([id, l]);
    });
  });
  return edges;
}

const ScrollyNetwork = ({ stepIndex, activeId, onNodeClick, hoveredId, setHoveredId }) => {
  const W = 800, H = 600;
  const layout = React.useMemo(() => computeLayout(W, H), []);

  // visible nodes = union of step 0..stepIndex
  const visibleIds = React.useMemo(() => {
    const ids = [];
    const seen = new Set();
    for (let i = 0; i <= stepIndex; i++) {
      STEPS[i].nodes.forEach(id => { if (!seen.has(id)) { seen.add(id); ids.push(id); } });
    }
    return ids;
  }, [stepIndex]);

  const edges = React.useMemo(() => computeEdges(visibleIds), [visibleIds]);
  const focusSet = React.useMemo(() => new Set(STEPS[stepIndex]?.focus || []), [stepIndex]);
  const visibleSet = React.useMemo(() => new Set(visibleIds), [visibleIds]);

  // Effective active = drawer active OR hovered OR step focus
  const eff = activeId || hoveredId;
  const linkedToActive = React.useMemo(() => {
    if (!eff) return null;
    const out = new Set([eff]);
    edges.forEach(([a,b]) => {
      if (a === eff) out.add(b);
      if (b === eff) out.add(a);
    });
    return out;
  }, [eff, edges]);

  return (
    <svg className="sketch" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {/* faint era band labels */}
      {STEPS.map((s, si) => {
        const padX = 60, bandW = (W - padX*2) / STEPS.length;
        const cx = padX + bandW * (si + 0.5);
        const passed = si <= stepIndex;
        return (
          <g key={s.id} opacity={passed ? 0.5 : 0.18}>
            <line x1={cx} y1={20} x2={cx} y2={H - 20} stroke="var(--rule)" strokeDasharray="2 4" />
            <text x={cx} y={32} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill="var(--ink-soft)" style={{ letterSpacing: '.1em', textTransform: 'uppercase' }}>
              {s.title}
            </text>
          </g>
        );
      })}

      {/* edges */}
      {edges.map(([a,b], i) => {
        const A = layout[a], B = layout[b];
        if (!A || !B) return null;
        const isActive = eff && (a === eff || b === eff);
        const dim = eff && !isActive;
        const mx = (A.x+B.x)/2 + (i%2?6:-6);
        const my = (A.y+B.y)/2 + (i%2?-6:6);
        return (
          <path key={i}
                className={"edge visible" + (isActive ? " active" : "")}
                style={{ opacity: dim ? 0.08 : undefined, strokeDasharray: 'none', strokeDashoffset: 0 }}
                d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`} />
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
        const dim = linkedToActive && !linkedToActive.has(id);
        return (
          <g key={id}
             className={"node" + (isVisible ? " visible" : "") + (isActive || isFocus ? " active" : "") + (dim ? " dim" : "")}
             transform={`translate(${pos.x},${pos.y})`}
             onClick={() => onNodeClick && onNodeClick(id)}
             onMouseEnter={() => setHoveredId && setHoveredId(id)}
             onMouseLeave={() => setHoveredId && setHoveredId(null)}>
            <NodeShape kind={ent.kind} r={isFocus ? 13 : 10} />
            {(isVisible && (isFocus || isActive)) && (
              <text className="label" y={22} textAnchor="middle" fontSize="11">
                {ent.name.length > 22 ? ent.name.slice(0,20) + '…' : ent.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

window.ScrollyNetwork = ScrollyNetwork;
window.STEPS = STEPS;
window.NodeShape = NodeShape;
