/* The Greatest Shortcoming — landing scrollytelling engine.
   Drives the narration beats (steps, digital clock, "% full" readout, progress
   bar, Act 3 text) from scroll position, and scrubs the pre-rendered background
   <video> (#bcanvas) to match. The heavy bacteria → spill → hedcut simulation
   that used to run live on a <canvas> here is now rendered offline to video
   (see render/README.md); this file no longer simulates anything. No build step. */
(function () {
  function init() {
/* ---------------- Chapter data (mirrors _data/chapters.yml, new structure) ---------------- */
const CHAPTERS = [
  { n:"01", slug:"01-boulder", title:"Boulder", years:"the case", concept:"Quantitative chauvinism & lebensraum imaginaries",
    teaser:"A progressive city builds the most elaborate growth-control machinery in America — and ends up whiter than the state around it.",
    body:"Boulder introduces the book's two operating concepts through a hundred years of its own institutional history: the Colorado Chautauqua of 1898, the Olmsted Report of 1910, the Blue Line of 1959, the carrying-capacity ordinances of the 1970s. A nominally progressive community built one of the most elaborate growth-management apparatuses in the country — and produced a city that was, by 2020, <b>83% non-Hispanic white</b> in a state two-thirds so. Boulder isn't exceptional; it's legible. The slide from conservation into exclusion was gradual enough that each step looked, from the inside, like responsible stewardship.",
    q:"How did the quantitative tools of environmental governance come to share a grammar with the journals of white nationalists?" },
  { n:"02", slug:"02-the-inheritance", title:"The Inheritance", years:"1900 – 1968", concept:"The architecture, already built",
    teaser:"Before Bartlett ever picked up the chalk, the apparatus, the vocabulary, and the audience were already in place.",
    body:"Bartlett's lecture was not an original act of creation; it entered a formation assembled across the first half of the twentieth century. Four currents converge: the <b>institutional eugenics apparatus</b> at Cold Spring Harbor, codified through sterilization regimes after <i>Buck v. Bell</i>; the German science of <b>Lebensraum</b> (Friedrich Ratzel → Rudolf Kjellén → Karl Haushofer); the <b>American conservation movement</b>, sharing donors and personnel with eugenics through Madison Grant and Henry Fairfield Osborn; and the postwar <b>population-concern community</b> — the Population Council, Paul Ehrlich, Garrett Hardin, the Club of Rome.",
    q:"What did Bartlett's lecture inherit?" },
  { n:"03", slug:"03-the-bottle", title:"The Bottle", years:"1968 – 1994", concept:"Domesticated scientism",
    teaser:"He gave the same lecture 1,742 times. Each time, arithmetic quietly became obligation.",
    body:"In the late 1960s the Cold War's ambient dread found a new target. Ehrlich's <i>Population Bomb</i> sold three million copies; Hardin's lifeboat ethics argued some must drown so others survive. Bartlett's contribution worked at a different register — it didn't predict famine, it <b>taught arithmetic</b>, and made the math feel like insight and the insight feel like obligation. This chapter names the mechanism — <b>domesticated scientism</b> — by which exponential arithmetic was naturalized as ecology, and ends on the 1995 exchange where the movement's exclusionary logic first surfaced as a dispute.",
    q:"How did exponential arithmetic become environmental common sense?" },
  { n:"04", slug:"04-the-quarantine", title:"The Quarantine", years:"1995 – 2008", concept:"Agnotological infrastructuring",
    teaser:"After Cairo, the movement lost its license — so it built a new one out of footnotes.",
    body:"The 1994 Cairo conference replaced coercive population control with women's reproductive autonomy. For the population-concern community it was a catastrophe — but the anxieties didn't vanish, they migrated. With fertility control delegitimized, <b>immigration restriction</b> became the residual lever. John Tanton built a network that laundered nativist conclusions through the aesthetics of neutral policy expertise: fiscal impact statements that turned \u201cshould we admit these people?\u201d into \u201cwhat do these people cost?\u201d The chapter calls the method <b>agnotological infrastructuring</b> — the manufacture of ignorance through parallel institutions.",
    q:"How did these ideas survive their own delegitimation — and shed their association with racism?" },
  { n:"05", slug:"05-the-swarm", title:"The Swarm", years:"2009 – 2024", concept:"Demographic engineering",
    teaser:"A federal press release became one of the most-cited numbers in a mass-shooter's manifesto.",
    body:"In 2008 the Census Bureau announced that non-Hispanic whites would become a minority by 2042, with a chart of converging lines. The projection was conditional; the chart was not. Stripped of caveats by screenshots and memes, the <b>crossover chart</b> traveled from a federal agency to chan-boards to the \u201cgreat replacement\u201d narrative and into manifestos. Federal demographers had produced, with unimpeachable authority, exactly the object restrictionists could never have manufactured themselves. The chapter calls the operation <b>demographic engineering</b>.",
    q:"How did a federal projection become the epistemic infrastructure of replacement politics once it left its makers?" },
  { n:"06", slug:"06-the-portfolio", title:"The Portfolio", years:"2025 – 2048", concept:"Fine-tuning & temporal gerrymandering",
    teaser:"Overpopulation panic flips into its mirror image: where did all the babies go?",
    body:"As replacement anxiety crested, the headline inverted — from \u201cminorities will be the majority\u201d to \u201cwhere have all the babies gone?\u201d Pronatalism recruited the very same quantitative infrastructure: fiscal-burden analysis became <b>demographic return-on-investment</b>, and wombs became policy levers. A 2024 legal complaint treated each prevented birth as an implied cost, each birth as a fiscal return. The chapter develops two concepts — <b>fine-tuning</b> (financial optimization applied to demography) and <b>temporal gerrymandering</b> (manipulating time horizons to manufacture urgency) — and shows that zero population growth and pronatalism are structurally the same project.",
    q:"Why are zero population growth and pronatalism the same project?" },
  { n:"07", slug:"07-the-evacuation", title:"The Evacuation", years:"2049 – 2068", concept:"Regenerative sovereignty",
    teaser:"When the bottle is finally full, the question stops being who stays and becomes who gets rescued.",
    body:"The final era is speculative; its mechanisms are not. Cascading climate catastrophe shifts the governing question from who belongs to <b>who gets rescued</b>. The instrument is no longer a curve but a model of the shocks themselves — <b>shock-spillover modeling</b>, where a disruption in one region is forecast as a cascade carried by the displaced into the regions that receive them. The chapter follows that apparatus to an <b>autonomous decision system</b> issuing evacuation determinations faster than any human review, and shows how a bioregional, restorative vocabulary — <b>regenerative sovereignty</b> — becomes the progressive idiom in which Hardin's lifeboat returns.",
    q:"When the decision is handed to a system no one in the water can argue with, whose survival counts?" },
  { n:"08", slug:"08-the-long-term", title:"The Long Term", years:"the reclamation", concept:"Intersectional longtermism",
    teaser:"The future has been ceded to people who use it as a warrant for present cruelty. Take it back.",
    body:"Long-term thinking has been surrendered to longtermisms that treat the future as a license for present coercion. This chapter reclaims it — drawing <b>intersectional longtermism</b> from communities that have already survived long-term projects of erasure and had to think in generations to do it: <b>Black ecologies, Indigenous continuance, disability justice, reproductive justice, and antifascist organizing</b>. From them it distills a constructive program — <b>quantitative egalitarianism</b>, which demotes the number from verdict to evidence, and <b>solidarity infrastructuring</b>, the work of carrying these traditions across generations.",
    q:"Who owns the long term — and what does it look like to wield quantitative tools without recruiting them for exclusion?" },
  { n:"09", slug:"09-boulder-again", title:"Boulder Again", years:"the return", concept:"What the valley owes",
    teaser:"What the model strips from bacteria — memory, feedback, survival — is what these imaginaries strip from us.",
    body:"The book returns to where it opened. Bartlett's bacteria-in-a-bottle is read as a <b>micro-macro isomorphism</b>: what the model deletes from real bacteria — feedback, coordination, memory, survival — is exactly what lebensraum imaginaries delete from human communities. The chapter brings the argument down to Boulder's own ground — the Cheyenne and Arapaho, the <b>Sand Creek Massacre</b> as the local precedent for what the architecture produces under stress, and a deep-time future of water, fire, and heat — and turns the nativist question of who belongs into the question of <b>what the valley owes the people in a rapidly warming world.</b>",
    q:"What does the valley owe the people in a warming world?" }
];
const CH_BASE = "/chapters/"; // chapter page base; standalone preview links are illustrative

/* ---------------- Midcentury textbook plate illustrations (per metaphor) ---------------- */
const ART = {
  "01-boulder": "<svg viewBox=\"0 0 160 116\"><circle cx=\"40\" cy=\"34\" r=\"18\" fill=\"#e0a52f\"/><polygon points=\"20,92 50,46 80,92\" fill=\"#1a1a1a\"/><polygon points=\"58,92 92,36 126,92\" fill=\"#b0382a\" fill-opacity=\"0.9\"/><polygon points=\"104,92 128,56 152,92\" fill=\"#285079\" fill-opacity=\"0.9\"/><line x1=\"12\" y1=\"92\" x2=\"152\" y2=\"92\" stroke=\"#1a1a1a\" stroke-width=\"3\"/></svg>",
  "02-the-inheritance": "<svg viewBox=\"0 0 160 116\"><g stroke-width=\"7\"><line x1=\"20\" y1=\"14\" x2=\"80\" y2=\"90\" stroke=\"#b0382a\"/><line x1=\"62\" y1=\"12\" x2=\"80\" y2=\"90\" stroke=\"#285079\"/><line x1=\"100\" y1=\"12\" x2=\"80\" y2=\"90\" stroke=\"#e0a52f\"/><line x1=\"140\" y1=\"14\" x2=\"80\" y2=\"90\" stroke=\"#1a1a1a\"/></g><circle cx=\"80\" cy=\"90\" r=\"11\" fill=\"#1a1a1a\"/><rect x=\"74\" y=\"96\" width=\"12\" height=\"16\" fill=\"#1a1a1a\"/></svg>",
  "03-the-bottle": "<svg viewBox=\"0 0 160 116\"><line x1=\"24\" y1=\"12\" x2=\"24\" y2=\"98\" stroke=\"#1a1a1a\" stroke-width=\"2.5\"/><line x1=\"24\" y1=\"98\" x2=\"152\" y2=\"98\" stroke=\"#1a1a1a\" stroke-width=\"2.5\"/><path d=\"M34 93 C84 90 104 82 118 60 C128 44 132 32 134 24\" fill=\"none\" stroke=\"#1a1a1a\" stroke-width=\"2\"/><circle cx=\"34\" cy=\"93\" r=\"4\" fill=\"#285079\"/><circle cx=\"54\" cy=\"92\" r=\"4.5\" fill=\"#1a1a1a\"/><circle cx=\"74\" cy=\"88\" r=\"5\" fill=\"#e0a52f\"/><circle cx=\"92\" cy=\"80\" r=\"5.5\" fill=\"#285079\"/><circle cx=\"108\" cy=\"66\" r=\"6.5\" fill=\"#1a1a1a\"/><circle cx=\"122\" cy=\"46\" r=\"8\" fill=\"#b0382a\"/><circle cx=\"134\" cy=\"24\" r=\"10\" fill=\"#b0382a\"/></svg>",
  "04-the-quarantine": "<svg viewBox=\"0 0 160 116\"><circle cx=\"58\" cy=\"52\" r=\"30\" fill=\"#285079\" fill-opacity=\"0.9\"/><line x1=\"34\" y1=\"22\" x2=\"126\" y2=\"94\" stroke=\"#1a1a1a\" stroke-width=\"9\" stroke-linecap=\"square\"/><line x1=\"126\" y1=\"22\" x2=\"34\" y2=\"94\" stroke=\"#b0382a\" stroke-width=\"9\" stroke-linecap=\"square\"/><rect x=\"14\" y=\"100\" width=\"132\" height=\"7\" fill=\"#1a1a1a\"/><rect x=\"104\" y=\"18\" width=\"22\" height=\"22\" fill=\"#e0a52f\"/></svg>",
  "05-the-swarm": "<svg viewBox=\"0 0 160 116\"><line x1=\"96\" y1=\"10\" x2=\"96\" y2=\"106\" stroke=\"#1a1a1a\" stroke-width=\"3\"/><polygon points=\"20,28 29,46 11,46\" fill=\"#1a1a1a\"/><polygon points=\"38,18 45,32 31,32\" fill=\"#b0382a\"/><polygon points=\"30,52 41,74 19,74\" fill=\"#285079\"/><polygon points=\"15,64 23,80 7,80\" fill=\"#e0a52f\"/><polygon points=\"48,50 61,76 35,76\" fill=\"#1a1a1a\"/><polygon points=\"60,28 68,44 52,44\" fill=\"#b0382a\"/><polygon points=\"72,54 82,74 62,74\" fill=\"#285079\"/><polygon points=\"52,84 61,102 43,102\" fill=\"#e0a52f\"/><polygon points=\"33,84 45,106 21,106\" fill=\"#1a1a1a\"/><polygon points=\"74,86 82,102 66,102\" fill=\"#b0382a\"/><polygon points=\"84,40 92,56 76,56\" fill=\"#285079\"/><polygon points=\"20,94 27,108 13,108\" fill=\"#1a1a1a\"/><polygon points=\"62,98 70,112 54,112\" fill=\"#e0a52f\"/><g fill=\"#ece4d2\" stroke=\"#1a1a1a\" stroke-width=\"2.5\"><circle cx=\"120\" cy=\"38\" r=\"13\"/><circle cx=\"140\" cy=\"70\" r=\"10\"/><circle cx=\"116\" cy=\"86\" r=\"8.5\"/></g></svg>",
  "06-the-portfolio": "<svg viewBox=\"0 0 160 116\"><rect x=\"20\" y=\"98\" width=\"120\" height=\"7\" fill=\"#e0a52f\"/><polygon points=\"80,60 69,92 91,92\" fill=\"#1a1a1a\"/><line x1=\"34\" y1=\"46\" x2=\"126\" y2=\"62\" stroke=\"#1a1a1a\" stroke-width=\"4\"/><circle cx=\"34\" cy=\"46\" r=\"14\" fill=\"#b0382a\"/><rect x=\"112\" y=\"50\" width=\"24\" height=\"24\" fill=\"#285079\"/></svg>",
  "07-the-evacuation": "<svg viewBox=\"0 0 160 116\"><rect x=\"14\" y=\"16\" width=\"132\" height=\"84\" fill=\"#285079\" fill-opacity=\"0.12\" stroke=\"#1a1a1a\" stroke-width=\"2\"/><path d=\"M14 62 Q50 46 86 60 T146 54\" fill=\"none\" stroke=\"#285079\" stroke-width=\"2.5\"/><line x1=\"22\" y1=\"86\" x2=\"138\" y2=\"34\" stroke=\"#b0382a\" stroke-width=\"2.5\" stroke-dasharray=\"7 6\"/><polygon points=\"40,80 47,92 33,92\" fill=\"#1a1a1a\"/><rect x=\"64\" y=\"58\" width=\"13\" height=\"13\" fill=\"#e0a52f\"/><circle cx=\"98\" cy=\"50\" r=\"7\" fill=\"#b0382a\"/><polygon points=\"120,40 128,52 112,52\" fill=\"#1a1a1a\"/><path d=\"M138 34 l-8 1 m8 -1 l-2 8\" stroke=\"#b0382a\" stroke-width=\"2.5\" fill=\"none\"/></svg>",
  "08-the-long-term": "<svg viewBox=\"0 0 160 116\"><circle cx=\"78\" cy=\"58\" r=\"34\" fill=\"none\" stroke=\"#1a1a1a\" stroke-width=\"3\" stroke-dasharray=\"150 64\" transform=\"rotate(-32 78 58)\"/><line x1=\"78\" y1=\"58\" x2=\"78\" y2=\"33\" stroke=\"#1a1a1a\" stroke-width=\"3\"/><line x1=\"78\" y1=\"58\" x2=\"99\" y2=\"66\" stroke=\"#b0382a\" stroke-width=\"3\"/><circle cx=\"64\" cy=\"46\" r=\"6\" fill=\"#285079\"/><circle cx=\"78\" cy=\"58\" r=\"3.5\" fill=\"#1a1a1a\"/><rect x=\"12\" y=\"16\" width=\"20\" height=\"20\" fill=\"#b0382a\"/><polygon points=\"132,14 150,14 141,0\" fill=\"#e0a52f\"/><circle cx=\"22\" cy=\"98\" r=\"11\" fill=\"#285079\"/><polygon points=\"126,94 146,94 137,110\" fill=\"#1a1a1a\"/></svg>",
  "09-boulder-again": "<svg viewBox=\"0 0 160 116\"><circle cx=\"40\" cy=\"34\" r=\"18\" fill=\"#e0a52f\"/><polygon points=\"20,46 80,46 50,92\" fill=\"#1a1a1a\"/><polygon points=\"58,36 126,36 92,92\" fill=\"#b0382a\" fill-opacity=\"0.9\"/><polygon points=\"104,56 152,56 128,92\" fill=\"#285079\" fill-opacity=\"0.9\"/><line x1=\"12\" y1=\"92\" x2=\"152\" y2=\"92\" stroke=\"#1a1a1a\" stroke-width=\"3\"/></svg>"
};

/* ---------------- Build chapter cards ---------------- */
// On the Jekyll homepage the chapter cards are rendered server-side from
// _data/chapters.yml (see _includes/chapter-card.html), so #chGrid is absent
// and this client-side build is skipped. It runs only on the standalone
// landing.html prototype, which still carries #chGrid.
const grid = document.getElementById('chGrid');
if (grid) CHAPTERS.forEach((c,i)=>{
  const card = document.createElement('a');
  card.className='ch-card reveal';
  card.href = 'chapters/'+c.slug+'.html';
  card.style.transitionDelay = (i%3*60)+'ms';
  card.innerHTML = `<figure class="plate"><div class="plate-art">${ART[c.slug]||''}</div>
    <figcaption><span class="fig">Fig. ${c.n}</span><span class="cyears">${c.years}</span></figcaption></figure>
    <span class="cnum">Chapter ${c.n}</span>
    <h3>${c.title}</h3><div class="concept">${c.concept}</div>
    <p class="teaser">${c.teaser}</p>
    <span class="more">Read chapter <span class="arw">→</span></span>`;
  grid.appendChild(card);
});

/* ---------------- Scroll reveals ---------------- */
const io=new IntersectionObserver((es)=>{
  es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('is-on'); io.unobserve(en.target);} });
},{threshold:.18});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---------------- Title reveal ---------------- */
// The title card lives on the home hub (/home.html), not this landing page, so
// guard: only wire the reveal when both elements are actually present.
const bigtitle=document.getElementById('bigtitle');
const titlecardEl=document.getElementById('titlecard');
if(bigtitle&&titlecardEl){
  new IntersectionObserver((es)=>{
    es.forEach(en=>{ if(en.isIntersecting) bigtitle.classList.add('is-on'); });
  },{threshold:.4}).observe(titlecardEl);
}

/* ---------------- ACT 1 scroll engine: bottle fill + steps ---------------- */
const act1=document.getElementById('act1');
const act2=document.getElementById('act2');
const a2text=document.getElementById('a2text');
const a2quote=document.getElementById('a2quote');
const act3=document.getElementById('act3');
const a3lines=[...document.querySelectorAll('.a3-line')];
const steps=[...document.querySelectorAll('.pstep')];
const pctEl=document.getElementById('pct');
const clockEl=document.getElementById('clock');
const clockTimeEl=document.getElementById('clockTime');
function fmtClock(m){
  m=Math.round(m);
  if(m>=60) return '12:'+String(Math.min(99,m-60)).padStart(2,'0');
  return '11:'+String(Math.max(0,m)).padStart(2,'0');
}
// Act 1 storyboard — one keyframe per narrated beat
const KF=[
  {min:0,  fill:0,      over:0},   // 0  picture a bottle (vessel fades in)
  {min:0,  fill:0,      over:0},   // 1  at eleven o'clock (clock appears)
  {min:0,  fill:1/190,  over:0},   // 2  a single bacterium
  {min:1,  fill:2/190,  over:0},   // 3  11:01 — one becomes two
  {min:2,  fill:4/190,  over:0},   // 4  11:02 — two become four
  {min:55, fill:0.03,   over:0},   // 5  11:55  3%
  {min:56, fill:0.06,   over:0},   // 6  11:56  6%
  {min:57, fill:0.12,   over:0},   // 7  11:57  12%
  {min:58, fill:0.25,   over:0},   // 8  11:58  quarter
  {min:59, fill:0.50,   over:0},   // 9  11:59  half
  {min:60, fill:1.0,    over:0},    // 10 12:00  full (≈190)
  {min:61, fill:1.0,    over:0.25}, // 11 12:01  spills out (≈580)
  {min:62, fill:1.0,    over:0.50}, // 12 12:02  doubles again (≈1.8k)
  {min:63, fill:1.0,    over:0.75}, // 13 12:03  fills the screen (≈5.4k)
  {min:64, fill:1.0,    over:1.0},  // 14 12:04  one last doubling — full population (≈16k)
  {min:64, fill:1.0,    over:1.0}   // 15 clear view -> the line
];
function onScroll(){
  const rect=act1.getBoundingClientRect();
  const total=Math.max(1,act1.offsetHeight-window.innerHeight);
  const p=Math.min(1,Math.max(0,(-rect.top)/total));
  const N=KF.length, bi=p*(N-1);
  const i0=Math.min(N-1,Math.floor(bi)), i1=Math.min(N-1,i0+1), fr=bi-i0;
  const ease=fr*fr*(3-2*fr);
  const a=KF[i0], b=KF[i1];
  let fill=a.fill+(b.fill-a.fill)*ease;
  let over=a.over+(b.over-a.over)*ease;
  const minutes=a.min+(b.min-a.min)*fr;

  // ACT 2 — the circles reorganize into the Bartlett hedcut
  const r2=act2.getBoundingClientRect();
  const t2=Math.max(1,act2.offsetHeight-window.innerHeight);
  const p2=Math.min(1,Math.max(0,(-r2.top)/t2));
  let morph=0;
  // Linear here — render applies a single smoothstep. Completes by 20% of Act 2's
  // scroll (was 45% + a second smoothstep, which dragged the finish badly).
  if(p2>0) morph=Math.min(1,p2/0.20);
  if(morph>0) over=1;                 // keep every circle for the portrait
  window.__fill=fill; window.__over=over; window.__morph=morph;
  pctEl.textContent=Math.max(1,Math.round(fill*100))+'% full';
  // digital watchface: HH:MM ticks from 11:00 toward noon as you scroll
  if(clockTimeEl) clockTimeEl.textContent=fmtClock(minutes);
  if(clockEl){ clockEl.style.opacity=(bi>=0.7 && bi<14.6 && morph<0.02)?'1':'0';
    clockEl.setAttribute('aria-label','digital watch reading '+fmtClock(minutes)); }
  // The "% full" readout belongs to the filling beats — hidden through "picture a
  // bottle / eleven o'clock / a single bacterium / one→two→four" (a lone bacterium
  // is not "1% full"); it fades in only once the narration starts naming
  // percentages ("…three percent full", ~keyframe 5) and out again past the spill.
  if(pctEl.parentElement) pctEl.parentElement.style.opacity=(bi>=4.5 && bi<10.6 && morph<0.02)?'1':'0';
  if(a2quote) a2quote.classList.toggle('is-on', p2>0.7);

  // ACT 3 — sequential animated story lines
  if(act3){
    const r3=act3.getBoundingClientRect();
    const t3=Math.max(1,act3.offsetHeight-window.innerHeight);
    const p3=Math.min(1,Math.max(0,(-r3.top)/t3));
    const inv3=r3.top<window.innerHeight && r3.bottom>0;
    const idx3=Math.min(a3lines.length-1, Math.floor(p3*a3lines.length));
    a3lines.forEach((el,k)=>el.classList.toggle('is-on', inv3 && k===idx3));
  }

  // The pre-rendered background <video> spans Act 1 + Act 2: scrub its time to
  // scroll position and fade it in at the start / out as Act 2 ends. The scrub
  // timeline matches render/scenes/landing.js phases — Act 1 → [0,0.70] (fill +
  // spill), Act 2 → [0.70,1.0] (hedcut morph). The seek is eased toward this
  // target by the scrubber loop below.
  const vidEl=document.getElementById('bcanvas');
  if(vidEl){
    const a1vis=rect.bottom>0 && rect.top<window.innerHeight;
    const a2vis=r2.bottom>0 && r2.top<window.innerHeight;
    let op=Math.min(1,Math.max(0,bi/0.8));
    if(p2>0.58) op=Math.min(op, Math.max(0,1-(p2-0.58)/0.16));
    vidEl.style.display=(a1vis||a2vis)?'block':'none';
    vidEl.style.opacity=String(op);
    window.__scrubTarget = p2>0 ? (0.70 + Math.min(1,p2)*0.30) : (p*0.70);
  }

  let idx=Math.min(N-1,Math.max(0,Math.round(bi)));
  // Hold "11:59 — half full" until the bottle is genuinely full (counter = 100%) so
  // "Noon. The bottle is full." never appears before the fill completes.
  if(idx>=10 && fill<0.999) idx=9;
  steps.forEach((st,k)=>st.classList.toggle('is-on',k===idx));
  const docH=document.documentElement.scrollHeight-window.innerHeight;
  const progEl=document.getElementById('progress');
  if(progEl) progEl.style.width=(docH>0?(window.scrollY/docH*100):0)+'%';
  // Fade the brandbar out over the title card — but the title card only exists
  // on the home hub, so this is a no-op on the landing page (bar stays visible).
  const tcEl=document.getElementById('titlecard');
  const bbEl=document.getElementById('brandbar');
  if(tcEl&&bbEl){
    const tc=tcEl.getBoundingClientRect();
    bbEl.style.opacity=(tc.top<60 && tc.bottom>60)?'0':'1';
  }
}
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',onScroll);
onScroll();
// init first step
steps[0].classList.add('is-on');

// One-shot "scroll to continue" cue at the foot of the opening screen. The element
// is present only on the landing layout (not the home hub), and it dismisses itself
// the first time the reader scrolls — or immediately if the page loaded mid-scroll.
(function(){
  const cue=document.getElementById('scrollcue'); if(!cue) return;
  if((window.scrollY||window.pageYOffset||0)>4){ cue.remove(); return; }
  const hide=()=>{ cue.classList.add('is-hidden'); setTimeout(()=>{ if(cue.parentNode) cue.remove(); },700); };
  window.addEventListener('scroll',hide,{passive:true,once:true});
})();

// After 10 s with no scroll input, gently auto-advance Act I so the bottle plays itself;
// any real scroll / touch / key cancels it and re-arms the 10 s idle timer. Act I only,
// and never under prefers-reduced-motion.
(function(){
  const a1=document.getElementById('act1'); if(!a1) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const IDLE=10000, SPEED=210;            // ms idle before auto-scroll; px per second
  let timer=null, raf=0, last=0, auto=false;
  const actEnd=()=>a1.offsetTop+a1.offsetHeight-window.innerHeight;
  function stop(){ auto=false; if(raf){ cancelAnimationFrame(raf); raf=0; } }
  function frame(ts){
    if(!auto) return;
    if(!last) last=ts;
    const dt=Math.min(0.05,(ts-last)/1000); last=ts;
    if((window.scrollY||window.pageYOffset||0) >= actEnd()-1){ stop(); return; }   // Act I finished
    window.scrollBy(0, SPEED*dt);
    raf=requestAnimationFrame(frame);
  }
  function start(){ if(auto||(window.scrollY||0)>=actEnd()-1) return; auto=true; last=0; raf=requestAnimationFrame(frame); }
  function arm(){ clearTimeout(timer); timer=setTimeout(start, IDLE); }
  function onInput(){ stop(); arm(); }    // real input cancels and restarts the countdown
  ['wheel','touchstart','touchmove','keydown','pointerdown'].forEach(ev=>window.addEventListener(ev,onInput,{passive:true}));
  arm();
})();

/* ---------------- Scroll-scrubbed background video ----------------
   Replaces the former live canvas particle sim. The heavy bacteria → spill →
   hedcut simulation is now a pre-rendered, all-intra video
   (render/scenes/landing.js); here we only seek it to the scroll position that
   onScroll() publishes as window.__scrubTarget (0..1). currentTime is eased
   toward the target each frame for smoothness across browsers. Honours
   prefers-reduced-motion by freezing on the poster. (ScrollyVideo.js would be a
   drop-in upgrade for iOS canvas-decoded seeking if stutter shows up there.) */
(function(){
  const vid=document.getElementById('bcanvas'); if(!vid||vid.tagName!=='VIDEO') return;
  const reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){ try{vid.pause();}catch(e){} return; }   // poster stands in
  try{vid.pause();}catch(e){}                          // we drive currentTime manually
  let duration=0;
  function onMeta(){ duration=vid.duration||0; }
  if(vid.readyState>=1) onMeta(); else vid.addEventListener('loadedmetadata',onMeta);
  (function tick(){
    requestAnimationFrame(tick);
    if(!duration) return;
    const target=Math.min(1,Math.max(0,window.__scrubTarget||0))*duration;
    const cur=vid.currentTime||0;
    if(Math.abs(target-cur)>0.001){ try{ vid.currentTime=cur+(target-cur)*0.18; }catch(e){} }
  })();
})();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
