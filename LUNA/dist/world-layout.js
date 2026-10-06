// Authored scenery and colliders. Coordinates share the NASA terrain grid.
// Model sizes are enlarged for playability; these are not observed lunar structures.
export const WORLD_SCALE = 8;
export const BODY_RADIUS = 0.16;

export function createWorldLayout(mission) {
  const b = mission.objects.base, r = mission.objects.relay;
  const props = [
    { id: 'habitat', kind: 'habitat', x: b.x - 1.65, y: b.y - 1.1, halfX: 1.05, halfY: .72 },
    { id: 'airlock', kind: 'airlock', x: b.x - .36, y: b.y - 1.1, halfX: .30, halfY: .44 },
    { id: 'solar', kind: 'solar', x: b.x - 1.1, y: b.y + 1.2, halfX: .8, halfY: .43 },
    { id: 'tank', kind: 'tank', x: b.x - 2.25, y: b.y + .5, halfX: .33, halfY: .33 },
    { id: 'lab', kind: 'lab', x: b.x + 1.7, y: b.y - 1.1, halfX: .50, halfY: .38 },
    { id: 'relay', kind: 'relay', x: r.x - .70, y: r.y - .64, halfX: .40, halfY: .40 },
    { id: 'relay-panel', kind: 'solar', x: r.x - 1.6, y: r.y - .7, halfX: .6, halfY: .4 }
  ];
  return props.filter(p => mission.terrain.inBounds(p.x, p.y));
}

function pointInProp(point, prop, padding) {
  if (prop.radius) return Math.hypot(point.x - prop.x, point.y - prop.y) < prop.radius + padding;
  return Math.abs(point.x - prop.x) < prop.halfX + padding && Math.abs(point.y - prop.y) < prop.halfY + padding;
}

export function isOccupied(point, props, radius = BODY_RADIUS) {
  return props.some(p => pointInProp(point, p, radius));
}

export function segmentBlocked(from, to, props, radius = BODY_RADIUS) {
  // Sampling interval is smaller than the narrowest collider and stops tunnelling.
  const n = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / .06));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (isOccupied({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }, props, radius)) return true;
  }
  return false;
}

export function roverCollider(rover, heading = 0) {
  // Conservative square encloses the rover body for every wheel orientation.
  return { id: 'echo-body', kind: 'rover', x: rover.x, y: rover.y, halfX: .46, halfY: .46, heading };
}
