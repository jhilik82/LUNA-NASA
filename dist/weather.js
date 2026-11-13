import * as THREE from 'three';

// Weather and ambience for every place the game visits.
//   Earth launch site: clear, windy, rain showers, thunderstorm (rain, clouds, gusts, lightning).
//   Mars (Jezero):     calm, windy, dust devils, dust storm (blowing dust, swirling columns, dimmed sun).
//   Moon:              no air, so no wind or rain. Instead, real space weather: quiet, micrometeorite
//                      flashes, and solar storms (radiation alert, cosmic-ray flashes in the eyes and camera).
//   Deep space:        the solar wind, and solar storms.
// Each visual is one GPU-animated object (one draw call), so weather barely changes the frame cost.

export const CONDITIONS = {
  earth: [
    { id: 'clear', label: 'Clear skies', icon: '☀', wind: 3, weight: 45, note: 'Launch weather GO.' },
    { id: 'windy', label: 'Gusty winds', icon: '🌬', wind: 13, weight: 25, note: 'Gusts within launch limits.' },
    { id: 'rain', label: 'Rain showers', icon: '🌧', wind: 8, rain: .55, cloud: .7, weight: 20, note: 'Showers over the pad. Launch weather GO.' },
    { id: 'storm', label: 'Thunderstorm', icon: '⛈', wind: 17, rain: 1, cloud: 1, sun: .38, haze: 4.5, visibility: 900, lightning: true, weight: 10, note: 'Lightning near the pad: real launches would hold.' }
  ],
  mars: [
    { id: 'calm', label: 'Calm, clear', icon: '☀', wind: 2, dust: .1, weight: 35, note: 'Light breeze, thin dust.' },
    { id: 'windy', label: 'Windy', icon: '🌬', wind: 12, dust: .45, visibility: 1600, weight: 30, note: 'Wind lifts fine dust off the crater floor.' },
    { id: 'devils', label: 'Dust devils', icon: '🌪', wind: 7, dust: .3, devils: 3, weight: 20, note: 'Whirlwinds cross Jezero; they can clean solar panels.' },
    { id: 'storm', label: 'Dust storm', icon: '🟠', wind: 25, dust: 1, haze: 7, sun: .32, visibility: 220, weight: 15, note: 'Dust storm: low visibility and weak sunlight for the solar array.' }
  ],
  moon: [
    { id: 'quiet', label: 'Quiet space weather', icon: '✦', weight: 60, note: 'No air on the Moon: no wind, no rain, no sound outside.' },
    { id: 'meteors', label: 'Micrometeorites', icon: '☄', meteors: true, weight: 30, note: 'Tiny grains strike the regolith at many km/s.' },
    { id: 'solar-storm', label: 'Solar storm', icon: '☢', radiation: true, weight: 10, note: 'Solar particle event: radiation alert. Shelter inside Haven.' }
  ],
  space: [
    { id: 'solar-wind', label: 'Solar wind', icon: '✦', solarWind: .45, weight: 85, note: 'Charged particles stream out from the Sun.' },
    { id: 'solar-storm', label: 'Solar storm', icon: '☢', solarWind: 1, radiation: true, weight: 15, note: 'Solar particle event: crew moves to the shielded cabin.' }
  ]
};

// Settings override: 'auto' or a generic intensity mapped to each place.
const OVERRIDE = { clear: { earth: 'clear', mars: 'calm', moon: 'quiet', space: 'solar-wind' }, windy: { earth: 'windy', mars: 'windy', moon: 'meteors', space: 'solar-wind' }, storm: { earth: 'storm', mars: 'storm', moon: 'solar-storm', space: 'solar-storm' } };

function hash(n) { let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; }

// Weather changes every six hours of mission time and differs per place.
export function chooseWeather(place, utcSeconds = 0, override = 'auto', forced = null) {
  const list = CONDITIONS[place] || CONDITIONS.moon;
  const id = forced || OVERRIDE[override]?.[place];
  if (id) return list.find(c => c.id === id) || list[0];
  const r = hash(Math.floor(utcSeconds / 21600) * 31 + place.length * 977 + place.charCodeAt(0)) * list.reduce((n, c) => n + c.weight, 0);
  let acc = 0; for (const c of list) { acc += c.weight; if (r < acc) return c; }
  return list[0];
}

// Expedition stages that come with their own weather.
export function stageWeather(place, stageId) {
  if (stageId === 'shelter') return place === 'mars' ? 'storm' : place === 'moon' ? 'solar-storm' : null;
  if (stageId === 'power' && place === 'mars') return 'windy';
  return null;
}

const wrapChunk = `
  vec3 wrapAround(vec3 seed, vec3 drift) {
    vec3 p = seed * uBox + drift - uCenter + uBox * 0.5;
    return uCenter + mod(p, uBox) - uBox * 0.5;
  }`;

function rainMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(60, 40, 60) }, uVel: { value: new THREE.Vector3(0, -9, 0) }, uLen: { value: .6 }, uColor: { value: new THREE.Color('#b9cde0') }, uOpacity: { value: .5 } },
    vertexShader: `uniform float uTime, uLen; uniform vec3 uCenter, uBox, uVel; attribute float tail; varying float vTail;${wrapChunk}
      void main() { vec3 p = wrapAround(position, uVel * uTime) - normalize(uVel) * uLen * tail; vTail = tail; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vTail; void main() { gl_FragColor = vec4(uColor, uOpacity * (1.0 - vTail * .85));
      #include <colorspace_fragment>
    }`
  });
}

function dustMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(80, 18, 80) }, uVel: { value: new THREE.Vector3(6, 0, 1) }, uSize: { value: 28 }, uColor: { value: new THREE.Color('#d9a273') }, uOpacity: { value: .35 } },
    vertexShader: `uniform float uTime, uSize; uniform vec3 uCenter, uBox, uVel; varying float vFade;${wrapChunk}
      void main() { vec3 p = wrapAround(position, uVel * uTime); p.y += sin(uTime * 1.7 + position.x * 40.0) * uBox.y * .03;
        vec4 mv = viewMatrix * vec4(p, 1.0); vFade = clamp(1.0 - length(p - uCenter) / (uBox.x * .5), 0.0, 1.0);
        gl_PointSize = clamp(uSize / max(.5, -mv.z), 1.0, 48.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vFade;
      void main() { float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(uColor, uOpacity * vFade * smoothstep(.5, .1, d));
        #include <colorspace_fragment>
      }`
  });
}

function devilMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uCenters: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uHeight: { value: 30 }, uSize: { value: 30 }, uColor: { value: new THREE.Color('#c99268') }, uOpacity: { value: .45 } },
    vertexShader: `uniform float uTime, uHeight, uSize; uniform vec3 uCenters[3]; attribute float devil; varying float vH;
      void main() { int i = int(devil); vec3 c = i == 0 ? uCenters[0] : i == 1 ? uCenters[1] : uCenters[2];
        float h = position.y; float r = mix(.04, .22, h) * uHeight * (.7 + .3 * position.z);
        float a = position.x * 6.2831 + uTime * (5.0 - 3.0 * h);
        vec3 p = c + vec3(cos(a) * r, h * uHeight, sin(a) * r); vH = h;
        vec4 mv = viewMatrix * vec4(p, 1.0); gl_PointSize = clamp(uSize / max(.5, -mv.z), 1.0, 40.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vH;
      void main() { float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(uColor, uOpacity * (1.0 - vH * .7) * smoothstep(.5, .15, d));
        #include <colorspace_fragment>
      }`
  });
}

function flashMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uRate: { value: 0 } },
    vertexShader: `uniform float uTime, uRate; attribute float id; varying float vOn;
      float h(float n) { return fract(sin(n) * 43758.5453); }
      void main() { float slot = floor(uTime * 12.0); vOn = step(1.0 - uRate, h(slot * 13.1 + id * 7.7));
        vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 2.0 + 4.0 * h(id); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vOn; void main() { if (vOn < .5) discard; float d = length(gl_PointCoord - .5); gl_FragColor = vec4(1.0, 1.0, 1.0, smoothstep(.5, .0, d)); }`
  });
}

export class WeatherEffects {
  // scale: world units per metre in this scene.
  constructor(scene, { scale = 1, place = 'moon' } = {}) {
    this.scene = scene; this.scale = scale; this.place = place; this.condition = CONDITIONS[place]?.[0] || CONDITIONS.moon[0];
    this.group = new THREE.Group(); this.group.name = 'weather'; scene.add(this.group);
    const rng = (() => { let a = 1234567; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();
    // Rain: 1,800 streaks.
    const rain = new THREE.BufferGeometry(), rp = [], rt = [];
    for (let i = 0; i < 1800; i++) { const p = [rng(), rng(), rng()]; rp.push(...p, ...p); rt.push(0, 1); }
    rain.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rain.setAttribute('tail', new THREE.Float32BufferAttribute(rt, 1));
    this.rain = new THREE.LineSegments(rain, rainMaterial()); this.rain.name = 'weather-rain';
    // Blowing dust: 2,400 soft points.
    const dust = new THREE.BufferGeometry(), dp = [];
    for (let i = 0; i < 2400; i++) dp.push(rng(), rng(), rng());
    dust.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
    this.dust = new THREE.Points(dust, dustMaterial()); this.dust.name = 'weather-dust';
    // Dust devils: three swirling columns.
    const devils = new THREE.BufferGeometry(), vp = [], vd = [];
    for (let d = 0; d < 3; d++) for (let i = 0; i < 700; i++) { vp.push(rng(), Math.pow(rng(), .8), rng()); vd.push(d); }
    devils.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); devils.setAttribute('devil', new THREE.Float32BufferAttribute(vd, 1));
    this.devils = new THREE.Points(devils, devilMaterial()); this.devils.name = 'weather-dust-devils';
    this.devilState = [0, 1, 2].map(i => ({ angle: i * 2.1, distance: 35 + i * 18, speed: .04 + i * .015 }));
    // Cosmic-ray / micrometeorite flashes: points in front of the camera (in camera space).
    const flash = new THREE.BufferGeometry(), fp = [], fi = [];
    for (let i = 0; i < 90; i++) { fp.push((rng() - .5) * 2.4, (rng() - .5) * 1.4, -1.2 - rng() * 2); fi.push(i); }
    flash.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); flash.setAttribute('id', new THREE.Float32BufferAttribute(fi, 1));
    this.flashes = new THREE.Points(flash, flashMaterial()); this.flashes.name = 'weather-particle-flashes'; this.flashes.frustumCulled = false; this.flashes.renderOrder = 10;
    // Micrometeorite streaks: a handful of short bright lines, re-placed on the CPU.
    this.streakGeometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => new THREE.Vector3()));
    this.streaks = new THREE.LineSegments(this.streakGeometry, new THREE.LineBasicMaterial({ color: '#fff4dc', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.streaks.name = 'weather-micrometeorites'; this.streakTimer = 0;
    // Lightning bolt (Earth storms).
    this.boltGeometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 24 }, () => new THREE.Vector3()));
    this.bolt = new THREE.LineSegments(this.boltGeometry, new THREE.LineBasicMaterial({ color: '#e8f0ff', transparent: true, opacity: 0, depthWrite: false, fog: false }));
    this.bolt.name = 'weather-lightning'; this.lightning = 0; this.nextStrike = 3;
    for (const o of [this.rain, this.dust, this.devils, this.flashes, this.streaks, this.bolt]) { o.frustumCulled = false; o.visible = false; o.raycast = () => {}; this.group.add(o); }
    this.time = 0;
  }
  setCondition(condition) { if (condition && condition !== this.condition) { this.condition = condition; this.changedAt = this.time; } return this.condition; }
  // Returns the light modifiers the renderer applies this frame.
  update(dt, camera, { sunDirection = null, groundY = null, reducedMotion = false } = {}) {
    const c = this.condition, m = this.scale, t = (this.time += dt), center = camera.position;
    // visibility (metres) becomes an exponential-fog density the renderer can use directly: ~85% hidden at that range.
    const out = { sun: c.sun ?? (c.rain ? 1 - .45 * c.rain : 1), haze: c.haze ?? (c.rain ? 1 + 2.2 * c.rain : c.dust ? 1 + c.dust : 1), fogDensity: c.visibility ? 1.4 / (c.visibility * m) : 0, flash: 0, tint: null };
    const motion = !reducedMotion;
    // Rain
    this.rain.visible = motion && !!c.rain;
    if (this.rain.visible) {
      const u = this.rain.material.uniforms; u.uTime.value = t; u.uCenter.value.copy(center); u.uBox.value.set(60, 36, 60).multiplyScalar(m);
      u.uVel.value.set(c.wind * .45, -9.5, c.wind * .15).multiplyScalar(m); u.uLen.value = 1.1 * m; u.uOpacity.value = .35 + .4 * c.rain;
      this.rain.geometry.setDrawRange(0, Math.round(3600 * c.rain));
    }
    // Dust (Mars wind and storms) or the solar wind in space
    const dustAmount = c.dust ?? c.solarWind ?? 0;
    this.dust.visible = motion && dustAmount > .05;
    if (this.dust.visible) {
      const u = this.dust.material.uniforms, space = this.place === 'space';
      u.uTime.value = t; u.uCenter.value.copy(center);
      u.uBox.value.set(80, space ? 80 : 14, 80).multiplyScalar(m);
      if (space && sunDirection) u.uVel.value.copy(sunDirection).multiplyScalar(-40 * m * (.5 + dustAmount)); else u.uVel.value.set(c.wind || 2, .3, (c.wind || 2) * .35).multiplyScalar(m);
      u.uColor.value.set(space ? '#ffe7b0' : '#e0a676'); u.uSize.value = (space ? 6 : 70 + 90 * dustAmount) * m; u.uOpacity.value = space ? .5 : .22 + .5 * dustAmount;
      if (!space && groundY !== null) u.uCenter.value.y = groundY + 6 * m;
      this.dust.geometry.setDrawRange(0, Math.round(2400 * Math.min(1, .25 + dustAmount)));
    }
    // Dust devils wander around the player
    this.devils.visible = motion && !!c.devils;
    if (this.devils.visible) {
      const u = this.devils.material.uniforms; u.uTime.value = t; u.uHeight.value = 26 * m; u.uSize.value = 34 * m;
      this.devilState.forEach((d, i) => { d.angle += dt * d.speed; const r = d.distance * m; u.uCenters.value[i].set(center.x + Math.cos(d.angle) * r, (groundY ?? center.y - 2 * m), center.z + Math.sin(d.angle) * r); });
    }
    // Radiation flashes (solar storms) and micrometeorite sparkle, drawn in front of the camera
    const flashRate = c.radiation ? .05 : c.meteors ? .006 : 0;
    this.flashes.visible = motion && flashRate > 0;
    if (this.flashes.visible) { this.flashes.position.copy(camera.position); this.flashes.quaternion.copy(camera.quaternion); this.flashes.material.uniforms.uTime.value = t; this.flashes.material.uniforms.uRate.value = flashRate; }
    // Micrometeorite streaks hitting the ground nearby
    this.streaks.visible = motion && !!c.meteors;
    if (this.streaks.visible) {
      this.streakTimer -= dt; const mat = this.streaks.material; mat.opacity = Math.max(0, mat.opacity - dt * 6);
      if (this.streakTimer <= 0) {
        this.streakTimer = .4 + Math.random() * 1.8; const pos = this.streakGeometry.attributes.position;
        for (let i = 0; i < pos.count; i += 2) { const a = Math.random() * Math.PI * 2, r = (8 + Math.random() * 40) * m, gx = center.x + Math.cos(a) * r, gz = center.z + Math.sin(a) * r, gy = groundY ?? center.y - 2 * m;
          pos.setXYZ(i, gx - 2 * m, gy + 7 * m, gz + 1.5 * m); pos.setXYZ(i + 1, gx, gy + .2 * m, gz); }
        pos.needsUpdate = true; mat.opacity = .9;
      }
    }
    // Lightning
    this.bolt.visible = !!c.lightning;
    if (c.lightning) {
      this.nextStrike -= dt; this.lightning = Math.max(0, this.lightning - dt * 3.5);
      if (this.nextStrike <= 0) {
        this.nextStrike = 4 + Math.random() * 8; this.lightning = 1; this.strikes = (this.strikes || 0) + 1;
        const pos = this.boltGeometry.attributes.position, a = Math.random() * Math.PI * 2, base = new THREE.Vector3(center.x + Math.cos(a) * 600 * m, (groundY ?? 0), center.z + Math.sin(a) * 600 * m);
        let p = base.clone().setY(base.y + 420 * m);
        for (let i = 0; i < pos.count; i += 2) { const q = p.clone().add(new THREE.Vector3((Math.random() - .5) * 40 * m, -420 * m / (pos.count / 2), (Math.random() - .5) * 40 * m)); pos.setXYZ(i, p.x, p.y, p.z); pos.setXYZ(i + 1, q.x, q.y, q.z); p = q; }
        pos.needsUpdate = true;
      }
      const flicker = reducedMotion ? Math.min(this.lightning, .35) : this.lightning * (.6 + .4 * Math.sin(t * 60));
      this.bolt.material.opacity = flicker; out.flash = flicker;
    }
    if (c.radiation) out.tint = '#ff6b7a';
    return out;
  }
  dispose() { this.scene.remove(this.group); this.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
}
