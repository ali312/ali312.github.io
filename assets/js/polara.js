/* No dependencies, requests, persistence, or analytics. All demo state is ephemeral. */
(() => {
  'use strict';
  const canvas = document.querySelector('#demo-canvas');
  if (!canvas) return;
  const scene = canvas.querySelector('.composition');
  const photo = document.querySelector('#movable-photo');
  const previewScene = document.querySelector('.preview-track .composition');
  const previewTrack = document.querySelector('.preview-track');
  const previewWindow = document.querySelector('.preview-window');
  const textures = [...document.querySelectorAll('button[data-texture]')];
  const catToggle = document.querySelector('.cat-toggle');
  const previous = document.querySelector('#previous-slide');
  const next = document.querySelector('#next-slide');
  const status = document.querySelector('#demo-status');
  const initial = { x: 5, y: 26, texture: 'bricks', cat: true, slide: 0 };
  let state = { ...initial };
  let drag = null;
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
  function boundPosition() {
    // Keep the entire photo and its selection outline inside the canvas.
    const bounds = scene.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const insetX = 10 / bounds.width * 100;
    const insetY = 10 / bounds.height * 100;
    state.x = clamp(state.x, insetX, 100 - photo.offsetWidth / bounds.width * 100 - insetX);
    state.y = clamp(state.y, insetY, 100 - photo.offsetHeight / bounds.height * 100 - insetY);
  }
  function render() {
    for (const target of [scene, previewScene]) {
      target.dataset.texture = state.texture;
      target.style.setProperty('--photo-x', `${state.x}%`);
      target.style.setProperty('--photo-y', `${state.y}%`);
      target.style.setProperty('--cat-display', state.cat ? 'block' : 'none');
    }
    textures.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.texture === state.texture)));
    catToggle.setAttribute('aria-pressed', String(state.cat));
    previewTrack.style.setProperty('--preview-offset', `${-state.slide * 100 / 3}%`);
    const slideLabel = `${state.slide + 1} <span>/ 3</span>`;
    const slideStatus = document.querySelector('#slide-status');
    if (slideStatus.innerHTML !== slideLabel) slideStatus.innerHTML = slideLabel;
    previewWindow.dataset.slide = String(state.slide);
    previewWindow.setAttribute('aria-label', `Slide ${state.slide + 1} of the example collage`);
    previous.disabled = state.slide === 0;
    next.disabled = state.slide === 2;
  }
  function announcePosition() {
    status.textContent = `Photo position: ${Math.round(state.x)} percent from the left, ${Math.round(state.y)} percent from the top.`;
  }
  textures.forEach(button => button.addEventListener('click', () => {
    state.texture = button.dataset.texture;
    render();
    status.textContent = `${button.textContent.trim()} background selected. The slide preview is updated.`;
  }));
  catToggle.addEventListener('click', () => {
    state.cat = !state.cat;
    render();
    status.textContent = state.cat ? 'Cat sticker added.' : 'Cat sticker removed.';
  });
  document.querySelector('.reset').addEventListener('click', () => {
    state = { ...initial };
    boundPosition();
    render();
    status.textContent = 'Collage reset. Brick background, cat sticker, and first slide restored.';
  });
  function moveSlide(delta) {
    state.slide = clamp(state.slide + delta, 0, 2);
    render();
    // A disabled focused button should not strand keyboard users at either end.
    if (document.activeElement === previous && previous.disabled) next.focus();
    if (document.activeElement === next && next.disabled) previous.focus();
  }
  let swipe = null;
  previewWindow.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button')) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    previewWindow.setPointerCapture(event.pointerId);
  });
  previewWindow.addEventListener('pointerup', event => {
    if (!swipe || swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = null;
    if (previewWindow.hasPointerCapture(event.pointerId)) previewWindow.releasePointerCapture(event.pointerId);
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) moveSlide(dx < 0 ? 1 : -1);
  });
  previewWindow.addEventListener('pointercancel', () => { swipe = null; });
  previewWindow.addEventListener('lostpointercapture', () => { swipe = null; });
  previewWindow.addEventListener('keydown', event => {
    if (event.target !== previewWindow || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    moveSlide(event.key === 'ArrowRight' ? 1 : -1);
  });
  previous.addEventListener('click', () => moveSlide(-1));
  next.addEventListener('click', () => moveSlide(1));
  photo.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    const bounds = scene.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: state.x, startY: state.y, width: bounds.width, height: bounds.height };
    photo.setPointerCapture(event.pointerId);
    photo.classList.add('dragging');
    photo.focus({ preventScroll: true });
    event.preventDefault();
  });
  photo.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    state.x = drag.startX + (event.clientX - drag.x) / drag.width * 100;
    state.y = drag.startY + (event.clientY - drag.y) / drag.height * 100;
    boundPosition();
    render();
  });
  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    photo.classList.remove('dragging');
    if (photo.hasPointerCapture(event.pointerId)) photo.releasePointerCapture(event.pointerId);
    announcePosition();
  }
  photo.addEventListener('pointerup', endDrag);
  photo.addEventListener('pointercancel', endDrag);
  photo.addEventListener('lostpointercapture', endDrag);
  photo.addEventListener('keydown', event => {
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!directions[event.key]) return;
    event.preventDefault();
    const [dx, dy] = directions[event.key];
    const step = event.shiftKey ? 5 : 1;
    state.x += dx * step;
    state.y += dy * step;
    boundPosition();
    render();
    announcePosition();
  });
  // Resize also handles image/font loading and keeps the draggable item bounded.
  if ('ResizeObserver' in window) new ResizeObserver(() => { boundPosition(); render(); }).observe(scene);
  else window.addEventListener('resize', () => { boundPosition(); render(); });
  photo.disabled = false;
  document.querySelector('.demo-controls').hidden = false;
  document.querySelector('.preview-controls').hidden = false;
  document.querySelector('#move-help').hidden = false;
  canvas.classList.add('demo-ready');
  boundPosition();
  render();
})();
