export function readPreference(key, fallback, storage = globalThis.localStorage) {
  try { const raw = storage?.getItem(key); return raw == null ? fallback : JSON.parse(raw); }
  catch { return fallback; }
}
export function writePreference(key, value, storage = globalThis.localStorage) {
  try { storage?.setItem(key, JSON.stringify(value)); return !!storage; }
  catch { return false; }
}
