import * as THREE from 'three';
import { mesh } from './models.js';

export function createGreenhouse(mat) {
  const g = new THREE.Group();
  g.name = 'academy-greenhouse';

  const box = (material, position, size) =>
    mesh(g, new THREE.BoxGeometry(...size), material, position);

  // Foundation and transparent dome
  box(mat.silver, [0, 0.35, 0], [12, 0.7, 8]);

  const glass = new THREE.MeshPhysicalMaterial({
    color: '#a4d7d4',
    roughness: 0.15,
    metalness: 0.12,
    transparent: true,
    opacity: 0.27,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  mesh(
    g,
    new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    glass,
    [0, 0.7, 0],
    [6, 4, 4]
  );

  // Dome support ribs
  for (let j = -3; j <= 3; j++) {
    const z = j;
    const scale = Math.sqrt(Math.max(0.05, 1 - (z * z) / 16));
    mesh(
      g,
      new THREE.TorusGeometry(1, 0.018, 6, 48, Math.PI),
      mat.silver,
      [0, 0.72, z],
      [6 * scale, 4 * scale, 1]
    );
  }

  // Soil beds and planted rows
  const soil = new THREE.MeshStandardMaterial({
    color: '#28271e',
    roughness: 1
  });
  const leaves = new THREE.MeshStandardMaterial({
    color: '#6f9a55',
    roughness: 0.85
  });

  g.userData.plants = [];

  for (const z of [-2.2, 0, 2.2]) {
    box(mat.dark, [0, 0.8, z], [9, 0.35, 1.2]);
    box(soil, [0, 1, z], [8.8, 0.08, 1]);

    for (let x = -4; x <= 4; x += 0.8) {
      const plant = new THREE.Group();
      plant.position.set(x, 1.08, z);
      g.add(plant);

      for (let i = 0; i < 4; i++) {
        const leaf = mesh(
          plant,
          new THREE.SphereGeometry(0.24, 7, 5),
          leaves,
          [0, 0.12 + i * 0.055, 0],
          [1, 0.28, 1.5]
        );
        leaf.rotation.y = i * Math.PI / 2;
        leaf.rotation.z = 0.2;
      }

      g.userData.plants.push(plant);
    }
  }

  // Interior grow light
  const glow = new THREE.PointLight('#d9efb5', 10, 12);
  glow.position.set(0, 2.7, 0);
  g.add(glow);
  g.userData.growLight = glow;

  // Entrance
  box(mat.white, [0, 1.8, 3.8], [2.2, 3.4, 0.25]);
  box(mat.glass, [0, 2.1, 3.97], [1.6, 2.3, 0.06]);

  return g;
}
