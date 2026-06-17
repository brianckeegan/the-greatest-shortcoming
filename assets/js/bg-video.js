/* Background video helper for autoplay looping backgrounds (e.g. the home
   title card). Keeps the prefers-reduced-motion contract the old canvas
   animations honoured: under reduced motion the video does not play and its
   poster still stands in. Also flags load failures so CSS can fall back to the
   poster / section background while assets/video/* has not yet been rendered.

   Scroll-scrubbed backgrounds (the landing) are handled separately in
   landing.js via ScrollyVideo — this only governs [data-bg-video] autoplayers. */
(function () {
  function init() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var vids = document.querySelectorAll('video[data-bg-video]');
    Array.prototype.forEach.call(vids, function (v) {
      if (reduce) {
        v.removeAttribute('autoplay');
        v.autoplay = false;
        try { v.pause(); } catch (e) { /* noop */ }
        return;
      }
      // Some browsers need an explicit play() kick for muted autoplay.
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () { /* poster stands in */ });
      v.addEventListener('error', function () { v.classList.add('bg-video-failed'); }, true);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
