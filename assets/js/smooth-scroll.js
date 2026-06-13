/* The Greatest Shortcoming — smooth-scroll driver.
 *
 * A small, dependency-free reimplementation of the wheel-smoothing technique
 * popularised by Lenis (Studio Freight / darkroom.engineering),
 * https://github.com/darkroomengineering/lenis — MIT licensed. This is an
 * independent ~80-line take on the same idea, not the library itself.
 *
 * How it works (the same approach the Lenis default uses): keep the native
 * scrollbar and the real document height, intercept only the wheel delta, and
 * each animation frame ease the actual scroll position toward a target with a
 * linear interpolation — `current += (target - current) * lerp` — via
 * window.scrollTo. Because the document keeps its true height, position:sticky,
 * anchors, IntersectionObserver and the existing getBoundingClientRect() scroll
 * maths all keep working untouched; the page just *arrives* at each scroll
 * position smoothly instead of jumping.
 *
 * Honors [data-lenis-prevent] subtrees and genuinely scrollable inner panes,
 * leaves touch and pinch-zoom to the browser, and disables itself entirely under
 * prefers-reduced-motion. */
(function () {
  var root = document.documentElement;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lerp = 0.12;   // easing per frame — higher is snappier, lower is floatier
  var EPS = 0.4;     // stop easing once we're within this many px of the target

  var target = window.scrollY || window.pageYOffset || 0;
  var current = target;
  var running = false;

  // Native CSS smooth-scroll would fight our rAF loop on anchor jumps, so take
  // ownership of the easing ourselves.
  root.style.scrollBehavior = 'auto';

  function maxScroll() {
    return Math.max(0, (document.scrollingElement || root).scrollHeight - window.innerHeight);
  }
  function clamp(v) { var m = maxScroll(); return v < 0 ? 0 : v > m ? m : v; }

  function frame() {
    var d = target - current;
    if (Math.abs(d) < EPS) { current = target; window.scrollTo(0, current); running = false; return; }
    current += d * lerp;
    window.scrollTo(0, current);
    requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(frame); } }

  // When the page is moved by anything other than our loop (scrollbar drag,
  // keyboard, touch, programmatic jumps), resync so we never snap back.
  window.addEventListener('scroll', function () {
    if (!running) { current = target = window.scrollY; }
  }, { passive: true });
  window.addEventListener('resize', function () { target = clamp(target); }, { passive: true });

  // Defer to the browser for inner scrollers and explicitly opted-out subtrees.
  function deferToNative(node) {
    while (node && node.nodeType === 1 && node !== document.body && node !== root) {
      if (node.hasAttribute('data-lenis-prevent')) return true;
      var oy = getComputedStyle(node).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) return true;
      node = node.parentNode;
    }
    return false;
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return;                 // pinch-zoom — leave it to the browser
    if (deferToNative(e.target)) return;   // inner scroll panes / opted-out subtrees
    e.preventDefault();
    // normalise line / page delta modes to pixels
    var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    if (!running) current = window.scrollY; // begin easing from the real position
    target = clamp(target + e.deltaY * unit);
    start();
  }, { passive: false });

  // Ease to in-page anchors too, rather than jumping.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (hash.length < 2) return;
    var el = document.getElementById(hash.slice(1)) || document.querySelector(hash);
    if (!el) return;
    e.preventDefault();
    if (!running) current = window.scrollY;
    target = clamp(Math.round(window.scrollY + el.getBoundingClientRect().top));
    start();
    if (history.pushState) history.pushState(null, '', hash);
  });
})();
