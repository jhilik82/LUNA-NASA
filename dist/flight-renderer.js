import * as THREE from 'three';
import { makeMaterials, applyMaterialDetail, roundedBox, mesh, createAstronaut, createLander } from './models.js';
import { globe, atmosphere } from './celestial.js';
import { vectorAt, WORLDS } from './voyage.js';
import { ScientificSky } from './scientific-sky.js';
import { exposureProfile, unit, add, length, DEG, v as av } from './astronomy-world.js';
import { clamp, randomGenerator } from './engine.js';
import { LandingScene, SURFACE_APPROACH_PHASES } from './landing-scene.js';
import { WeatherEffects } from './weather.js';
const V=THREE.Vector3;
const performanceNow=()=>globalThis.performance?.now?.()??Date.now();
const box=(p,m,pos,size,name='')=>mesh(p,roundedBox(...size),m,pos,null,name);
export const CREW_ENTRY={floorY:25.125,ceilingY:27.25,halfAngle:.36,startX:-13,endX:-.65,z:0};
export const LAUNCH_COAST={halfExtent:850,shoreZ:-320,seaY:-.045};
function beam(g,m,a,b,r=.12){const x=new V(...a),y=new V(...b),d=y.clone().sub(x);const rod=mesh(g,new THREE.CylinderGeometry(r,r,d.length(),12),m,x.add(y).multiplyScalar(.5).toArray());rod.quaternion.setFromUnitVectors(new V(0,1,0),d.normalize());return rod;}
function createCrewHatch(ship,hull,mat){
 const e=CREW_ENTRY,radius=y=>2.9-(y-23.5)*.31,wall=new THREE.Group();wall.name='command-capsule';ship.add(wall);
 for(const [bottom,top,cut] of [[23.5,e.floorY,false],[e.floorY,e.ceilingY,true],[e.ceilingY,28.5,false]])mesh(wall,new THREE.CylinderGeometry(radius(top),radius(bottom),top-bottom,96,1,true,cut?-Math.PI/2+e.halfAngle:0,cut?Math.PI*2-e.halfAngle*2:Math.PI*2),hull,[0,(top+bottom)/2,0],null,'capsule-pressure-shell');
 const point=(y,theta)=>new V(Math.sin(theta)*radius(y),y,Math.cos(theta)*radius(y)),left=-Math.PI/2-e.halfAngle,right=-Math.PI/2+e.halfAngle;
 for(const a of [left,right])beam(ship,mat.silver,point(e.floorY,a).toArray(),point(e.ceilingY,a).toArray(),.045);
 for(const y of [e.floorY,e.ceilingY]){const ring=mesh(ship,new THREE.TorusGeometry(radius(y),.04,8,24,e.halfAngle*2),mat.silver,[0,y,0],null,'crew-hatch-frame');ring.rotation.set(Math.PI/2,0,Math.PI-e.halfAngle);}
 const hinge=point(e.floorY,left),axis=point(e.ceilingY,left).sub(hinge).normalize(),pivot=new THREE.Group();pivot.name='crew-hatch-door';pivot.position.copy(hinge);ship.add(pivot);
 const doorGeometry=new THREE.CylinderGeometry(radius(e.ceilingY),radius(e.floorY),e.ceilingY-e.floorY,20,1,true,left,e.halfAngle*2);doorGeometry.translate(-hinge.x,(e.floorY+e.ceilingY)/2-hinge.y,-hinge.z);
 const doorMaterial=hull.clone();doorMaterial.side=THREE.FrontSide;mesh(pivot,doorGeometry,doorMaterial,[0,0,0],null,'hinged-pressure-door');
 // The door has real thickness: grey inner liner, metal edge trim, a porthole and a handle.
 const linerGeometry=new THREE.CylinderGeometry(radius(e.ceilingY)-.09,radius(e.floorY)-.09,e.ceilingY-e.floorY,20,1,true,left,e.halfAngle*2);linerGeometry.translate(-hinge.x,(e.floorY+e.ceilingY)/2-hinge.y,-hinge.z);
 mesh(pivot,linerGeometry,new THREE.MeshStandardMaterial({color:'#6b747b',roughness:.62,metalness:.25,side:THREE.BackSide}),[0,0,0],null,'door-inner-liner');
 const local=(y,theta,inset=.045)=>{const r=radius(y)-inset;return new V(Math.sin(theta)*r,y,Math.cos(theta)*r).sub(hinge).toArray();};
 for(const a of [left,right])beam(pivot,mat.silver,local(e.floorY,a),local(e.ceilingY,a),.05);
 for(const y of [e.floorY,e.ceilingY]){const trim=mesh(pivot,new THREE.TorusGeometry(radius(y)-.045,.05,6,20,e.halfAngle*2),mat.silver,new V(0,y,0).sub(hinge).toArray(),null,'door-edge-trim');trim.rotation.set(Math.PI/2,0,Math.PI-e.halfAngle);}
 const midY=(e.floorY+e.ceilingY)/2+.25,normal=new V(-1,.31,0).normalize(),port=new THREE.Group();port.position.set(...local(midY,-Math.PI/2,-.02));port.quaternion.setFromUnitVectors(new V(0,1,0),normal);pivot.add(port);
 mesh(port,new THREE.CylinderGeometry(.24,.24,.16,32),mat.glass,[0,0,0],null,'door-porthole');const ring=mesh(port,new THREE.TorusGeometry(.25,.045,10,32),mat.silver,[0,.06,0],null,'door-porthole-frame');ring.rotation.x=Math.PI/2;
 const handle=box(pivot,mat.dark,local(e.floorY+.95,right-.12,-.06),[.08,.42,.08],'door-handle');handle.rotation.y=right;
 const cabin=new THREE.Group();cabin.name='capsule-entry-interior';ship.add(cabin);box(cabin,mat.dark,[-1.3,e.floorY-.055,0],[2.5,.11,1.75],'entry-floor');box(cabin,mat.dark,[.30,26.10,0],[.12,2.05,2.45],'entry-inner-bulkhead');
 for(const z of [-1,1])box(cabin,mat.dark,[-.5,26.10,z],[1.5,2.05,.10],'entry-side-wall');
 box(cabin,mat.cyan,[.21,26.55,0],[.018,.16,.35],'entry-interior-indicator');const light=new THREE.PointLight('#edf4fa',16,4,2);light.position.set(-1.0,26.7,0);cabin.add(light);
 ship.userData.crewHatch={pivot,axis,floorY:e.floorY,ceilingY:e.ceilingY,radius};
}
export function createSpaceship(mat,createCanvas=null){
 const g=new THREE.Group();g.name='odyssey-transport';
 const hull=mat.white.clone();hull.roughness=.42;hull.metalness=.24;
 if(createCanvas){const canvas=createCanvas(1024,1024),ctx=canvas.getContext('2d');ctx.fillStyle='#e3e6e7';ctx.fillRect(0,0,1024,1024);ctx.strokeStyle='#a6afb5';ctx.lineWidth=1;for(let y=80;y<1024;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}for(let x=0;x<1024;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();}ctx.fillStyle='#253c4e';ctx.fillRect(0,730,1024,8);ctx.font='bold 46px sans-serif';ctx.textAlign='center';ctx.fillText('ODYSSEY',256,515);ctx.fillText('ODYSSEY',768,515);ctx.font='18px monospace';ctx.fillStyle='#465765';ctx.fillText('LUNA / CREW TRANSPORT',256,548);ctx.fillText('LUNA / CREW TRANSPORT',768,548);ctx.fillStyle='#b88552';ctx.fillRect(122,398,268,10);ctx.fillRect(634,398,268,10);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;hull.map=texture;}
 mesh(g,new THREE.CylinderGeometry(2.9,3.1,19,96),hull,[0,14,0],null,'pressure-hull');
 const capsuleHull=hull.clone();capsuleHull.map=null;capsuleHull.roughness=.34;createCrewHatch(g,capsuleHull,mat);
 const nose=[new THREE.Vector2(1.35,0),new THREE.Vector2(1.28,.5),new THREE.Vector2(1.08,1.2),new THREE.Vector2(.79,1.85),new THREE.Vector2(.43,2.45),new THREE.Vector2(.15,2.84),new THREE.Vector2(0,3.0)];mesh(g,new THREE.LatheGeometry(nose,96),capsuleHull,[0,28.5,0],null,'rounded-capsule-nose');
 for(const y of [5,9,14,19,23.5]){const ring=mesh(g,new THREE.TorusGeometry(3,.09,8,64),mat.silver,[0,y,0]);ring.rotation.x=Math.PI/2;}
 for(let i=0;i<8;i++){if(i===6)continue;const a=i*Math.PI/4,window=box(g,mat.glass,[Math.sin(a)*2.50,25,Math.cos(a)*2.50],[.8,1.1,.10],'capsule-window');window.rotation.set(-Math.atan(.31),a,0,'YXZ');const frame=box(g,mat.silver,[Math.sin(a)*2.475,25,Math.cos(a)*2.475],[.96,1.25,.08],'capsule-window-frame');frame.rotation.set(-Math.atan(.31),a,0,'YXZ');}
 for(let i=0;i<16;i++){const a=i*Math.PI/8;beam(g,mat.silver,[Math.sin(a)*3.12,4.5,Math.cos(a)*3.12],[Math.sin(a)*3.12,6.4,Math.cos(a)*3.12],.045);}
 for(const x of [-1,1]){beam(g,mat.silver,[x*2.95,7,.8],[x*2.95,21,.8],.045);}
 for(const sign of [-1,1]){
  mesh(g,new THREE.CylinderGeometry(.9,1.1,13,32),mat.white,[sign*4.1,8.5,0]);mesh(g,new THREE.ConeGeometry(.9,3,32),mat.white,[sign*4.1,16.5,0]);mesh(g,new THREE.CylinderGeometry(.8,1.25,1.8,32,1,true),mat.dark,[sign*4.1,1.1,0]);
  beam(g,mat.silver,[sign*2.8,5,0],[sign*4.1,5,0]);beam(g,mat.silver,[sign*2.8,12,0],[sign*4.1,12,0]);
 }
 mesh(g,new THREE.CylinderGeometry(1.4,2.3,3,40,1,true),mat.dark,[0,3,0],null,'engine-bell');
 for(let i=0;i<6;i++){const a=i*Math.PI/3;beam(g,mat.silver,[Math.sin(a)*2.7,5,Math.cos(a)*2.7],[Math.sin(a)*5.8,0,Math.cos(a)*5.8]);}
 g.userData.flames=[];
 for(const x of [0,-4.1,4.1]){
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},air:{value:1}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
    varying vec2 uv0;uniform float time;uniform float air;
    void main(){float axial=uv0.y,noise=.80+.20*sin(uv0.x*43.+axial*57.-time*25.);float fade=pow(axial,1.4)*noise;vec3 blue=mix(vec3(.12,.32,.9),vec3(.86,.96,1.),pow(axial,4.));vec3 hot=mix(vec3(.75,.12,.015),vec3(1.,.91,.6),pow(axial,2.));gl_FragColor=vec4(mix(blue,hot,air)*1.6,fade*.72);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
  const flame=mesh(g,new THREE.CylinderGeometry(x===0?1.35:.65,x===0?2.6:1.2,14,32,8,true),material,[x,x===0?-5.5:-6.8,0],null,'engine-plume');flame.castShadow=false;g.userData.flames.push(flame);
 }
 return g;
}
export class FlightRenderer{
 constructor(renderer,simulation,data){
  this.r=renderer;this.sim=simulation;this.data=data;this.mat=makeMaterials();applyMaterialDetail(this.mat,renderer.materialTextures);this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#07101d');this.camera=new THREE.PerspectiveCamera(52,1,.035,20000);this.ray=new THREE.Raycaster();this.lookYaw=0;this.lookPitch=0;this.pilotView=false;
  this.ambient=new THREE.HemisphereLight('#c6d9ec','#302e24',1.0);this.scene.add(this.ambient);this.sun=new THREE.DirectionalLight('#fff4de',3.3);this.sun.position.set(-120,180,-90);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:.1,far:550});this.sun.shadow.bias=-.000025;this.sun.shadow.normalBias=.015;this.scene.add(this.sun,this.sun.target);
  this.pad=new THREE.Group();this.scene.add(this.pad);this.buildPad();
  this.ship=createSpaceship(this.mat,renderer.createCanvas);this.scene.add(this.ship);
  this.cadet=createAstronaut(this.mat);this.cadet.scale.setScalar(.35);this.scene.add(this.cadet);
  this.cockpit=new THREE.Group();this.cockpit.position.x=5000;this.scene.add(this.cockpit);this.buildCockpit();if(simulation.world)this.cockpit.scale.setScalar(.35);
  this.earth=globe('Earth',1100,renderer.createCanvas,data);this.earth.position.set(-900,-1090,-1250);this.scene.add(this.earth);
  this.moon=globe('Moon',450,renderer.createCanvas,data);this.mars=globe('Mars',700,renderer.createCanvas,data);this.scene.add(this.moon,this.mars);this.moon.visible=this.mars.visible=false;
  this.lander=createLander(this.mat);this.scene.add(this.lander);this.lander.visible=false;
  this.surfaceLanding=new LandingScene(this);
  const rng=randomGenerator(855),points=[];for(let i=0;i<3000;i++){const a=rng()*Math.PI*2,y=rng()*2-1,r=Math.sqrt(1-y*y);points.push(Math.sin(a)*r*9000,y*9000,Math.cos(a)*r*9000);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));this.stars=new THREE.Points(geo,new THREE.PointsMaterial({color:'#c2c9d2',size:3,depthWrite:false}));this.scene.add(this.stars);
  if(simulation.world){this.sharedSky=new ScientificSky({scene:this.scene,camera:this.camera,createCanvas:renderer.createCanvas,world:simulation.world,getView:()=>this.flightSkyView()});}
  this.dust=[];for(let i=0;i<90;i++){const m=mesh(this.scene,new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#b5a792',transparent:true,opacity:.3,depthWrite:false}),[0,0,0],null,'exhaust-condensation');m.castShadow=false;this.dust.push({mesh:m,seed:rng()});}
  this.buildCruiseBackdrop();this.buildBusHardware();
  // Weather at the launch site, and the solar wind during the cruise.
  this.padWeather=new WeatherEffects(this.scene,{scale:1,place:'earth'});this.spaceWeather=new WeatherEffects(this.scene,{scale:6,place:'space'});
  // Space bodies and the shared sky never take on launch-site haze.
  for(const g of [this.earth,this.moon,this.mars,this.windowEarth,this.stars,this.sharedSky?.group].filter(Boolean))g.traverse(o=>{if(o.material)for(const m of [].concat(o.material))m.fog=false;});
 }
 flightSkyView(){
  const world=this.sim.world,observer=this.sim.observerState(),orbital=this.sim.telemetry().altitudeM>10000||observer.world==='space',bodies=Object.keys(world.data.bodies).filter(n=>n!==observer.host||orbital).map(n=>({...world.apparent(n,observer),visible:true})),sun=bodies.find(x=>x.name==='Sun');
  for(const b of bodies){if(!orbital)b.visible=b.altitude+b.diameterDeg/2>=0;for(const other of bodies){if(other.name===b.name||other.distanceKm>=b.distanceKm)continue;const separation=Math.acos(clamp(b.icrf.x*other.icrf.x+b.icrf.y*other.icrf.y+b.icrf.z*other.icrf.z,-1,1))/DEG;if(separation+b.diameterDeg/2<other.diameterDeg/2)b.visible=false;}}
  return {observer,bodies,sun,orbital,dust:observer.world==='mars'&&!orbital?.22:0,profile:exposureProfile({sunAltitude:orbital?20:sun.altitude,dust:0,exposure:world.exposure,enhanced:world.enhanced})};
 }

 // Deep-space cruise backdrop: colour-varied stars, a visible Sun glow and the Earth → destination route.
 buildCruiseBackdrop(){
  const rng=randomGenerator(4411),positions=[],colors=[],c=new THREE.Color();
  for(let i=0;i<5200;i++){const a=rng()*Math.PI*2,y=rng()*2-1,r=Math.sqrt(1-y*y),d=8000;positions.push(Math.sin(a)*r*d,y*d,Math.cos(a)*r*d);const tint=rng(),bright=.3+Math.pow(rng(),2.4)*1.1;c.setHSL(tint<.12?.07:tint<.3?.6:.13,tint<.3?.55:.06,.72);colors.push(c.r*bright,c.g*bright,c.b*bright);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  this.cruise=new THREE.Group();this.cruise.name='cruise-backdrop';this.cruise.visible=false;this.scene.add(this.cruise);
  this.cruiseStars=new THREE.Points(geometry,new THREE.PointsMaterial({size:2.1,sizeAttenuation:false,vertexColors:true,depthWrite:false,fog:false,toneMapped:false}));this.cruiseStars.frustumCulled=false;this.cruise.add(this.cruiseStars);
  const canvas=this.r.createCanvas(256,256),ctx=canvas.getContext('2d'),glow=ctx.createRadialGradient?.(128,128,0,128,128,128);
  if(glow?.addColorStop){glow.addColorStop(0,'rgba(255,255,252,1)');glow.addColorStop(.07,'rgba(255,250,235,1)');glow.addColorStop(.2,'rgba(255,214,160,.42)');glow.addColorStop(.5,'rgba(255,180,110,.08)');glow.addColorStop(1,'rgba(255,170,100,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,256,256);}
  const glowTexture=new THREE.CanvasTexture(canvas);glowTexture.colorSpace=THREE.SRGBColorSpace;
  this.sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));this.sunGlow.name='cruise-sun';this.sunGlow.scale.setScalar(1500);this.cruise.add(this.sunGlow);
  const line=(color,opacity,dashed)=>{const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:65},()=>new V())),dashed?new THREE.LineDashedMaterial({color,dashSize:70,gapSize:45,transparent:true,opacity,depthWrite:false,fog:false}):new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,fog:false}));l.frustumCulled=false;this.cruise.add(l);return l;};
  this.routeAhead=line('#7fd1c7',.6,true);this.routeBehind=line('#ffb27a',.8,false);this.routeAhead.name='route-ahead';this.routeBehind.name='route-flown';
  this.fill=new THREE.DirectionalLight('#a9c4e6',0);this.fill.name='cruise-fill-light';this.scene.add(this.fill,this.fill.target);
 }
 // Bezier through the ship: the flown part (solid) and the part still ahead (dashed).
 updateRoute(from,fromRadius,to,toRadius){
  const ship=new V(0,-8,0),start=from.clone().add(ship.clone().sub(from).normalize().multiplyScalar(fromRadius*1.02)),end=to.clone().add(ship.clone().sub(to).normalize().multiplyScalar(toRadius*1.04)),control=ship.clone().multiplyScalar(2).sub(start.clone().add(end).multiplyScalar(.5));
  const curve=new THREE.QuadraticBezierCurve3(start,control,end);
  for(const [lineObject,a,b] of [[this.routeBehind,0,.5],[this.routeAhead,.5,1]]){const pos=lineObject.geometry.attributes.position;for(let i=0;i<pos.count;i++){const q=curve.getPoint(a+(b-a)*i/(pos.count-1));pos.setXYZ(i,q.x,q.y,q.z);}pos.needsUpdate=true;lineObject.geometry.computeBoundingSphere();}
  this.routeAhead.computeLineDistances();
 }
 // Electrical hardware on the hull: status lights per circuit, the downlink dish, a backup battery and the auxiliary-bus junction.
 buildBusHardware(){
  const g=this.ship,glowMat=color=>new THREE.MeshStandardMaterial({color:'#1b2329',emissive:color,emissiveIntensity:1.6,roughness:.4}),lights=[];
  const hullPoint=(y,a,out=3.13)=>[Math.sin(a)*out,y,Math.cos(a)*out];
  const add=(circuit,y,a)=>{const m=mesh(g,new THREE.BoxGeometry(.34,.5,.1),glowMat('#45d483'),hullPoint(y,a),null,'bus-status-light');m.rotation.y=a;m.castShadow=false;m.userData.circuit=circuit;lights.push(m);};
  for(let i=0;i<7;i++)add('main',6.2+i*1.8,0);
  for(let i=0;i<2;i++)add('aux',13.1+i*1.8,.42);
  for(let i=0;i<2;i++)add('downlink',17.4+i*1.6,-.42);
  const mastBase=hullPoint(18.2,-.42,3.0),mastTop=hullPoint(18.2,-.42,4.9);beam(g,this.mat.silver,mastBase,mastTop,.07);
  const dish=new THREE.Group();dish.name='downlink-dish';dish.position.set(...mastTop);dish.rotation.y=-.42;g.add(dish);
  const bowl=mesh(dish,new THREE.SphereGeometry(1.25,32,10,0,Math.PI*2,0,.82),new THREE.MeshStandardMaterial({color:'#e8ecef',roughness:.35,metalness:.3,side:THREE.DoubleSide}),[0,0,-1.0],null,'dish-reflector');bowl.rotation.x=Math.PI/2;
  beam(dish,this.mat.silver,[0,0,-.3],[0,0,.55],.04);this.dishLight=mesh(dish,new THREE.SphereGeometry(.13,16,10),glowMat('#45d483'),[0,0,.6],null,'downlink-status');
  this.battery=new THREE.Group();this.battery.name='backup-battery';const ba=.95;this.battery.position.set(...hullPoint(10.4,ba,3.28));this.battery.rotation.y=ba;g.add(this.battery);
  box(this.battery,this.mat.dark,[0,0,0],[1.1,1.9,.42],'battery-case');this.batteryGlow=mesh(this.battery,new THREE.BoxGeometry(.85,.16,.06),glowMat('#ffad5c'),[0,.55,.23],null,'battery-indicator');this.batteryGlow.material.emissiveIntensity=.15;
  for(const y of [-.35,.05])box(this.battery,this.mat.silver,[0,y,.22],[.9,.06,.04],'battery-rib');
  this.junction=new THREE.Group();this.junction.name='aux-bus-junction';this.junction.position.set(...hullPoint(15.9,.42,3.25));this.junction.rotation.y=.42;g.add(this.junction);box(this.junction,this.mat.silver,[0,0,0],[.9,.9,.36],'junction-box');
  const sparkCanvas=this.r.createCanvas(64,64),sctx=sparkCanvas.getContext('2d'),sg=sctx.createRadialGradient?.(32,32,0,32,32,32);if(sg?.addColorStop){sg.addColorStop(0,'rgba(255,255,255,1)');sg.addColorStop(.25,'rgba(255,120,90,.9)');sg.addColorStop(1,'rgba(255,60,40,0)');sctx.fillStyle=sg;sctx.fillRect(0,0,64,64);}
  const sparkTexture=new THREE.CanvasTexture(sparkCanvas);sparkTexture.colorSpace=THREE.SRGBColorSpace;
  this.spark=new THREE.Sprite(new THREE.SpriteMaterial({map:sparkTexture,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));this.spark.position.set(0,0,.35);this.spark.scale.setScalar(1.6);this.junction.add(this.spark);
  this.sparkLight=new THREE.PointLight('#ff6a4a',0,14,2);this.sparkLight.position.set(0,0,.8);this.junction.add(this.sparkLight);
  this.rcsPuffs=[];for(const y of [21,7]){const puff=new THREE.Sprite(new THREE.SpriteMaterial({map:this.sunGlow.material.map,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0,toneMapped:false}));puff.position.set(0,y,3.6);puff.scale.setScalar(2.2);g.add(puff);this.rcsPuffs.push(puff);}
  for(const sprite of [this.spark,this.sunGlow,...this.rcsPuffs])sprite.raycast=()=>{}; // visual effects only, never hit-tested
  this.busLights=lights;this.setBusState('nominal',0,0);
 }
 // States: nominal, fault, isolate (circuit cut off, then bus restored), backup (battery switched in, then bus restored).
 setBusState(state,t,time){
  const green='#45d483',amber='#ffb347',red='#ff4b3e',off='#0b0f12',blink=(rate)=>Math.sin(time*rate)>0?1:.15;
  const set=(m,color,intensity)=>{m.material.emissive.set(color);m.material.emissiveIntensity=intensity;};
  const restored=state==='isolate'?t>1.4:state==='backup'?t>1.2:true;
  for(const [i,m] of this.busLights.entries()){
   const sweep=restored&&state!=='nominal'?Math.min(1,Math.max(0,(t-(state==='isolate'?1.4:1.2))*2.2-i*.18)):1;
   if(state==='fault'){const c=m.userData.circuit;set(m,c==='aux'?red:amber,c==='aux'?2.2*blink(14):1.4*blink(5));continue;}
   if(state==='isolate'&&m.userData.circuit==='downlink'){set(m,t<.7?red:amber,t<.7?2*blink(16):.55);continue;}
   if(state==='isolate'&&m.userData.circuit==='aux'&&t<1.4){set(m,t<.8?red:off,t<.8?2*blink(16):.1);continue;}
   if(state==='backup'&&!restored){set(m,amber,1.2*blink(7));continue;}
   set(m,sweep>=1?green:amber,sweep>=1?1.6:.9);
  }
  const fault=state==='fault'||(state==='isolate'&&t<.8)||(state==='backup'&&t<1.0);
  this.spark.visible=fault;this.spark.material.opacity=fault?.5+.5*Math.abs(Math.sin(time*23)):0;this.spark.scale.setScalar(fault?1.1+Math.abs(Math.sin(time*31))*.9:1);this.sparkLight.intensity=fault?40*Math.abs(Math.sin(time*19)):0;
  set(this.dishLight,state==='fault'?red:state==='isolate'?amber:green,state==='fault'?2.5*blink(9):state==='isolate'?1+.6*Math.sin(time*2.4):1.8);
  set(this.batteryGlow,amber,state==='backup'?(t<1.2?1.5+1.2*Math.abs(Math.sin(time*8)):1.4):.12);
  for(const [i,puff] of this.rcsPuffs.entries()){const local=t-.3-i*.25;puff.material.opacity=state==='backup'&&local>0&&local<.8?(1-local/.8)*.9:0;puff.scale.setScalar(2+Math.max(0,local)*5);}
 }
 buildPad(){
  const groundCanvas=this.r.createCanvas(512,512),ctx=groundCanvas.getContext('2d'),rng=randomGenerator(238);ctx.fillStyle='#8b937a';ctx.fillRect(0,0,512,512);for(let i=0;i<22000;i++){const shade=Math.round(98+rng()*62);ctx.fillStyle=`rgba(${shade-8},${shade+5},${shade-20},.25)`;ctx.fillRect(rng()*512,rng()*512,1+rng()*4,1+rng()*3);}this.padGroundTexture=new THREE.CanvasTexture(groundCanvas);this.padGroundTexture.wrapS=this.padGroundTexture.wrapT=THREE.RepeatWrapping;this.padGroundTexture.repeat.set(50,50);this.padGroundTexture.colorSpace=THREE.SRGBColorSpace;this.padGroundTexture.anisotropy=8;
  // Land and water meet at one edge. Near-coplanar overlapping surfaces produce
  // unstable depth comparisons hundreds of metres from the boarding camera.
  const coast=LAUNCH_COAST,width=coast.halfExtent*2;
  this.earthGroundGeometry=new THREE.PlaneGeometry(width,coast.halfExtent-coast.shoreZ);
  this.localGroundGeometry=new THREE.PlaneGeometry(width,width);
  this.padGround=mesh(this.pad,this.earthGroundGeometry,new THREE.MeshStandardMaterial({color:'#8c997c',map:this.padGroundTexture,bumpMap:this.padGroundTexture,bumpScale:.025,roughness:1}),[0,0,(coast.halfExtent+coast.shoreZ)/2],null,'launch-site-ground');this.padGround.rotation.x=-Math.PI/2;this.padGround.receiveShadow=true;
  mesh(this.pad,new THREE.CylinderGeometry(20,22,.6,64),this.mat.dark,[0,.25,0],null,'launch-pad');
  const stripes=mesh(this.pad,new THREE.RingGeometry(18.3,18.7,80),this.mat.white,[0,.6,0]);stripes.rotation.x=-Math.PI/2;
  const tower=new THREE.Group();tower.name='access-tower';this.pad.add(tower);for(const x of [-17,-13])for(const z of [-2,2])beam(tower,this.mat.silver,[x,0,z],[x,32,z],.17);
  for(let y=2;y<31;y+=3){for(const z of [-2,2]){beam(tower,this.mat.silver,[-17,y,z],[-13,y+3,z],.10);beam(tower,this.mat.silver,[-13,y,z],[-17,y+3,z],.10);}for(const x of [-17,-13]){beam(tower,this.mat.silver,[x,y,-2],[x,y+3,2],.10);beam(tower,this.mat.silver,[x,y,2],[x,y+3,-2],.10);}box(tower,this.mat.dark,[-15,y,0],[4.2,.08,4.2],'tower-platform');}
  box(this.pad,this.mat.silver,[-8,CREW_ENTRY.floorY-.125,0],[14,.25,2],'boarding-gantry');
  for(const z of [-1,1])beam(this.pad,this.mat.silver,[-15,CREW_ENTRY.floorY+1,z],[-2.55,CREW_ENTRY.floorY+1,z],.05);
  box(this.pad,this.mat.dark,[-360,.02,0],[670,.03,8],'access-road');for(let i=0;i<50;i++)box(this.pad,this.mat.white,[-34-i*13,.045,0],[5,.006,.13],'road-marking');
  this.padLights=[];
  for(const x of [-23,23])for(const z of [-23,23]){mesh(this.pad,new THREE.CylinderGeometry(.5,.5,4.5,24),this.mat.silver,[x,2.25,z],null,'pad-service-post');box(this.pad,this.mat.amber,[x,4.55,z],[.25,.2,.25]);const light=new THREE.PointLight('#ffe6bc',0,42,2);light.position.set(x,4.7,z);light.userData.nightIntensity=260;this.pad.add(light);this.padLights.push(light);}
  for(const x of [-12,-4]){box(this.pad,this.mat.white,[x,CREW_ENTRY.floorY+2.4,-1.2],[.5,.08,.14],'gantry-work-light');const light=new THREE.PointLight('#d9e9ff',0,14,2);light.position.set(x,CREW_ENTRY.floorY+2.35,-1.15);light.userData.nightIntensity=90;this.pad.add(light);this.padLights.push(light);}
  const seaDepth=coast.halfExtent+coast.shoreZ;
  box(this.pad,new THREE.MeshStandardMaterial({color:'#3a6a80',roughness:.16,metalness:.08}),[0,coast.seaY-.075,(coast.shoreZ-coast.halfExtent)/2],[width,.15,seaDepth],'distant-ocean');
  const shore=mesh(this.pad,new THREE.PlaneGeometry(width,16),new THREE.MeshStandardMaterial({color:'#b8ab86',roughness:1}),[0,.012,coast.shoreZ+8],null,'shoreline');shore.rotation.x=-Math.PI/2;shore.receiveShadow=true;
  // Atmospheric haze hides the finite edges of land and sea and blends them into the sky's horizon colour.
  this.haze=new THREE.FogExp2('#6ea1bf',.0021);
  this.sky=mesh(this.scene,new THREE.SphereGeometry(9500,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthTest:false,depthWrite:false,uniforms:{fade:{value:1},day:{value:1},twilight:{value:0},sunDirection:{value:new V(-120,180,-90).normalize()}},vertexShader:'varying vec3 p;void main(){p=position;vec4 clip=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=clip.xyww;}',fragmentShader:`
    varying vec3 p;uniform float fade;uniform float day;uniform float twilight;uniform vec3 sunDirection;
    void main(){
      vec3 direction=normalize(p);float h=clamp(direction.y,0.0,1.0);
      vec3 daylight=mix(vec3(.43,.63,.75),vec3(.055,.20,.40),pow(h,.45));
      vec3 night=mix(vec3(.002,.003,.007),vec3(.0004,.0007,.0016),h);
      float towardSun=pow(max(0.0,dot(direction,normalize(sunDirection))),6.0);
      vec3 c=mix(night,daylight,day)+vec3(.35,.09,.02)*twilight*exp(-h*9.0)*towardSun;
      gl_FragColor=vec4(c*fade,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`}));this.sky.name='earth-atmospheric-background';this.sky.castShadow=false;this.sky.renderOrder=-1000;this.sky.frustumCulled=false;
 }
 buildCockpit(){
  const c=this.cockpit,m=this.mat;
  box(c,m.dark,[0,.6,0],[8,.25,8],'cabin-floor');box(c,m.silver,[-4,3,0],[.25,5,8]);box(c,m.silver,[4,3,0],[.25,5,8]);box(c,m.white,[0,5.5,0],[8,.2,8]);box(c,m.dark,[0,3,-4],[8,5,.2],'rear-bulkhead');
  // Open forward viewport with opaque frames, never drawn over the astronaut.
  box(c,m.silver,[0,4.5,3.8],[8,.25,.3],'window-header');box(c,m.silver,[0,2.3,3.8],[8,.2,.3]);
  for(const x of [-3.9,-1.4,1.4,3.9])beam(c,m.silver,[x,2.4,3.8],[x*.9,4.4,3.8],.11);
  box(c,m.dark,[0,1.95,2.1],[6.8,.5,2.5],'flight-console');
  this.screens=[];
  for(const x of [-2.2,0,2.2]){
   const canvas=this.r.createCanvas(384,256),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   const panel=mesh(c,new THREE.PlaneGeometry(1.7,1.15),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),[x,2.42,2.25],null,'live-flight-display');panel.rotation.x=-Math.PI/2-.2;panel.rotateZ(Math.PI);this.screens.push({canvas,texture});
  }
  for(const x of [-2.9,-2.5,-2.1,-1.7,1.7,2.1,2.5,2.9]){mesh(c,new THREE.CylinderGeometry(.07,.07,.09,16),m.cyan,[x,2.25,2.75]);}
  const buttonBase=mesh(c,new THREE.CylinderGeometry(.36,.36,.10,32),m.silver,[.85,2.26,.9],null,'launch-button-bezel');
  this.button=mesh(c,new THREE.CylinderGeometry(.26,.26,.12,32),m.amber,[.85,2.36,.9],null,'physical-launch-button');
  for(const x of [-.8,.8])box(c,m.black,[x,1.35,-1.2],[1.5,2.2,.55],'flight-seat');
  this.pilot=createAstronaut(m);this.pilot.position.set(0,-.55,-.8);this.pilot.userData.legs.forEach(x=>x.rotation.x=-1.35);this.pilot.userData.knees.forEach(x=>x.rotation.x=1.3);c.add(this.pilot);
  this.pilot.userData.arms.forEach(x=>x.rotation.x=-.4);this.pilot.userData.elbows.forEach(x=>x.rotation.x=-1.1);
  const labelCanvas=this.r.createCanvas(256,64),ctx=labelCanvas.getContext('2d');ctx.fillStyle='#101923';ctx.fillRect(0,0,256,64);ctx.fillStyle='#ffbe85';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText('LAUNCH',128,42);
  const tex=new THREE.CanvasTexture(labelCanvas);tex.colorSpace=THREE.SRGBColorSpace;const label=mesh(c,new THREE.PlaneGeometry(.95,.24),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}),[.85,2.205,.51],null,'launch-label');label.rotation.x=-Math.PI/2;label.rotateZ(Math.PI);
  const taskLight=new THREE.PointLight('#b8dbf0',.55,4,2);taskLight.position.set(0,4.9,-.3);c.add(taskLight);const consoleGlow=new THREE.PointLight('#70c7b4',.065,1.5,2);consoleGlow.position.set(0,2.6,2);c.add(consoleGlow);
  this.windowWorld=new THREE.Group();c.add(this.windowWorld);this.windowEarth=globe('Earth',120,this.r.createCanvas,this.data);this.windowEarth.position.set(-130,-50,500);this.windowWorld.add(this.windowEarth);
 }

 buildSolarSystem(){
  this.solarScene=new THREE.Scene();this.solarScene.background=new THREE.Color('#020409');this.solarCamera=new THREE.PerspectiveCamera(49,1,.1,3000);this.solarYaw=.45;this.solarPitch=.72;
  this.solarScene.add(new THREE.AmbientLight('#9bacbd',.18));this.solarScene.add(new THREE.PointLight('#fff0d5',15000,0,1));this.solarBodies=new Map();
  const radii=this.sim.world?Object.fromEntries(Object.entries(this.sim.world.data.bodies).map(([n,b])=>[n,n==='Sun'?9:b.kind.includes('giant')?Math.max(2,b.radiusKm/14000):b.kind==='planet'?Math.max(.6,b.radiusKm/3200):.4])):{Sun:9,Mercury:1,Venus:1.8,Earth:2,Moon:.65,Mars:1.4,Jupiter:5,Saturn:4,Uranus:3,Neptune:2.8};
  for(const [name,r] of Object.entries(radii)){
   const g=globe(name,r,this.r.createCanvas,this.sim.world?.data||this.data),v=this.sim.world?this.sim.world.position(name):vectorAt(this.data,name),d=Math.hypot(v.x,v.y,v.z),radius=d?Math.pow(d/149597870.7,.42)*65:0;
   if(d)g.position.set(v.x/d*radius,v.z/d*radius,v.y/d*radius);
   if(name==='Moon'){const earth=this.solarBodies.get('Earth'),ev=this.sim.world?this.sim.world.position('Earth'):vectorAt(this.data,'Earth'),dir=new V(v.x-ev.x,v.z-ev.z,v.y-ev.y).normalize();g.position.copy(earth.position).addScaledVector(dir,6.5);}
   g.userData.radiusKm={Sun:695700,Mercury:2439.7,Venus:6051.8,Earth:6371,Moon:1737.4,Mars:3389.5,Jupiter:69911,Saturn:58232,Uranus:25362,Neptune:24622}[name];
   this.solarBodies.set(name,g);this.solarScene.add(g);
   if(d&&name!=='Moon'){
    const pts=[];if(this.sim.world){const samples=this.sim.world.data.bodies[name].samples;for(let i=0;i<samples.length;i+=Math.max(1,Math.floor(samples.length/160))){const p=samples[i],d=Math.hypot(p[1],p[2],p[3]),r=Math.pow(d/149597870.7,.42)*65;pts.push(new V(p[1]/d*r,p[3]/d*r,p[2]/d*r));}}else for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;pts.push(new V(Math.sin(a)*radius,0,Math.cos(a)*radius));}
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#46637b',transparent:true,opacity:.32}));this.solarScene.add(line);
   }
  }
 }
 rotateSolar(yaw,pitch){if(!this.solarScene)this.buildSolarSystem();this.solarYaw+=yaw;this.solarPitch=clamp(this.solarPitch+pitch,.12,1.45);}
 drawSolarSystem(){
  if(!this.solarScene)this.buildSolarSystem();
  if(this.probeBody&&this.sim.world){this.drawProbe();return;}
  if(this.sim.world){for(const[name,g]of this.solarBodies){const v=this.sim.world.position(name),d=Math.hypot(v.x,v.y,v.z),radius=d?Math.pow(d/149597870.7,.42)*65:0;g.position.set(d?v.x/d*radius:0,d?v.z/d*radius:0,d?v.y/d*radius:0);if(name==='Moon'){const earth=this.solarBodies.get('Earth'),e=this.sim.world.position('Earth'),dir=new V(v.x-e.x,v.z-e.z,v.y-e.y).normalize();g.position.copy(earth.position).addScaledVector(dir,6.5);}}this.solarScene.traverse(o=>{if(o.isLine)o.visible=this.showOrbitLines!==false;});}
  const c=this.solarCamera,r=this.r;c.aspect=r.width/r.height;c.updateProjectionMatrix();const d=570*Math.max(1,1.05/c.aspect);c.position.set(Math.sin(this.solarYaw)*d*Math.cos(this.solarPitch),d*Math.sin(this.solarPitch),Math.cos(this.solarYaw)*d*Math.cos(this.solarPitch));c.lookAt(0,0,0);c.updateMatrixWorld(true);this.solarScene.updateMatrixWorld(true);r.device.render(this.solarScene,c);
  if(typeof document==='undefined')return;const container=document.getElementById('solar-labels');
  if(!this.solarLabels){this.solarLabels=new Map();container.replaceChildren();for(const name of this.solarBodies.keys()){const el=document.createElement('span');el.className='solar-label';el.textContent=name;container.append(el);this.solarLabels.set(name,el);}}
  for(const [name,g] of this.solarBodies){const p=g.position.clone().project(c),el=this.solarLabels.get(name);el.style.left=(p.x*.5+.5)*r.width+'px';el.style.top=(-p.y*.5+.5)*r.height+16+'px';el.hidden=Math.abs(p.x)>1||Math.abs(p.y)>1;}
 }
 drawProbe(){
  if(!this.probeScene){this.probeScene=new THREE.Scene();this.probeScene.background=new THREE.Color('#000103');this.probeCamera=new THREE.PerspectiveCamera(55,1,.05,5000);this.probeSky=new ScientificSky({scene:this.probeScene,camera:this.probeCamera,createCanvas:this.r.createCanvas,world:this.sim.world,getView:()=>{const w=this.sim.world,b=w.data.bodies[this.probeBody],target=w.position(this.probeBody),direction=length(target)>1?unit(target):av(1,0,0),position=add(target,direction,Math.max(200,b.radiusKm*7)),observer={world:'space',host:null,geo:null,position,velocity:av(),basis:[av(1,0,0),av(0,1,0),av(0,0,1)]},bodies=Object.keys(w.data.bodies).map(n=>({...w.apparent(n,observer),visible:true})),sun=bodies.find(b=>b.name==='Sun');return {observer,bodies,sun,dust:0,profile:exposureProfile({sunAltitude:20,enhanced:w.enhanced,exposure:w.exposure})};}});}
  const c=this.probeCamera;c.aspect=this.r.width/this.r.height;c.updateProjectionMatrix();const view=this.probeSky.update(),body=view.bodies.find(b=>b.name===this.probeBody),direction=new V(body.direction.x,body.direction.y,body.direction.z);direction.applyAxisAngle(new V(0,1,0),this.lookYaw);direction.y+=this.lookPitch;c.position.set(0,0,0);c.lookAt(direction);this.probeScene.updateMatrixWorld(true);this.r.device.render(this.probeScene,c);
  if(typeof document!=='undefined'){const el=document.getElementById('solar-science-readout');el.textContent=this.probeBody+' · '+this.sim.world.data.bodies[this.probeBody].kind+' · '+body.diameterDeg.toFixed(2)+'° disk · '+body.distanceKm.toFixed(0)+' km · exact apparent scale · '+new Date(this.sim.world.utc*1000).toISOString().slice(0,16)+' UTC';}
 }
 rotate(yaw,pitch){this.lookYaw+=yaw;this.lookPitch=clamp(this.lookPitch+pitch,-.65,.9);}
 orbitAround(target){
  if(!this.lookYaw&&!this.lookPitch){this.camera.lookAt(target);return;}
  // Spherical coordinates retain the cinematic distance and allow every azimuth.
  const offset=this.camera.position.clone().sub(target),radius=offset.length();
  const yaw=Math.atan2(offset.x,offset.z)+this.lookYaw,pitch=clamp(Math.asin(offset.y/radius)+this.lookPitch,.04,Math.PI/2-.06);
  this.camera.position.copy(target).add(new V(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(radius));this.camera.lookAt(target);
 }
 hitButton(x,y){this.ray.setFromCamera(new THREE.Vector2(x/this.r.width*2-1,1-y/this.r.height*2),this.camera);return this.ray.intersectObject(this.button,false).length>0;}
 draw(){
  const f=this.sim,p=f.phase,t=f.elapsed,r=this.r,tele=f.telemetry();this.updateScreens(tele);
  if(SURFACE_APPROACH_PHASES.includes(p)&&(p!=='capture'||tele.altitudeM<=180)){this.surfaceLanding.draw();return;}
  const inside=p==='cockpit'||p==='ignition'||f.cabinFlight&&['ascent','transfer','capture','speed','angle','descent','go-around','landed'].includes(p);
  // Preserve nearby console controls; exterior scenes need a more precise depth range.
  this.camera.near=inside?.035:.5;this.camera.far=20000;this.camera.aspect=r.width/r.height;this.camera.fov=['cockpit','ignition'].includes(p)?Math.min(120,2*Math.atan(Math.tan(39*Math.PI/180)/this.camera.aspect)*180/Math.PI):52;this.camera.clearViewOffset();this.camera.updateProjectionMatrix();
  this.pad.visible=['briefing','boarding','cockpit','ignition'].includes(p)||p==='ascent'&&tele.altitudeM<10000;this.ship.visible=!SURFACE_APPROACH_PHASES.includes(p);this.lander.visible=!this.ship.visible;this.mat.regolith.color.set(f.destination==='mars'?'#987252':'#888b8b');
  this.cockpit.visible=inside;this.pilot.userData.helmet.visible=!(inside&&this.pilotView);this.cadet.visible=p==='boarding';this.sky.visible=this.pad.visible;this.sky.material.uniforms.fade.value=p==='ascent'?1-clamp(t/13,0,1):1;this.stars.visible=!this.pad.visible||p==='ascent'&&t>12;
  this.earth.visible=!inside&&['ascent','transfer'].includes(p);this.moon.visible=this.mars.visible=false;
  this.ship.position.set(0,p==='ascent'?t*t*2:0,0);this.ship.rotation.set(0,0,p==='ascent'?-clamp(t/18,0,1)*.19:0);
  const hatch=this.ship.userData.crewHatch,open=p==='boarding'?clamp(t/.65,0,1)*(1-clamp((t-5.6)/.35,0,1)):0;hatch.pivot.quaternion.setFromAxisAngle(hatch.axis,-2.6*open); // Folds flat against the hull, clear of the walkway and rails.
  for(const flame of this.ship.userData.flames){flame.visible=p==='ignition'||p==='ascent';flame.scale.y=1+(r.reducedMotion?0:Math.sin(t*27)*.05);flame.material.uniforms.time.value=r.reducedMotion?0:t;flame.material.uniforms.air.value=clamp(tele.exteriorPressureKpa/101.325,0,1);}
  for(const d of this.dust){const a=d.seed*Math.PI*2,age=(t+d.seed*3)%3;d.mesh.visible=!r.reducedMotion&&(p==='ignition'||p==='ascent'&&t<5);d.mesh.position.set(Math.cos(a)*age*9,age*2,Math.sin(a)*age*9);d.mesh.scale.setScalar(1+age*2.3);d.mesh.material.opacity=.3*(1-age/3);}
  if(p==='briefing'){this.camera.position.set(52,30,-72);this.orbitAround(new V(0,18,0));}
  else if(p==='boarding'){
   const u=clamp((t-.7)/4.7,0,1),x=CREW_ENTRY.startX+(CREW_ENTRY.endX-CREW_ENTRY.startX)*u;this.cadet.position.set(x,CREW_ENTRY.floorY,CREW_ENTRY.z);this.cadet.rotation.y=Math.PI/2;
   r.poseAstronaut(this.cadet,(x-CREW_ENTRY.startX)*2.45,t,t>.7&&t<5.4?1:0);this.camera.position.set(x-6,CREW_ENTRY.floorY+3.1,7.8);this.orbitAround(new V(x+1.2,CREW_ENTRY.floorY+1.1,0));
  }else if(inside){
   this.windowEarth.visible=p==='ignition';
   const press=p==='ignition'?Math.sin(Math.PI*clamp(t/1.4,0,1)):0;
   // A visible pressure-suit arm reaches the physical switch; the switch depresses at contact.
   this.pilot.userData.arms[1].rotation.x=-.4-.8*press;this.pilot.userData.elbows[1].rotation.x=-1.1+.81*press;this.button.position.y=2.36-.08*press;
   this.camera.position.set(...(this.pilotView&&p==='cockpit'?[5000,3.75,-.15]:[5003.25,4.85,-3.55]));const aim=this.pilotView&&p==='cockpit'?new V(5000.85,2.7,1.4):new V(5000.3,2.9,1.9),direction=aim.sub(this.camera.position);direction.applyAxisAngle(new V(0,1,0),this.lookYaw);direction.y+=this.lookPitch*5;this.camera.lookAt(this.camera.position.clone().add(direction));if(f.world){this.camera.position.sub(new V(5000,0,0)).multiplyScalar(.35).add(new V(5000,0,0));this.camera.lookAt(this.camera.position.clone().add(direction.multiplyScalar(.35)));}
  }else if(p==='ascent'){
   this.camera.position.copy(this.ship.position).add(new V(40,18,-63));this.orbitAround(this.ship.position.clone().add(new V(0,20,0)));this.earth.position.set(-600,-1220,-900);
  }else if(p==='transfer'){
   const u=f.routeProgress,target=f.destination==='moon'?this.moon:this.mars;target.visible=true;const radius=f.destination==='moon'?450:700;
   // Fixed cinematic layout (from the default camera): Earth falls away behind-left, the destination grows ahead-right, the ship flies across the frame.
   const home=new V(52,20,64),forward=new V(-26,4,-40).sub(home).normalize(),side=new V().crossVectors(forward,new V(0,1,0)).normalize(),lift=new V().crossVectors(side,forward);
   const place=(ahead,across,height)=>home.clone().addScaledVector(forward,ahead).addScaledVector(side,across).addScaledVector(lift,height);
   this.earth.position.copy(place(4200+u*2600,-2300-u*900,-900));target.position.copy(place(7400-u*(7400-radius*5),1500*(1-u*.6),-150));
   this.ship.position.set(0,0,0);this.ship.quaternion.setFromUnitVectors(new V(0,1,0),side.clone().addScaledVector(forward,.3).normalize());
   this.camera.position.copy(home);this.orbitAround(new V(-26,4,-40));this.sky.visible=false;
   this.earth.rotation.y=.2+u*.6;target.rotation.y=.5;this.updateRoute(this.earth.position,1100,target.position,radius);
  }else{
   const target=f.destination==='moon'?this.moon:this.mars;target.visible=true;target.position.set(0,-(f.destination==='moon'?450:700)-4,-40);
   this.lander.position.set(0,0,0);this.lander.rotation.z=0;
   this.camera.position.copy(this.lander.position).add(new V(25,15,36));this.orbitAround(this.lander.position.clone().add(new V(0,4,0)));
   this.sky.visible=false;
  }
  this.padGround.geometry=f.localSortie?this.localGroundGeometry:this.earthGroundGeometry;this.padGround.position.z=f.localSortie?0:(LAUNCH_COAST.halfExtent+LAUNCH_COAST.shoreZ)/2;
  if(f.localSortie){this.sky.visible=false;this.pad.getObjectByName('distant-ocean').visible=false;for(const d of this.dust){const age=(t+d.seed*3)%3,a=d.seed*Math.PI*2;d.mesh.position.set(Math.cos(a)*age*9,Math.max(0,age*3-.5*WORLDS[f.departure].gravity*age*age),Math.sin(a)*age*9);d.mesh.scale.setScalar(.05+d.seed*.12);d.mesh.material.opacity=.5;}}else this.pad.getObjectByName('distant-ocean').visible=true;
  const groundMaterial=this.padGround.material,map=f.localSortie?r.groundMaterial?.map||this.padGroundTexture:this.padGroundTexture,bump=f.localSortie?r.groundMaterial?.bumpMap||map:map;if(groundMaterial.map!==map||groundMaterial.bumpMap!==bump){groundMaterial.map=map;groundMaterial.bumpMap=bump;groundMaterial.needsUpdate=true;}groundMaterial.color.set(f.localSortie?'#ffffff':'#8c997c');
  this.sun.target.position.copy(inside?this.cockpit.position:this.ship.visible?this.ship.position:this.lander.position).add(new V(0,inside?1:14,0));const span=inside?2.5:45;Object.assign(this.sun.shadow.camera,{left:-span,right:span,top:span,bottom:-span});this.sun.shadow.camera.updateProjectionMatrix();
  const cruise=p==='transfer'&&!inside;this.cruise.visible=cruise;
  if(this.sharedSky)this.sharedSky.group.visible=!cruise;
  if(this.sharedSky&&!cruise){this.earth.visible=this.moon.visible=this.mars.visible=this.windowEarth.visible=false;this.stars.visible=false;this.sharedSky.update();if(!this.pad.visible)this.sky.visible=false;this.sun.position.copy(this.sun.target.position).add(new V(this.sharedSky.lastView.sun.direction.x,this.sharedSky.lastView.sun.direction.y,this.sharedSky.lastView.sun.direction.z).multiplyScalar(200));}else this.sun.position.copy(this.sun.target.position).add(new V(-120,180,-90));this.sun.target.updateMatrixWorld();
  const solarAltitude=this.sharedSky?.lastView?.sun.altitude??34,day=THREE.MathUtils.smoothstep(solarAltitude,-8,6),night=1-day;
  this.sky.position.copy(this.camera.position);this.sky.material.uniforms.day.value=day;this.sky.material.uniforms.twilight.value=clamp(1-Math.abs(solarAltitude+2)/10,0,1);this.sky.material.uniforms.sunDirection.value.copy(this.sun.position).sub(this.sun.target.position).normalize();
  this.ambient.intensity=inside?.22:f.localSortie?.12:.10+.90*day;this.sun.intensity=solarAltitude>0?(inside?.65:3.3):0;this.fill.intensity=0;
  if(cruise){
   // Deep space has no horizon: the Sun is always up. Key light from a visible Sun (upper left), soft fill from the camera side.
   const forward=new V(),right=new V(),up=new V();this.camera.getWorldDirection(forward);right.crossVectors(forward,this.camera.up).normalize();up.crossVectors(right,forward).normalize();
   const sunDirection=forward.clone().multiplyScalar(.38).add(right.clone().multiplyScalar(-.86)).add(up.multiplyScalar(.34)).normalize(); // side-lit: half-lit worlds, readable hull
   this.sun.position.copy(this.sun.target.position).addScaledVector(sunDirection,200);this.sun.intensity=3.4;this.ambient.intensity=.34;
   this.fill.position.copy(this.camera.position);this.fill.target.position.copy(this.sun.target.position);this.fill.intensity=1.15;
   this.sunGlow.position.copy(this.camera.position).addScaledVector(sunDirection,6500);this.cruise.position.set(0,0,0);this.cruiseStars.position.copy(this.camera.position);
   this.earth.visible=this.cruise.visible;(f.destination==='moon'?this.moon:this.mars).visible=true;
  }
  const ev=f.flightEvent,busState=p==='transfer'&&!ev.resolved?'fault':ev.resolved&&['transfer','capture'].includes(p)?ev.choice:ev.choice==='isolate'&&!['briefing','boarding','cockpit','ignition','ascent'].includes(p)?'isolate':'nominal';
  this.setBusState(busState,ev.resolved&&p==='transfer'?f.elapsed-(ev.at??f.elapsed):99,r.reducedMotion?0:performanceNow()/1000);
  const hazy=this.pad.visible&&!f.localSortie&&!inside;this.scene.fog=hazy?this.haze:null;
  if(hazy)this.haze.color.setRGB(.002+.428*day,.003+.627*day,.007+.743*day).multiplyScalar(this.sky.material.uniforms.fade.value);
  const clock=performanceNow()/1000,weatherDt=Math.min(.1,Math.max(0,clock-(this.weatherClock??clock)));this.weatherClock=clock;
  this.padWeather.group.visible=hazy;this.spaceWeather.group.visible=cruise;this.lightningFlash=0;
  if(hazy){
   const w=this.padWeather.update(weatherDt,this.camera,{groundY:0,reducedMotion:r.reducedMotion}),cloud=this.padWeather.condition.cloud||0;
   this.sun.intensity*=w.sun;this.haze.density=Math.max(.0021*w.haze,w.fogDensity);this.haze.color.lerp(new THREE.Color(.16,.18,.2).multiplyScalar(.4+.6*day),.75*cloud);this.sky.material.uniforms.day.value*=1-.62*cloud;this.ambient.intensity+=w.flash*1.6;this.lightningFlash=w.flash;
  }
  if(cruise)this.spaceWeather.update(weatherDt,this.camera,{sunDirection:this.sun.position.clone().sub(this.sun.target.position).normalize(),reducedMotion:r.reducedMotion});
  for(const light of this.padLights)light.intensity=this.pad.visible&&!inside?light.userData.nightIntensity*night:0;
  this.scene.updateMatrixWorld(true);r.device.render(this.scene,this.camera);
 }
 updateScreens(tele){
  const f=this.sim,p=f.phase,landing=SURFACE_APPROACH_PHASES.includes(p);
  for(let i=0;i<this.screens.length;i++){
   const {canvas,texture}=this.screens[i],ctx=canvas.getContext('2d');ctx.fillStyle='#08151b';ctx.fillRect(0,0,384,256);ctx.textAlign='left';ctx.font='18px monospace';ctx.fillStyle='#8dd9d0';ctx.fillText(['NAVIGATION','LIFE SUPPORT','FLIGHT STATUS'][i],18,32);ctx.fillStyle='#e5eae5';ctx.font='26px monospace';
   const lines=i===0?[f.destination.toUpperCase(),landing?tele.altitudeM.toFixed(1)+' m AGL':Math.round(f.plan.totalKm).toLocaleString()+' km']:i===1?[tele.cabinPressureKpa.toFixed(1)+' kPa cabin',tele.cabinC.toFixed(0)+'°C cabin']:[p.toUpperCase(),landing?tele.velocityMps.toFixed(1)+' m/s':p==='cockpit'?'PRESS LAUNCH':tele.fuelPercent.toFixed(0)+'% FUEL'];lines.forEach((x,j)=>ctx.fillText(x,18,90+j*50));texture.needsUpdate=true;
  }
 }
 dispose(){this.surfaceLanding.dispose();this.sharedSky?.dispose();this.probeSky?.dispose();const unused=this.padGround.geometry===this.earthGroundGeometry?this.localGroundGeometry:this.earthGroundGeometry;unused.dispose();for(const scene of [this.scene,this.solarScene,this.probeScene].filter(Boolean))scene.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}
}
