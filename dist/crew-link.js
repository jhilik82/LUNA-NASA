// Connection to a crew room on the game server: create or join with a code, receive the live room through
// server-sent events, send this player's position a few times a second, and run host actions (start, new round).
// The membership is remembered per tab so a page reload rejoins the same crew.

const SESSION_KEY = 'luna-crew-session-v1';

export class CrewLink {
  constructor({ fetcher = globalThis.fetch?.bind(globalThis), EventSourceImpl = globalThis.EventSource, session = globalThis.sessionStorage } = {}) {
    this.fetcher = fetcher; this.EventSourceImpl = EventSourceImpl; this.session = session;
    this.code = null; this.playerId = null; this.token = null; this.world = 'moon'; this.links = [];
    this.room = null; this.source = null; this.listeners = new Set(); this.lastSent = 0; this.pending = null; this.connected = false;
  }
  get active() { return !!this.code; }
  get me() { return this.room?.players.find(p => p.id === this.playerId) || null; }
  get isHost() { return !!this.room && this.room.hostId === this.playerId; }
  onRoom(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  async post(path, body) {
    const response = await this.fetcher(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let data = null; try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data?.error || 'The game server did not answer (' + response.status + ').');
    return data;
  }
  async available() {
    try { const r = await this.fetcher('/api/health'); if (!r.ok) return false; const h = await r.json(); return !!h.multiplayer; } catch { return false; }
  }
  async create(name, world) { return this.enter(await this.post('/api/rooms', { name, world })); }
  async join(code, name) {
    const clean = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const saved = this.saved();
    const body = saved?.code === clean ? { name, playerId: saved.playerId, token: saved.token } : { name };
    return this.enter(await this.post('/api/rooms/' + clean + '/join', body));
  }
  saved() { try { return JSON.parse(this.session?.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
  enter(data) {
    this.code = data.code; this.playerId = data.playerId; this.token = data.token; this.world = data.world; this.links = data.links || this.links;
    try { this.session?.setItem(SESSION_KEY, JSON.stringify({ code: this.code, playerId: this.playerId, token: this.token })); } catch {}
    this.listen(); return data;
  }
  listen() {
    this.source?.close();
    if (!this.EventSourceImpl) throw new Error('This browser cannot receive live crew updates.');
    const url = '/api/rooms/' + this.code + '/stream?player=' + encodeURIComponent(this.playerId) + '&token=' + encodeURIComponent(this.token);
    const source = this.source = new this.EventSourceImpl(url);
    source.onopen = () => { this.connected = true; this.retries = 0; };
    // The browser retries dropped connections by itself, but gives up for good after an HTTP error (a server
    // restart, an online host's proxy). Then reconnect here, rejoining the crew with this tab's membership.
    source.onerror = () => {
      this.connected = false;
      if (source.readyState !== 2 || this.source !== source || !this.code) return;
      clearTimeout(this.retryTimer);
      const wait = Math.min(15000, 1000 * 2 ** Math.min(4, this.retries = (this.retries || 0) + 1));
      this.retryTimer = setTimeout(() => {
        if (this.source !== source || !this.code) return;
        this.post('/api/rooms/' + this.code + '/join', { playerId: this.playerId, token: this.token }).then(() => this.listen()).catch(error => /does not exist|Not a member/.test(error.message) ? this.closeLocal() : this.listen());
      }, wait);
    };
    this.source.onmessage = event => { try { this.room = JSON.parse(event.data); this.connected = true; for (const l of this.listeners) l(this.room); } catch {} };
  }
  // Position updates, at most ~6 per second.
  sendState(state, now = Date.now()) {
    if (!this.active || now - this.lastSent < 160 || this.pending) return;
    this.lastSent = now;
    this.pending = this.post('/api/rooms/' + this.code + '/state', { playerId: this.playerId, token: this.token, ...state }).catch(() => {}).finally(() => { this.pending = null; });
  }
  action(type, extra = {}) { return this.post('/api/rooms/' + this.code + '/action', { playerId: this.playerId, token: this.token, type, ...extra }); }
  // The room has closed on the server (for example after a server restart): back to solo play.
  closeLocal() {
    clearTimeout(this.retryTimer); this.source?.close(); this.source = null; this.code = null; this.room = null; this.connected = false;
    try { this.session?.removeItem(SESSION_KEY); } catch {}
    for (const l of this.listeners) l(null);
  }
  async leave() {
    if (!this.active) return;
    try { await this.action('leave'); } catch {}
    clearTimeout(this.retryTimer); this.source?.close(); this.source = null; this.code = null; this.room = null; this.connected = false;
    try { this.session?.removeItem(SESSION_KEY); } catch {}
    for (const l of this.listeners) l(null);
  }
}
