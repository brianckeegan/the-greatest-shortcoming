/* The Greatest Shortcoming — home scrollytelling engine + bottle/hedcut sim.
   Ported verbatim from the standalone landing prototype. No build step. */
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
const a2quote=document.getElementById('a2quote');
const act3=document.getElementById('act3');
const a3lines=[...document.querySelectorAll('.a3-line')];
const steps=[...document.querySelectorAll('.pstep')];
const pctEl=document.getElementById('pct');
const clockEl=document.getElementById('clock');
const minHand=document.getElementById('minHand');
const hourHand=document.getElementById('hourHand');
function fmtClock(m){
  m=Math.round(m);
  if(m>=60) return '12:'+String(Math.min(99,m-60)).padStart(2,'0');
  return '11:'+String(Math.max(0,m)).padStart(2,'0');
}
// Act 1 storyboard — an explicit beat table (one stop per scripted action).
// text = caption index into .pstep (null holds the previous caption, so the line
// LEADS and the figure follows); pct = counter number (null holds); clock/counter =
// element visibility (0/1, lerped for a fade); card = cream backing behind the last line.
const BEATS=[
  {min:0,  fill:0,      over:0,    text:0,    pct:null, clock:0, counter:0, card:0}, //  0 picture an empty bottle
  {min:0,  fill:0,      over:0,    text:1,    pct:null, clock:1, counter:0, card:0}, //  1 at eleven o'clock — clock appears
  {min:0,  fill:0.006,  over:0,    text:2,    pct:null, clock:1, counter:0, card:0}, //  2 drop a single bacterium
  {min:0,  fill:0.010,  over:0,    text:3,    pct:null, clock:1, counter:0, card:0}, //  3 it divides once a minute
  {min:1,  fill:0.013,  over:0,    text:null, pct:null, clock:1, counter:0, card:0}, //  4 clock → 11:01
  {min:1,  fill:0.016,  over:0,    text:4,    pct:null, clock:1, counter:0, card:0}, //  5 one becomes two
  {min:2,  fill:0.020,  over:0,    text:5,    pct:null, clock:1, counter:0, card:0}, //  6 at 11:02, two become four
  {min:3,  fill:0.026,  over:0,    text:6,    pct:null, clock:1, counter:0, card:0}, //  7 four become eight
  {min:3,  fill:0.030,  over:0,    text:7,    pct:null, clock:1, counter:0, card:0}, //  8 after fifty minutes of doubling
  {min:52, fill:0.03,   over:0,    text:8,    pct:3,    clock:1, counter:1, card:0}, //  9 11:52 · three percent · counter in
  {min:52, fill:0.03,   over:0,    text:9,    pct:3,    clock:1, counter:1, card:0}, // 10 when would they realize?
  {min:57, fill:0.12,   over:0,    text:10,   pct:12,   clock:1, counter:1, card:0}, // 11 11:57 · 12%
  {min:58, fill:0.25,   over:0,    text:11,   pct:25,   clock:1, counter:1, card:0}, // 12 11:58 · quarter
  {min:59, fill:0.50,   over:0,    text:12,   pct:50,   clock:1, counter:1, card:0}, // 13 11:59 · half
  {min:60, fill:1.0,    over:0,    text:13,   pct:100,  clock:1, counter:1, card:0}, // 14 noon · full
  {min:61, fill:1.0,    over:0.10, text:14,   pct:100,  clock:1, counter:1, card:0}, // 15 12:01 · spills out
  {min:62, fill:1.0,    over:0.35, text:15,   pct:null, clock:0, counter:0, card:0}, // 16 12:02 · container/clock/counter gone
  {min:62, fill:1.0,    over:0.65, text:16,   pct:null, clock:0, counter:0, card:1}, // 17 the end of the line (cream card)
  {min:62, fill:1.0,    over:1.0,  text:null, pct:null, clock:0, counter:0, card:0}  // 18 fills the full screen
];
// carry-forward the caption + counter number through figure-only beats (null = hold)
const CAP=BEATS.map(b=>b.text), PCT=BEATS.map(b=>b.pct);
for(let i=1;i<BEATS.length;i++){ if(CAP[i]==null)CAP[i]=CAP[i-1]; if(PCT[i]==null)PCT[i]=PCT[i-1]; }
function onScroll(){
  const rect=act1.getBoundingClientRect();
  const total=Math.max(1,act1.offsetHeight-window.innerHeight);
  const p=Math.min(1,Math.max(0,(-rect.top)/total));
  const NB=BEATS.length, bi=p*(NB-1);
  const i0=Math.min(NB-1,Math.floor(bi)), i1=Math.min(NB-1,i0+1), fr=bi-i0;
  const ease=fr*fr*(3-2*fr);
  const a=BEATS[i0], b=BEATS[i1];
  let fill=a.fill+(b.fill-a.fill)*ease;
  let over=a.over+(b.over-a.over)*ease;
  const minutes=a.min+(b.min-a.min)*fr;

  // ACT 2 — the particles reorganize into the Bartlett hedcut
  const r2=act2.getBoundingClientRect();
  const t2=Math.max(1,act2.offsetHeight-window.innerHeight);
  const p2=Math.min(1,Math.max(0,(-r2.top)/t2));
  let morph=0;
  if(p2>0){ let x=Math.min(1,p2/0.45); morph=x*x*(3-2*x); }
  if(morph>0) over=1;                 // keep every particle for the portrait
  window.__fill=fill; window.__over=over; window.__morph=morph;

  // clock — analog face driven by the interpolated minute; visibility from the beat
  if(minHand) minHand.setAttribute('transform','rotate('+((minutes%60)*6)+' 50 50)');
  if(hourHand) hourHand.setAttribute('transform','rotate('+((330+minutes*0.5)%360)+' 50 50)');
  const gone=morph<0.02?1:0;
  if(clockEl){ clockEl.style.opacity=String((a.clock+(b.clock-a.clock)*ease)*gone);
    clockEl.setAttribute('aria-label','clock reading '+fmtClock(minutes)); }

  // counter — number straight from the beat table (script's %), fixed at screen bottom;
  // fades in at the three-percent beat and out with the clock + container at 12:02.
  const counterEl=document.getElementById('counter');
  if(pctEl) pctEl.textContent=(PCT[Math.min(NB-1,Math.round(bi))]||0)+'%';
  if(counterEl) counterEl.style.opacity=String((a.counter+(b.counter-a.counter)*ease)*gone);

  // cream card behind "the end of the line"
  const cardEl=document.getElementById('endcard');
  if(cardEl) cardEl.style.opacity=String(a.card+(b.card-a.card)*ease);

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

  // canvas spans Act 1 + Act 2; fades in at the very start, out as Act 2 ends
  const cvEl=document.getElementById('bcanvas');
  if(cvEl){
    const a1vis=rect.bottom>0 && rect.top<window.innerHeight;
    const a2vis=r2.bottom>0 && r2.top<window.innerHeight;
    let op=Math.min(1,Math.max(0,bi/0.8));
    if(p2>0.58) op=Math.min(op, Math.max(0,1-(p2-0.58)/0.16));
    cvEl.style.display=(a1vis||a2vis)?'block':'none';
    cvEl.style.opacity=String(op);
  }

  // caption — the most recent beat that carries text (holds through figure-only beats)
  const active=CAP[Math.min(NB-1,Math.max(0,Math.floor(bi)))];
  steps.forEach((st,k)=>st.classList.toggle('is-on',k===active));
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

// One-shot "scroll to continue" cue at the foot of the opening screen; dismisses on the
// first scroll (or immediately if the page loaded mid-scroll). Landing layout only.
(function(){
  const cue=document.getElementById('scrollcue'); if(!cue) return;
  if((window.scrollY||window.pageYOffset||0)>4){ cue.remove(); return; }
  const hide=()=>{ cue.classList.add('is-hidden'); setTimeout(()=>{ if(cue.parentNode) cue.remove(); },700); };
  window.addEventListener('scroll',hide,{passive:true,once:true});
})();
(function(){
  const cv=document.getElementById('bcanvas'); if(!cv) return;
  const ctx=cv.getContext('2d');
  const flask=document.getElementById('flask');
  const RED=[176,56,42], BLACK=[17,17,17];
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let W=0,H=0,dpr=1;
  // dpr capped at 1.5 — soft dots don't need full retina, and it halves fill cost.
  function resize(){ dpr=Math.min(1.5,window.devicePixelRatio||1); W=window.innerWidth; H=window.innerHeight; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); if(reduce) renderCanvas(0); }

  /* ---- Prebaked positions (assets/data/landing-bake.v2.bin, from
     render/bake-landing.mjs). The runtime splines the bottle-fill states, replays the
     baked fluid spill frames, and morphs to the portrait — no live solver. ---- */
  let BAKE=null, DOUB=6.4, lastActive=0;
  fetch('assets/data/landing-bake.v2.bin').then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); }).then(buf=>{
    const dv=new DataView(buf);
    if(String.fromCharCode(dv.getUint8(0),dv.getUint8(1),dv.getUint8(2),dv.getUint8(3))!=='TGSB') throw new Error('bad magic');
    const hl=dv.getUint32(8,true);
    const hdr=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,12,hl)));
    const data=new Int16Array(buf,12+hl,(buf.byteLength-12-hl)>>1);
    const states={}, bStates=[];
    for(const s of hdr.states){ states[s.name]={space:s.space,off:s.offset}; if(s.space==='bottle') bStates.push(s.name); }
    BAKE={N:hdr.N, scale:hdr.scale, fills:hdr.fills, states, bStates, data, spill:hdr.spill};
    DOUB=Math.log2(hdr.N/NCAP);
    if(reduce) renderCanvas(0);   // static path: repaint once the artifact arrives
  }).catch(e=>{ console.warn('landing: prebaked positions unavailable —', e && e.message); });

  function smooth(u){ return u<=0?0:u>=1?1:u*u*(3-2*u); }
  // read slot i of a baked state into out[0..2] (normalized units)
  function rd(name,i,out){ const s=BAKE.states[name], d=BAKE.data, sc=BAKE.scale, o=s.off+i*3; out[0]=d[o]/sc; out[1]=d[o+1]/sc; out[2]=d[o+2]/sc; }
  // read spill frame f, slot i → out[0..1] (fill-space normalized)
  function rdFrame(f,i,out){ const sp=BAKE.spill, d=BAKE.data, sc=BAKE.scale, o=sp.offset+f*sp.count*2+i*2; out[0]=d[o]/sc; out[1]=d[o+1]/sc; }
  // remap out[0..2] from its coordinate space to viewport pixels, in place
  function remap(space,out,g){
    if(space==='bottle'){ out[0]=g.inL+out[0]*(g.inR-g.inL); out[1]=g.rim+out[1]*(g.bot-g.rim); out[2]=out[2]*(g.inR-g.inL); }
    else if(space==='fill'){ out[0]*=W; out[1]*=H; out[2]*=H; }
    else { out[0]=W/2+out[0]*H; out[1]=H/2+out[1]*H; out[2]=out[2]*H; }   // hcenter
  }
  const SPILL_R=0.006;            // spill/pile dot radius as a fraction of viewport height
  const A=[0,0,0], B=[0,0,0];
  let T0=null;
  resize(); window.addEventListener('resize',resize);

  // Bauhaus U vessel geometry from the flask anchor (viewport px)
  function geo(){
    const r=flask.getBoundingClientRect();
    const cx=r.left+r.width/2;
    const w=Math.min(212, r.width*0.94);
    const h=Math.min(300, r.height*0.84);
    const top=r.top+r.height*0.10;
    const th=Math.max(18, w*0.155);
    return {cx,w,h,top,th, inL:cx-w/2+th, inR:cx+w/2-th, outL:cx-w/2, outR:cx+w/2, bot:top+h-th, outBot:top+h, rim:top};
  }

  const NCAP=190;     // slots active when the bottle is full at noon (drives the doubling)

  // Pure function of the scroll globals + the baked artifact: compute the active
  // count, spline each active slot between its keyframe states, jitter, and draw.
  function renderCanvas(now){
    const g=geo();
    ctx.clearRect(0,0,W,H);
    const fill=Math.max(0,Math.min(1, window.__fill||0));
    const over=Math.max(0,Math.min(1, window.__over||0));
    const morph=Math.max(0,Math.min(1, window.__morph||0));
    // The vessel is a pure visual. It dissolves as the spill pours out and is fully
    // gone by over≈0.35 (12:02), in sync with the bake dropping the beaker walls.
    let uT=(over-0.12)/0.23; uT=uT<0?0:uT>1?1:uT;
    const uA=1-uT*uT*(3-2*uT);
    if(uA>0.001){ ctx.save(); ctx.globalAlpha=uA; ctx.fillStyle='#111111'; drawU(ctx,g); ctx.restore(); }
    if(!BAKE) return;                       // artifact not loaded yet → vessel only

    const N=BAKE.N;
    let active = morph>0 ? N : over<=0 ? Math.round(NCAP*fill) : Math.min(N, Math.round(NCAP*Math.pow(2, over*DOUB)));
    if(active<0) active=0; else if(active>N) active=N;
    lastActive=active;
    if(active===0) return;

    if(T0==null) T0=now||0;
    const t=((now||0)-T0)/1000;

    // Every dot shares one colour per frame → batch into a single filled path.
    const m=smooth(morph);
    let cr=RED[0], cg=RED[1], cb=RED[2];
    if(morph>0){ cr=(RED[0]+(BLACK[0]-RED[0])*m)|0; cg=(RED[1]+(BLACK[1]-RED[1])*m)|0; cb=(RED[2]+(BLACK[2]-RED[2])*m)|0; }
    ctx.fillStyle='rgb('+cr+','+cg+','+cb+')';
    ctx.beginPath();

    if(morph>0){
      const amp=reduce?0:1.1*morph;         // faint breathing shimmer at the portrait
      const lastF=BAKE.spill.frames-1, ar=SPILL_R*H;
      for(let i=0;i<active;i++){
        rdFrame(lastF,i,A);                  // A = the screen-full pile (fill space)
        const ax=A[0]*W, ay=A[1]*H;
        rd('v_portrait',i,B); remap('hcenter',B,g);
        let x=ax+(B[0]-ax)*m, y=ay+(B[1]-ay)*m; const r=ar+(B[2]-ar)*m;
        if(amp){ x+=Math.sin(t*1.7+i*0.7)*amp; y+=Math.cos(t*1.9+i*1.3)*amp; }
        ctx.moveTo(x+r,y); ctx.arc(x,y,r,0,6.283);
      }
    } else if(over>0){
      // Replay the baked fluid spill: pick the two bracketing frames and lerp.
      const sp=BAKE.spill, F=sp.frames;
      const ff=over*(F-1); let f0=ff|0; if(f0>F-2)f0=F-2; const fr2=ff-f0;
      const ar=SPILL_R*H, amp=reduce?0:2.0;
      for(let i=0;i<active;i++){
        rdFrame(f0,i,A); rdFrame(f0+1,i,B);
        let x=(A[0]+(B[0]-A[0])*fr2)*W, y=(A[1]+(B[1]-A[1])*fr2)*H;
        if(amp){ x+=Math.sin(t*2.1+i*0.7)*amp; y+=Math.cos(t*2.5+i*1.3)*amp; }
        ctx.moveTo(x+ar,y); ctx.arc(x,y,ar,0,6.283);
      }
    } else {
      // fill phase — bracket the bottle knots by fill and spline between them
      const fills=BAKE.fills, bs=BAKE.bStates;
      let k=0; while(k<fills.length-1 && fill>fills[k+1]) k++;
      const nameA=bs[k], nameB=bs[Math.min(bs.length-1,k+1)];
      const f0=fills[k], f1=fills[Math.min(fills.length-1,k+1)];
      const u = f1>f0 ? smooth((fill-f0)/(f1-f0)) : 0;
      for(let i=0;i<active;i++){
        rd(nameA,i,A); remap('bottle',A,g);
        rd(nameB,i,B); remap('bottle',B,g);
        const x=A[0]+(B[0]-A[0])*u, y=A[1]+(B[1]-A[1])*u, r=A[2]+(B[2]-A[2])*u;
        ctx.moveTo(x+r,y); ctx.arc(x,y,r,0,6.283);
      }
    }
    ctx.fill();
  }

  function drawU(ctx,g){
    const x=g.outL,y=g.rim,w=g.w,h=g.h,th=g.th;
    // Gentle outer bottom corners over a near-square interior floor — clean beaker,
    // no cream "white space" clipping the lower corners.
    const rad=Math.min(16, w*0.12, h*0.12), irad=Math.max(2,rad-th*0.4);
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x,y+h-rad); ctx.quadraticCurveTo(x,y+h,x+rad,y+h);
    ctx.lineTo(x+w-rad,y+h); ctx.quadraticCurveTo(x+w,y+h,x+w,y+h-rad);
    ctx.lineTo(x+w,y);
    ctx.lineTo(x+w-th,y);
    ctx.lineTo(x+w-th,y+h-th-irad); ctx.quadraticCurveTo(x+w-th,y+h-th,x+w-th-irad,y+h-th);
    ctx.lineTo(x+th+irad,y+h-th); ctx.quadraticCurveTo(x+th,y+h-th,x+th,y+h-th-irad);
    ctx.lineTo(x+th,y);
    ctx.closePath(); ctx.fill();
  }

  window.__pcount=()=>lastActive;

  let running=false, rafId=0;
  function loop(now){ if(!running) return; renderCanvas(now); rafId=requestAnimationFrame(loop); }
  function start(){ if(!running){ running=true; rafId=requestAnimationFrame(loop); } }
  function stop(){ running=false; if(rafId){ cancelAnimationFrame(rafId); rafId=0; } }

  if(reduce){
    // Honour prefers-reduced-motion: no autonomous rAF. The canvas tracks the
    // user's own scroll only (jitter forced off above), so nothing moves on its own.
    window.addEventListener('scroll',()=>renderCanvas(0),{passive:true});
    renderCanvas(0);
  } else {
    // Idle the loop whenever neither act is on screen (mirrors titlecard-growth.js).
    const act1=document.getElementById('act1'), act2=document.getElementById('act2');
    if('IntersectionObserver' in window && (act1||act2)){
      const vis={};
      const io=new IntersectionObserver((es)=>{ es.forEach(en=>{ vis[en.target.id]=en.isIntersecting; }); (vis.act1||vis.act2)?start():stop(); },{threshold:0});
      if(act1) io.observe(act1); if(act2) io.observe(act2);
    }
    start();
  }
})();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
