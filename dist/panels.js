import { readPreference, writePreference } from './preferences.js';

// Fixed panels use viewport coordinates, including the mobile keyboard's visible area.
export function boundPanelPosition(position, size, viewport, gap = 12) {
  const left = (viewport.left || 0) + gap, top = (viewport.top || 0) + gap;
  const right = Math.max(left, (viewport.left || 0) + viewport.width - size.width - gap);
  const bottom = Math.max(top, (viewport.top || 0) + viewport.height - size.height - gap);
  return { x: Math.min(right, Math.max(left, position.x)), y: Math.min(bottom, Math.max(top, position.y)) };
}

const validPosition = value => value && Number.isFinite(value.x) && Number.isFinite(value.y);

export class MovablePanel {
  // maxHeight caps the panel; topInset() returns the height of fixed chrome (the game's top bar) the panel must stay below.
  // bounds() may return an on-screen rectangle (for example the 3D view) the panel must stay inside, or null for the whole
  // window; boundsElement is watched so the panel moves back inside when that area changes size (sidebar shown/hidden).
  constructor({ panel, handle, resetButton, storage = null, storageKey, view = globalThis.window, onGrab = () => {}, maxHeight = Infinity, topInset = null, bounds = null, boundsElement = null }) {
    this.panel = panel; this.handle = handle; this.storage = storage; this.storageKey = storageKey; this.view = view; this.onGrab = onGrab; this.bounds = bounds;
    this.maxHeight = maxHeight; this.topInset = topInset || (() => { const bar = this.view.document?.getElementById?.('game-header'), r = bar?.getBoundingClientRect?.(); return r && r.height > 0 && Number.isFinite(r.bottom) ? Math.max(0, r.bottom) : 0; });
    const saved = readPreference(storageKey, null, storage);
    this.position = validPosition(saved) ? { x: saved.x, y: saved.y } : null;
    this.userPosition = !!this.position; this.drag = null;
    handle.addEventListener('pointerdown', event => this.begin(event));
    // Window listeners also handle a released pointer when capture is unavailable.
    view.addEventListener('pointermove', event => this.move(event));
    view.addEventListener('pointerup', event => this.finish(event));
    view.addEventListener('pointercancel', event => this.finish(event));
    handle.addEventListener('lostpointercapture', event => this.finish(event));
    handle.addEventListener('keydown', event => this.moveWithKeys(event));
    resetButton?.addEventListener('click', () => this.reset());
    view.addEventListener('resize', () => this.refresh());
    view.visualViewport?.addEventListener('resize', () => this.refresh());
    view.visualViewport?.addEventListener('scroll', () => this.refresh());
    // Refresh on the next frame: moving the panel inside the observer callback would start a resize loop.
    if (view.ResizeObserver) { let queued = false; const watch = new view.ResizeObserver(() => { if (queued) return; queued = true; (view.requestAnimationFrame || (f => setTimeout(f, 16)))(() => { queued = false; this.refresh(); }); }); watch.observe(panel); if (boundsElement) watch.observe(boundsElement); }
  }
  viewport() {
    const v = this.view.visualViewport;
    return { width: v?.width || this.view.innerWidth, height: v?.height || this.view.innerHeight, left: v?.offsetLeft || 0, top: v?.offsetTop || 0 };
  }
  place(position) {
    const viewport = this.viewport(), raw = Number(this.topInset()), inset = Number.isFinite(raw) ? Math.min(Math.max(0, raw - viewport.top), viewport.height / 2) : 0;
    let usable = { ...viewport, top: viewport.top + inset, height: viewport.height - inset };
    const area = this.bounds?.();
    if (area && [area.left, area.top, area.right, area.bottom].every(Number.isFinite) && area.right - area.left >= 200 && area.bottom - area.top >= 150) {
      const left = Math.max(usable.left, area.left), top = Math.max(usable.top, area.top);
      const right = Math.min(usable.left + usable.width, area.right), bottom = Math.min(usable.top + usable.height, area.bottom);
      if (right - left >= 200 && bottom - top >= 150) usable = { left, top, width: right - left, height: bottom - top };
    }
    this.panel.style.maxHeight = Math.max(96, Math.min(this.maxHeight, usable.height - 24)) + 'px';
    const rect = this.panel.getBoundingClientRect();
    this.position = boundPanelPosition(position, rect, usable);
    Object.assign(this.panel.style, { left: this.position.x + 'px', top: this.position.y + 'px', right: 'auto', bottom: 'auto' });
  }
  refresh() {
    if (!this.panel.getClientRects().length || this.drag) return;
    if (!this.userPosition) {
      Object.assign(this.panel.style, { left: '', top: '', right: '', bottom: '' });
      const rect = this.panel.getBoundingClientRect();
      this.place({ x: rect.left, y: rect.top });
    } else this.place(this.position);
  }
  begin(event) {
    if (event.button !== 0 || event.isPrimary === false || this.drag) return;
    event.preventDefault(); event.stopPropagation(); this.onGrab();
    this.panel.classList.add('is-dragging');
    this.refresh();
    const rect = this.panel.getBoundingClientRect();
    this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    this.handle.focus({ preventScroll: true });
    try { this.handle.setPointerCapture(event.pointerId); } catch { /* Window listeners keep dragging usable. */ }
  }
  move(event) {
    if (!this.drag || event.pointerId !== this.drag.id) return;
    event.preventDefault();
    this.userPosition = true;
    this.place({ x: this.drag.left + event.clientX - this.drag.x, y: this.drag.top + event.clientY - this.drag.y });
  }
  finish(event) {
    if (!this.drag || event.pointerId !== this.drag.id) return;
    const id = this.drag.id; this.drag = null; this.panel.classList.remove('is-dragging');
    try { if (this.handle.hasPointerCapture?.(id)) this.handle.releasePointerCapture(id); } catch { /* Capture may already have ended. */ }
    if (this.userPosition) writePreference(this.storageKey, this.position, this.storage);
    this.refresh();
  }
  moveWithKeys(event) {
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (event.key !== 'Home' && !directions[event.key]) return;
    event.preventDefault(); event.stopPropagation(); this.onGrab();
    if (event.key === 'Home') { this.reset(); return; }
    this.refresh();
    const [dx, dy] = directions[event.key], step = event.shiftKey ? 40 : 10;
    this.userPosition = true;
    this.place({ x: this.position.x + dx * step, y: this.position.y + dy * step });
    writePreference(this.storageKey, this.position, this.storage);
  }
  reset() {
    this.drag = null; this.userPosition = false; this.position = null;
    this.panel.classList.remove('is-dragging');
    writePreference(this.storageKey, null, this.storage); this.refresh();
  }
}
