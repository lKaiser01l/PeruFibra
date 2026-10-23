
const inFlight = new Set();
const counters = new Map();

const STALE_MS = 6 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [sid, v] of counters) if (now - v.lastSeen > STALE_MS) counters.delete(sid);
}, 30 * 60 * 1000).unref();

export function acquire(sid, maxMessages) {
  if (inFlight.has(sid)) return { ok: false, reason: 'busy' };
  const entry = counters.get(sid) ?? { count: 0, lastSeen: Date.now() };
  if (entry.count >= maxMessages) return { ok: false, reason: 'quota' };
  entry.count += 1;
  entry.lastSeen = Date.now();
  counters.set(sid, entry);
  inFlight.add(sid);
  return { ok: true };
}

export function release(sid) {
  inFlight.delete(sid);
}
