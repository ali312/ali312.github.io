// Alpine Dawn by @bas3line, MIT; see ../vendor/ascii-rest/LICENSE.
// Compute characters here; paint on the page's ordinary Canvas 2D for Safari
// and Chrome compatibility. One acknowledged frame at a time bounds the queue.
import * as scene from '../vendor/ascii-rest/alpine-dawn.js';

let frame, colors, timer, playing = false, awaitingPaint = false;
let elapsed = 0, lastTick = 0, frameStarted = 0;
const interval = 1000 / 15;

function paint() {
  const now = performance.now();
  if (playing) elapsed += Math.min((now - lastTick) / 1000, .25);
  lastTick = now;
  frameStarted = now;
  const time = 12 + elapsed * 3;
  const text = frame(time, { paper: false, color: colors });
  const copy = colors.slice();
  awaitingPaint = true;
  postMessage({ type: 'frame', text, colors: copy, time }, [copy.buffer]);
}

function schedule() {
  clearTimeout(timer);
  if (playing && !awaitingPaint) {
    timer = setTimeout(paint, Math.max(0, interval - (performance.now() - frameStarted)));
  }
}

self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    frame = scene.default();
    colors = new Uint8Array(scene.meta.cols * scene.meta.rows);
    playing = data.playing;
    lastTick = performance.now();
    paint();
  } else if (data.type === 'painted') {
    awaitingPaint = false;
    schedule();
  } else if (data.type === 'motion') {
    playing = data.playing;
    lastTick = performance.now();
    schedule();
  }
};
