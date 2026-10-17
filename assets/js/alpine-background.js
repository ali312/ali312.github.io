// Alpine Dawn by @bas3line: https://ascii.rest/alpine-dawn/
import { createRenderer } from './alpine-renderer.js';
import { meta } from '../vendor/ascii-rest/alpine-dawn.js';

const canvas = document.getElementById('alpine-dawn');
const toggle = document.getElementById('scene-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const preferenceKey = 'anton-background-motion';
let choice;
try { choice = sessionStorage.getItem(preferenceKey); } catch { /* Storage can be disabled. */ }
let worker, renderer, observer, watchdog, mainTimer, makeFrame, lastFrame;
let disposed = false, suspended = false, fallingBack = false;
let elapsed = 0, lastTick = 0, paints = 0, lastWorkerFrame = 0;
const wantsMotion = () => choice ? choice === 'playing' : !reduced.matches;
const canPlay = () => !disposed && !suspended && !document.hidden && wantsMotion();

function updateControl() {
  canvas.dataset.motion = canPlay() ? 'playing' : 'still';
  toggle.hidden = false;
  toggle.textContent = wantsMotion() ? 'Pause scene' : 'Play scene';
  toggle.setAttribute('aria-label', wantsMotion() ? 'Pause background animation' : 'Play background animation');
}

function draw(data) {
  renderer.paint(data.text, data.colors);
  lastFrame = data;
  canvas.dataset.frame = String(++paints);
  canvas.dataset.sceneTime = data.time.toFixed(2);
}

function mainTick() {
  if (!canPlay() || !makeFrame) return;
  const now = performance.now();
  elapsed += Math.min((now - lastTick) / 1000, .25);
  lastTick = now;
  const time = 12 + elapsed * 3;
  const colors = new Uint8Array(meta.cols * meta.rows);
  draw({ text: makeFrame(time, { paper: false, color: colors }), colors, time });
  mainTimer = setTimeout(mainTick, Math.max(0, 1000 / 15 - (performance.now() - now)));
}

function motion() {
  updateControl();
  clearTimeout(mainTimer);
  lastTick = performance.now();
  // Give a newly visible tab time to resume before checking for a stalled worker.
  lastWorkerFrame = lastTick;
  worker?.postMessage({ type: 'motion', playing: canPlay() });
  if (canPlay() && makeFrame) mainTimer = setTimeout(mainTick, 1000 / 15);
}

async function fallback(reason) {
  if (fallingBack || disposed) return;
  fallingBack = true;
  clearInterval(watchdog);
  worker?.terminate();
  worker = undefined;
  canvas.dataset.fallback = reason;
  // No canvas was transferred, so the same visible canvas remains usable.
  const scene = await import('../vendor/ascii-rest/alpine-dawn.js');
  if (disposed) return;
  makeFrame = scene.default();
  elapsed = lastFrame ? Math.max(0, (lastFrame.time - 12) / 3) : 0;
  const time = 12 + elapsed * 3;
  const colors = new Uint8Array(meta.cols * meta.rows);
  draw({ text: makeFrame(time, { paper: false, color: colors }), colors, time });
  canvas.dataset.renderer = 'main';
  motion();
}

function start() {
  if (!canvas || disposed) return;
  try { renderer = createRenderer(canvas, meta); } catch { return; }
  observer = new ResizeObserver(() => { if (lastFrame) renderer.paint(lastFrame.text, lastFrame.colors); });
  observer.observe(canvas);
  updateControl();
  if (location.protocol === 'file:') { void fallback('file-preview'); return; }
  try {
    worker = new Worker(new URL('./alpine-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (disposed || !worker || data.type !== 'frame') return;
      lastWorkerFrame = performance.now();
      draw(data);
      canvas.dataset.renderer = 'worker';
      worker.postMessage({ type: 'painted' });
    };
    worker.onerror = (event) => { event.preventDefault(); void fallback('worker-error'); };
    worker.onmessageerror = () => { void fallback('worker-message'); };
    lastWorkerFrame = performance.now();
    worker.postMessage({ type: 'init', playing: canPlay() });
    watchdog = setInterval(() => {
      if (canPlay() && performance.now() - lastWorkerFrame > 8000) void fallback('worker-timeout');
    }, 2000);
  } catch { void fallback('worker-unavailable'); }
}

toggle?.addEventListener('click', () => {
  choice = wantsMotion() ? 'paused' : 'playing';
  try { sessionStorage.setItem(preferenceKey, choice); } catch { /* Optional persistence. */ }
  motion();
});
window.addEventListener('pagehide', ({ persisted }) => {
  suspended = true;
  motion();
  if (!persisted) {
    disposed = true;
    clearInterval(watchdog);
    worker?.terminate();
    observer?.disconnect();
  }
});
window.addEventListener('pageshow', () => { suspended = false; motion(); });
document.addEventListener('visibilitychange', motion);
if (reduced.addEventListener) reduced.addEventListener('change', motion);
else reduced.addListener(motion);
start();
