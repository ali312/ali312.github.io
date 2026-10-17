// Canvas renderer adapted from ascii.rest by @bas3line, MIT licensed.
// See ../vendor/ascii-rest/LICENSE. Use ordinary Canvas 2D in every browser;
// only scene computation runs in a worker, avoiding OffscreenCanvas differences.
export function createRenderer(canvas, { cols, rows, palette, ground }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  const atlas = document.createElement('canvas');
  const atlasCtx = atlas.getContext('2d');
  if (!atlasCtx) throw new Error('Canvas 2D atlas is unavailable');
  const slots = new Map();
  const previousColors = new Uint8Array(cols * rows);
  let previous = '', full = true, width = 0;
  let cellWidth, slotWidth, slotHeight, xs, ys, gx, gy;

  function resize() {
    const nextWidth = Math.max(cols, Math.round(canvas.clientWidth * Math.min(devicePixelRatio || 1, 2)));
    if (nextWidth === width) return false;
    width = nextWidth;
    cellWidth = width / cols;
    canvas.width = width;
    canvas.height = Math.round(rows * cellWidth);
    slotWidth = Math.ceil(cellWidth) + 2;
    slotHeight = slotWidth;
    atlas.width = slotWidth * 32;
    atlas.height = slotHeight * 32;
    xs = Int32Array.from({ length: cols + 1 }, (_, x) => Math.round(x * cellWidth));
    ys = Int32Array.from({ length: rows + 1 }, (_, y) => Math.round(y * cellWidth));
    gx = Int32Array.from({ length: cols }, (_, x) => Math.round(x * cellWidth + (cellWidth - Math.ceil(cellWidth)) / 2));
    gy = Int32Array.from({ length: rows }, (_, y) => Math.round(y * cellWidth + (cellWidth - Math.ceil(cellWidth)) / 2));
    slots.clear();
    full = true;
    return true;
  }

  function glyph(code, color) {
    const key = code * 256 + color;
    if (slots.has(key)) return slots.get(key);
    const slot = slots.size;
    const x = (slot % 32) * slotWidth + 1;
    const y = Math.floor(slot / 32) * slotHeight + 1;
    atlasCtx.font = `${cellWidth / .6}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    atlasCtx.textAlign = 'center';
    atlasCtx.textBaseline = 'middle';
    atlasCtx.fillStyle = palette[color];
    atlasCtx.save();
    atlasCtx.beginPath();
    atlasCtx.rect(x - 1, y - 1, slotWidth, slotHeight);
    atlasCtx.clip();
    atlasCtx.fillText(String.fromCharCode(code), x + Math.ceil(cellWidth) / 2, y + Math.ceil(cellWidth) / 2);
    atlasCtx.restore();
    slots.set(key, slot);
    return slot;
  }

  function paint(text, colors) {
    resize();
    ctx.fillStyle = ground;
    if (full) ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const k = row * cols + col;
        const pos = row * (cols + 1) + col;
        const code = text.charCodeAt(pos);
        if (!full && code === previous.charCodeAt(pos) && colors[k] === previousColors[k]) continue;
        const x = xs[col], y = ys[row];
        const w = xs[col + 1] - x, h = ys[row + 1] - y;
        if (!full) ctx.fillRect(x, y, w, h);
        if (code !== 32) {
          const slot = glyph(code, colors[k]);
          ctx.drawImage(atlas, (slot % 32) * slotWidth + 1 + x - gx[col],
            Math.floor(slot / 32) * slotHeight + 1 + y - gy[row], w, h, x, y, w, h);
        }
      }
    }
    previous = text;
    previousColors.set(colors);
    full = false;
  }
  return { paint };
}
