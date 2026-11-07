import * as THREE from 'three';
import { clamp, randomGenerator } from './engine.js';
import { isOccupied } from './world-layout.js';

export const LUNAR_DUST_TILE_METRES = .8;

// Decode the authored colour tile without an external request. The build embeds
// it so the standalone HTML and localhost use exactly the same material.
// Luminance is only a visual micro-height approximation, not measured relief.
export function installLunarRegolithPixels(maps, data, width, height) {
  if (maps.disposed) return false;
  if (!(data instanceof Uint8Array || data instanceof Uint8ClampedArray) ||
      data.length !== width * height * 4 || width < 1 || height < 1) {
    throw new Error('Invalid lunar regolith texture pixels');
  }
  for (const name of ['albedo', 'relief']) {
    maps[name].image = { data, width, height };
    maps[name].needsUpdate = true;
  }
  maps.textureStatus = 'authored';
  return true;
}

async function loadLunarRegolith(maps) {
  // Headless data/gameplay tools keep the deterministic procedural fallback.
  if (typeof globalThis.Image !== 'function' || typeof document === 'undefined') return false;
  try {
    const { lunarRegolithDataURL } = await import('./lunar-regolith-asset.js');
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = lunarRegolithDataURL; });
    if (maps.disposed) return false;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return false;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    return installLunarRegolithPixels(maps, pixels.data, canvas.width, canvas.height);
  } catch {
    // A failed/disabled image decoder must leave the surface playable.
    return false;
  }
}

// Visual reconstructions, in metres; no pixel or clast is a NASA measurement.
export function lunarHash(x, z, seed = 3917) {
  let n = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
export function lunarNoise(x, z, seed = 3917, period = 0) {
  const ix = Math.floor(x), iz = Math.floor(z), a = x - ix, b = z - iz;
  const u = a * a * (3 - 2 * a), v = b * b * (3 - 2 * b);
  const at = (i, j) => lunarHash(period ? (i % period + period) % period : i, period ? (j % period + period) % period : j, seed);
  const top = at(ix, iz) * (1 - u) + at(ix + 1, iz) * u;
  const bottom = at(ix, iz + 1) * (1 - u) + at(ix + 1, iz + 1) * u;
  return top * (1 - v) + bottom * v;
}
function dataTexture(data, size, color = false) {
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

export function lunarSurfaceMaps(size = 512) {
  const albedo = new Uint8Array(size * size * 4), relief = new Uint8Array(albedo.length);
  const roughness = new Uint8Array(albedo.length), rock = new Uint8Array(albedo.length), rockRelief = new Uint8Array(albedo.length);
  const rng = randomGenerator(18392);
  const pits = Array.from({ length: 54 }, () => ({ x: rng(), z: rng(), r: .003 + rng() ** 2 * .035, depth: .025 + rng() * .045 }));
  for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
    const u = x / size, v = z / size, i = (z * size + x) * 4;
    const broad = lunarNoise(u * 8, v * 8, 917, 8);
    const soil = lunarNoise(u * 32, v * 32, 1831, 32);
    const grit = lunarNoise(u * 128, v * 128, 7251, 128), grain = lunarHash(x, z, 83);
    let h = .48 + (soil - .5) * .10 + (grit - .5) * .12 + (grain - .5) * .055;
    for (const p of pits) {
      const dx = Math.min(Math.abs(u - p.x), 1 - Math.abs(u - p.x));
      const dz = Math.min(Math.abs(v - p.z), 1 - Math.abs(v - p.z));
      const q = Math.hypot(dx, dz) / p.r;
      if (q < 1.5) h += p.depth * (.30 * Math.exp(-(((q - 1) / .19) ** 2)) - Math.max(0, 1 - q * q));
    }
    // Charcoal regolith, with subtle mineral variation rather than white sand.
    const gray = 116 + (broad - .5) * 29 + (soil - .5) * 21 + (grain - .5) * 13;
    albedo.set([gray, gray * .995, gray * .982, 255], i);
    const height = clamp(h * 255, 0, 255); relief.set([height, height, height, 255], i);
    roughness.set([250, 250, 250, 255], i);
    const fracture = lunarNoise(u * 13, v * 13, 1532, 13), mineral = Math.max(0, grain - .87) * 48;
    const stone = 108 + (soil - .5) * 37 + (grit - .5) * 20 + mineral;
    rock.set([stone, stone * .997, stone * .99, 255], i);
    const rh = clamp(128 + (fracture - .5) * 82 + (grit - .5) * 49 + (grain - .5) * 24, 0, 255);
    rockRelief.set([rh, rh, rh, 255], i);
  }
  const maps = { world: 'moon', tileMetres: LUNAR_DUST_TILE_METRES, microHeightMetres: .003, textureStatus: 'procedural', albedo: dataTexture(albedo, size, true), relief: dataTexture(relief, size), roughness: dataTexture(roughness, size), rock: dataTexture(rock, size, true), rockRelief: dataTexture(rockRelief, size) };
  for (const [name, t] of Object.entries(maps)) if (t?.isTexture) t.name = 'lunar-' + name + '-authored-regolith';
  maps.ready = loadLunarRegolith(maps);
  return maps;
}

// Two differently oriented soil samples plus metre-based nonperiodic macro colour.
// Using absolute coordinates keeps the fine patches and coarse terrain seamless.
export function applyLunarRegolithShader(material, unitsPerMetre = 1, tileMetres = LUNAR_DUST_TILE_METRES) {
  material.onBeforeCompile = shader => {
    shader.uniforms.lunarMetres = { value: 1 / unitsPerMetre };
    shader.uniforms.lunarTileMetres = { value: tileMetres };
    shader.vertexShader = 'varying vec3 vLunarMetres;\nuniform float lunarMetres;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', `
      #include <worldpos_vertex>
      vec4 lunarWorld = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        lunarWorld = instanceMatrix * lunarWorld;
      #endif
      vLunarMetres = (modelMatrix * lunarWorld).xyz * lunarMetres;
    `);
    shader.fragmentShader = `
      varying vec3 vLunarMetres;
      uniform float lunarTileMetres;
      float lunarRandom(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float lunarField(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(lunarRandom(i), lunarRandom(i+vec2(1.0,0.0)), f.x),
                   mix(lunarRandom(i+vec2(0.0,1.0)), lunarRandom(i+vec2(1.0,1.0)), f.x), f.y);
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec2 soilUV = vLunarMetres.xz / lunarTileMetres;
        float blendSoil = smoothstep(0.18, 0.82, lunarField(vLunarMetres.xz * 0.19));
        vec4 soilA = texture2D(map, soilUV);
        vec4 soilB = texture2D(map, mat2(0.6,-0.8,0.8,0.6)*soilUV + vec2(0.37,0.71));
        vec4 soilSample = mix(soilA, soilB, blendSoil);
        float mare = lunarField(vLunarMetres.xz * 0.018);
        float ejecta = lunarField(vLunarMetres.xz * 0.075 + vec2(31.2,19.4));
        float mottling = lunarField(vLunarMetres.xz * 0.43);
        soilSample.rgb *= 0.78 + 0.27*mare + 0.13*ejecta + 0.08*mottling;
        diffuseColor *= soilSample;
      #endif
    `);
    // Colour and surface slopes must use the same metre-scale samples on every
    // terrain patch. Ordinary UV bump mapping produces different dust relief
    // on the detailed patches and the horizon continuation.
    const bump = THREE.ShaderChunk.bumpmap_pars_fragment.replace(/vec2 dHdxy_fwd\(\)\s*\{[\s\S]*?return vec2\( dBx, dBy \);\s*\}/, `
      float lunarSoilHeight(vec2 p) {
        vec2 uv = p / lunarTileMetres;
        float blendSoil = smoothstep(0.18, 0.82, lunarField(p * 0.19));
        return mix(texture2D(bumpMap, uv).r,
                   texture2D(bumpMap, mat2(0.6,-0.8,0.8,0.6)*uv + vec2(0.37,0.71)).r,
                   blendSoil);
      }
      vec2 dHdxy_fwd() {
        vec2 p = vLunarMetres.xz;
        float h = lunarSoilHeight(p);
        return bumpScale * vec2(lunarSoilHeight(p + dFdx(p)) - h,
                                lunarSoilHeight(p + dFdy(p)) - h);
      }
    `).replace('normalize( dFdx( surf_pos.xyz ) )','dFdx( surf_pos.xyz )')
      .replace('normalize( dFdy( surf_pos.xyz ) )','dFdy( surf_pos.xyz )');
    // Keep the actual screen-space distance in the surface-gradient method.
    // The height is in scene units (metres converted by unitsPerMetre), so
    // normalising these derivatives would flatten millimetre-scale powder.
    shader.fragmentShader = shader.fragmentShader.replace('#include <bumpmap_pars_fragment>', bump);
  };
  material.customProgramCacheKey = () => 'lunar-regolith-world-v3';
  material.userData.lunarRegolith = { unitsPerMetre, tileMetres, authored: true };
  return material;
}

export function lunarRockGeometry(seed = 213, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position;
  const fracture = randomGenerator(seed + 843);
  const planes = Array.from({length:3},()=>({n:new THREE.Vector3(fracture()-.5,fracture()*.8+.15,fracture()-.5).normalize(),d:.56+fracture()*.20}));
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const variation = .83 + lunarHash(Math.round(x * 300), Math.round(z * 300), seed) * .17;
    const cut = .55 + (lunarHash(5, 3, seed) - .5) * .14;
    const v=new THREE.Vector3(clamp(x * variation, -.91, .94),clamp(y * variation * .76 + x * .12, -.48, cut),clamp(z * variation, -.86, .91));
    for(const face of planes){const excess=v.dot(face.n)-face.d;if(excess>0)v.addScaledVector(face.n,-excess);}
    p.setXYZ(i,v.x,v.y,v.z);
  }
  g.computeVertexNormals(); g.computeBoundingBox();
  g.userData.authored = true;
  return g;
}

export function surfaceNormal(terrain, point) {
  const d = .18 / terrain.cell;
  const sx = (terrain.heightAt(point.x + d, point.y) - terrain.heightAt(point.x - d, point.y)) / .36;
  const sz = (terrain.heightAt(point.x, point.y + d) - terrain.heightAt(point.x, point.y - d)) / .36;
  return new THREE.Vector3(-sx, 1, -sz).normalize();
}
export function footprintRotation(terrain, point, heading) {
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfaceNormal(terrain, point))
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2 - heading));
}
export function lunarImpressionMaterial(kind = 'boot', unitsPerMetre = 1) {
  const size = 128, image = new Uint8Array(size * size * 4), bump = new Uint8Array(image.length);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + .5) / size, v = (y + .5) / size, i = (y * size + x) * 4;
    const edge = kind === 'boot' ? Math.abs(u - .5) / (.42 - .07 * Math.cos(v * Math.PI * 2)) : Math.abs(u - .5) / .49;
    const end = kind === 'boot' ? Math.abs(v - .5) / .48 : 0;
    const inside = Math.max(edge, end) < 1;
    const tread = kind === 'boot' ? Math.abs(Math.sin((v * 10 + Math.abs(u - .5) * 1.7) * Math.PI)) : Math.abs(Math.sin((v * 3 + Math.abs(u - .5)) * Math.PI));
    const grain = lunarHash(x, y, 1302), gray = inside ? 89 + tread * 23 + grain * 10 : 118;
    image.set([gray, gray, gray * .98, inside ? (tread > .48 ? 255 : 115) : 0], i);
    const h = inside ? 110 + tread * 26 : 141; bump.set([h, h, h, 255], i);
  }
  const material = new THREE.MeshStandardMaterial({ map: dataTexture(image, size, true), bumpMap: dataTexture(bump, size), bumpScale: .003 * unitsPerMetre, roughness: 1, metalness: 0, alphaTest: .48, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  if (kind === 'wheel') { material.map.repeat.set(1, 25); material.bumpMap.repeat.set(1, 25); }
  material.name = 'lunar-' + kind + '-dust-impression';
  return material;
}

// Rebuild only when crossing a 24 m cell; gravel continues along every EVA route.
// Small clasts can be stepped over. Large boulders live in the collision landscape.
export class LunarClastField {
  constructor(renderer) {
    this.renderer = renderer; this.chunkMetres = 24; this.capacity = 2800; this.quality = 'balanced';
    this.group = new THREE.Group(); this.group.name = 'persistent-lunar-gravel-field';
    const material = renderer.mat.rock.clone(); material.flatShading = true;
    this.batches = [217, 519, 811].map(seed => {
      const g = new THREE.InstancedMesh(lunarRockGeometry(seed), material, this.capacity);
      g.name = 'lunar-gravel-variant-' + seed; g.castShadow = true; g.receiveShadow = true;
      g.userData.authored = true; this.group.add(g); return g;
    });
    renderer.scene.add(this.group); this.update(true);
  }
  setQuality(quality) { if (this.quality !== quality) { this.quality = quality; this.lastKey = ''; } }
  update(force = false) {
    const r = this.renderer, t = r.mission.terrain, u = r.unitsPerMetre;
    const pos = r.world(r.cameraPinned || r.mission.state.player), cx = Math.floor(pos.x / u / this.chunkMetres), cz = Math.floor(pos.z / u / this.chunkMetres);
    const key = cx + ':' + cz + ':' + this.quality; if (!force && key === this.lastKey) return;
    this.lastKey = key; const counts = [0, 0, 0], perChunk = { low: 280, balanced: 660, high: 900 }[this.quality] || 660;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const cellX = cx + dx, cellZ = cz + dz, rng = randomGenerator(Math.floor(lunarHash(cellX, cellZ, 9301) * 4294967295));
      for (let i = 0; i < perChunk; i++) {
        const mx = (cellX + rng()) * this.chunkMetres, mz = (cellZ + rng()) * this.chunkMetres;
        const p = { x: mx / t.cell + (t.width - 1) / 2, y: mz / t.cell + (t.height - 1) / 2 };
        const size=rng(),radius=size<.67?.007+(size/.67)**2*.031:size<.93?.04+((size-.67)/.26)**2*.085:.13+((size-.93)/.07)**2*.16;
        const yaw = rng() * Math.PI * 2, tone = .68 + rng() * .48;
        const heightRatio=.42+rng()*.43;
        // Patchy ejecta has many grains and fewer larger fragments. Hash-based
        // thinning keeps those clusters stable as quality or camera position changes.
        if(lunarHash(i,cellX*7919+cellZ,941)> .69+.25*lunarNoise(mx*.075,mz*.075,941))continue;
        if (!t.inBounds(p.x, p.y) || isOccupied(p, r.mission.props, (radius + .06) / t.cell)) continue;
        if (r.mission.landscape.clasts.some(b => Math.hypot(p.x - (r.mission.landscape.base.x + b.x / t.cell), p.y - (r.mission.landscape.base.y + b.z / t.cell)) * t.cell < b.radius)) continue;
        const batch = i % 3, index = counts[batch]++;
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        const scale = new THREE.Vector3(radius * u, radius * u * heightRatio, radius * u);
        const matrix = new THREE.Matrix4().compose(r.world(p, scale.y * .36), q, scale);
        this.batches[batch].setMatrixAt(index, matrix);
        this.batches[batch].setColorAt(index, new THREE.Color().setRGB(tone, tone, tone));
      }
    }
    for (let i = 0; i < this.batches.length; i++) {
      const b = this.batches[i]; b.count = counts[i]; b.instanceMatrix.needsUpdate = true;
      if (b.instanceColor) b.instanceColor.needsUpdate = true;
      b.computeBoundingSphere(); b.computeBoundingBox();
    }
  }
}
