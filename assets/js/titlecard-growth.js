/* The Greatest Shortcoming — home title-card background.
   An evocative variant of the chapter-3 "Fig. 3" exponential-growth chart:
   scatter points explode into being along an exponential curve — sparse and cool
   at the base, dense and red as the curve goes vertical — then the field fades and
   the run repeats. Pure canvas, no build step. Pauses when the title card scrolls
   off-screen and degrades to a single static frame under prefers-reduced-motion. */
(function () {
  function init() {
    var cv = document.getElementById('growthfield');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var host = cv.parentElement;            // .titlecard
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var W = 0, H = 0, dpr = 1, S = 1;       // S scales spark/curve sizes to the viewport
    var marginL = 0, marginR = 0, baseY = 0, topY = 0;
    var K = 5.3;                            // curve "explosiveness"

    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    // colour ramp echoing the Fig.3 plate: cool blue → ink → gold → alarm red
    var RAMP = [[0.0, 40, 80, 121], [0.45, 26, 26, 26], [0.72, 224, 165, 47], [1.0, 176, 56, 42]];
    function colAt(x) {
      x = clamp01(x);
      for (var i = 1; i < RAMP.length; i++) {
        if (x <= RAMP[i][0]) {
          var a = RAMP[i - 1], b = RAMP[i], t = (x - a[0]) / ((b[0] - a[0]) || 1);
          return [Math.round(a[1] + (b[1] - a[1]) * t),
                  Math.round(a[2] + (b[2] - a[2]) * t),
                  Math.round(a[3] + (b[3] - a[3]) * t)];
        }
      }
      var last = RAMP[RAMP.length - 1];
      return [last[1], last[2], last[3]];
    }

    function curveX(x) { return marginL + x * (W - marginL - marginR); }
    function curveH(x) { return (Math.exp(K * x) - 1) / (Math.exp(K) - 1); }   // 0..1, exponential
    function curveY(x) { return baseY - curveH(x) * (baseY - topY); }

    var pts = [];     // settled dots: {x,y,r,c}
    var bursts = [];  // explosions: {x,y,r,c,ring,age,life,sparks}

    function explode(px, py, r, c, q) {
      // the whole explosion footprint scales with the point's size, which grows
      // along the curve — so later, taller points detonate over a visibly larger
      // area: more sparks, flung farther, in a wider, longer-lived ring.
      var n = Math.round(rnd(5, 8) + r * 0.9), sparks = [], maxLife = 30 + r * 1.2;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, sp = rnd(0.16, 0.40) * r, life = rnd(28, 50) + r;
        if (life > maxLife) maxLife = life;
        sparks.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.3 * S,
                      r: rnd(0.12, 0.26) * r, age: 0, life: life });
      }
      bursts.push({ x: px, y: py, r: r, c: c, q: q, ring: r * 4.2, age: 0, life: Math.round(maxLife), sparks: sparks });
    }

    function spawnAt(x, withBurst) {
      // h is the exponential progress along the curve; size and intensity track it,
      // so explosions grow exponentially larger and bolder toward noon.
      var h = curveH(x);
      var px = curveX(x), py = curveY(x) + rnd(-1, 1) * (baseY - topY) * 0.018;
      var c = colAt(x), r = (0.004 + 0.024 * h) * Math.min(W, H);
      pts.push({ x: px + rnd(-1, 1) * 4 * S, y: py, r: r, c: c, q: h });
      if (withBurst) explode(px, py, r, c, h);
    }

    // run state machine: grow → hold → fade → reset
    var phase = 'grow', t = 0, nextX = 0, hold = 0, fade = 1;
    function reset(seed) {
      pts = []; bursts = []; phase = 'grow'; t = 0; nextX = 0; hold = 0; fade = 1;
      if (seed) {                            // a complete static composition
        for (var x = 0; x <= 1.0001; x += 0.02) spawnAt(x, false);
        phase = 'hold'; t = 1;
      }
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = host.clientWidth; H = host.clientHeight;
      cv.width = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S = Math.min(W, H) / 900;
      marginL = W * 0.10; marginR = W * 0.07; baseY = H * 0.86; topY = H * 0.16;
      reset(reduce);                         // reduced-motion: a filled static frame
      draw();
    }

    function update() {
      if (phase === 'grow') {
        t += 0.0015;                         // ~11s sweep
        while (nextX <= t && nextX <= 1) {
          var cluster = 1 + Math.floor(curveH(nextX) * 6);   // clusters swell toward the top
          for (var k = 0; k < cluster; k++) spawnAt(Math.min(1, nextX + rnd(-0.01, 0.01)), true);
          nextX += 0.012 + 0.085 * Math.exp(-3 * nextX);     // delay between bursts shrinks exponentially
        }
        if (t >= 1) { t = 1; phase = 'hold'; hold = 0; }
      } else if (phase === 'hold') {
        if (++hold > 130) phase = 'fade';
      } else if (phase === 'fade') {
        fade -= 0.010;
        if (fade <= 0) reset(false);
      }
      for (var i = bursts.length - 1; i >= 0; i--) {
        var b = bursts[i]; b.age++;
        for (var j = 0; j < b.sparks.length; j++) {
          var s = b.sparks[j]; s.x += s.vx; s.y += s.vy; s.vy += 0.05 * S; s.vx *= 0.96; s.age++;
        }
        if (b.age > b.life) bursts.splice(i, 1);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      // faint baseline + the exponential curve, traced up to the current front
      ctx.strokeStyle = 'rgba(233,226,208,0.10)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(marginL, baseY); ctx.lineTo(W - marginR, baseY); ctx.stroke();
      var tt = (phase === 'grow') ? t : 1;
      ctx.strokeStyle = 'rgba(176,56,42,' + (0.22 * fade) + ')'; ctx.lineWidth = 1.5 * S;
      ctx.beginPath();
      for (var x = 0; x <= tt + 0.0001; x += 0.01) {
        var cx = curveX(x), cy = curveY(x);
        if (x === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // glowing scatter + explosions, drawn additively for a luminous-plot feel
      ctx.globalCompositeOperation = 'lighter';
      var i, p, col;
      for (i = 0; i < pts.length; i++) {
        p = pts[i]; col = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',';
        var al = 0.55 + 0.35 * p.q;        // less transparent as the curve climbs
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.6);
        g.addColorStop(0, col + (al * fade) + ')'); g.addColorStop(1, col + '0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.6, 0, 6.283); ctx.fill();
        ctx.fillStyle = col + ((0.9 + 0.1 * p.q) * fade) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      for (i = 0; i < bursts.length; i++) {
        var b = bursts[i], k = clamp01(b.age / b.life), rc = 'rgba(' + b.c[0] + ',' + b.c[1] + ',' + b.c[2] + ',';
        var bal = 0.55 + 0.35 * b.q;       // bigger and bolder (less transparent) up the curve
        ctx.strokeStyle = rc + ((1 - k) * bal * fade) + ')';
        ctx.lineWidth = Math.max(1, b.r * 0.25 * (1 - k));
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + (b.ring - b.r) * k, 0, 6.283); ctx.stroke();
        for (var j = 0; j < b.sparks.length; j++) {
          var s = b.sparks[j], sk = clamp01(s.age / s.life);
          ctx.fillStyle = rc + ((1 - sk) * (0.8 + 0.2 * b.q) * fade) + ')';
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (1 - 0.4 * sk), 0, 6.283); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }

    var running = false;
    function loop() { if (!running) return; update(); draw(); requestAnimationFrame(loop); }

    resize();
    window.addEventListener('resize', resize);
    if (reduce) return;                      // static frame already drawn

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) { if (!running) { running = true; requestAnimationFrame(loop); } }
          else { running = false; }
        });
      }, { threshold: 0 }).observe(host);
    } else { running = true; requestAnimationFrame(loop); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
