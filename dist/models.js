import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function makeMaterials() {
  const material = (color, roughness = .7, metalness = .1, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, depthTest: true, depthWrite: true, ...extra });
  return {
    suit: material('#f4f3ee', .82, 0), dark: material('#202731', .66), silver: material('#bac2ca', .28, .78),
    white: material('#dce0df', .48, .16), orange: material('#d66b36', .5, .22),
    gold: material('#c89438', .17, .90), blue: material('#142e50', .32, .47),
    foil: material('#b49b61', .56, .72),
    glass: material('#1f405b', .18, .76), black: material('#101317', .87),
    cyan: material('#7be8db', .35, .1, {emissive:'#43bba8', emissiveIntensity:1.2}),
    amber: material('#ee914f', .3, .1, {emissive:'#ea6431', emissiveIntensity:.8}),
    rock: material('#686b70', .98), regolith: material('#828589', 1)
  };
}

export function roundedBox(w,h,d){return new RoundedBoxGeometry(w,h,d,2,Math.min(.09,w*.12,h*.12,d*.12));}
export function applyMaterialDetail(mat,textures){
  if(!textures)return;
  mat.suit.map=textures.fabric;mat.suit.bumpMap=textures.weave;mat.suit.bumpScale=.008;
  mat.silver.bumpMap=textures.brushed;mat.silver.bumpScale=.0025;
  mat.foil.bumpMap=textures.foil;mat.foil.bumpScale=.035;mat.foil.roughnessMap=textures.foil;
  for(const name of ['silver','white','gold','glass','foil','blue']){mat[name].envMap=textures.reflections;mat[name].envMapIntensity=name==='gold'||name==='glass'?.65:.28;}
}

export function mesh(parent, geometry, material, position = [0,0,0], scale = null, name = '') {
  const m = new THREE.Mesh(geometry, material); m.position.set(...position);
  if (scale) m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = true; m.name = name; parent.add(m); return m;
}
const box = (p,m,x,y,z,w,h,d,name='') => mesh(p,roundedBox(w,h,d),m,[x,y,z],null,name);
const sphere = (p,m,x,y,z,r,s=null,name='') => mesh(p,new THREE.SphereGeometry(r,40,24),m,[x,y,z],s,name);
const cylinder = (p,m,x,y,z,r,h,name='') => mesh(p,new THREE.CylinderGeometry(r,r,h,32),m,[x,y,z],null,name);
function beam(p,m,a,b,r=.065) {
  const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), dir=end.clone().sub(start);
  const rod=mesh(p,new THREE.CylinderGeometry(r,r,dir.length(),8),m,start.clone().add(end).multiplyScalar(.5).toArray());
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return rod;
}

// Suit accents: each crew member wears a white suit with bold panels in their own colour,
// so they are easy to tell apart and the suit reads clearly on grey regolith and red dust.
export const SUIT_ACCENTS={player:'#ff6a2b',botanist:'#22c47e',engineer:'#ffc21a',scientist:'#2f9bff',mentor:'#a66bff'};
function suitAccent(mat,color){
  mat.suitAccents ||= new Map();
  if(!mat.suitAccents.has(color))mat.suitAccents.set(color,new THREE.MeshStandardMaterial({color,roughness:.46,metalness:.08,emissive:color,emissiveIntensity:.06}));
  return mat.suitAccents.get(color);
}
export function createAstronaut(mat,{accent=SUIT_ACCENTS.player}={}) {
  const trim=suitAccent(mat,accent);
  const group=new THREE.Group();group.name='astronaut';
  const body=new THREE.Group();group.add(body);body.name='suit-body';
  mesh(body,new THREE.CapsuleGeometry(.69,.95,10,32),mat.suit,[0,2.65,0],[1,1,.74]);
  box(body,mat.dark,0,2.95,.51,1.05,.59,.15,'chest-console');
  box(body,trim,0,3.05,.60,.5,.11,.07);
  for(let i=0;i<3;i++)sphere(body,mat.cyan,-.32+i*.32,2.79,.61,.044);
  box(body,mat.white,0,2.7,-.69,1.28,1.73,.67,'life-support-pack');
  box(body,trim,0,3.35,-1.03,1.08,.14,.05);
  for(let i=0;i<4;i++)box(body,mat.dark,0,2.30+i*.17,-1.04,.90,.07,.05);
  cylinder(body,mat.dark,0,3.63,0,.51,.23,'helmet-collar');
  const helmet=new THREE.Group();helmet.position.y=4.28;helmet.scale.setScalar(.82);helmet.name='helmet-pivot';body.add(helmet);
  sphere(helmet,mat.suit,0,0,0,.93,[1,1,.91],'helmet-shell');
  const visor=sphere(helmet,mat.gold,0,-.03,.56,.74,[.97,.70,.49],'gold-visor');
  const rim=mesh(helmet,new THREE.TorusGeometry(.74,.026,8,56),mat.dark,[0,-.03,.57],[.98,.71,1],'visor-seal');
  // The visor is an opaque depth-writing curved mesh, never a screen overlay.
  box(helmet,trim,0,.42,.47,1.10,.10,.21);
  for(const side of [-1,1])box(helmet,trim,side*.66,.32,-.05,.08,.42,.7,'helmet-side-stripe');
  for(const sign of [-1,1]) {
    sphere(helmet,mat.silver,sign*.87,-.03,0,.18,[.7,1,1]);
    const arm=new THREE.Group();arm.position.set(sign*.85,3.18,0);body.add(arm);arm.name=sign<0?'left-arm':'right-arm';
    sphere(arm,trim,0,.02,0,.3,[1,.72,1],'shoulder-cap');cylinder(arm,trim,0,-.3,0,.24,.13,'upper-arm-band');
    cylinder(arm,mat.suit,0,-.46,0,.23,.90);sphere(arm,mat.dark,0,-.92,0,.22);
    const elbow=new THREE.Group();elbow.position.y=-.92;elbow.name=sign<0?'left-elbow':'right-elbow';arm.add(elbow);
    const forearm=cylinder(elbow,mat.suit,0,-.38,.08,.20,.63);forearm.rotation.x=-.13;
    cylinder(elbow,trim,0,-.61,.10,.215,.11);sphere(elbow,mat.suit,0,-.82,.11,.235,[1,1.25,1]);
    for(let i=0;i<4;i++)box(elbow,mat.suit,-.12+i*.08,-1.01,.21,.075,.20,.14,'glove-finger');
    for(let i=0;i<5;i++){const fold=mesh(elbow,new THREE.TorusGeometry(.205,.018,6,32),mat.dark,[0,-.035-i*.055,.02],null,'elbow-flex-ring');fold.rotation.x=Math.PI/2;}
    if(sign<0){box(elbow,mat.dark,0,-.49,.27,.32,.34,.08,'wrist-computer');box(elbow,mat.cyan,0,-.49,.315,.23,.22,.018,'wrist-display');}
    const leg=new THREE.Group();leg.position.set(sign*.37,1.96,0);group.add(leg);leg.name=sign<0?'left-leg':'right-leg';
    cylinder(leg,mat.suit,0,-.44,0,.29,.81);cylinder(leg,trim,0,-.34,0,.302,.2,'thigh-band');box(leg,trim,sign*.17,-.5,.2,.1,.46,.1,'thigh-stripe');sphere(leg,mat.dark,0,-.9,0,.24);
    const knee=new THREE.Group();knee.position.y=-.9;knee.name=sign<0?'left-knee':'right-knee';leg.add(knee);
    cylinder(knee,mat.suit,0,-.4,0,.25,.61);box(knee,mat.dark,0,-.91,.16,.58,.30,.93,'boot');
    for(let i=0;i<4;i++){const fold=mesh(knee,new THREE.TorusGeometry(.245,.018,6,32),mat.dark,[0,-.02-i*.06,0],null,'knee-flex-ring');fold.rotation.x=Math.PI/2;}
    box(knee,trim,0,-.70,.20,.56,.12,.49);
    for(let i=0;i<4;i++)box(knee,mat.silver,0,-1.063,-.16+i*.20,.52,.014,.055,'boot-tread');
    sphere(knee,trim,0,-.06,.17,.19,[1,1,.55],'knee-cap');box(knee,trim,0,-.98,.55,.5,.16,.16,'toe-cap');
  }
  beam(body,mat.gold,[-.62,2.42,.47],[-.95,2.0,-.15],.045);
  const hose=new THREE.CatmullRomCurve3([new THREE.Vector3(.43,2.45,.58),new THREE.Vector3(.74,2.05,.45),new THREE.Vector3(.84,2.12,-.3),new THREE.Vector3(.55,2.5,-.7)]);mesh(body,new THREE.TubeGeometry(hose,28,.043,10,false),mat.dark,[0,0,0],null,'life-support-hose');
  for(const sign of [-1,1]){
    const seam=mesh(body,new THREE.TorusGeometry(.71,.022,5,24),mat.dark,[0,2.34+sign*.42,0],[1,1,.75],'suit-seam');seam.rotation.x=Math.PI/2;
  }
  group.userData={body,visor,helmet,arms:[body.getObjectByName('left-arm'),body.getObjectByName('right-arm')],elbows:[body.getObjectByName('left-elbow'),body.getObjectByName('right-elbow')],legs:[group.getObjectByName('left-leg'),group.getObjectByName('right-leg')],knees:[group.getObjectByName('left-knee'),group.getObjectByName('right-knee')]};
  return group;
}

export function createRover(mat,world='moon') {
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
  // Instrument mast, exposed rocker links and sampling arm echo the references.
  for(const sign of [-1,1]){beam(g,mat.dark,[sign*2.3,1.55,-1.52],[sign*2.3,1.8,0],.10);beam(g,mat.silver,[sign*2.3,1.8,0],[sign*2.3,1.15,1.52],.10);}
  box(g,mat.foil,0,1.72,-2.48,2.8,.52,.66,'insulated-instrument-bay');
  const arm=new THREE.Group();arm.name='robotic-sampling-arm';g.add(arm);beam(arm,mat.silver,[1.6,1.2,1.8],[1.75,1.55,2.5],.10);beam(arm,mat.white,[1.75,1.55,2.5],[.65,1.0,2.7],.11);cylinder(arm,mat.silver,.65,.86,2.7,.22,.3,'sampling-tool');
  if(world==='mars'){
    const mast=new THREE.Group();mast.name='martian-science-mast';g.add(mast);beam(mast,mat.silver,[.8,2.8,.5],[.8,3.6,.5],.095);box(mast,mat.white,.8,3.72,.5,1.15,.42,.48,'stereo-mast-head');for(const x of [.48,1.1]){const lens=cylinder(mast,mat.dark,x,3.72,.79,.13,.12,'stereo-camera-lens');lens.rotation.x=Math.PI/2;}box(g,mat.dark,-.5,2.82,-.55,1.0,.25,.9,'spectrometer');
  }else{
    for(const x of [-.6,.6])cylinder(g,mat.silver,x,1.8,-2.4,.24,.63,'lunar-sample-container');
  }
  g.userData={wheels,beacon};return g;
}

export function createHabitat(mat,world='moon') {
  const g=new THREE.Group();g.name='haven-habitat';
  const mars=world==='mars',shell=mars?mat.white:mat.suit;
  for(const z of [-2.65,2.65]){
    const pod=new THREE.Group();pod.position.set(0,3.3,z);g.add(pod);pod.name=mars?'rigid-mars-pressure-module':'ribbed-lunar-inflatable-module';
    const skin=mesh(pod,new THREE.CapsuleGeometry(2.1,7.1,12,40),shell,[0,0,0],null,'pressure-shell');skin.rotation.z=Math.PI/2;
    for(let i=0;i<=20;i++){const ring=mesh(pod,new THREE.TorusGeometry(2.115,mars?.026:.075,7,40),mars?mat.silver:mat.white,[-3.55+i*.355,0,0],null,'reinforced-module-rib');ring.rotation.y=Math.PI/2;}
    for(const x of [-5.68,5.68]){const end=mesh(pod,new THREE.CylinderGeometry(.93,.93,.32,32),mat.silver,[x,0,0],null,'end-pressure-port');end.rotation.z=Math.PI/2;const hatch=mesh(pod,new THREE.CylinderGeometry(.73,.73,.08,32),mat.dark,[x*1.034,0,0],null,'sealed-port');hatch.rotation.z=Math.PI/2;}
    for(const x of [-3.2,0,3.2]){
      const collar=mesh(pod,new THREE.TorusGeometry(.49,.065,8,32),mat.silver,[x,.38,z<0?-2.145:2.145],null,'window-pressure-seal');
      const window=mesh(pod,new THREE.CircleGeometry(.45,32),mat.glass,[x,.38,z<0?-2.163:2.163],null,'module-window');if(z<0){collar.rotation.y=Math.PI;window.rotation.y=Math.PI;}
    }
    box(g,mat.silver,0,1.08,z,12.2,.18,4.65,'module-cradle');
    for(const x of [-4.8,4.8])for(const side of [-1,1]){cylinder(g,mat.silver,x,.55,z+side*1.6,.16,1.1,'adjustable-landing-support');cylinder(g,mat.dark,x,.075,z+side*1.6,.43,.15,'dust-foot');}
    if(mars){for(const x of [-3.4,0,3.4])box(g,mat.orange,x,5.28,z,1.65,.12,1.2,'mars-thermal-shield');}
  }
  const cross=mesh(g,new THREE.CylinderGeometry(.91,.91,5.6,32),mat.silver,[3.6,2.35,0],null,'inter-module-tunnel');cross.rotation.x=Math.PI/2;
  const neck=mesh(g,new THREE.CylinderGeometry(1.06,1.06,4.6,32),mat.white,[6.1,2.35,0],null,'airlock-connection');neck.rotation.z=Math.PI/2;
  for(const x of [4.1,5.2,6.3,7.4,8.25]){const ring=mesh(g,new THREE.TorusGeometry(1.08,.06,8,32),mat.silver,[x,2.35,0],null,'connector-seal');ring.rotation.y=Math.PI/2;}
  box(g,mat.gold,-4.2,1.45,0,2.7,.9,1.5,'thermal-control-package');
  cylinder(g,mat.silver,-4.1,6.2,-2.65,.08,2.3,'communications-mast');
  const dish=mesh(g,new THREE.SphereGeometry(.85,24,12,0,Math.PI*2,0,Math.PI*.35),mat.white,[-4.1,7.45,-2.65]);dish.rotation.z=-.55;
  for(const x of [-3.5,0,3.5])box(g,mat.silver,x,5.53,-2.65,1.8,.08,.85,'radiator-panel');
  g.userData.world=world;
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
  for(let i=0;i<8;i++){const a=i*Math.PI/4,panel=box(g,i%2?mat.white:mat.dark,Math.sin(a)*2.68,6.12,Math.cos(a)*2.68,1.78,2.70,.055,'cabin-thermal-panel');panel.rotation.set(-.10,a,0,'YXZ');}
  for(const x of [-.75,.75])box(g,mat.dark,x,6.7,2.60,1.24,.99,.14,'pilot-window-bezel');
  box(g,mat.glass,-.75,6.7,2.69,1.08,.82,.08,'pilot-window');box(g,mat.glass,.75,6.7,2.69,1.08,.82,.08,'pilot-window');
  box(g,mat.white,0,5.55,2.87,1.6,1.45,.14,'crew-hatch');box(g,mat.orange,0,5.2,2.96,1.3,.15,.06);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,panel=box(g,mat.foil,Math.sin(a)*3.17,3.4,Math.cos(a)*3.17,2.32,2.23,.12,'descent-thermal-blanket');panel.rotation.y=a;for(const y of [2.32,4.48]){const rail=box(g,mat.dark,Math.sin(a)*3.25,y,Math.cos(a)*3.25,2.34,.05,.04,'blanket-retaining-rail');rail.rotation.y=a;}}
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
