/**
 * Procedural flow field animation
 * Simplex-noise-driven particle system rendered on <canvas id="canvas">
 */

(function () {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const coords = document.getElementById('coords');

  let width, height;
  let particles = [];
  const particleCount = 1000;
  const noiseScale = 0.003;
  const maxTrailPoints = 120;
  let time = 0;
  let lastTime = 0;
  const targetFPS = 60;
  const targetFrameTime = 1000 / targetFPS;

  /* ------------------------------------------------------------
     Simplex noise (2-D, simplified)
     ------------------------------------------------------------ */
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const perm = new Uint8Array(512);
  const grad2 = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];

  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

  function noise2D(x, y) {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;

    let n = 0;

    let t0 = 0.5 - x0*x0 - y0*y0;
    if (t0 >= 0) {
      const gi = perm[ii + perm[jj]] % 8;
      t0 *= t0;
      n += t0 * t0 * (grad2[gi][0] * x0 + grad2[gi][1] * y0);
    }

    let t1 = 0.5 - x1*x1 - y1*y1;
    if (t1 >= 0) {
      const gi = perm[ii + i1 + perm[jj + j1]] % 8;
      t1 *= t1;
      n += t1 * t1 * (grad2[gi][0] * x1 + grad2[gi][1] * y1);
    }

    let t2 = 0.5 - x2*x2 - y2*y2;
    if (t2 >= 0) {
      const gi = perm[ii + 1 + perm[jj + 1]] % 8;
      t2 *= t2;
      n += t2 * t2 * (grad2[gi][0] * x2 + grad2[gi][1] * y2);
    }

    return 70 * n;
  }

  /* ------------------------------------------------------------
     Particle
     ------------------------------------------------------------ */
  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = 0;
      this.vy = 0;
      this.life = Math.random() * 250 + 120;
      this.maxLife = this.life;
      this.trail = [];
    }

    update(dt) {
      const angle = noise2D(this.x * noiseScale, this.y * noiseScale + time) * Math.PI * 4;

      this.vx += Math.cos(angle) * 0.15 * dt;
      this.vy += Math.sin(angle) * 0.15 * dt;

      const friction = Math.pow(0.95, dt);
      this.vx *= friction;
      this.vy *= friction;

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > maxTrailPoints) {
        this.trail.shift();
      }

      this.life -= dt;

      if (
        this.life <= 0 ||
        this.x < 0 ||
        this.x > width ||
        this.y < 0 ||
        this.y > height
      ) {
        this.reset();
      }
    }

    draw() {
      const lifeAlpha = (this.life / this.maxLife) * 0.35;
      const count = this.trail.length;
      for (let i = 0; i < count; i++) {
        const point = this.trail[i];
        const t = (i + 1) / count;
        const alpha = t * lifeAlpha;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(point.x, point.y, 1.5, 1.5);
      }
    }
  }

  /* ------------------------------------------------------------
     Lifecycle
     ------------------------------------------------------------ */
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    lastTime = 0;
  }

  function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = Math.min(currentTime - lastTime, 100);
    lastTime = currentTime;
    const dt = deltaTime / targetFrameTime;

    ctx.fillStyle = 'rgba(10, 10, 10, 1)';
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
      p.update(dt);
      p.draw();
    });

    time += 0.0003 * dt;
    requestAnimationFrame(animate);
  }

  /* Mouse tracking for coordinates display */
  if (coords) {
    document.addEventListener('mousemove', (e) => {
      const x = (e.clientX / width).toFixed(3);
      const y = (e.clientY / height).toFixed(3);
      coords.textContent = `${x} / ${y}`;
    });
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(animate);
})();
