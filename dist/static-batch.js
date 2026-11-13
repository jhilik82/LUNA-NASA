import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Performance: every separate mesh costs one draw call per frame (plus one per shadow pass).
// batchStaticMeshes() merges the static meshes inside `root` that share a material into a single
// mesh per material, keeping their exact shape and position. It must run once, after the model is
// fully built and positioned, and before it is first drawn.
//
// Animated parts referenced from userData (doors, dishes, arms, legs, plants, lights…) keep their own
// transform and are never merged themselves; static pieces *inside* such a part are merged within that
// part, so they still move with it.
// Never merged (they keep working exactly as before):
//  • any object referenced from any userData in the subtree
//  • meshes with multi-materials, instancing, skinning, morph targets, or custom depth materials
//  • meshes rejected by the optional `keep(mesh)` callback

function collectReferenced(value, out, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  if (value.isObject3D) { out.add(value); return; }
  if (Array.isArray(value)) { for (const v of value) collectReferenced(v, out, seen); return; }
  if (Object.getPrototypeOf(value) === Object.prototype) for (const v of Object.values(value)) collectReferenced(v, out, seen);
}

function flipWinding(geometry) {
  const position = geometry.attributes.position;
  for (const attribute of Object.values(geometry.attributes)) {
    const size = attribute.itemSize, array = attribute.array;
    for (let i = 0; i < position.count; i += 3) {
      for (let k = 0; k < size; k++) { const a = (i + 1) * size + k, b = (i + 2) * size + k; const t = array[a]; array[a] = array[b]; array[b] = t; }
    }
  }
}

export function batchStaticMeshes(root, { keep = () => false, protect = [] } = {}) {
  root.updateMatrixWorld(true);
  const referenced = new Set();
  root.traverse(o => { if (o !== root) collectReferenced(o.userData, referenced); });
  collectReferenced(root.userData, referenced);
  collectReferenced(protect, referenced); // parts the caller animates or toggles through its own handles
  const buckets = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || referenced.has(o) || keep(o)) return;
    if (Array.isArray(o.material) || o.customDepthMaterial || o.customDistanceMaterial || o.geometry.morphAttributes?.position) return;
    // The anchor is the nearest ancestor that moves on its own (a referenced part) or the root.
    let anchor = o.parent, hidden = false;
    for (let p = o.parent; p; p = p.parent) { if (!p.visible) hidden = true; if (p === root || referenced.has(p)) { anchor = p; break; } }
    if (hidden || keep(anchor)) return;
    const key = [anchor.uuid, o.material.uuid, o.castShadow, o.receiveShadow, o.renderOrder].join('|');
    if (!buckets.has(key)) buckets.set(key, { anchor, list: [] });
    buckets.get(key).list.push(o);
  });

  let merged = 0, removed = 0;
  for (const { anchor, list } of buckets.values()) {
    if (list.length < 2) continue;
    const toLocal = new THREE.Matrix4().copy(anchor.matrixWorld).invert();
    const material = list[0].material, needsUv = list.some(o => o.geometry.attributes.uv) && !!(material.map || material.normalMap || material.roughnessMap || material.aoMap || material.alphaMap);
    const needsColor = !!material.vertexColors;
    if (needsColor && !list.every(o => o.geometry.attributes.color)) continue;
    const parts = [];
    for (const o of list) {
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (needsUv && !g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!needsUv && g.attributes.uv) g.deleteAttribute('uv');
      if (!needsColor && g.attributes.color) g.deleteAttribute('color');
      g.morphAttributes = {}; g.clearGroups();
      const m = new THREE.Matrix4().multiplyMatrices(toLocal, o.matrixWorld);
      g.applyMatrix4(m);
      if (m.determinant() < 0) flipWinding(g);
      parts.push(g);
    }
    const geometry = mergeGeometries(parts, false);
    for (const g of parts) g.dispose();
    if (!geometry) continue;
    geometry.computeBoundingSphere(); geometry.computeBoundingBox();
    const batch = new THREE.Mesh(geometry, material);
    batch.name = 'static-batch:' + (list[0].name || material.name || 'part');
    batch.castShadow = list[0].castShadow; batch.receiveShadow = list[0].receiveShadow; batch.renderOrder = list[0].renderOrder;
    batch.userData.batchedParts = list.length;
    anchor.add(batch);
    for (const o of list) o.parent?.remove(o);
    merged++; removed += list.length;
  }
  return { merged, removed };
}
