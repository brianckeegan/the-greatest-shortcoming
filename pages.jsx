/* Pages: Home, Era, Entity, Document */

const { useState, useEffect, useMemo } = React;
const D = window.GS_DATA;

/* ---------------- Home: era picker ---------------- */
const HomePage = ({ onNav }) => (
  <div className="page">
    <Topbar current="home" onNav={onNav} />
    <div style={{ maxWidth: 760, marginBottom: 36 }}>
      <div className="kicker">a network reading of</div>
      <h1 style={{ fontSize: '3.2rem', marginTop: 4 }}>The Greatest Shortcoming</h1>
      <p style={{ fontSize: '1.15rem', color: 'var(--ink-soft)', fontStyle:'italic', maxWidth: 600 }}>
        How a community abstracts its anxieties about disorder, contamination, and change into technical
        problems subject to "objective" numerical analysis — and how those quantitative logics are translated
        into justifications for who has access to community, beauty, or safety.
      </p>
    </div>

    <div className="kicker" style={{ marginBottom: 8 }}>five eras · pick a constellation</div>
    <div className="era-grid">
      {D.eras.map((e, i) => (
        <div key={e.id} className="era-cell" onClick={() => onNav(e.id)}>
          <span className="era-num">era {String(i+1).padStart(2,'0')}</span>
          <div className="era-title">{e.title}</div>
          <div className="era-dates">{e.start} — {e.end}</div>
          <div className="era-blurb">{e.blurb}</div>
          <div className="era-go">enter →</div>
        </div>
      ))}
    </div>

    <div className="layout" style={{ marginTop: 40 }}>
      <div className="content">
        <h2>How to read this site</h2>
        <p className="dropcap">
          The book traces five eras of <span className="hl">quantitative chauvinism</span> — the deployment of
          numerical instruments to foreclose political deliberation by converting contested claims into apparent
          technical necessities. This site lets you wander the same territory laterally rather than linearly.
          Three kinds of pages are linked together.
        </p>
        <p>
          <b>Era pages</b> open onto a constellation of mini-documents and the people, organizations, and
          instruments that animate them. <b>Entity pages</b> describe a single person, organization, theme, or
          instrument — with the related entities pinned in the margin. <b>Document pages</b> treat primary
          sources (the <i>Olmsted Report</i>, the Bartlett lecture, the Blue Line text) as artifacts to inspect.
        </p>
        <p>
          Hover any node in a margin network to highlight its connections; click to jump. The margin is the
          point: nothing here is meant to be read end-to-end.
        </p>
      </div>
      <div className="margin">
        <div className="kicker">legend</div>
        <div className="margin-graph" style={{ marginTop: 6 }}>
          <svg className="sketch" viewBox="0 0 240 220" style={{ width: '100%' }}>
            <g transform="translate(40,30)"><NodeShape kind="person" r={11} /><text y="26" textAnchor="middle" fontSize="11">person</text></g>
            <g transform="translate(120,30)"><NodeShape kind="org" r={11} /><text y="26" textAnchor="middle" fontSize="11">organization</text></g>
            <g transform="translate(200,30)"><NodeShape kind="theme" r={11} /><text y="26" textAnchor="middle" fontSize="11">theme</text></g>
            <g transform="translate(40,110)"><NodeShape kind="instrument" r={11} /><text y="26" textAnchor="middle" fontSize="11">instrument</text></g>
            <g transform="translate(120,110)"><NodeShape kind="document" r={11} /><text y="26" textAnchor="middle" fontSize="11">document</text></g>
            <g transform="translate(200,110)"><NodeShape kind="era" r={9} /><text y="26" textAnchor="middle" fontSize="11">era</text></g>
            <path className="edge" d="M 30 180 Q 80 160 130 180" />
            <path className="edge active" d="M 130 180 Q 180 200 230 180" />
            <text x="30" y="205" fontSize="10" fill="var(--ink-soft)" fontFamily="JetBrains Mono">— link</text>
            <text x="130" y="205" fontSize="10" fill="var(--tufte-red)" fontFamily="JetBrains Mono">— active</text>
          </svg>
        </div>
        <p className="sidenote" style={{ marginTop: 12 }}>
          Drawn from chapter 1 of the manuscript. Entities and links extend as more chapters are added.
        </p>
      </div>
    </div>
  </div>
);

/* ---------------- Era page ---------------- */
const EraPage = ({ era, onNav }) => {
  const eraId = era.id;
  // Entities active in this era
  const inEra = D.all.filter(x => Array.isArray(x.era) && x.era.includes(eraId));
  const docs = inEra.filter(x => x.kind === 'document');
  const people = inEra.filter(x => x.kind === 'person');
  const orgs = inEra.filter(x => x.kind === 'org');
  const instruments = inEra.filter(x => x.kind === 'instrument');
  const themes = inEra.filter(x => x.kind === 'theme');

  // Add documents that link to entities in this era (broader doc surface)
  const docIds = new Set(docs.map(d => d.id));
  D.documents.forEach(d => {
    const linksToEra = (d.links || []).some(l => inEra.some(x => x.id === l));
    if (linksToEra) docIds.add(d.id);
  });
  const allDocs = [...docIds].map(id => D.byId[id]).filter(Boolean);

  // Build a constellation network for the era
  const constellation = useMemo(() => {
    const ents = [...new Map(inEra.map(e => [e.id, e])).values()];
    // simple radial layout
    const cx = 260, cy = 200, R = 150;
    const nodes = ents.map((e, i) => {
      const angle = (i / ents.length) * Math.PI * 2 - Math.PI/2;
      const r = R * (0.6 + 0.4 * (e.kind === 'theme' ? 0.4 : e.kind === 'person' ? 1 : 0.75));
      return {
        id: e.id,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      };
    });
    // edges from .links inside the era set
    const ids = new Set(ents.map(e => e.id));
    const edges = [];
    ents.forEach(e => (e.links || []).forEach(l => {
      if (ids.has(l) && !edges.some(([a,b]) => (a===l&&b===e.id) || (a===e.id&&b===l))) {
        edges.push([e.id, l]);
      }
    }));
    return { nodes, edges };
  }, [eraId]);

  return (
    <div className="page">
      <Topbar current={eraId} onNav={onNav} />

      <div style={{ marginBottom: 24 }}>
        <span className="kicker">era · {D.eras.findIndex(e=>e.id===eraId)+1} of 5</span>
        <h1 style={{ marginTop: 4 }}>{era.title}</h1>
        <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{era.start} — {era.end}</div>
        <p style={{ fontSize: '1.1rem', fontStyle: 'italic', maxWidth: 720, marginTop: 14, color:'var(--ink-soft)' }}>{era.blurb}</p>
      </div>

      {/* Era timeline rule */}
      <div className="era-rule">
        {D.eras.map((e, i) => (
          <React.Fragment key={e.id}>
            <span className={"tick" + (e.id === eraId ? " active" : "")}>{e.start}</span>
            <span className={"seg" + (e.id === eraId ? " active" : "")} onClick={()=>onNav(e.id)} style={{ cursor:'pointer' }} />
            {i === D.eras.length - 1 && <span className="tick">{e.end}</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="layout">
        <div className="content">
          <h2>Constellation</h2>
          <figure className="margin-graph" style={{ padding: 12 }}>
            <SketchNetwork nodes={constellation.nodes} edges={constellation.edges} onNav={onNav} w={520} h={400} />
            <figcaption><b>Figure {D.eras.findIndex(e=>e.id===eraId)+1}.1.</b> {era.title}: people, organizations, instruments, and themes drawn from chapter 1. Click any node to open its page.</figcaption>
          </figure>

          <h2 style={{ marginTop: 32 }}>Documents</h2>
          <div className="doc-grid">
            {allDocs.map(d => (
              <div key={d.id} className="doc-card" onClick={()=>onNav(d.id)}>
                <div className="dc-kind">document · {d.year || ''}</div>
                <h4>{d.name}</h4>
                <p>{d.blurb}</p>
              </div>
            ))}
            {!allDocs.length && <p className="sidenote">No documents tagged for this era yet.</p>}
          </div>

          {!!instruments.length && <>
            <h2 style={{ marginTop: 32 }}>Instruments</h2>
            <div className="doc-grid">
              {instruments.map(d => (
                <div key={d.id} className="doc-card" onClick={()=>onNav(d.id)}>
                  <div className="dc-kind">instrument {d.year ? '· ' + d.year : ''}</div>
                  <h4>{d.name}</h4>
                  <p>{d.blurb}</p>
                </div>
              ))}
            </div>
          </>}

          {!!people.length && <>
            <h2 style={{ marginTop: 32 }}>People</h2>
            <div className="doc-grid">
              {people.map(d => (
                <div key={d.id} className="doc-card" onClick={()=>onNav(d.id)}>
                  <div className="dc-kind">person {d.dates ? '· ' + d.dates : ''}</div>
                  <h4>{d.name}</h4>
                  <p>{d.blurb}</p>
                </div>
              ))}
            </div>
          </>}

          {!!orgs.length && <>
            <h2 style={{ marginTop: 32 }}>Organizations</h2>
            <div className="doc-grid">
              {orgs.map(d => (
                <div key={d.id} className="doc-card" onClick={()=>onNav(d.id)}>
                  <div className="dc-kind">organization {d.founded ? '· est. ' + d.founded : ''}</div>
                  <h4>{d.name}</h4>
                  <p>{d.blurb}</p>
                </div>
              ))}
            </div>
          </>}
        </div>

        <aside className="margin">
          <div className="kicker">cross-references</div>
          <p className="sidenote" style={{ marginTop: 4, marginBottom: 10 }}>
            Themes that travel beyond this era. Drift through them — each opens its own page with its own margin.
          </p>
          <div className="xref-stack">
            {themes.map(t => <Xref key={t.id} id={t.id} onNav={onNav} />)}
          </div>
          <div className="kicker" style={{ marginTop: 24 }}>jump to era</div>
          <div className="xref-stack" style={{ marginTop: 6 }}>
            {D.eras.filter(e => e.id !== eraId).map(e => (
              <div key={e.id} className="xref" onClick={()=>onNav(e.id)}>
                <span className="kind-pill era" style={{ float:'right', fontSize: 9, padding:'1px 5px' }}>era</span>
                <div className="xref-name">{e.title}</div>
                <div className="xref-kind">{e.start} — {e.end}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
};

/* ---------------- Entity page ---------------- */
const EntityPage = ({ entity, onNav }) => {
  // Build a small ego-network: this entity + its links, and second-order links between them
  const network = useMemo(() => {
    const linkIds = entity.links || [];
    const linkedEnts = linkIds.map(id => D.byId[id]).filter(Boolean);
    const nodeList = [entity, ...linkedEnts];

    const cx = 130, cy = 160;
    const nodes = [{ id: entity.id, x: cx, y: cy }];
    linkedEnts.forEach((e, i) => {
      const angle = (i / linkedEnts.length) * Math.PI * 2 - Math.PI/2;
      const r = 95;
      nodes.push({ id: e.id, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    });

    const edges = [];
    linkedEnts.forEach(e => edges.push([entity.id, e.id]));
    // second-order: between linked entities
    linkedEnts.forEach(a => (a.links || []).forEach(bid => {
      if (linkIds.includes(bid) && a.id !== bid) {
        const exists = edges.some(([x,y]) => (x===a.id&&y===bid)||(x===bid&&y===a.id));
        if (!exists) edges.push([a.id, bid]);
      }
    }));
    return { nodes, edges };
  }, [entity.id]);

  return (
    <div className="page">
      <Topbar current="" onNav={onNav} />

      <div className="layout">
        <div className="content">
          <span className={"kind-pill " + entity.kind}>{entity.kind}</span>
          <h1 style={{ marginTop: 10 }}>{entity.name}</h1>
          <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
            {entity.dates || entity.role || (entity.year ? `${entity.year}` : '') || (entity.founded ? `est. ${entity.founded}` : '')}
          </div>

          {entity.era && entity.era.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <EraRibbon eras={entity.era} onNav={onNav} />
            </div>
          )}

          <p className="dropcap" style={{ marginTop: 18 }}>{entity.blurb}</p>

          {entity.kind === 'person' && entity.id === 'bartlett' && (
            <>
              <p>
                The other half of an oft-recounted 1958 conversation with mathematician <a href="#" onClick={e=>{e.preventDefault();onNav('mckelvey');}}>Bob McKelvey</a> — the moment when faculty alarm about hillside development found mathematical voice. Bartlett would spend the next half century translating
                <a href="#" onClick={e=>{e.preventDefault();onNav('exponential_curve');}}> the exponential mathematics of radioactivity</a> into a persuasive template about the consequences of growth.
              </p>
              <p>
                The <a href="#" onClick={e=>{e.preventDefault();onNav('blue_line');}}>Blue Line</a> was an early demonstration of this translation: it took the <a href="#" onClick={e=>{e.preventDefault();onNav('olmsted_report');}}>Olmsted report's</a> scarcity frame and grounded it not in aesthetic judgment but in arithmetic. Above a certain elevation, the physics of water pressure and the economics of infrastructure could be mustered to defeat development without confronting it directly. The city needed only to define a line on a map.
              </p>
              <div className="excerpt">
                "What Olmsted had argued through the cultivated authority of the landscape architect, McKelvey and Bartlett could argue through the harder authority of mathematics and physics."
                <cite>ch. 1, p. 5</cite>
              </div>
              <p>
                The conviction that <span className="hl">the right number, placed in the right instrument, could make exclusion feel like stewardship</span> originates here, in the same foothills Olmsted had designated Boulder's "priceless possession."
              </p>
            </>
          )}

          {entity.kind !== 'person' && (
            <>
              {entity.full && <p><i>Also:</i> {entity.full}</p>}
              <p className="sidenote" style={{ marginTop: 24 }}>
                ↳ This page is sketched from references in chapter 1. Subsequent chapters will deepen the entry.
              </p>
            </>
          )}

          {/* Inline figure: ego-network */}
          <h2 style={{ marginTop: 32 }}>Connections</h2>
          <figure className="margin-graph" style={{ padding: 12 }}>
            <SketchNetwork nodes={network.nodes} edges={network.edges} activeId={entity.id} onNav={onNav} w={260} h={320} />
            <figcaption><b>Figure.</b> First-order connections drawn from chapter 1. Hover dims unrelated nodes; click to navigate.</figcaption>
          </figure>
        </div>

        <aside className="margin">
          <div className="kicker">in the margin</div>
          <p className="sidenote" style={{ marginTop: 4, marginBottom: 10 }}>
            Cross-referenced pages — a pile of papers next to your reading.
          </p>
          <div className="xref-stack">
            {(entity.links || []).map(id => <Xref key={id} id={id} onNav={onNav} />)}
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
};

/* ---------------- Document page ---------------- */
const DocumentPage = ({ doc, onNav }) => {
  const network = useMemo(() => {
    const linkedEnts = (doc.links || []).map(id => D.byId[id]).filter(Boolean);
    const cx = 130, cy = 150;
    const nodes = [{ id: doc.id, x: cx, y: cy }];
    linkedEnts.forEach((e, i) => {
      const angle = (i / linkedEnts.length) * Math.PI * 2 - Math.PI/2;
      const r = 95;
      nodes.push({ id: e.id, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    });
    const edges = linkedEnts.map(e => [doc.id, e.id]);
    return { nodes, edges };
  }, [doc.id]);

  return (
    <div className="page">
      <Topbar current="" onNav={onNav} />

      <div className="layout">
        <div className="content">
          <span className="kind-pill document">document</span>
          <h1 style={{ marginTop: 10, fontStyle: 'italic' }}>{doc.name}</h1>
          <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
            {doc.year}{doc.author ? ` · ${doc.author}` : ''}{doc.pages ? ` · ${doc.pages}` : ''}
          </div>

          <p className="dropcap" style={{ marginTop: 18 }}>{doc.blurb}</p>

          {doc.excerpt && (
            <div className="excerpt" style={{ fontSize: '1.15em' }}>
              "{doc.excerpt}"
              {doc.pages && <cite>{doc.pages}</cite>}
            </div>
          )}

          {/* Document-specific facsimile placeholder */}
          <h2 style={{ marginTop: 32 }}>Artifact</h2>
          <div style={{
            border: '1px solid var(--rule)', background: 'repeating-linear-gradient(45deg, transparent 0 12px, rgba(0,0,0,0.04) 12px 13px)',
            padding: '36px 24px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)',
            textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div>
              <div style={{ fontSize: 13, fontStyle: 'italic', fontFamily: 'var(--serif)', color: 'var(--ink)' }}>
                facsimile / scan placeholder
              </div>
              <div style={{ marginTop: 6 }}>{doc.name} · {doc.year || '—'}</div>
            </div>
          </div>

          <h2 style={{ marginTop: 32 }}>What this document is doing</h2>
          {doc.id === 'olmsted_report' && (
            <p>
              A genuinely reformist work that proposes parks, defends wages against land speculators, and advocates for systematic management of Boulder Creek's dangerous floodplain. It is also one of the earliest codifications of a vision of environmental preservation that specifies who belongs in the community it protects and what must be kept out to preserve the community's character. The subheading <i>"The Cost of Delay"</i> recurs through the report like a drumbeat — marking each moment where inaction is characterized not as a value-neutral choice but as responsible stewardship deferred at collective expense.
            </p>
          )}
          {doc.id === 'bartlett_lecture' && (
            <p>
              The thought experiment is pedagogically brilliant; its implications are catastrophic. It compresses fertility, mortality, migration, technology, consumption, distribution, and political economy into a single alarming metric — a doubling time — and converts a conditional projection into an unconditional destiny: <i>the bottle will fill</i>.
            </p>
          )}
          {!['olmsted_report','bartlett_lecture'].includes(doc.id) && (
            <p className="sidenote">A short interpretive note will live here in the next pass.</p>
          )}

          <h2 style={{ marginTop: 32 }}>Network of references</h2>
          <figure className="margin-graph" style={{ padding: 12 }}>
            <SketchNetwork nodes={network.nodes} edges={network.edges} activeId={doc.id} onNav={onNav} w={260} h={300} />
            <figcaption><b>Figure.</b> Entities referenced or implicated by this document.</figcaption>
          </figure>
        </div>

        <aside className="margin">
          <div className="kicker">in the margin</div>
          <p className="sidenote" style={{ marginTop: 4, marginBottom: 10 }}>
            Pages this document points at.
          </p>
          <div className="xref-stack">
            {(doc.links || []).map(id => <Xref key={id} id={id} onNav={onNav} />)}
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
};

Object.assign(window, { HomePage, EraPage, EntityPage, DocumentPage });
