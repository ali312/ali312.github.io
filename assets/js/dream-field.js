/**
 * Somnia atmospheric field
 * Twilight gradient + drifting glassy orbs
 */

(function () {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const coords = document.getElementById('coords');

  let width;
  let height;
  let dpr;
  let orbs = [];
  let lastTime = 0;
  const targetFPS = 60;
  const targetFrameTime = 1000 / targetFPS;

  const bgTop = [19, 20, 32];    // #131420
  const bgBottom = [33, 29, 73]; // #211D49

  const palette = [
    [145, 126, 252], // primary violet
    [111, 123, 255], // mysterious blue
    [163, 233, 196], // success mint
    [145, 201, 255], // info blue
  ];

  const orbCount = 18;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createOrb() {
    const base = palette[Math.floor(Math.random() * palette.length)];
    const radius = randomBetween(80, 230);
    const speed = randomBetween(0.06, 0.16);
    const life = randomBetween(900, 1800);

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: radius,
      driftX: randomBetween(-0.6, 0.6),
      driftY: randomBetween(-0.45, 0.45),
      speed: speed,
      phase: Math.random() * Math.PI * 2,
      color: base,
      alpha: randomBetween(0.05, 0.14),
      life: life,
      maxLife: life,
      phaseSpeed: randomBetween(0.00018, 0.00045)
    };
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgb(' + bgTop.join(',') + ')');
    gradient.addColorStop(1, 'rgb(' + bgBottom.join(',') + ')');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
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
    for (let i = 0; i < orbCount; i += 1) {
      orbs.push(createOrb());
    }
    lastTime = 0;
  }

  function drawOrb(orb, time) {
    const wobbleX = Math.sin(time * (0.00032 + orb.phaseSpeed) + orb.phase) * 18;
    const wobbleY = Math.cos(time * (0.00028 + orb.phaseSpeed) + orb.phase) * 15;
    const x = orb.x + wobbleX;
    const y = orb.y + wobbleY;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.radius);
    const color = orb.color;
    const lifeRatio = orb.life / orb.maxLife;
    const fade = Math.sin(Math.PI * lifeRatio);
    const alpha = orb.alpha * fade;

    gradient.addColorStop(0, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + alpha + ')');
    gradient.addColorStop(0.58, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (alpha * 0.32) + ')');
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
    drawBackground();

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < orbs.length; i += 1) {
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

  const observer = new IntersectionObserver(function (entries) {
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
