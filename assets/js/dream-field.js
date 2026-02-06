/**
 * Dreamy bokeh field
 * Soft drifting orbs with gentle parallax and subtle glow
 */

(function () {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const coords = document.getElementById('coords');

  let width, height, dpr;
  let orbs = [];
  let lastTime = 0;
  const targetFPS = 60;
  const targetFrameTime = 1000 / targetFPS;

  const palette = [
    [168, 154, 214], // lavender
    [142, 113, 214], // violet
    [127, 218, 220], // teal
    [108, 126, 192], // cool blue
  ];

  const orbCount = 22;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createOrb() {
    const base = palette[Math.floor(Math.random() * palette.length)];
    const radius = randomBetween(90, 220);
    const speed = randomBetween(0.08, 0.18);
    const life = randomBetween(800, 1600);
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius,
      driftX: randomBetween(-0.8, 0.8),
      driftY: randomBetween(-0.6, 0.6),
      speed,
      phase: Math.random() * Math.PI * 2,
      color: base,
      alpha: randomBetween(0.06, 0.18),
      life,
      maxLife: life,
      phaseSpeed: randomBetween(0.0002, 0.0006),
    };
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    orbs = [];
    for (let i = 0; i < orbCount; i++) {
      orbs.push(createOrb());
    }
    lastTime = 0;
  }

  function drawOrb(orb, time) {
    const wobble = Math.sin(time * (0.0004 + orb.phaseSpeed) + orb.phase) * 16;
    const x = orb.x + wobble;
    const y = orb.y + Math.cos(time * (0.00035 + orb.phaseSpeed) + orb.phase) * 14;

    const gradient = ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      orb.radius
    );

    const [r, g, b] = orb.color;
    const lifeRatio = orb.life / orb.maxLife;
    const fade = Math.sin(Math.PI * lifeRatio);
    const alpha = orb.alpha * fade;

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${alpha * 0.35})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, orb.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = Math.min(currentTime - lastTime, 100);
    lastTime = currentTime;
    const dt = deltaTime / targetFrameTime;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(16, 18, 40, 1)';
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i];
      orb.x += orb.driftX * orb.speed * dt;
      orb.y += orb.driftY * orb.speed * dt;
      orb.life -= dt;

      if (orb.life <= 0) {
        orbs[i] = createOrb();
        continue;
      }

      if (orb.x < -orb.radius) orb.x = width + orb.radius;
      if (orb.x > width + orb.radius) orb.x = -orb.radius;
      if (orb.y < -orb.radius) orb.y = height + orb.radius;
      if (orb.y > height + orb.radius) orb.y = -orb.radius;

      drawOrb(orb, currentTime);
    }
    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(animate);
  }

  /* Mouse tracking for coordinates display */
  if (coords) {
    document.addEventListener('mousemove', function (e) {
      const x = (e.clientX / width).toFixed(3);
      const y = (e.clientY / height).toFixed(3);
      coords.textContent = x + ' / ' + y;
    });
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(animate);

  /* Scroll-triggered reveal */
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
