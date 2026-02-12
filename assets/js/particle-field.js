/**
 * PicMatic — Floating dust-particle field
 * Faithful web port of the SwiftUI ProceduralArtView.
 * 50 deterministic white ellipses with slow floating motion and twinkle.
 * Includes scroll-triggered reveal observer.
 */

(function () {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, dpr;

  const PARTICLE_COUNT = 50;
  const GOLDEN_RATIO = 0.618033988749895;
  const SQRT2_MINUS1 = 0.41421356237;
  const GR_RELATED = 0.30901699437;

  /* Background gradient colours matching Theme.appBackgroundGradient */
  const BG_TOP = [15, 13, 26];    // #0F0D1A
  const BG_BOTTOM = [16, 14, 50]; // #100E32

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function drawBackground() {
    var gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgb(' + BG_TOP[0] + ',' + BG_TOP[1] + ',' + BG_TOP[2] + ')');
    gradient.addColorStop(1, 'rgb(' + BG_BOTTOM[0] + ',' + BG_BOTTOM[1] + ',' + BG_BOTTOM[2] + ')');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function frac(n) {
    return n - Math.floor(n);
  }

  function drawParticles(time) {
    /* time in seconds for parity with SwiftUI TimelineView */
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var seed1 = i * GOLDEN_RATIO;
      var seed2 = (i * i) * SQRT2_MINUS1;
      var seed3 = i * GR_RELATED;

      /* Base position (deterministic spread) */
      var baseX = frac(seed1) * width;
      var baseY = frac(seed2) * height;

      /* Slow floating motion — matches SwiftUI sin/cos with time */
      var floatX = Math.sin(time * 0.3 + seed1 * 10) * 15;
      var floatY = Math.cos(time * 0.2 + seed2 * 10) * 20
                   - ((time * 5) % (height * 0.3));

      var x = baseX + floatX;
      var y = baseY + floatY;

      /* Wrap particles */
      if (y < 0) y += height;
      if (y > height) y -= height;
      x = x % width;
      if (x < 0) x += width;

      /* Size and twinkle opacity */
      var particleSize = 1.0 + frac(seed3) * 2.0;
      var twinkle = Math.sin(time * 2 + seed1 * 20) * 0.5 + 0.5;
      var opacity = 0.15 + twinkle * 0.15;

      ctx.beginPath();
      ctx.ellipse(x, y, particleSize / 2, particleSize / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
      ctx.fill();
    }
  }

  var startTime = null;

  function animate(ts) {
    if (!startTime) startTime = ts;
    var elapsed = (ts - startTime) / 1000; // seconds

    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawParticles(elapsed);

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(animate);

  /* ── Scroll-triggered reveal ── */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    observer.observe(el);
  });
})();
