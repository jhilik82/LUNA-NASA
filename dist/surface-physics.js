// Surface movement in low gravity, scaled from the world's real surface gravity g.
//
// What changes with gravity, and why:
// - Hops are ballistic. A suited astronaut pushes off at about 1.3 m/s, so the apex is v²/2g and the time in the
//   air is 2v/g: about 0.52 m and 1.6 s on the Moon, 0.23 m and 0.7 s on Mars (0.09 m and 0.27 s on Earth).
//   Once airborne there is nothing to push against, so direction cannot change until the boots land again.
// - Traction scales with weight: the most horizontal force the boots can apply is about μ·m·g, so starting,
//   stopping and turning take longer the lower the gravity (μ ≈ 0.6 for boots on packed regolith).
// - Preferred walking speed drops with gravity (Froude scaling, Carr & McGee 2009). Apollo crews moved at about
//   1.1 m/s in a loping gait on the Moon; studies predict about 1.25 m/s for suited walking on Mars.
// - Low gravity stretches the stride: steps are longer and slower (cadence ∝ √g) and each step lifts the body
//   higher (a short airborne bound on the Moon).
// The game clock runs faster than real time for consumables; hops, traction and gait are felt in real time.

export const EARTH_GRAVITY = 9.81;
export const HOP_TAKEOFF_METRES_PER_SECOND = 1.3;
export const BOOT_TRACTION = 0.6;
const WALK_TABLE = [[1.62, 1.1], [3.71, 1.25], [9.81, 1.4]]; // g, preferred suited walking speed (m/s)
const SPRINT_TABLE = [[1.62, 1.45], [3.71, 1.6], [9.81, 1.7]]; // g, lope/run multiplier

function interpolate(table, g) {
  if (g <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) if (g <= table[i][0]) { const [g0, v0] = table[i - 1], [g1, v1] = table[i]; return v0 + (v1 - v0) * (g - g0) / (g1 - g0); }
  return table.at(-1)[1];
}

export function gaitFor(gravity = 1.62) {
  const g = Math.max(.1, Number(gravity) || 1.62), ratio = g / EARTH_GRAVITY;
  const takeoff = HOP_TAKEOFF_METRES_PER_SECOND;
  return {
    gravity: g,
    walkMetresPerSecond: interpolate(WALK_TABLE, g),
    sprintMultiplier: interpolate(SPRINT_TABLE, g),
    hopTakeoff: takeoff,
    hopApexMetres: takeoff * takeoff / (2 * g),
    hopSeconds: 2 * takeoff / g,
    // Time to reach walking speed from standstill (real seconds), limited by traction μ·g.
    acceleration: BOOT_TRACTION * g,
    // Steps per metre relative to Earth: slower cadence and a longer stride in low gravity.
    strideFactor: Math.sqrt(ratio) / (interpolate(WALK_TABLE, g) / 1.4),
    // Height of the bound in each step of a walking gait (m).
    stepBounceMetres: Math.min(.16, .028 / ratio)
  };
}

// Advances the hop (real seconds). Returns the new { jump, jumpVelocity }.
export function stepHop(player, gait, dt, wantsJump) {
  let jump = player.jump || 0, velocity = player.jumpVelocity || 0;
  if (wantsJump && jump === 0 && velocity === 0) velocity = gait.hopTakeoff;
  if (jump > 0 || velocity > 0) {
    velocity -= gait.gravity * dt; jump += velocity * dt;
    if (jump <= 0) { jump = 0; velocity = 0; }
  }
  return { jump, jumpVelocity: velocity };
}

// Moves the current ground speed toward the target speed with traction-limited acceleration.
// While airborne the speed and direction stay as they were at take-off.
export function stepSpeed(current, target, gait, dt, airborne) {
  if (airborne) return current;
  const limit = gait.acceleration * dt;
  return current + Math.max(-limit, Math.min(limit, target - current));
}
