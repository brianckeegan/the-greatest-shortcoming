/* ============================================================================
 * app.jsx — main React renderer for the homepage and chapter pages.
 * Reads window.SITE (page-invariant config + sections list),
 *       window.GS_DATA (entities + news),
 *       window.PAGE_CONTEXT (per-page steps, prose, intro/outro, hero/stepper
 *                             config, sections override).
 * Mounts into #root. Section rendering is kind-aware (register / coda / news /
 * epigraphs) and slot-positioned (pre-stepper / pre-scrolly / post-scrolly /
 * post-coda).
 * ============================================================================ */

const { useState, useEffect, useRef, useMemo } = React;
const D = window.GS_DATA;
const PAGE = window.PAGE_CONTEXT || {};
const STEPS = PAGE.steps || [];
const SITE = window.SITE;
const PROSE = PAGE.prose || {};

const TWEAK_DEFAULTS = SITE.themeDefaults || { theme: "cool", net: "rough", fontSize: 18 };

/* ---------- Prose renderer ----------
 * Era prose comes in as HTML strings with two server-side macros:
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
 * site-wide wayfinding. Era buttons inside the eras-menu navigate to the
 * mapped chapter URL when on a chapter page.
 */
function Header({ activeStep, onJumpEra, onJumpTop }) {
  const [erasOpen, setErasOpen] = useState(false);
  useEffect(() => {
    if (!erasOpen) return;
    const close = (e) => {
      if (!e.target.closest('.menu-wrap')) setErasOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [erasOpen]);

  const isChapterPage = PAGE.kind === 'chapter';
  const currentEra = STEPS[activeStep];

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
          if (item.kind === "eras-menu") {
            return (
              <div className="menu-wrap" key={i}>
                <button className={"menu-btn" + (erasOpen ? " open" : "")}
                        onClick={(e) => { e.stopPropagation(); setErasOpen(o => !o); }}>
                  {item.label}{currentEra && currentEra.id !== 'prelude' ? <span style={{ color: 'var(--ink-soft)', textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>· {currentEra.title}</span> : null}
                  <span className="caret">▼</span>
                </button>
                {erasOpen && (
                  <div className="menu-pop">
                    {STEPS.map((s, idx) => {
                      const era = (D.eras || []).find(e => e.id === s.id);
                      const slug = era && era.chapter_slug;
                      const href = isChapterPage && slug ? `/chapters/${slug}/` : `#step-${s.id}`;
                      return (
                        <a key={s.id} href={href}
                           onClick={(e) => {
                             setErasOpen(false);
                             if (isChapterPage && slug) return; // let the navigation happen
                             e.preventDefault();
                             onJumpEra(idx);
                           }}>
                          <span>{s.title}</span>
                          <span className="yrs">{s.subtitle}</span>
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

/* ---------- Era step ---------- */
function EraStep({ era, idx, onEnt }) {
  const proseHtml = PROSE[era.id] || '';
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
    <section id={"step-" + era.id} className="era-step" data-step={idx}>
      <div className="era-num"><span className="num">{era.num}</span> {era.kicker}</div>
      <h2>{era.title}</h2>
      <div className="era-dates">{era.subtitle}</div>
      <div ref={ref}>{renderProse(proseHtml, onEnt)}</div>
    </section>
  );
}

/* ---------- Era stepper ----------
 * Home/reading: clicking an era scrolls to the matching scrolly section; the
 * active state tracks the scroll position. Chapter pages: clicking an era
 * navigates to the mapped chapter URL; the active state pins to the
 * chapter's `highlightEraId`. QC/EFI brackets always link to register
 * sections — on chapter pages, those are on the homepage so the link form is
 * `/#quant-chauvinism`.
 */
function EraStepper({ activeStep, onJump }) {
  const isChapterPage = PAGE.kind === 'chapter';
  const stepperCfg = PAGE.stepper || {};
  const pinnedEraId = stepperCfg.highlightEraId || null;
  const pinnedIdx = pinnedEraId ? STEPS.findIndex(s => s.id === pinnedEraId) : -1;

  const left = stepperCfg.leftBracket || { label: 'Quantitative chauvinism', href: '#quant-chauvinism' };
  const right = stepperCfg.rightBracket || { label: 'Ecofascist imaginaries', href: '#ecofascist-imaginaries' };

  const followBracket = (href) => {
    const id = (href || '').replace(/^#/, '');
    if (!id) return;
    if (isChapterPage) {
      window.location.href = '/#' + id;
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="era-stepper">
      <a className="stepper-bracket left" href={isChapterPage ? '/' + left.href : left.href}
         onClick={(e) => { e.preventDefault(); followBracket(left.href); }}>
        <span className="bracket-label">{left.label}</span>
        <span className="bracket-line" />
      </a>
      <div className="stepper-eras">
        {STEPS.map((s, i) => {
          const era = (D.eras || []).find(e => e.id === s.id);
          const slug = era && era.chapter_slug;
          const isActive = isChapterPage ? (i === pinnedIdx) : (i === activeStep);
          const isPassed = !isChapterPage && i < activeStep;
          const cls = (isActive ? "active" : "") + (isPassed ? " passed" : "");
          if (isChapterPage && slug) {
            return (
              <a key={s.id} className={cls} href={`/chapters/${slug}/`}>
                <span className="enum">{String(i).padStart(2, '0')}</span>
                <span className="ename">{s.title}</span>
                {s.subtitle && <span className="eyears">{s.subtitle}</span>}
              </a>
            );
          }
          return (
            <button key={s.id} className={cls} onClick={() => onJump(i)}>
              <span className="enum">{String(i).padStart(2, '0')}</span>
              <span className="ename">{s.title}</span>
              {s.subtitle && <span className="eyears">{s.subtitle}</span>}
            </button>
          );
        })}
      </div>
      <a className="stepper-bracket right" href={isChapterPage ? '/' + right.href : right.href}
         onClick={(e) => { e.preventDefault(); followBracket(right.href); }}>
        <span className="bracket-line" />
        <span className="bracket-label">{right.label}</span>
      </a>
    </div>
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
  const [activeStep, setActiveStep] = useState(0);
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
  const showStepper = stepperCfg.show !== false && STEPS.length > 0;
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
    if (!hasProse) return; // no scroll-driven step tracking on chapter pages
    const sections = STEPS.map(s => document.getElementById('step-' + s.id)).filter(Boolean);
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, window.scrollY / docH)));
      const probe = window.innerHeight * 0.4;
      let active = 0;
      sections.forEach((el, i) => {
        const top = el.getBoundingClientRect().top;
        if (top <= probe) active = i;
      });
      setActiveStep(active);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasProse]);

  const jumpToEra = (i) => {
    const el = document.getElementById('step-' + STEPS[i].id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };
  const jumpTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const onEnt = (id) => setDrawerId(id);

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
            <p dangerouslySetInnerHTML={{ __html: s.body || '' }} />
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
        {s.body && <p dangerouslySetInnerHTML={{ __html: s.body }} />}
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

      <Header activeStep={activeStep} onJumpEra={jumpToEra} onJumpTop={jumpTop} />

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

      {showStepper && <EraStepper activeStep={activeStep} onJump={jumpToEra} />}

      {/* Pre-scrolly slot: QC frames the eras */}
      {showRegisters && preScrollySections.map(renderSection)}

      {showNetwork && hasProse && (
        <div className="scrolly">
          <div className="sticky-figure">
            <div className="figure-frame">
              <div className="figure-caption">
                <span><b>Figure 1.</b> {networkCfg.caption || 'The network grows era by era.'}</span>
                <span>step {String(activeStep + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')} · {STEPS[activeStep] ? STEPS[activeStep].title : ''}</span>
              </div>
              <div className="figure-svg-wrap">
                <window.ScrollyNetwork
                  stepIndex={activeStep}
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
              const era = (D.eras || []).find(e => e.id === s.id) || s;
              return <EraStep key={era.id} era={era} idx={i} onEnt={onEnt} />;
            })}
          </div>
        </div>
      )}

      {/* Post-scrolly slot: EFI closes the era arc */}
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
