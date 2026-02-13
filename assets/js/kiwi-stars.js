/**
 * KiwiDrive starscape
 * Minimal dark gradient with sparse, slow, twinkling stars.
 */
(function () {
  var canvas = document.getElementById("canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var width = 0;
  var height = 0;
  var dpr = 1;
  var stars = [];
  var STAR_COUNT = 88;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function buildStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i += 1) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: rand(0.45, 1.75),
        alpha: rand(0.14, 0.66),
        twinkleSeed: rand(0, Math.PI * 2),
        twinkleSpeed: rand(0.18, 0.8),
        driftX: rand(-0.002, 0.002),
        driftY: rand(-0.0028, -0.0002)
      });
    }
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
  }

  function drawBackground() {
    var gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgb(6, 6, 8)");
    gradient.addColorStop(1, "rgb(13, 15, 19)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawStars(timeSec) {
    for (var i = 0; i < stars.length; i += 1) {
      var s = stars[i];
      s.x += s.driftX;
      s.y += s.driftY;

      if (s.x < 0) s.x += 1;
      if (s.x > 1) s.x -= 1;
      if (s.y < 0) s.y += 1;
      if (s.y > 1) s.y -= 1;

      var twinkle = 0.6 + Math.sin(timeSec * s.twinkleSpeed + s.twinkleSeed) * 0.4;
      var alpha = s.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 247, 250, " + alpha + ")";
      ctx.fill();
    }
  }

  var start = null;
  function animate(ts) {
    if (!start) start = ts;
    var elapsed = (ts - start) / 1000;
    drawBackground();
    drawStars(elapsed);
    requestAnimationFrame(animate);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    observer.observe(el);
  });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(animate);
})();
