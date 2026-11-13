import * as THREE from 'three';

export function makeMaterials() {
  const material = (color, roughness = .7, metalness = .1, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, depthTest: true, depthWrite: true, ...extra });
  return {
    suit: material('#e4e5df', .83), dark: material('#202731', .64), silver: material('#a7b5c2', .34, .72),
    white: material('#cbd1d2', .61, .22), orange: material('#d66b36', .5, .35),
    gold: material('#c89438', .22, .79), blue: material('#142e50', .32, .47),
    foil: material('#b49b61', .56, .72),
    glass: material('#1f405b', .18, .76), black: material('#101317', .87),
    cyan: material('#7be8db', .35, .1, {emissive:'#43bba8', emissiveIntensity:1.2}),
    amber: material('#ee914f', .3, .1, {emissive:'#ea6431', emissiveIntensity:.8}),
    rock: material('#686b70', .98), regolith: material('#828589', 1)
  };
}

export function mesh(parent, geometry, material, position = [0,0,0], scale = null, name = '') {
  const m = new THREE.Mesh(geometry, material); m.position.set(...position);
  if (scale) m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = true; m.name = name; parent.add(m); return m;
}
const box = (p,m,x,y,z,w,h,d,name='') => mesh(p,new THREE.BoxGeometry(w,h,d),m,[x,y,z],null,name);
const sphere = (p,m,x,y,z,r,s=null,name='') => mesh(p,new THREE.SphereGeometry(r,24,16),m,[x,y,z],s,name);
const cylinder = (p,m,x,y,z,r,h,name='') => mesh(p,new THREE.CylinderGeometry(r,r,h,18),m,[x,y,z],null,name);
function beam(p,m,a,b,r=.065) {
  const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), dir=end.clone().sub(start);
  const rod=mesh(p,new THREE.CylinderGeometry(r,r,dir.length(),8),m,start.clone().add(end).multiplyScalar(.5).toArray());
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return rod;
}

export function createAstronaut(mat) {
  const group=new THREE.Group();group.name='astronaut';
  const body=new THREE.Group();group.add(body);body.name='suit-body';
  mesh(body,new THREE.CapsuleGeometry(.69,.95,6,16),mat.suit,[0,2.65,0],[1,1,.74]);
  box(body,mat.dark,0,2.95,.51,1.05,.59,.15,'chest-console');
  box(body,mat.orange,0,3.05,.60,.5,.11,.07);
  for(let i=0;i<3;i++)sphere(body,mat.cyan,-.32+i*.32,2.79,.61,.044);
  box(body,mat.white,0,2.7,-.69,1.28,1.73,.67,'life-support-pack');
  box(body,mat.orange,0,3.35,-1.03,1.08,.14,.05);
  for(let i=0;i<4;i++)box(body,mat.dark,0,2.30+i*.17,-1.04,.90,.07,.05);
  cylinder(body,mat.dark,0,3.63,0,.51,.23,'helmet-collar');
  const helmet=new THREE.Group();helmet.position.y=4.28;helmet.scale.setScalar(.82);helmet.name='helmet-pivot';body.add(helmet);
  sphere(helmet,mat.suit,0,0,0,.93,[1,1,.91],'helmet-shell');
  const visor=sphere(helmet,mat.gold,0,-.03,.56,.74,[.97,.70,.49],'gold-visor');
  // The visor is an opaque depth-writing curved mesh, never a screen overlay.
  box(helmet,mat.white,0,.42,.47,1.10,.10,.21);
  for(const sign of [-1,1]) {
    sphere(helmet,mat.silver,sign*.87,-.03,0,.18,[.7,1,1]);
    const arm=new THREE.Group();arm.position.set(sign*.85,3.18,0);body.add(arm);arm.name=sign<0?'left-arm':'right-arm';
    cylinder(arm,mat.suit,0,-.46,0,.23,.90);sphere(arm,mat.dark,0,-.92,0,.22);
    const elbow=new THREE.Group();elbow.position.y=-.92;elbow.name=sign<0?'left-elbow':'right-elbow';arm.add(elbow);
    const forearm=cylinder(elbow,mat.suit,0,-.38,.08,.20,.63);forearm.rotation.x=-.13;
    cylinder(elbow,mat.orange,0,-.61,.10,.215,.11);sphere(elbow,mat.suit,0,-.82,.11,.235,[1,1.25,1]);
    if(sign<0){box(elbow,mat.dark,0,-.49,.27,.32,.34,.08,'wrist-computer');box(elbow,mat.cyan,0,-.49,.315,.23,.22,.018,'wrist-display');}
    const leg=new THREE.Group();leg.position.set(sign*.37,1.96,0);group.add(leg);leg.name=sign<0?'left-leg':'right-leg';
    cylinder(leg,mat.suit,0,-.44,0,.29,.81);sphere(leg,mat.dark,0,-.9,0,.24);
    const knee=new THREE.Group();knee.position.y=-.9;knee.name=sign<0?'left-knee':'right-knee';leg.add(knee);
    cylinder(knee,mat.suit,0,-.4,0,.25,.61);box(knee,mat.dark,0,-.91,.16,.58,.30,.93,'boot');
    box(knee,mat.orange,0,-.70,.20,.56,.12,.49);
    for(let i=0;i<4;i++)box(knee,mat.silver,0,-1.063,-.16+i*.20,.52,.014,.055,'boot-tread');
  }
  beam(body,mat.gold,[-.62,2.42,.47],[-.95,2.0,-.15],.045);
  for(const sign of [-1,1]){
    const seam=mesh(body,new THREE.TorusGeometry(.71,.022,5,24),mat.dark,[0,2.34+sign*.42,0],[1,1,.75],'suit-seam');seam.rotation.x=Math.PI/2;
  }
  group.userData={body,visor,helmet,arms:[body.getObjectByName('left-arm'),body.getObjectByName('right-arm')],elbows:[body.getObjectByName('left-elbow'),body.getObjectByName('right-elbow')],legs:[group.getObjectByName('left-leg'),group.getObjectByName('right-leg')],knees:[group.getObjectByName('left-knee'),group.getObjectByName('right-knee')]};
  return group;
}

export function createRover(mat) {
  const g=new THREE.Group();g.name='echo-rover';g.rotation.order='YXZ';
  box(g,mat.silver,0,1.06,0,4.5,.43,3.6,'chassis');
  box(g,mat.white,0,1.92,.05,4.15,1.38,2.9,'pressure-cabin');
  box(g,mat.orange,0,1.82,1.53,3.7,.16,.06);
  box(g,mat.glass,0,2.1,1.53,3.43,.8,.06,'windshield');
  for(const s of [-1,1])box(g,mat.glass,s*2.10,2.12,.15,.06,.75,1.98);
  box(g,mat.silver,0,2.73,0,4.36,.16,3.14,'roof');
  box(g,mat.white,0,1.25,-2.27,3.76,.70,1.00,'cargo-bay');
  box(g,mat.gold,0,1.75,-2.24,3.20,.25,.82);
  const wheels=[];
  for(const x of [-2.55,2.55])for(const z of [-1.52,0,1.52]) {
    const wheel=new THREE.Group();wheel.position.set(x,.77,z);g.add(wheel);
    const tire=cylinder(wheel,mat.black,0,0,0,.77,.49);tire.rotation.z=Math.PI/2;
    const hub=cylinder(wheel,mat.silver,x<0?-.27:.27,0,0,.43,.07);hub.rotation.z=Math.PI/2;
    for(let i=0;i<12;i++) {
      const a=i*Math.PI/6, t=box(wheel,mat.dark,0,Math.cos(a)*.76,Math.sin(a)*.76,.53,.11,.26);t.rotation.x=a;
    }
    beam(g,mat.silver,[x*.7,1.11,z],[x,.77,z],.10);wheels.push(wheel);
  }
  cylinder(g,mat.silver,-1.2,3.19,-.44,.095,.90);
  box(g,mat.dark,-1.2,3.71,-.44,.69,.31,.40,'navigation-camera');
  sphere(g,mat.glass,-1.2,3.71,-.21,.14);
  beam(g,mat.silver,[1.5,2.8,-.9],[1.5,4.1,-.9],.035);
  const beacon=sphere(g,mat.amber,1.5,4.12,-.9,.14);
  for(const x of [-1.4,1.4])sphere(g,mat.cyan,x,1.28,1.87,.14);
  g.userData={wheels,beacon};return g;
}

export function createHabitat(mat) {
  const g=new THREE.Group();g.name='haven-habitat';
  box(g,mat.dark,0,.62,0,16.8,1.23,11.52,'foundation');
  box(g,mat.white,0,4.0,0,15.0,6.0,10.4,'habitat-shell');
  box(g,mat.silver,0,7.08,0,15.8,.35,11.0,'roof-shield');
  box(g,mat.orange,0,2.65,5.25,14.6,.36,.12);
  for(const x of [-4.6,0,4.6])box(g,mat.glass,x,4.8,5.24,2.90,1.60,.13,'window');
  for(const x of [-7.5,7.5])for(const z of [-5.4,5.4])cylinder(g,mat.silver,x,2.12,z,.38,4.2,'support');
  for(const x of [-5,-2.5,0,2.5,5])box(g,mat.dark,x,7.35,0,.1,.18,10.5);
  cylinder(g,mat.silver,-5,8.48,-3.5,.48,2.55,'antenna-support');
  const dish=mesh(g,new THREE.SphereGeometry(1.50,20,12,0,Math.PI*2,0,Math.PI*.35),mat.white,[-5,9.79,-3.5]);dish.rotation.z=-.5;
  box(g,mat.gold,3.7,7.68,-2.4,3.2,.88,2.7,'thermal-module');
  for(const x of [-4,0,4])box(g,mat.silver,x,7.42,4.4,2.7,.3,.8);
  return g;
}

export function createAirlock(mat) {
  const g=new THREE.Group();g.name='airlock';
  box(g,mat.silver,-2.3,2.43,0,.2,4.86,7.04);
  for(const z of [-3.4,3.4])box(g,mat.silver,0,2.43,z,4.8,4.86,.2);
  box(g,mat.silver,0,4.75,0,4.8,.22,7.04);
  box(g,mat.dark,0,.2,0,4.8,.4,7.04,'chamber-floor');
  const door=new THREE.Group();g.add(door);door.name='outer-hatch';
  box(door,mat.white,2.43,2.2,0,.11,3.51,3.8,'airlock-door');
  box(door,mat.dark,2.52,2.2,0,.10,2.8,2.7);
  const light=box(door,mat.cyan,2.6,3.28,0,.10,.16,2.6);
  box(g,mat.dark,2.6,2.1,2.6,.16,3,.6,'pressure-gauge');
  const pressure=new THREE.Group();pressure.position.set(2.7,.7,2.6);g.add(pressure);box(pressure,mat.cyan,0,1.4,0,.12,2.8,.38,'pressure-column');
  box(g,mat.silver,3.07,.13,0,1.1,.27,3.5);
  g.userData={door,light,pressure};
  return g;
}

export function createSolar(mat, hx=.8, hy=.43) {
  const g=new THREE.Group();g.name='solar-array';
  const w=hx*16,d=hy*16;
  for(const x of [-w*.31,w*.31])for(const z of [-d*.32,d*.32])cylinder(g,mat.silver,x,1.38,z,.095,2.8);
  const pivot=new THREE.Group();pivot.position.y=4.2;pivot.rotation.order='YXZ';g.add(pivot);pivot.name='array-gimbal';
  cylinder(g,mat.silver,0,3.5,0,.3,1.5);
  box(pivot,mat.silver,0,0,0,w,.16,d);
  box(pivot,mat.blue,0,.11,0,w-.18,.08,d-.18,'photovoltaic-surface');
  for(let i=0;i<=8;i++)box(pivot,mat.silver,-w/2+.18+i*(w-.36)/8,.17,0,.035,.03,d-.16);
  for(let i=0;i<=4;i++)box(pivot,mat.silver,0,.17,-d/2+.18+i*(d-.36)/4,w-.16,.03,.035);
  g.userData={pivot};
  return g;
}

export function createTrainingBench(mat){
  const g=new THREE.Group();g.name='sample-laboratory';
  box(g,mat.silver,0,2.7,0,7.8,.3,5.6,'lab-worktop');
  for(const x of [-3.3,3.3])for(const z of [-2.2,2.2])cylinder(g,mat.silver,x,1.35,z,.13,2.7);
  box(g,mat.dark,-2.6,3.05,-1.5,1.8,.6,1.4,'site-record-console');
  const canister=new THREE.Group();canister.position.set(.6,2.85,0);g.add(canister);
  cylinder(canister,mat.gold,0,.75,0,.7,1.5,'sample-canister');
  const lid=new THREE.Group();lid.position.set(0,1.5,-.7);canister.add(lid);cylinder(lid,mat.silver,0,.08,.7,.75,.16,'canister-lid');
  const identity=sphere(canister,mat.amber,0,.85,.72,.12);
  box(g,mat.dark,2.9,3.25,-1.2,1.2,.9,2.2,'storage-rack');
  g.userData={canister,lid,identity};return g;
}

export function createRelay(mat) {
  const g=new THREE.Group();g.name='surface-relay';
  box(g,mat.dark,0,.3,0,6.4,.6,6.4,'relay-base');
  box(g,mat.gold,0,1.7,0,3.6,2.8,3.6,'electronics-box');
  for(const s of [-1,1])for(const z of [-1,1])beam(g,mat.silver,[s*2.6,.4,z*2.6],[0,6.4,0],.16);
  cylinder(g,mat.silver,0,5.7,0,.19,8.1,'mast');
  const tilt=new THREE.Group();tilt.position.set(0,10,0);tilt.rotation.order='YXZ';tilt.rotation.x=.47;g.add(tilt);
  const bowl=mat.white.clone();bowl.side=THREE.DoubleSide;
  const dish=mesh(tilt,new THREE.SphereGeometry(2.90,32,16,0,Math.PI*2,0,Math.PI*.40),bowl);dish.rotation.x=Math.PI;
  const rim=mesh(tilt,new THREE.TorusGeometry(2.76,.09,8,36),mat.silver,[0,-.90,0]);rim.rotation.x=Math.PI/2;
  beam(tilt,mat.silver,[0,-2.5,0],[0,.8,0],.065);sphere(tilt,mat.gold,0,.86,0,.20);
  box(g,mat.dark,0,1.8,1.83,2.7,1.6,.10);const lamp=sphere(g,mat.amber,.80,2.25,1.94,.15);
  g.userData={dish:tilt,lamp};return g;
}

export function createTank(mat) {
  const g=new THREE.Group();g.name='storage-tank';
  cylinder(g,mat.silver,0,2.3,0,2.1,4.6);sphere(g,mat.silver,0,4.6,0,2.1,[1,.38,1]);
  cylinder(g,mat.orange,0,2.7,0,2.14,.25);cylinder(g,mat.dark,0,.25,0,2.65,.5);
  beam(g,mat.gold,[2,1.4,0],[3.2,1.4,0],.10);return g;
}

export function createSatellite(mat) {
  const g=new THREE.Group();g.name='cinematic-orbiter';
  box(g,mat.gold,0,0,0,2.4,2.7,2.4);
  for(const s of [-1,1]) { box(g,mat.silver,s*4.25,0,0,5.4,.14,3.3);box(g,mat.blue,s*4.25,.12,0,5.1,.07,3.0);for(let i=0;i<6;i++)box(g,mat.silver,s*1.8+s*i*.89,.17,0,.03,.03,3); }
  cylinder(g,mat.white,0,1.8,0,1.25,.35);beam(g,mat.silver,[0,2,0],[0,3.2,0],.04);return g;
}

export function createLander(mat){
  const g=new THREE.Group();g.name='cinematic-lunar-lander';
  cylinder(g,mat.foil,0,3.4,0,3.3,2.5,'descent-stage');
  cylinder(g,mat.dark,0,2.06,0,.72,1.35,'engine-bell');
  const cabin=mesh(g,new THREE.CylinderGeometry(2.5,2.9,3.6,8),mat.silver,[0,6.2,0]);
  cabin.rotation.y=Math.PI/8;
  box(g,mat.glass,-.75,6.7,2.57,1.08,.82,.08,'pilot-window');box(g,mat.glass,.75,6.7,2.57,1.08,.82,.08,'pilot-window');
  box(g,mat.white,0,5.55,2.87,1.6,1.45,.14,'crew-hatch');box(g,mat.orange,0,5.2,2.96,1.3,.15,.06);
  const legs=[];
  for(let i=0;i<4;i++){
    const a=Math.PI/4+i*Math.PI/2,x=Math.cos(a),z=Math.sin(a),leg=new THREE.Group();g.add(leg);legs.push(leg);
    beam(leg,mat.silver,[x*2.8,4,z*2.8],[x*5.3,.32,z*5.3],.16);
    beam(leg,mat.dark,[x*2.9,2.4,z*2.9],[x*4.5,1.3,z*4.5],.12);
    cylinder(leg,mat.silver,x*5.3,.16,z*5.3,1.08,.26,'landing-foot');
    box(g,mat.dark,x*3.3,3.6,z*3.3,.68,.46,.68,'attitude-thruster');
  }
  for(let i=0;i<8;i++)beam(g,mat.silver,[-.65,5.2-i*.48,3.2],[.65,5.2-i*.48,3.2],.06);
  for(const x of [-.75,.75])beam(g,mat.silver,[x,5.6,3.2],[x,.4,3.2],.045);
  beam(g,mat.silver,[1.4,7.8,-.8],[1.4,10.1,-.8],.06);sphere(g,mat.white,1.4,10.1,-.8,.45,[1,.28,1]);
  g.userData={legs};return g;
}

export function createSurvey(mat) {
  const g=new THREE.Group();g.name='survey-instrument';
  cylinder(g,mat.silver,0,.77,0,.13,1.5);box(g,mat.white,0,1.6,0,.95,.9,.75);sphere(g,mat.cyan,0,2.13,0,.16);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam(g,mat.silver,[0,.8,0],[Math.cos(a)*.9,0,Math.sin(a)*.9],.05);}return g;
}
