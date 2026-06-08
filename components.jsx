/* Shared React components for Greatest Shortcoming */

const D = window.GS_DATA;

// kind shape mapping
const KIND_SHAPE = {
  person: 'circle', org: 'rect', theme: 'diamond', instrument: 'dashed-rect',
  document: 'doc', era: 'pill',
};

const NodeShape = ({ kind, r = 12 }) => {
  const k = KIND_SHAPE[kind] || 'circle';
  if (k === 'circle')        return <circle className="node-shape" r={r} />;
  if (k === 'rect')          return <rect className="node-shape" x={-r} y={-r*0.78} width={r*2} height={r*1.55} />;
  if (k === 'dashed-rect')   return <rect className="node-shape" x={-r} y={-r*0.78} width={r*2} height={r*1.55} strokeDasharray="2 2" />;
  if (k === 'diamond')       return <polygon className="node-shape" points={`0,${-r} ${r},0 0,${r} ${-r},0`} />;
  if (k === 'doc')           return <path className="node-shape" d={`M ${-r} ${-r*0.9} L ${r*0.7} ${-r*0.9} L ${r} ${-r*0.55} L ${r} ${r*0.9} L ${-r} ${r*0.9} Z`} />;
  if (k === 'pill')          return <rect className="node-shape" x={-r*1.4} y={-r*0.6} width={r*2.8} height={r*1.2} rx={r*0.6} />;
  return <circle className="node-shape" r={r} />;
};

/* Sketchy network — given nodes + edges + active id */
const SketchNetwork = ({ nodes, edges, activeId, onNav, w = 260, h = 320, compact = false }) => {
  // small jitter so it feels hand-drawn but stable
  const jitter = (x, seed) => x + (Math.sin(seed * 12.9898) * 4);

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const isActive = id => id === activeId;
  const isLinked = id => {
    if (!activeId) return true;
    return edges.some(([a, b]) => (a === activeId && b === id) || (b === activeId && a === id)) || id === activeId;
  };

  return (
    <svg className="sketch" viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height: 'auto', display:'block' }}>
      {edges.map(([a, b], i) => {
        const A = nodeMap[a], B = nodeMap[b];
        if (!A || !B) return null;
        const active = activeId && (a === activeId || b === activeId);
        const mx = (A.x + B.x)/2 + (i % 2 ? 6 : -6);
        const my = (A.y + B.y)/2 + (i % 2 ? -6 : 6);
        return <path key={i} className={"edge" + (active ? " active" : "")}
                     d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`} />;
      })}
      {nodes.map(n => {
        const ent = D.byId[n.id];
        const cls = "node" + (isActive(n.id) ? " active" : "") + (activeId && !isLinked(n.id) ? " dim" : "");
        return (
          <g key={n.id} className={cls} transform={`translate(${n.x},${n.y})`}
             onClick={() => onNav && onNav(n.id)}>
            <NodeShape kind={ent?.kind || 'theme'} r={compact ? 7 : 10} />
            {!compact && <text y={n.labelOffset || 24} textAnchor="middle" fontSize="11">{n.label || ent?.name}</text>}
          </g>
        );
      })}
    </svg>
  );
};

/* Cross-reference card */
const Xref = ({ id, onNav }) => {
  const e = D.byId[id];
  if (!e) return null;
  return (
    <div className="xref" onClick={() => onNav && onNav(id)}>
      <span className={"kind-pill " + e.kind} style={{ float:'right', fontSize: 9, padding:'1px 5px' }}>{e.kind}</span>
      <div className="xref-name">{e.name}</div>
      {e.dates && <div className="xref-kind">{e.dates}</div>}
      {e.role && <div className="xref-kind">{e.role}</div>}
      {e.year && <div className="xref-kind">{e.year}</div>}
      <div className="xref-blurb">{(e.blurb || '').slice(0, 120)}{(e.blurb || '').length > 120 ? '…' : ''}</div>
    </div>
  );
};

/* Era ribbon — shows which era(s) an entity belongs to */
const EraRibbon = ({ eras = [], onNav }) => {
  if (!eras.length) return null;
  return (
    <div className="ribbon">
      <span>active in:</span>
      {eras.map(eid => {
        const e = D.byId[eid];
        return (
          <span key={eid}>
            <span className="dot" />{' '}
            <a href="#" onClick={(ev)=>{ev.preventDefault(); onNav && onNav(eid);}}>{e?.name} <span style={{ color:'var(--ink-soft)' }}>{e?.start}–{e?.end}</span></a>
          </span>
        );
      })}
    </div>
  );
};

/* Topbar with era nav */
const Topbar = ({ current, onNav }) => (
  <div className="topbar">
    <div className="brand">
      <a href="#" onClick={(e)=>{e.preventDefault(); onNav('home');}} style={{ border: 'none' }}>
        <b>The Greatest Shortcoming</b> <span style={{ color:'var(--ink-soft)' }}>· a network reading</span>
      </a>
    </div>
    <nav>
      {D.eras.map(e => (
        <a key={e.id} href="#" className={current === e.id ? 'current' : ''}
           onClick={(ev)=>{ev.preventDefault(); onNav(e.id);}}>{e.title}</a>
      ))}
    </nav>
  </div>
);

const Footer = () => (
  <div className="footer">
    <span>The Greatest Shortcoming · ch. 1 Boulder</span>
    <span>network reading · v0.1</span>
  </div>
);

Object.assign(window, { SketchNetwork, NodeShape, Xref, EraRibbon, Topbar, Footer });
