import * as THREE from 'three';
import { clamp, randomGenerator } from './engine.js';
import { WORLD_SCALE, isOccupied } from './world-layout.js';
import { openingMotion, astronautPose, ballisticDust } from './animation.js';
import { TrackingMaps } from './maps.js';
import { makeMaterials, mesh, createAstronaut, createRover, createHabitat, createAirlock, createSolar, createRelay, createTank, createSatellite, createSurvey, createTrainingBench, createLander } from './models.js';

const V = THREE.Vector3;
const smooth = t => t*t*(3-2*t);

export class Renderer {
  constructor(canvas, mission, { device = null, createCanvas = null } = {}) {
    this.canvas=canvas;this.mission=mission;
    this.createCanvas=createCanvas||((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
    this.width=1000;this.height=720;this.dpr=1;this.zoom=1.25;this.follow=true;this.mode='surface';this.perspective='third-person';
    this.elevation=false;this.showLifeline=true;this.assistedRoute=null;this.cameraPinned=null;this.reducedMotion=false;
    this.lastDrawTime=null;this.frameTime=0;this.stepPhase=0;this.particles=[];this.bursts=[];
    this.yaw=Math.PI/4;this.pitch=Math.atan(.76);this.lookYaw=this.yaw+Math.PI;this.lookPitch=0;this.cameraFocusHeight=2.8;this.focus=new V();this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#020408');
    this.camera=new THREE.PerspectiveCamera(49,this.width/this.height,.15,3000);
    this.scene.add(new THREE.HemisphereLight('#c3d4e6','#292623',.55));
    this.sun=new THREE.DirectionalLight('#fff1d7',4.1);this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-78;this.sun.shadow.camera.right=78;
    this.sun.shadow.camera.top=78;this.sun.shadow.camera.bottom=-78;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=240;
    this.sun.shadow.bias=-.00035;this.sun.shadow.normalBias=.14;
    this.scene.add(this.sun,this.sun.target);
    this.mat=makeMaterials();this.addSurfaceDetail();this.maps=new TrackingMaps(mission);this.orbitCanvas=this.createCanvas(1000,720);
    this.device=device||new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.device.setClearColor('#020408',1);this.device.shadowMap.enabled=true;this.device.shadowMap.type=THREE.PCFSoftShadowMap;
    this.device.toneMapping=THREE.ACESFilmicToneMapping;this.device.toneMappingExposure=1.15;this.device.outputColorSpace=THREE.SRGBColorSpace;
    this.buildTerrain();this.buildScenery();this.buildSky();
    this.player=createAstronaut(this.mat);this.rover=createRover(this.mat);this.scene.add(this.player,this.rover);this.buildCinematic();
    this.fieldSample=mesh(this.scene,new THREE.DodecahedronGeometry(1.1),this.mat.rock,[0,0,0],[1.3,.6,1],'collectable-field-sample');
    this.carriedSample=mesh(this.player,new THREE.CylinderGeometry(.32,.32,.85,12),this.mat.gold,[1.2,1.4,.45],null,'carried-sample');
    this.roverCargo=this.makeCargo();this.roverCargo.position.set(0,2.55,-2.2);this.rover.add(this.roverCargo);
    this.outpostCargo=this.makeCargo();this.outpostCargo.position.set(0,3.75,-1);this.models.get('lab')?.add(this.outpostCargo);
    this.deliveredCargo=this.makeCargo();this.scene.add(this.deliveredCargo);
    this.pathGroups={};for(const name of ['lifeline','trail','active','assisted']){const g=new THREE.Group();g.name=name+'-path';this.pathGroups[name]=g;this.scene.add(g);}
    this.pathKeys={};this.fxGroup=new THREE.Group();this.scene.add(this.fxGroup);
    this.marker=mesh(this.scene,new THREE.TorusGeometry(2,.075,6,40),this.mat.amber);this.marker.rotation.x=-Math.PI/2;
    this.orbitTexture=new THREE.CanvasTexture(this.orbitCanvas);
    this.orbitTexture.colorSpace=THREE.SRGBColorSpace;
    this.orbitScene=new THREE.Scene();this.orbitCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const orbitPlane=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:this.orbitTexture,depthTest:false,depthWrite:false,toneMapped:false}));
    this.orbitScene.add(orbitPlane);
    this.focus.copy(this.world(mission.state.player));this.updateActors(0);this.updateCamera(0);
  }
  world(p, offset=0) {
    const t=this.mission.terrain;
    return new V((p.x-(t.width-1)/2)*WORLD_SCALE,(t.heightAt(p.x,p.y)-t.min)/t.cell*WORLD_SCALE*this.mission.config.art.terrainVerticalExaggeration+offset,(p.y-(t.height-1)/2)*WORLD_SCALE);
  }
  addSurfaceDetail(){
    const canvas=this.createCanvas(128,128),ctx=canvas.getContext('2d'),rng=randomGenerator(174);
    ctx.fillStyle='#b8b8b8';ctx.fillRect(0,0,128,128);
    for(let i=0;i<5000;i++){const c=Math.round(110+rng()*125);ctx.fillStyle=`rgb(${c},${c},${c})`;ctx.fillRect(rng()*128,rng()*128,1,1);}
    const grain=new THREE.CanvasTexture(canvas);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(4,4);
    this.mat.suit.bumpMap=grain;this.mat.suit.bumpScale=.016;
    this.mat.silver.bumpMap=grain;this.mat.silver.bumpScale=.008;
    const foil=this.createCanvas(128,128),fctx=foil.getContext('2d');
    for(let y=0;y<128;y+=2)for(let x=0;x<128;x+=2){const shade=Math.round(155+42*Math.sin(x*.19+Math.sin(y*.27)*3)+20*Math.cos(y*.51-x*.08)+rng()*22);fctx.fillStyle=`rgb(${shade},${shade},${shade})`;fctx.fillRect(x,y,2,2);}
    const crinkles=new THREE.CanvasTexture(foil);crinkles.wrapS=crinkles.wrapT=THREE.RepeatWrapping;crinkles.repeat.set(3,2);
    this.mat.foil.bumpMap=crinkles;this.mat.foil.bumpScale=.08;this.mat.foil.roughnessMap=crinkles;
  }
  buildCinematic(){
    this.cinemaGroup=new THREE.Group();this.cinemaGroup.name='opening-stage';this.cinemaGroup.visible=false;this.scene.add(this.cinemaGroup);
    this.lander=createLander(this.mat);this.cinemaGroup.add(this.lander);
    const b=this.mission.objects.base,candidates=[[-4,3.5],[4,3.5],[-4,-4],[4,-4]].map(([x,y])=>({x:b.x+x,y:b.y+y}));
    this.landingPoint=candidates.find(p=>this.mission.terrain.inBounds(p.x,p.y)&&!isOccupied(p,this.mission.props,1.1))||{x:b.x+4,y:b.y+3.5};
    this.landingOrigin=this.world(this.landingPoint);
    for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;this.landingOrigin.y=Math.max(this.landingOrigin.y,this.world({x:this.landingPoint.x+Math.cos(a)*5.3/WORLD_SCALE,y:this.landingPoint.y+Math.sin(a)*5.3/WORLD_SCALE}).y);}
    this.mentor=createAstronaut(this.mat);this.mentor.name='flight-school-instructor';this.cinemaGroup.add(this.mentor);
    this.plume=mesh(this.lander,new THREE.ConeGeometry(.95,2.8,20,1,true),new THREE.MeshBasicMaterial({color:'#c4dcfa',transparent:true,opacity:.22,depthTest:true,depthWrite:false}),[0,0,0],null,'vacuum-exhaust');this.plume.castShadow=false;
    this.engineLight=new THREE.PointLight('#bccfff',0,16,2);this.lander.add(this.engineLight);this.engineLight.position.y=1.4;
    const rng=randomGenerator(882),geometry=new THREE.IcosahedronGeometry(1,0);this.cinemaDust=[];
    for(let i=0;i<128;i++){
      const p=mesh(this.cinemaGroup,geometry,this.mat.rock);p.castShadow=false;p.visible=false;
      this.cinemaDust.push({mesh:p,kind:i<80?'lander':'rover',angle:rng()*Math.PI*2,start:i<80?3.15+rng()*1.8:6.1+rng()*2.6,speed:i<80?3+rng()*8:.7+rng()*3,lift:.35+rng()*1.1,life:1.25+rng()*.85,size:.035+rng()*.085,side:rng()>.5?1:-1});
    }
  }
  poseAstronaut(actor,phase,time,strength=0,checking=0){
    const pose=astronautPose(phase,time,strength,checking,this.reducedMotion),u=actor.userData;
    for(let i=0;i<2;i++){u.legs[i].rotation.x=pose.hips[i];u.knees[i].rotation.x=pose.knees[i];u.arms[i].rotation.x=pose.shoulders[i];u.elbows[i].rotation.x=pose.elbows[i];u.arms[i].rotation.z=i===0?.04:-.04;}
    u.body.position.y=pose.bodyY;u.body.rotation.set(pose.lean,0,pose.roll);u.helmet.rotation.set(pose.headPitch,pose.headYaw,0);
    // Keep the lowest boot on the surface as hip and knee joints articulate.
    const soles=pose.hips.map((h,i)=>{const k=pose.knees[i],y=-.9-.91*Math.cos(k)-.16*Math.sin(k),z=-.91*Math.sin(k)+.16*Math.cos(k);return 1.96+y*Math.cos(h)-z*Math.sin(h)-.15*Math.abs(Math.cos(h+k))-.465*Math.abs(Math.sin(h+k));});
    actor.position.y-=Math.min(...soles);
  }
  terrainTexture() {
    const canvas=this.createCanvas(256,256),ctx=canvas.getContext('2d'),rng=randomGenerator(2219);
    ctx.fillStyle='#9a9996';ctx.fillRect(0,0,256,256);
    for(let i=0;i<18000;i++) {const g=80+Math.round(rng()*110);ctx.fillStyle=`rgba(${g},${g},${g},${.04+rng()*.20})`;ctx.fillRect(rng()*256,rng()*256,1+rng()*2,1+rng()*2);}
    const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(100,100);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  buildTerrain() {
    const t=this.mission.terrain,nx=(t.width-1)*2,ny=(t.height-1)*2;
    const geometry=new THREE.PlaneGeometry((t.width-1)*WORLD_SCALE,(t.height-1)*WORLD_SCALE,nx,ny);geometry.rotateX(-Math.PI/2);
    const pos=geometry.attributes.position,colors=new Float32Array(pos.count*3),normalColor=new THREE.Color();
    for(let i=0;i<pos.count;i++) {
      const x=pos.getX(i)/WORLD_SCALE+(t.width-1)/2,y=pos.getZ(i)/WORLD_SCALE+(t.height-1)/2;
      pos.setY(i,this.world({x,y}).y);normalColor.setRGB(.62,.64,.67);colors.set(normalColor.toArray(),i*3);
    }
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
    const tex=this.terrainTexture();this.groundMaterial=new THREE.MeshStandardMaterial({color:'#bfc0bc',map:tex,bumpMap:tex,bumpScale:.065,roughness:1,vertexColors:true,metalness:0});
    this.ground=mesh(this.scene,geometry,this.groundMaterial,[0,0,0],null,'NASA-LOLA-terrain');this.ground.castShadow=false;
    // Artistic distant ground outside the cached crop; no added NASA observations.
    const apron=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshStandardMaterial({color:'#37393d',roughness:1}));
    apron.rotation.x=-Math.PI/2;apron.position.y=-24;apron.receiveShadow=true;apron.name='illustrative-distant-ground';this.scene.add(apron);
    const rng=randomGenerator(183);this.rocks=[];
    for(let i=0;i<210;i++) {
      const p={x:2+rng()*(t.width-4),y:2+rng()*(t.height-4)};
      if(this.mission.props.some(o=>Math.hypot(o.x-p.x,o.y-p.y)<3)||Math.hypot(p.x-this.mission.state.rover.x,p.y-this.mission.state.rover.y)<3)continue;
      const size=.15+rng()*.33;const rock=mesh(this.scene,new THREE.DodecahedronGeometry(size,0),this.mat.rock,this.world(p,size*.16).toArray(),[1.4,.52,1.0],'decorative-pebble');rock.rotation.y=rng()*Math.PI;this.rocks.push(rock);
    }
  }
  buildScenery() {
    this.scenery=new THREE.Group();this.scenery.name='solid-equipment';this.scene.add(this.scenery);this.models=new Map();
    for(const p of this.mission.props) {
      const g=p.kind==='habitat'?createHabitat(this.mat):p.kind==='airlock'?createAirlock(this.mat):p.kind==='solar'?createSolar(this.mat,p.halfX,p.halfY):p.kind==='relay'?createRelay(this.mat):p.kind==='lab'?createTrainingBench(this.mat):createTank(this.mat);
      g.position.copy(this.world(p));g.userData.layout=p;this.scenery.add(g);this.models.set(p.id,g);
      const corners=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,y])=>this.world({x:p.x+x*(p.halfX||p.radius),y:p.y+y*(p.halfY||p.radius)}).y);
      const top=Math.max(g.position.y,...corners),low=Math.min(g.position.y,...corners)-.35;g.position.y=top;
      mesh(g,new THREE.BoxGeometry((p.halfX||p.radius)*16,top-low,(p.halfY||p.radius)*16),this.mat.regolith,[0,-(top-low)/2,0],null,'equipment-footing');
    }
    this.surveys=this.mission.science.map(p=>{const g=createSurvey(this.mat);g.position.copy(this.world(p));g.userData.site=p;this.scene.add(g);return g;});
    this.satellite=createSatellite(this.mat);this.satellite.position.copy(this.world(this.mission.objects.base,34)).add(new V(25,0,-20));this.satellite.visible=false;this.scene.add(this.satellite);
  }
  buildSky() {
    const rng=randomGenerator(7417),positions=new Float32Array(900*3);
    for(let i=0;i<900;i++){const a=rng()*Math.PI*2,y=.15+rng()*.85,r=Math.sqrt(1-y*y);positions.set([Math.cos(a)*r*1200,y*1200,Math.sin(a)*r*1200],i*3);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    this.stars=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#b2bdc8',size:1.1,sizeAttenuation:true,depthTest:true,depthWrite:false}));this.scene.add(this.stars);
    const canvas=this.createCanvas(512,256),ctx=canvas.getContext('2d');ctx.fillStyle='#185281';ctx.fillRect(0,0,512,256);
    ctx.fillStyle='#678887';const continents=[[[70,38],[122,20],[159,61],[113,99],[139,126],[116,170],[85,110]],[[250,48],[317,26],[357,61],[392,88],[351,120],[302,99],[287,191],[258,136]],[[413,162],[458,155],[478,198],[424,214]]];
    for(const pts of continents){ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fill();}
    ctx.strokeStyle='#eaf0f3';ctx.globalAlpha=.35;ctx.lineWidth=6;
    for(let i=0;i<40;i++){ctx.beginPath();ctx.ellipse(rng()*512,rng()*256,15+rng()*40,2+rng()*4,-.25,0,Math.PI*1.5);ctx.stroke();}
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    this.earth=new THREE.Mesh(new THREE.SphereGeometry(49,40,24),new THREE.MeshStandardMaterial({map:tex,color:'#a6b4c7',roughness:1}));this.earth.position.set(-340,480,-800);this.scene.add(this.earth);
  }
  resize(width,height,dpr=1) {
    this.width=Math.max(1,width);this.height=Math.max(1,height);this.dpr=Math.min(dpr,1.6);
    this.device.setPixelRatio(this.dpr);this.device.setSize(this.width,this.height,false);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();
    this.orbitCanvas.width=this.width;this.orbitCanvas.height=this.height;this.orbitTexture.needsUpdate=true;
  }
  setElevation(on) {
    this.elevation=on;const t=this.mission.terrain,colors=this.ground.geometry.attributes.color,p=this.ground.geometry.attributes.position;
    for(let i=0;i<colors.count;i++) {
      const x=p.getX(i)/WORLD_SCALE+(t.width-1)/2,y=p.getZ(i)/WORLD_SCALE+(t.height-1)/2;
      const f=(t.heightAt(x,y)-t.min)/(t.max-t.min),c=new THREE.Color();
      if(on)c.setHSL(.58-f*.5,.53,.31+f*.30);else c.setRGB(.62,.64,.67);colors.setXYZ(i,c.r,c.g,c.b);
    }
    colors.needsUpdate=true;
  }
  inputVector(right,down) {
    if(this.perspective==='first-person')return{dx:right*Math.cos(this.lookYaw)-down*Math.sin(this.lookYaw),dy:-right*Math.sin(this.lookYaw)-down*Math.cos(this.lookYaw)};
    return {dx:right*Math.cos(this.yaw)+down*Math.sin(this.yaw),dy:-right*Math.sin(this.yaw)+down*Math.cos(this.yaw)};
  }
  setPerspective(mode) {
    if(mode===this.perspective)return;
    if(mode==='first-person'){this.lookYaw=this.yaw+Math.PI;this.lookPitch=0;this.follow=true;this.cameraPinned=null;}
    else{this.yaw=(this.lookYaw??this.yaw+Math.PI)-Math.PI;this.pitch=Math.atan(.76);}
    this.perspective=mode;this.camera.fov=mode==='first-person'?72:49;this.camera.updateProjectionMatrix();this.updateCamera(0);
  }
  rotateCamera(amount,tilt=0) {
    if(this.perspective==='first-person'){this.lookYaw+=amount;this.lookPitch=clamp(this.lookPitch+tilt,-1.4,1.4);}
    else{this.yaw+=amount;this.pitch=clamp(this.pitch+tilt,.12,1.48);}
  }
  panCamera(dx,dy) {
    if(this.perspective==='first-person')return;
    const distance=this.camera.position.distanceTo(this.focus),scale=2*distance*Math.tan(this.camera.fov*Math.PI/360)/this.height;
    const across=-dx*scale,along=-dy*scale/Math.max(.25,Math.sin(this.pitch)),t=this.mission.terrain;
    const p=this.cameraPinned||{x:this.focus.x/WORLD_SCALE+(t.width-1)/2,y:this.focus.z/WORLD_SCALE+(t.height-1)/2};
    this.routeDistance=this.cameraPinned?this.routeDistance:54;
    this.cameraPinned={x:clamp(p.x+(across*Math.cos(this.yaw)+along*Math.sin(this.yaw))/WORLD_SCALE,1,t.width-2),y:clamp(p.y+(-across*Math.sin(this.yaw)+along*Math.cos(this.yaw))/WORLD_SCALE,1,t.height-2)};
    this.follow=false;this.focus.copy(this.world(this.cameraPinned,this.cameraFocusHeight??2.8));this.updateCamera(0);
  }
  resetCamera() {
    this.yaw=Math.PI/4;this.pitch=Math.atan(.76);this.lookYaw=Math.PI/2-this.mission.state.player.heading;this.lookPitch=0;
    this.follow=true;this.cameraPinned=null;this.cameraFocusHeight=2.8;this.zoom=1.2;this.focus.copy(this.world(this.mission.state.player,2.8));this.updateCamera(0);
  }
  showObjective() {
    const point=this.mission.target();
    if(this.perspective==='first-person'){
      this.updateCamera(0);const delta=this.world(point,4).sub(this.camera.position);
      if(delta.lengthSq()>.01){this.lookYaw=Math.atan2(delta.x,delta.z);this.lookPitch=clamp(Math.atan2(delta.y,Math.hypot(delta.x,delta.z)),-1.4,1.4);}
    }else{
      this.cameraPinned={...point};this.cameraFocusHeight=4;this.routeDistance=44;this.follow=false;this.zoom=1.2;this.pitch=.65;this.focus.copy(this.world(point,4));
    }
    this.updateCamera(0);
  }
  showOverview(){this.frameRoute([this.mission.state.player,this.mission.target()]);this.updateCamera(0);}
  inspectTraining(){
    this.setPerspective('third-person');
    const id=this.mission.lesson?.id,prop=this.models.get(({solar:'solar',airlock:'airlock',samples:'lab',comms:'relay',logistics:'lab',systems:'habitat',shelter:'habitat'})[id]);
    this.cameraPinned=prop?{...prop.userData.layout}:{...this.mission.target()};this.cameraFocusHeight=id==='comms'?7:3;this.follow=false;this.routeDistance=id==='comms'?45:34;this.zoom=1.2;this.pitch=.55;this.focus.copy(this.world(this.cameraPinned,this.cameraFocusHeight));this.updateCamera(0);
  }
  demonstrateTraining(){this.demonstration={id:this.mission.lesson.id,start:this.frameTime};}
  makeCargo(){
    const g=new THREE.Group();g.name='supply-crate';mesh(g,new THREE.BoxGeometry(2.7,1.45,1.9),this.mat.orange);mesh(g,new THREE.BoxGeometry(2.85,1.55,.16),this.mat.silver);mesh(g,new THREE.BoxGeometry(.16,1.55,2.05),this.mat.silver);return g;
  }
  refreshMission() {
    for(const g of this.surveys){this.scene.remove(g);g.traverse(o=>o.geometry?.dispose());}
    this.surveys=this.mission.science.map(p=>{const g=createSurvey(this.mat);g.position.copy(this.world(p));g.userData.site=p;this.scene.add(g);return g;});
    this.pathKeys={};this.lastDrawTime=null;this.demonstration=null;this.updateActors(0);this.resetCamera();
  }
  screenMarker(point,offset=4,occlusion=false) {
    const world=this.world(point,offset),position=world.clone().project(this.camera);
    const ahead=world.clone().sub(this.camera.position).dot(this.camera.getWorldDirection(new V()))>0;
    let visible=ahead;
    if(occlusion&&visible){
      const body=this.world(point,2.5),distance=this.camera.position.distanceTo(body);
      const ray=new THREE.Raycaster(this.camera.position,body.clone().sub(this.camera.position).normalize(),0,Math.max(0,distance-.35));
      visible=ray.intersectObjects([this.scenery,this.ground,...(this.mission.state.rover.occupied?[]:[this.rover])],true).length===0;
    }
    let px=(position.x+1)*this.width/2,py=(1-position.y)*this.height/2;
    const delta={x:point.x-this.mission.state.player.x,y:point.y-this.mission.state.player.y},basis=this.mission.screenBasis||{right:this.inputVector(1,0),down:this.inputVector(0,1)};
    const sx=delta.x*basis.right.dx+delta.y*basis.right.dy,sy=delta.x*basis.down.dx+delta.y*basis.down.dy;
    const arrow=['→','↘','↓','↙','←','↖','↑','↗'][(Math.round(Math.atan2(sy,sx)/(Math.PI/4))+8)%8];
    const edge=px<110||px>this.width-110||py<190||py>this.height-145;
    if(!ahead){const scale=Math.max(.01,Math.abs(sx),Math.abs(sy));px=this.width/2+sx/scale*this.width/2;py=this.height/2+sy/scale*this.height/2;}
    if(!occlusion&&!ahead)visible=true;
    return{x:clamp(px,110,Math.max(110,this.width-110)),y:clamp(py,190,Math.max(190,this.height-145)),visible:visible&&(!occlusion||!edge),edge:edge||!ahead,arrow};
  }
  frameRoute(path) {
    if(!path?.length)return;
    this.setPerspective('third-person');
    const points=path.map(p=>this.world(p,3)),bounds=new THREE.Box3().setFromPoints(points),center=bounds.getCenter(new V());
    const t=this.mission.terrain;this.cameraPinned={x:center.x/WORLD_SCALE+(t.width-1)/2,y:center.z/WORLD_SCALE+(t.height-1)/2};
    this.cameraFocusHeight=center.y-this.world(this.cameraPinned).y;
    const halfFov=Math.min(this.camera.fov*Math.PI/360,Math.atan(Math.tan(this.camera.fov*Math.PI/360)*this.camera.aspect));
    const radius=Math.max(12,...points.map(p=>p.distanceTo(center)));
    this.routeDistance=Math.max(50,radius/Math.sin(halfFov)*1.55)/Math.hypot(1,.76);this.zoom=1;this.pitch=Math.max(this.pitch,.65);this.follow=false;this.focus.copy(center);
  }
  updateCamera(dt) {
    const s=this.mission.state;
    if(this.perspective==='first-person'){
      this.follow=true;this.cameraPinned=null;this.focus.copy(this.world(s.player,2.8));
      // EVA eye level matches the model's visor. Echo uses its roof-mounted driving camera.
      const eye=this.world(s.player,s.rover.occupied?3.35:4.25+(s.player.jump||0)*1.2);
      this.camera.position.copy(eye);
      const dir=new V(Math.sin(this.lookYaw)*Math.cos(this.lookPitch),Math.sin(this.lookPitch),Math.cos(this.lookYaw)*Math.cos(this.lookPitch));
      this.camera.lookAt(eye.clone().add(dir));this.camera.updateMatrixWorld(true);this.updateSun();
      this.mission.screenBasis={right:this.inputVector(1,0),down:this.inputVector(0,1)};return;
    }
    const target=this.world(this.cameraPinned||s.player,this.cameraPinned?(this.cameraFocusHeight??2.8):s.rover.occupied?2:2.8);
    const f=this.reducedMotion?1:1-Math.exp(-Math.max(dt,.016)*4);this.focus.lerp(target,f);
    const dist=(this.cameraPinned?this.routeDistance||54:54)*Math.hypot(1,.76)/this.zoom;
    this.camera.position.copy(this.focus).add(new V(Math.sin(this.yaw)*Math.cos(this.pitch)*dist,Math.sin(this.pitch)*dist,Math.cos(this.yaw)*Math.cos(this.pitch)*dist));
    this.keepCameraAboveGround();this.updateSun();
    this.mission.screenBasis={right:this.inputVector(1,0),down:this.inputVector(0,1)};
  }
  updateSun() {
    this.sun.target.position.copy(this.focus);this.sun.position.copy(this.focus).add(new V(-70,44,40));this.sun.target.updateMatrixWorld();
  }
  keepCameraAboveGround() {
    const t=this.mission.terrain,x=this.camera.position.x/WORLD_SCALE+(t.width-1)/2,y=this.camera.position.z/WORLD_SCALE+(t.height-1)/2;
    if(t.inBounds(x,y))this.camera.position.y=Math.max(this.camera.position.y,this.world({x,y}).y+4);
    this.camera.lookAt(this.focus);
  }
  placeRover(point,yaw){
    const ahead={x:Math.sin(yaw)*1.52/WORLD_SCALE,y:Math.cos(yaw)*1.52/WORLD_SCALE},right={x:Math.cos(yaw)*2.55/WORLD_SCALE,y:-Math.sin(yaw)*2.55/WORLD_SCALE};
    const front=this.world({x:point.x+ahead.x,y:point.y+ahead.y}).y,back=this.world({x:point.x-ahead.x,y:point.y-ahead.y}).y;
    const high=this.world({x:point.x+right.x,y:point.y+right.y}).y,low=this.world({x:point.x-right.x,y:point.y-right.y}).y;
    this.rover.position.copy(this.world(point,.03));this.rover.rotation.set(-Math.atan2(front-back,3.04),yaw,Math.atan2(high-low,5.1),'YXZ');
  }
  updateActors(dt,time=0) {
    const s=this.mission.state;this.player.position.copy(this.world(s.player,s.player.jump*1.2));
    this.player.rotation.y=Math.PI/2-s.player.heading;this.player.visible=!s.rover.occupied&&!s.training?.inside&&this.perspective!=='first-person';
    this.placeRover(s.rover,Math.PI/2-(s.rover.occupied?s.player.heading:0));
    const travel=this.lastActorPosition?Math.hypot(this.player.position.x-this.lastActorPosition.x,this.player.position.z-this.lastActorPosition.z):0;
    if(s.moving&&!this.reducedMotion&&travel<6)this.stepPhase+=travel*2.45;
    this.lastActorPosition=this.player.position.clone();
    const desired=s.moving&&!s.rover.occupied?1:0;this.gaitStrength=dt?((this.gaitStrength||0)+(desired-(this.gaitStrength||0))*(1-Math.exp(-dt*9))):desired;
    this.poseAstronaut(this.player,this.stepPhase,time,this.gaitStrength);
    if(s.training?.drill?.collected&&!s.training.drill.stowed)this.player.userData.arms[1].rotation.x=-.55;
    if(this.mission.lesson?.id==='airlock'&&s.training.drill?.suitChecked&&!s.training.inside)this.player.userData.arms[0].rotation.x=-.8;
    this.rover.userData.beacon.material=s.rover.repaired?this.mat.cyan:this.mat.amber;
    const driven=this.lastRoverPosition?this.rover.position.distanceTo(this.lastRoverPosition):0;
    if(s.rover.occupied&&s.moving&&!this.reducedMotion&&driven<6)this.wheelAngle=(this.wheelAngle||0)+driven/.77;
    this.lastRoverPosition=this.rover.position.clone();for(const wheel of this.rover.userData.wheels)wheel.rotation.x=this.wheelAngle||0;
    this.rover.userData.beacon.scale.setScalar(1);
    const relay=this.models.get('relay');if(relay){relay.userData.lamp.material=s.relayOnline?this.mat.cyan:this.mat.amber;relay.userData.lamp.visible=true;}
    const target=this.mission.target();this.marker.position.copy(this.world(target,.28));this.marker.visible=s.status!=='complete'&&!this.cinematic;
    this.marker.scale.setScalar(this.reducedMotion?1:1+Math.sin(time*2)*.12);
    for(const site of this.surveys)site.visible=!s.scans.includes(site.userData.site.id);
    this.satellite.visible=false;
    this.updateTrainingModels(dt,time);
  }
  updateTrainingModels(dt,time){
    const s=this.mission.state,id=this.mission.lesson?.id,d=s.training?.drill;
    let demo=this.demonstration;
    if(demo&&time-demo.start>=7){this.demonstration=null;demo=null;}
    const f=demo?(this.reducedMotion?1:clamp((time-demo.start)/5,0,1)):0;
    const solar=this.models.get('solar'),airlock=this.models.get('airlock'),relay=this.models.get('relay'),lab=this.models.get('lab');
    if(solar){solar.userData.pivot.rotation.set((id==='solar'?(demo?35*f:d.tilt):0)*Math.PI/180,(id==='solar'?(demo?110*f:d.bearing):0)*Math.PI/180,0);}
    if(relay&&id==='comms'){relay.userData.dish.rotation.set((demo?32*f:d.tilt)*Math.PI/180,(demo?72*f:d.bearing)*Math.PI/180,0);}
    else if(relay&&!this.cinematic)relay.userData.dish.rotation.set(.47,0,0);
    if(airlock){
      const open=id==='airlock'&&(demo?f>.75:d.outerOpen),pressure=id==='airlock'?(demo?1-f:d.pressure/100):1;
      const lerp=this.reducedMotion||dt===0?1:1-Math.exp(-dt*4);
      airlock.userData.door.position.z+=(open?3.4-airlock.userData.door.position.z:-airlock.userData.door.position.z)*lerp;
      airlock.userData.pressure.scale.y+=(Math.max(.01,pressure)-airlock.userData.pressure.scale.y)*lerp;
      airlock.userData.light.material=id==='airlock'&&d?.innerClosed?this.mat.amber:this.mat.cyan;
    }
    const sample=id==='samples',logistics=id==='logistics';
    this.fieldSample.visible=sample&&!d.collected;this.carriedSample.visible=sample&&d.collected&&!d.stowed&&!this.mission.near(this.mission.objects.base);
    this.roverCargo.visible=logistics&&(demo?f<.8:d.loaded&&!d.delivered);this.deliveredCargo.visible=logistics&&(demo?f>=.8:d.delivered);
    if(this.outpostCargo)this.outpostCargo.visible=logistics&&!demo&&!d.loaded;
    if(this.mission.practice){this.fieldSample.position.copy(this.world(this.mission.practice,.6));this.deliveredCargo.position.copy(this.world(this.mission.practice,.9));}
    if(lab){
      lab.userData.canister.visible=sample&&(demo||d.collected&&this.mission.near(this.mission.objects.base)||d?.stowed);
      lab.userData.canister.position.x=d?.stowed?2.6:.6;
      lab.userData.lid.rotation.x=sample&&(demo?f<.6:!d.sealed)?-1.8:0;
      lab.userData.identity.material=sample&&(demo?f>.3:d.tagged)?this.mat.cyan:this.mat.amber;
    }
  }
  setPath(name,path,color,dashed=false) {
    const group=this.pathGroups[name],key=(path||[]).map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('|')+color;
    if(this.pathKeys[name]===key)return;this.pathKeys[name]=key;
    for(const child of [...group.children]){child.geometry?.dispose();child.material?.dispose();group.remove(child);}
    if(!path||path.length<2)return;
    const points=[];
    for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.max(2,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*4));for(let j=0;j<steps;j++){const f=j/steps;points.push(this.world({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},.36));}}
    points.push(this.world(path.at(-1),.36));
    const pos=[],indices=[],half=dashed?.11:.18;
    for(let i=0;i<points.length;i++){
      const tangent=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]);const side=new V(-tangent.z,0,tangent.x).normalize().multiplyScalar(half);
      pos.push(...points[i].clone().add(side).toArray(),...points[i].clone().sub(side).toArray());
      if(i&&(!dashed||i%5<3)){const k=i*2;indices.push(k-2,k-1,k,k-1,k+1,k);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setIndex(indices);
    const material=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,depthTest:true,depthWrite:false});group.add(new THREE.Mesh(geometry,material));
  }
  updatePaths(life) {
    const s=this.mission.state;
    this.setPath('lifeline',this.showLifeline&&s.status!=='ready'?life?.route?.path:null,life?.safe?'#cfdddd':'#ed8b4b',true);
    this.setPath('trail',s.trail,'#405c67',true);
    this.setPath('active',this.mission.route?[s.player,...this.mission.route.path.slice(this.mission.route.index)]:null,'#f7a755');
    this.setPath('assisted',this.assistedRoute?.path,this.assistedRoute?.safe?'#77dac6':'#ffbc7d');
  }
  toScreen(point,height=0) {
    this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);const p=this.world(point,height).project(this.camera);
    return {x:(p.x+1)*this.width/2,y:(1-p.y)*this.height/2,visible:p.z>-1&&p.z<1};
  }
  fromScreen(x,y) {
    this.pointer.set(x/this.width*2-1,1-y/this.height*2);this.camera.updateMatrixWorld(true);this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hit=this.raycaster.intersectObjects([this.ground,...this.scenery.children,this.rover],true)[0];
    if(!hit)return null;
    let obj=hit.object;while(obj&&obj!==this.scene){if(obj===this.rover)return {...this.mission.state.rover};if(obj.userData.layout)return {...(obj.userData.layout.kind==='relay'?this.mission.objects.relay:this.mission.objects.base)};obj=obj.parent;}
    const t=this.mission.terrain;return {x:hit.point.x/WORLD_SCALE+(t.width-1)/2,y:hit.point.z/WORLD_SCALE+(t.height-1)/2};
  }
  clearEffects() {for(const p of this.particles){this.fxGroup.remove(p.mesh);p.mesh.geometry.dispose();}this.particles=[];this.bursts=[];}
  trigger(kind,point=this.mission.state.player) {
    if(this.reducedMotion)return;const rng=randomGenerator(Math.floor(this.frameTime*1000)+72),color=kind==='survey'?'#75ead0':kind==='victory'?'#e7d5a3':'#ee9a54';
    const material=new THREE.MeshBasicMaterial({color,depthTest:true,depthWrite:false});
    for(let i=0;i<(kind==='route'?8:26);i++){
      const m=mesh(this.fxGroup,new THREE.IcosahedronGeometry(.06+rng()*.10,0),material,this.world(point,1).toArray());m.castShadow=false;
      this.particles.push({mesh:m,v:new V((rng()-.5)*5,1+rng()*5,(rng()-.5)*5),age:0,life:1+rng()*1.2});
    }
  }
  updateFX(dt) {
    const s=this.mission.state;
    if(s.moving&&!this.reducedMotion&&this.frameTime-(this.lastDust||0)>.12){
      this.lastDust=this.frameTime;const m=mesh(this.fxGroup,new THREE.IcosahedronGeometry(.13,0),this.mat.rock,this.world(s.player,.18).toArray());m.castShadow=false;
      this.particles.push({mesh:m,v:new V(Math.sin(this.stepPhase)*.35,.5,-.15),age:0,life:.55});
    }
    for(const p of [...this.particles]){p.age+=dt;p.v.y-=dt*1.62;p.mesh.position.addScaledVector(p.v,dt);p.mesh.scale.setScalar(Math.max(.03,1-p.age/p.life));if(p.age>=p.life){this.fxGroup.remove(p.mesh);p.mesh.geometry.dispose();this.particles.splice(this.particles.indexOf(p),1);}}
  }
  drawMini(canvas,life) {this.maps.assistedRoute=this.assistedRoute;this.maps.drawMini(canvas,life);}
  draw(time=0,life=null) {
    const dt=this.lastDrawTime===null?0:clamp(time-this.lastDrawTime,0,.1);this.lastDrawTime=time;this.frameTime=time;
    this.updateActors(dt,time);this.updateFX(dt);
    if(this.mode==='orbital') {this.maps.drawOrbit(this.orbitCanvas,time);this.orbitTexture.needsUpdate=true;this.device.render(this.orbitScene,this.orbitCamera);return;}
    this.updatePaths(life);this.updateCamera(dt);this.scene.updateMatrixWorld(true);this.device.render(this.scene,this.camera);
  }
  cinematicFrame(elapsed,shot) {
    if(!this.cinematic)this.cinemaLens={fov:this.camera.fov,exposure:this.device.toneMappingExposure};
    this.cinematic=true;this.updateActors(0,elapsed);for(const group of Object.values(this.pathGroups))group.visible=false;
    const motion=openingMotion(elapsed,this.reducedMotion);this.cinematicFade=motion.fade;this.cinemaGroup.visible=true;
    this.lander.position.copy(this.landingOrigin).add(new V(0,motion.landerHeight-motion.legCompression,0));
    this.lander.rotation.set(this.reducedMotion?0:Math.sin(elapsed*1.8)*.035*motion.landerHeight/27,0,this.reducedMotion?0:Math.sin(elapsed*1.3)*.025*motion.landerHeight/27);
    for(const leg of this.lander.userData.legs)leg.position.y=motion.legCompression;
    this.plume.visible=motion.engine>0;this.plume.scale.set(1,motion.engine*1.3,1);this.plume.position.y=1.38-1.4*motion.engine*1.3;
    this.engineLight.intensity=motion.engine*5;
    const s=this.mission.state,roverForward=new V(Math.sin(this.rover.rotation.y),0,Math.cos(this.rover.rotation.y));
    this.placeRover({x:s.rover.x+roverForward.x*(motion.roverTravel-10)/WORLD_SCALE,y:s.rover.y+roverForward.z*(motion.roverTravel-10)/WORLD_SCALE},this.rover.rotation.y);this.rover.rotation.x+=motion.roverBrake;
    for(const wheel of this.rover.userData.wheels)wheel.rotation.x=motion.roverTravel/.77;
    this.rover.userData.beacon.scale.setScalar(this.reducedMotion?1:.82+Math.max(0,Math.sin(elapsed*5))*.18);
    const forward=new V(Math.sin(.35),0,Math.cos(.35)),cadetPoint={x:s.player.x+forward.x*(motion.cadetTravel-5)/WORLD_SCALE,y:s.player.y+forward.z*(motion.cadetTravel-5)/WORLD_SCALE};
    this.player.position.copy(this.world(cadetPoint));this.player.rotation.y=.35;this.player.visible=true;
    this.poseAstronaut(this.player,motion.cadetTravel*2.45,elapsed,motion.cadetStride,motion.wristCheck);
    this.mentor.position.copy(this.world({x:s.player.x+.32,y:s.player.y-.12}));this.mentor.rotation.y=-1.17;
    this.poseAstronaut(this.mentor,0,elapsed,0,this.reducedMotion?0:.3);
    if(!this.reducedMotion){const greet=smooth(clamp((elapsed-22.2)/1.4,0,1));this.mentor.userData.arms[1].rotation.x=-.46*greet;this.mentor.userData.elbows[1].rotation.x=-.8*greet;}
    const relay=this.models.get('relay');relay.userData.dish.rotation.set(motion.relayTilt,motion.relayBearing,0);
    if(shot==='relay'&&!this.reducedMotion)relay.userData.lamp.visible=elapsed%1.1<.85;
    this.updateCinematicDust(elapsed,roverForward);
    let target,offset,t;
    if(shot==='arrival'){
      target=this.world(this.mission.objects.base,5).lerp(this.landingOrigin.clone().add(new V(0,5,0)),.35);
      t=smooth(clamp(elapsed/6,0,1));offset=new V(76-t*23,40-t*13,70-t*16);
    }else if(shot==='echo'){
      target=this.rover.position.clone().add(new V(0,1.9,0));t=smooth(clamp((elapsed-6)/6,0,1));
      offset=new V(-11+t*3,3.1-t*.75,14-t*3).applyAxisAngle(new V(0,1,0),this.rover.rotation.y);
    }else if(shot==='relay'){
      target=relay.position.clone().add(new V(0,6.5,0));t=smooth(clamp((elapsed-12)/7,0,1));offset=new V(17-t*5,4.8+t*1.2,19-t*5);
    }else{
      target=this.player.position.clone().add(new V(0,3,0));t=smooth(clamp((elapsed-19)/7,0,1));offset=new V(8-t*2.5,2.2-t*1.1,12-t*3.2);
    }
    if(this.reducedMotion){const still={arrival:[62,33,64],echo:[-9,3.1,14],relay:[16,5,18],astronaut:[8,2,12]};offset=new V(...still[shot]);}
    offset.multiplyScalar(Math.max(1,1.1/this.camera.aspect));
    this.camera.fov=46;this.camera.setViewOffset(this.width,this.height,-this.width*.10,this.height*.09,this.width,this.height);
    this.device.toneMappingExposure=1.1;this.focus.copy(target);this.camera.position.copy(target).add(offset);this.keepCameraAboveGround();this.updateSun();
    this.scene.updateMatrixWorld(true);this.device.render(this.scene,this.camera);
  }
  updateCinematicDust(time,forward){
    const right=new V(forward.z,0,-forward.x);
    for(const p of this.cinemaDust){
      const age=time-p.start;p.mesh.visible=!this.reducedMotion&&age>=0&&age<p.life;if(!p.mesh.visible)continue;
      let origin,direction;
      if(p.kind==='lander'){
        const radius=2.1+p.size*10;origin=this.world({x:this.landingPoint.x+Math.cos(p.angle)*radius/WORLD_SCALE,y:this.landingPoint.y+Math.sin(p.angle)*radius/WORLD_SCALE},.08);
        direction=new V(Math.cos(p.angle),0,Math.sin(p.angle));
      }else{
        const distance=openingMotion(p.start).roverTravel-10;
        const point=this.world(this.mission.state.rover).addScaledVector(forward,distance-1.2).addScaledVector(right,p.side*2.55);
        const t=this.mission.terrain;origin=this.world({x:point.x/WORLD_SCALE+(t.width-1)/2,y:point.z/WORLD_SCALE+(t.height-1)/2},.08);
        direction=forward.clone().multiplyScalar(-.8).addScaledVector(right,p.side*(.25+Math.abs(Math.sin(p.angle))*.35)).normalize();
      }
      const dust=ballisticDust(age,p.speed,p.lift);p.mesh.position.copy(origin).addScaledVector(direction,dust.distance);p.mesh.position.y+=dust.height;
      p.mesh.scale.setScalar(p.size*clamp((p.life-age)/.4,0,1));
      if(dust.height===0&&age>.1)p.mesh.visible=false;
    }
  }
  endCinematic() {
    this.cinematic=false;this.cinematicFade=0;this.satellite.visible=false;this.cinemaGroup.visible=false;this.engineLight.intensity=0;
    this.camera.clearViewOffset();this.camera.fov=this.cinemaLens?.fov??(this.perspective==='first-person'?72:49);this.camera.updateProjectionMatrix();
    this.device.toneMappingExposure=this.cinemaLens?.exposure??1.15;this.cinemaLens=null;
    for(const group of Object.values(this.pathGroups))group.visible=true;
    this.lastDrawTime=null;this.lastActorPosition=null;this.lastRoverPosition=null;this.updateActors(0,this.frameTime);
    this.focus.copy(this.world(this.mission.state.player,2.8));this.updateCamera(0);
  }
  dispose() {this.scene.traverse(o=>{o.geometry?.dispose();});this.device.dispose();}
}
