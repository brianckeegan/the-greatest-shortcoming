/* ============================================================================
 * app.jsx — main React renderer for the homepage and chapter pages.
 * Reads window.SITE (page-invariant config + sections list),
 *       window.GS_DATA (entities + news + parts),
 *       window.PAGE_CONTEXT (per-page parts, steps, prose, intro/outro,
 *                             hero/stepper config, sections override).
 * Mounts into #root. Section rendering is kind-aware (register / coda / news /
 * epigraphs) and slot-positioned (pre-stepper / pre-scrolly / post-scrolly /
 * post-coda).
 * The stepper is a unified element: every stop (parts + brackets like QC/EFI)
 * is the same React component, configured via per-stop fields (kind, color,
 * bracket_line, underline_active).
 * ============================================================================ */

const { useState, useEffect, useRef, useMemo } = React;
const D = window.GS_DATA;
const PAGE = window.PAGE_CONTEXT || {};
const PARTS = PAGE.parts || [];          // every stepper stop (parts + brackets)
const STEPS = PAGE.steps || [];          // scrolly figure steps (parts only)
const SITE = window.SITE;
const PROSE = PAGE.prose || {};

const TWEAK_DEFAULTS = SITE.themeDefaults || { theme: "cool", net: "rough", fontSize: 18 };

/* ---------- Prose renderer ----------
 * Part prose comes in as HTML strings with two server-side macros:
 *   {{ DOC:doc_id }}           → inline document vignette
 *   {{ QUOTE:source | body }}  → pull quote
 * We split the string into segments, rendering macros as React components
 * and raw HTML as dangerouslySetInnerHTML chunks. This keeps the prose
 * authorable as plain HTML in YAML while still letting React drive
 * interactivity (entity click → drawer).
 */
function renderProse(html, onEnt) {
  if (!html) return null;
  const re = /\{\{\s*(DOC|QUOTE):([^}]+?)\s*\}\}/g;
  const parts = [];
  let last = 0, m, key = 0;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) {
      parts.push({ kind: "html", html: html.slice(last, m.index), key: key++ });
    }
    if (m[1] === "DOC") {
      parts.push({ kind: "doc", id: m[2].trim(), key: key++ });
    } else {
      const [src, ...rest] = m[2].split("|");
      parts.push({ kind: "quote", cite: src.trim(), body: rest.join("|").trim(), key: key++ });
    }
    last = re.lastIndex;
  }
  if (last < html.length) parts.push({ kind: "html", html: html.slice(last), key: key++ });

  return parts.map(p => {
    if (p.kind === "html") {
      return <span key={p.key} dangerouslySetInnerHTML={{ __html: p.html }} />;
    }
    if (p.kind === "doc") {
      return <DocVignette key={p.key} id={p.id} onClick={onEnt} />;
    }
    if (p.kind === "quote") {
      return (
        <div key={p.key} className="pull-quote">
          <span dangerouslySetInnerHTML={{ __html: p.body }} />
          <cite dangerouslySetInnerHTML={{ __html: p.cite }} />
        </div>
      );
    }
  });
}

/* ---------- Header ----------
 * On home/reading, anchor links scroll within the page. On chapter pages,
 * they navigate to the homepage anchor (e.g. /#book) so the header acts as
 * site-wide wayfinding. The parts-menu dropdown shows step-kind parts only
 * (brackets are navbar-only). On chapter pages, each part link navigates
 * to its mapped chapter URL.
 *
 * `kind: "parts-menu"` (in `nav_reading`) renders the dropdown; the menu
 * button label is whatever the user authored (e.g. "Eras", "Parts", "Acts").
 */
function Header({ activeStop, onJumpStop, onJumpTop }) {
  const [partsOpen, setPartsOpen] = useState(false);
  useEffect(() => {
    if (!partsOpen) return;
    const close = (e) => {
      if (!e.target.closest('.menu-wrap')) setPartsOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [partsOpen]);

  const isChapterPage = PAGE.kind === 'chapter';
  // Step-kind parts only — brackets (QC/EFI) aren't shown in the dropdown.
  const stepParts = PARTS.filter(p => p.kind === 'step');
  const stepIdxOfActiveStop = (() => {
    const stop = PARTS[activeStop];
    if (!stop) return -1;
    return stepParts.findIndex(p => p.id === stop.id);
  })();
  const currentStep = stepIdxOfActiveStop >= 0 ? stepParts[stepIdxOfActiveStop] : null;

  const followHashLink = (href) => {
    const id = (href || '').replace(/^#/, '');
    if (!id) return;
    if (isChapterPage) {
      window.location.href = '/#' + id;
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="top-header">
      <div className="title" onClick={isChapterPage ? () => { window.location.href = '/'; } : onJumpTop} style={{ cursor: 'pointer' }}>
        <b>{SITE.title}</b> {SITE.subtitle && <span style={{ color: 'var(--ink-soft)' }}>· {SITE.subtitle}</span>}
      </div>
      <nav className="nav-main">
        {SITE.nav.map((item, i) => {
          if (item.kind === "parts-menu") {
            return (
              <div className="menu-wrap" key={i}>
                <button className={"menu-btn" + (partsOpen ? " open" : "")}
                        onClick={(e) => { e.stopPropagation(); setPartsOpen(o => !o); }}>
                  {item.label}{currentStep && currentStep.id !== 'prelude' ? <span style={{ color: 'var(--ink-soft)', textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>· {currentStep.title}</span> : null}
                  <span className="caret">▼</span>
                </button>
                {partsOpen && (
                  <div className="menu-pop">
                    {stepParts.map((p) => {
                      const slug = p.chapterSlug;
                      const href = isChapterPage && slug ? `/chapters/${slug}/` : `#part-${p.id}`;
                      return (
                        <a key={p.id} href={href}
                           onClick={(e) => {
                             setPartsOpen(false);
                             if (isChapterPage && slug) return; // let the navigation happen
                             e.preventDefault();
                             const stopIdx = PARTS.findIndex(s => s.id === p.id);
                             if (stopIdx >= 0) onJumpStop(stopIdx);
                           }}>
                          <span>{p.title}</span>
                          <span className="yrs">{p.subtitle}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          if (item.url && !item.url.startsWith('#')) {
            return <a key={i} className="menu-btn" href={item.url}>{item.label}</a>;
          }
          return (
            <button key={i} className="menu-btn" onClick={() => followHashLink(item.url)}>{item.label}</button>
          );
        })}
      </nav>
    </header>
  );
}

/* ---------- Document vignette ---------- */
function DocVignette({ id, onClick }) {
  const d = D.byId[id];
  if (!d) return null;
  return (
    <div className="doc-vignette" onClick={() => onClick && onClick(id)}>
      <div className="vk">document {d.year ? '· ' + d.year : ''}{d.author ? ' · ' + d.author : ''}</div>
      <h4>{d.name}</h4>
      {d.excerpt && <div className="vexcerpt">"{d.excerpt}"</div>}
      <div className="vmeta">{d.blurb}</div>
    </div>
  );
}

/* ---------- Entity drawer ---------- */
function EntDrawer({ id, onClose, onNavigate }) {
  if (!id) return null;
  const ent = D.byId[id];
  if (!ent) return null;
  return (
    <>
      <div className={"scrim" + (id ? " open" : "")} onClick={onClose} />
      <aside className={"ent-drawer" + (id ? " open" : "")}>
        <button className="close" onClick={onClose}>×</button>
        <span className="pill">{ent.kind}</span>
        <h3>{ent.name}</h3>
        <div className="meta">
          {ent.dates || ent.role || (ent.year ? ent.year : '') || (ent.founded ? `est. ${ent.founded}` : '')}
        </div>
        {ent.full && <p style={{ fontStyle: 'italic', color: 'var(--ink-soft)', marginTop: 6 }}>{ent.full}</p>}
        <p style={{ marginTop: 16 }}>{ent.blurb}</p>
        {ent.excerpt && (
          <div className="vexcerpt" style={{ borderLeft: '2px solid var(--tufte-red)', paddingLeft: 12, fontStyle: 'italic', margin: '14px 0' }}>
            "{ent.excerpt}"
          </div>
        )}
        {ent.links && ent.links.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="kicker" style={{ marginBottom: 8 }}>connected to</div>
            <div className="links">
              {ent.links.map(lid => {
                const e2 = D.byId[lid];
                if (!e2) return null;
                return (
                  <a key={lid} href="#" onClick={(ev) => { ev.preventDefault(); onNavigate(lid); }}>
                    <span>{e2.name}</span>
                    <span className="lk">{e2.kind}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

/* ---------- Part step ----------
 * Renders one chapter-level part (kind=step) inside the scrolly figure's
 * prose column. The DOM id `part-<id>` is what the stepper scroll-tracks
 * and what hash anchors target.
 */
function PartStep({ part, idx, onEnt }) {
  const proseHtml = PROSE[part.id] || '';
  const ref = useRef(null);

  // Wire up data-ent click handlers after render
  useEffect(() => {
    if (!ref.current) return;
    const handlers = [];
    ref.current.querySelectorAll('[data-ent]').forEach(el => {
      const handler = (e) => { e.preventDefault(); onEnt(el.dataset.ent); };
      el.addEventListener('click', handler);
      el.style.cursor = 'pointer';
      handlers.push([el, handler]);
    });
    return () => handlers.forEach(([el, h]) => el.removeEventListener('click', h));
  }, [proseHtml, onEnt]);

  return (
    <section id={"part-" + part.id} className="part-step" data-step={idx}>
      <div className="part-num"><span className="num">{part.num}</span> {part.kicker}</div>
      <h2>{part.title}</h2>
      <div className="part-dates">{part.subtitle}</div>
      <div ref={ref}>{renderProse(proseHtml, onEnt)}</div>
    </section>
  );
}

/* ---------- Stepper ----------
 * Unified stepper navbar. Every stop — chapter-level parts (kind=step) and
 * flanking brackets like QC and EFI (kind=bracket) — is rendered by the
 * same code path, configured per-stop via fields from `_data/parts.yml`:
 *
 *   kind              'step' | 'bracket'  — selects visual variant
 *   color             CSS color token name (e.g. 'tufte-red'); becomes
 *                     the `--stop-color` custom property on the stop
 *   bracketLine       true → render the connecting line ornament
 *   underlineActive   true → underline the label when this stop is active
 *
 * Active state: home / reading pages scroll-track every stop (parts +
 * brackets); the underline moves through QC → prelude → … → evacuation →
 * EFI as the reader scrolls. Chapter pages pin one part via
 * `stepper.highlightPartId`.
 *
 * Step-kind stops show numbered enum + title + year-range subtitle.
 * Bracket-kind stops show a single short label (with the optional
 * connecting line). On chapter pages each step-kind stop becomes an `<a>`
 * to its mapped chapter URL.
 */
function Stepper({ activeStop, onJumpStop }) {
  const isChapterPage = PAGE.kind === 'chapter';
  const stepperCfg = PAGE.stepper || {};
  const pinnedPartId = stepperCfg.highlightPartId || null;
  const pinnedIdx = pinnedPartId ? PARTS.findIndex(p => p.id === pinnedPartId) : -1;

  const renderStop = (p, i) => {
    const isActive = isChapterPage ? (i === pinnedIdx) : (i === activeStop);
    const isPassed = !isChapterPage && i < activeStop;
    const allowUnderline = p.underlineActive !== false;
    const cls = [
      'stepper__stop',
      'stepper__stop--' + (p.kind || 'step'),
      isActive ? 'active' : '',
      isPassed ? 'passed' : '',
      allowUnderline ? 'has-underline' : 'no-underline',
      p.bracketLine ? 'has-bracket-line' : ''
    ].filter(Boolean).join(' ');

    const style = p.color ? { '--stop-color': `var(--${p.color})` } : undefined;

    // Chapter pages: navigate to the mapped chapter URL when a step-kind
    // stop is clicked. Brackets and stops without a slug fall through to
    // hash anchor on the homepage.
    const slug = p.kind === 'step' ? p.chapterSlug : null;
    if (isChapterPage && slug) {
      return (
        <a key={p.id} className={cls} style={style} href={`/chapters/${slug}/`}>
          {p.bracketLine && <span className="stepper__stop-line" />}
          <StopBody part={p} index={i} />
        </a>
      );
    }
    // Brackets on chapter pages link to /#<id> (the def-bar is on the homepage)
    if (isChapterPage && p.kind === 'bracket') {
      return (
        <a key={p.id} className={cls} style={style} href={`/#${p.id}`}>
          {p.bracketLine && <span className="stepper__stop-line" />}
          <StopBody part={p} index={i} />
        </a>
      );
    }
    return (
      <button key={p.id} className={cls} style={style} onClick={() => onJumpStop(i)}>
        {p.bracketLine && <span className="stepper__stop-line" />}
        <StopBody part={p} index={i} />
      </button>
    );
  };

  return (
    <div className="stepper">
      <div className="stepper__stops">
        {PARTS.map(renderStop)}
      </div>
    </div>
  );
}

function StopBody({ part, index }) {
  if (part.kind === 'bracket') {
    return <span className="stepper__stop-label">{part.shortLabel || part.label}</span>;
  }
  return (
    <>
      <span className="stepper__stop-num">{part.num != null ? part.num : String(index).padStart(2, '0')}</span>
      <span className="stepper__stop-label">{part.shortLabel || part.title}</span>
      {part.subtitle && <span className="stepper__stop-years">{part.subtitle}</span>}
    </>
  );
}

/* ---------- Raw HTML block (for intro/outro from chapter pages) ---------- */
function RawHtml({ html, onEnt }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const handlers = [];
    ref.current.querySelectorAll('[data-ent]').forEach(el => {
      const handler = (e) => { e.preventDefault(); onEnt(el.dataset.ent); };
      el.addEventListener('click', handler);
      el.style.cursor = 'pointer';
      handlers.push([el, handler]);
    });
    return () => handlers.forEach(([el, h]) => el.removeEventListener('click', h));
  }, [html, onEnt]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ---------- Epigraph reveal ----------
 * Quotes revealed in cumulative scrolly succession: each fades from
 * dimmed/translated to fully present as it scrolls into view; once revealed,
 * stays revealed. Items are passed in via the `epigraphs` section in
 * _config.yml (kind: epigraphs, items: [{ quote, cite }, ...]).
 */
function BartlettEpigraphs({ id, items }) {
  const safeItems = items || [];
  const refs = useRef([]);
  const [revealed, setRevealed] = useState(() => safeItems.map(() => false));

  useEffect(() => {
    const observers = safeItems.map((_, i) => {
      const el = refs.current[i];
      if (!el) return null;
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(prev => {
            if (prev[i]) return prev;
            const next = prev.slice();
            next[i] = true;
            return next;
          });
        }
      }, { threshold: 0.45, rootMargin: '0px 0px -10% 0px' });
      io.observe(el);
      return io;
    });
    return () => observers.forEach(io => io && io.disconnect());
  }, [safeItems]);

  if (!safeItems.length) return null;

  // Distinct class names (epigraph-reveal__*) so the legacy `.epigraph` /
  // `.epigraph p` rules in main.scss (from the old landing-site epigraphs
  // include) can't squash font-size or padding via cascade. Outer element is
  // a <div> rather than <blockquote> for the same reason — and to avoid the
  // user-agent default `blockquote { margin: 1em 40px }` that visually
  // narrowed the break-out container.
  return (
    <div id={id} className="epigraph-reveal" aria-label="Epigraphs">
      {safeItems.map((item, i) => (
        <div key={i}
             ref={el => { refs.current[i] = el; }}
             className={'epigraph-reveal__card' + (revealed[i] ? ' revealed' : '')}
             role="figure"
             aria-label={item.cite ? `Epigraph by ${item.cite}` : 'Epigraph'}>
          <p className="epigraph-reveal__quote">&ldquo;{item.quote}&rdquo;</p>
          {item.cite && <p className="epigraph-reveal__cite">&mdash; {item.cite}</p>}
        </div>
      ))}
    </div>
  );
}

/* ---------- News coda ----------
 * Renders the latest N items from window.GS_DATA.news as compact cards plus
 * a link to the full /news/ archive.
 */
function NewsCoda({ limit = 3 }) {
  const items = (D.news || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, limit);
  if (!items.length) {
    return <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>No news yet — check back soon.</p>;
  }
  return (
    <>
      <div className="news-list">
        {items.map((it, i) => {
          const inner = (
            <>
              <div className="kicker">{it.date}{it.kind ? ` · ${it.kind}` : ''}</div>
              <h4 style={{ margin: '4px 0 6px', fontStyle: 'italic' }}>{it.title}</h4>
              {it.blurb && <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{it.blurb}</p>}
            </>
          );
          return it.link
            ? <a key={i} className="news-item" href={it.link}>{inner}</a>
            : <div key={i} className="news-item">{inner}</div>;
        })}
      </div>
      <p style={{ marginTop: 16 }}><a href="/news/">see all news →</a></p>
    </>
  );
}

/* ---------- App ---------- */
function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [activeStop, setActiveStop] = useState(0);
  const [progress, setProgress] = useState(0);
  const [drawerId, setDrawerId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  // PAGE_CONTEXT defaults so partial fixtures don't crash the app.
  const heroCfg = PAGE.hero || {};
  const stepperCfg = PAGE.stepper || {};
  const networkCfg = PAGE.network || {};
  const registersCfg = PAGE.registers || {};
  const intro = PAGE.intro || null;
  const outro = PAGE.outro || null;
  const showHero = heroCfg.show !== false;
  const showStepper = stepperCfg.show !== false && PARTS.length > 0;
  const showRegisters = registersCfg.show !== false;
  const showNetwork = networkCfg.show !== false && STEPS.length > 0;
  const hasProse = STEPS.length > 0 && STEPS.some(s => PROSE[s.id]);

  // Unified sections list (replaces SITE.registers + SITE.coda). Group by
  // slot for placement, then render via kind-aware switch. Per-page coda
  // override (PAGE.coda) is honored as a full sections list when present.
  const allSections = (PAGE.sections && PAGE.sections.length ? PAGE.sections : (SITE.sections || []));
  const registers = allSections.filter(s => s.kind === 'register');

  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.net = tweaks.net;
    document.body.style.fontSize = tweaks.fontSize + 'px';
  }, [tweaks]);

  useEffect(() => {
    if (!hasProse) return; // no scroll-driven tracking on chapter pages
    // Track every stepper stop. For step-kind parts the DOM id is `part-<id>`;
    // for bracket-kind stops (QC/EFI) it's the bare id (matches the def-bar
    // anchor in the sections renderer). Pair each tracked element with its
    // index in PARTS so the active state aligns with the stepper's stop list.
    const tracked = PARTS.map((p, i) => {
      const elId = p.kind === 'step' ? ('part-' + p.id) : p.id;
      const el = document.getElementById(elId);
      return el ? { el, idx: i } : null;
    }).filter(Boolean);

    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, window.scrollY / docH)));
      const probe = window.innerHeight * 0.4;
      let active = 0;
      tracked.forEach(({ el, idx }) => {
        const top = el.getBoundingClientRect().top;
        if (top <= probe) active = idx;
      });
      setActiveStop(active);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasProse]);

  // Jump to a stepper stop (any kind). For step-kind parts the target id is
  // `part-<id>`; for brackets it's the bare id (matches the def-bar anchor).
  const jumpToStop = (i) => {
    const stop = PARTS[i];
    if (!stop) return;
    const elId = stop.kind === 'step' ? ('part-' + stop.id) : stop.id;
    const el = document.getElementById(elId);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };
  const jumpTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const onEnt = (id) => setDrawerId(id);

  // Map the active stepper stop (which can be a bracket OR a step) onto an
  // index into the STEPS array, used by the network figure caption.
  // If the active stop is a bracket BEFORE any step, fall back to 0; if AFTER
  // every step, snap to the last step.
  const currentStepIdx = (() => {
    if (!STEPS.length) return 0;
    const activeStopObj = PARTS[activeStop];
    if (!activeStopObj) return 0;
    if (activeStopObj.kind === 'step') {
      const idx = STEPS.findIndex(s => s.id === activeStopObj.id);
      return idx >= 0 ? idx : 0;
    }
    // Bracket: find the nearest preceding step in PARTS
    for (let j = activeStop - 1; j >= 0; j--) {
      if (PARTS[j].kind === 'step') {
        const idx = STEPS.findIndex(s => s.id === PARTS[j].id);
        if (idx >= 0) return idx;
      }
    }
    return 0;
  })();

  const { TweaksPanel, TweakSection, TweakRadio, TweakSlider } = window;
  const heroTitle = heroCfg.titleLines && heroCfg.titleLines.length ? heroCfg.titleLines : (SITE.hero.title_lines || ["The Greatest", "Shortcoming"]);

  // Kind-aware section renderer. Switch on `kind` to pick the wrapper:
  //   register   → bordered .def-bar
  //   coda       → plain .coda block
  //   news       → .coda wrapper around <NewsCoda /> (the live items list)
  //   epigraphs  → standalone .bartlett-epigraphs scroll-reveal
  // Sections without a recognized kind are silently skipped.
  const renderSection = (s) => {
    if (!s || !s.id) return null;
    if (s.kind === 'register') {
      return (
        <section key={s.id} id={s.id} className="def-bar">
          <div className="def-inner">
            <div className="kicker">{s.kicker}</div>
            <h3>{s.title}</h3>
            {/* Body is rendered Markdown from _sections/<id>.md — may contain
                multiple <p> tags, so wrap in a <div> rather than <p>. */}
            <div className="section-body" dangerouslySetInnerHTML={{ __html: s.body || '' }} />
          </div>
        </section>
      );
    }
    if (s.kind === 'epigraphs') {
      return <BartlettEpigraphs key={s.id} id={s.id} items={s.items} />;
    }
    if (s.kind === 'news') {
      return (
        <section key={s.id} id={s.id} className="coda">
          {s.kicker && <div className="kicker">{s.kicker}</div>}
          {s.title && <h2>{s.title}</h2>}
          <NewsCoda />
        </section>
      );
    }
    // coda (default)
    return (
      <section key={s.id} id={s.id} className="coda">
        {s.kicker && <div className="kicker">{s.kicker}</div>}
        {s.title && <h2>{s.title}</h2>}
        {/* Body is rendered Markdown from _sections/<id>.md — may contain
            multiple <p> tags, so wrap in a <div> rather than <p>. */}
        {s.body && <div className="section-body" dangerouslySetInnerHTML={{ __html: s.body }} />}
      </section>
    );
  };

  // Group sections by slot. On chapter pages, registers don't render (the page
  // is about chapter content, not the analytical apparatus); other slots still
  // render so Book / Author / News / Resources appear in the same flow.
  const isHome = PAGE.kind === 'home' || PAGE.kind === 'reading';
  const slotFilter = (slotName) => allSections.filter(s => {
    if (s.slot !== slotName) return false;
    if (!isHome && s.kind === 'register') return false;
    return true;
  });
  const preStepperSections = slotFilter('pre-stepper');
  const preScrollySections = slotFilter('pre-scrolly');
  const postScrollySections = slotFilter('post-scrolly');
  const postCodaSections = slotFilter('post-coda');

  return (
    <>
      <div className="scroll-progress"><div className="bar" style={{ width: (progress * 100) + '%' }} /></div>

      <Header activeStop={activeStop} onJumpStop={jumpToStop} onJumpTop={jumpTop} />

      {showHero && (
        <div className="hero">
          <h1>{heroTitle.map((line, i) => <React.Fragment key={i}>{line}{i < heroTitle.length - 1 ? <br /> : null}</React.Fragment>)}</h1>
          {registers.length > 0 && (
            <div className="kicker hero-kicker">
              {registers.map((r, i) => (
                <React.Fragment key={r.id}>
                  {i > 0 && <span className="amp"> &amp; </span>}
                  <a href={"#" + r.id} onClick={(e) => { e.preventDefault(); document.getElementById(r.id)?.scrollIntoView({ behavior: 'smooth' }); }}>
                    {r.title.toLowerCase()}{i === registers.length - 1 ? " →" : ""}
                  </a>
                </React.Fragment>
              ))}
            </div>
          )}
          <p className="deck">{heroCfg.deck || SITE.hero.deck}</p>
          {(heroCfg.scrollCue || SITE.hero.scroll_cue) && <div className="scroll-cue">{heroCfg.scrollCue || SITE.hero.scroll_cue}</div>}
        </div>
      )}

      {intro && <section className="page-intro"><RawHtml html={intro.html} onEnt={onEnt} /></section>}

      {/* Pre-stepper slot: Book + Bartlett epigraphs + Author (in YAML order) */}
      {preStepperSections.map(renderSection)}

      {showStepper && <Stepper activeStop={activeStop} onJumpStop={jumpToStop} />}

      {/* Pre-scrolly slot: QC frames the parts */}
      {showRegisters && preScrollySections.map(renderSection)}

      {showNetwork && hasProse && (
        <div className="scrolly">
          <div className="sticky-figure">
            <div className="figure-frame">
              <div className="figure-caption">
                <span><b>Figure 1.</b> {networkCfg.caption || 'The network grows part by part.'}</span>
                <span>step {String(currentStepIdx + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')} · {STEPS[currentStepIdx] ? STEPS[currentStepIdx].title : ''}</span>
              </div>
              <div className="figure-svg-wrap">
                <window.ScrollyNetwork
                  stepIndex={currentStepIdx}
                  activeId={drawerId}
                  hoveredId={hoveredId}
                  setHoveredId={setHoveredId}
                  onNodeClick={(id) => setDrawerId(id)} />
              </div>
              <div className="figure-legend">
                <span><i className="person" />person</span>
                <span><i className="org" />organization</span>
                <span><i className="theme" />theme</span>
                <span><i className="instrument" />instrument</span>
                <span><i className="doc" />document</span>
              </div>
            </div>
          </div>

          <div className="prose">
            {STEPS.map((s, i) => {
              const part = (D.parts || []).find(p => p.id === s.id) || s;
              // Merge per-step `subtitle` (year range computed in page-context)
              // onto the part record so PartStep can show the dates line.
              const merged = { ...part, subtitle: s.subtitle || part.subtitle, num: s.num || part.num };
              return <PartStep key={merged.id} part={merged} idx={i} onEnt={onEnt} />;
            })}
          </div>
        </div>
      )}

      {/* Post-scrolly slot: EFI closes the part arc */}
      {showRegisters && postScrollySections.map(renderSection)}

      {outro && <section className="page-outro"><RawHtml html={outro.html} onEnt={onEnt} /></section>}

      {/* Post-coda slot: News, Resources */}
      {postCodaSections.map(renderSection)}

      <EntDrawer id={drawerId} onClose={() => setDrawerId(null)} onNavigate={setDrawerId} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Type & color">
          <TweakRadio label="Theme" value={tweaks.theme} onChange={v => setTweak('theme', v)}
            options={[{ value: 'warm', label: 'Warm' }, { value: 'ivory', label: 'Ivory' }, { value: 'cool', label: 'Cool' }]} />
          <TweakSlider label="Body size" min={16} max={22} step={1} value={tweaks.fontSize} onChange={v => setTweak('fontSize', v)} />
        </TweakSection>
        <TweakSection label="Network">
          <TweakRadio label="Drawing" value={tweaks.net} onChange={v => setTweak('net', v)}
            options={[{ value: 'rough', label: 'Sketchy' }, { value: 'clean', label: 'Clean' }]} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
