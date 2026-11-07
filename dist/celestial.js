import * as THREE from 'three';
import { localSky, skyDirection } from './voyage.js';
import { randomGenerator } from './engine.js';
export const BODY_COLORS={Sun:'#fff0c2',Mercury:'#9b9590',Venus:'#dcc39b',Earth:'#598ac5',Moon:'#989995',Mars:'#a46039',Jupiter:'#bda993',Saturn:'#c8b991',Uranus:'#9cafaf',Neptune:'#426898',Phobos:'#776958',Deimos:'#918470',Io:'#d7bd74',Europa:'#bda588',Ganymede:'#867e71',Callisto:'#57534b',Titan:'#b49662',Enceladus:'#c7ccd0',Titania:'#8f9298',Triton:'#b0a69c',Pluto:'#bda391',Charon:'#7f858a',Ceres:'#686866',Vesta:'#7f796c',Eris:'#adb3b3',Halley:'#534e49'};
const V=THREE.Vector3;
export function planetMaterial(name,createCanvas,data){
 const c=createCanvas(1024,512),ctx=c.getContext('2d'),rng=randomGenerator(name.split('').reduce((n,x)=>n+x.charCodeAt(0),0));
 ctx.fillStyle=BODY_COLORS[name];ctx.fillRect(0,0,1024,512);
 if(['Jupiter','Saturn','Uranus','Neptune'].includes(name)){
  for(let y=0;y<512;y+=2){const f=Math.sin(y*.105)+.4*Math.sin(y*.4);ctx.fillStyle=`rgba(${name==='Jupiter'?'84,53,37':'93,99,94'},${.06+Math.abs(f)*.10})`;ctx.fillRect(0,y,1024,2);}
  if(name==='Jupiter'){ctx.fillStyle='#a26a50';ctx.beginPath();ctx.ellipse(710,315,62,20,-.12,0,Math.PI*2);ctx.fill();}
 }else if(name==='Mars'){
  for(let i=0;i<1800;i++){ctx.fillStyle=i%3?'#754a2d25':'#d7a77838';ctx.beginPath();ctx.ellipse(rng()*1024,rng()*512,4+rng()*60,2+rng()*21,rng()*Math.PI,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#d7d4c7';ctx.fillRect(0,0,1024,12);ctx.fillRect(0,502,1024,10);
 }else if(['Mercury','Moon'].includes(name)){
  for(let i=0;i<1700;i++){const x=rng()*1024,y=rng()*512,r=1+rng()*11;ctx.fillStyle='#302d2a33';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#dad3c329';ctx.lineWidth=1;ctx.stroke();}
 }
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const m=name==='Sun'?new THREE.MeshBasicMaterial({map:texture,color:'#fff8e3',toneMapped:false}):new THREE.MeshStandardMaterial({map:texture,roughness:1,metalness:0});
 if(data?.assets?.[name]&&typeof Image!=='undefined'){
  const img=new Image();img.onload=()=>{texture.image=img;texture.needsUpdate=true;};img.src=data.assets[name].data;
 }
 return m;
}
export function atmosphere(parent,radius,color){
 const m=new THREE.ShaderMaterial({uniforms:{tint:{value:new THREE.Color(color)}},vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n;varying vec3 v;uniform vec3 tint;void main(){float rim=pow(1.0-abs(dot(normalize(n),normalize(v))),3.5);gl_FragColor=vec4(tint,rim*0.42);}',transparent:true,depthTest:true,depthWrite:false,side:THREE.BackSide});
 const g=new THREE.Mesh(new THREE.SphereGeometry(radius*1.013,48,24),m);g.castShadow=false;parent.add(g);return g;
}
export function globe(name,radius,createCanvas,data){
 const g=new THREE.Group();g.name=name+'-globe';const sphere=new THREE.Mesh(new THREE.SphereGeometry(radius,64,40),planetMaterial(name,createCanvas,data));g.add(sphere);
 if(name==='Earth'){
  const c=createCanvas(512,256),ctx=c.getContext('2d'),rng=randomGenerator(299);ctx.fillStyle='#000';ctx.fillRect(0,0,512,256);
  for(let i=0;i<430;i++){ctx.fillStyle=`rgba(255,255,255,${.02+rng()*.15})`;ctx.beginPath();ctx.ellipse(rng()*512,rng()*256,5+rng()*27,1+rng()*4,(rng()-.5)*.65,0,Math.PI*2);ctx.fill();}
  const t=new THREE.CanvasTexture(c),cloud=new THREE.Mesh(new THREE.SphereGeometry(radius*1.001,48,28),new THREE.MeshStandardMaterial({map:t,alphaMap:t,transparent:true,opacity:.85,depthWrite:false,roughness:1,color:'#fff'}));cloud.name='reconstructed-static-earth-clouds';g.add(cloud);g.userData.cloud=cloud;
 }
 if(name==='Earth')atmosphere(g,radius,'#5290e0');if(name==='Mars')atmosphere(g,radius,'#c38455');
 if(name==='Saturn'){const ring=new THREE.Mesh(new THREE.RingGeometry(radius*1.25,radius*2.25,80),new THREE.MeshStandardMaterial({color:'#ac9a77',roughness:1,side:THREE.DoubleSide,transparent:true,opacity:.75,depthWrite:true}));ring.rotation.x=Math.PI/2;g.add(ring);}
 return g;
}
export class SurfaceSky{
 constructor(renderer,data,world){
  this.r=renderer;this.data=data;this.world=world;this.hour=12;this.group=new THREE.Group();this.group.name='local-horizon-sky';renderer.scene.add(this.group);this.bodies=new Map();
  for(const body of localSky(data,world,this.hour)){const g=globe(body.name,1,renderer.createCanvas,data);this.group.add(g);this.bodies.set(body.name,g);}
  const rng=randomGenerator(6364),p=new Float32Array(2400*3);for(let i=0;i<2400;i++){const y=rng()*2-1,a=rng()*Math.PI*2,r=Math.sqrt(1-y*y);p.set([r*Math.sin(a)*1700,y*1700,-r*Math.cos(a)*1700],i*3);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));this.stars=new THREE.Points(geo,new THREE.PointsMaterial({color:'#abb7c9',size:.72,transparent:true,depthWrite:false}));this.group.add(this.stars);
  this.fill=new THREE.HemisphereLight('#dfbca5','#483021',.28);if(world==='mars')renderer.scene.add(this.fill);
  this.update();
 }
 update(){
  const r=this.r,list=localSky(this.data,this.world,this.hour),sun=list.find(b=>b.name==='Sun');
  this.group.position.copy(r.camera.position);
  for(const b of list){const g=this.bodies.get(b.name),d=skyDirection(b),radius=1600*Math.tan(b.diameterArcsec*Math.PI/(3600*360));
   g.position.set(d.x*1600,d.y*1600,d.z*1600);g.scale.setScalar(Math.max(this.telescope===b.name?.001:b.name==='Sun'||b.name==='Earth'&&this.world==='moon'?.01:.38,radius));g.visible=b.altitude>-.4;
  }
  const day=sun.altitude>0;this.stars.visible=!day;this.stars.material.opacity=this.world==='mars'?.7:.65;
  r.scene.background.set(this.world==='mars'?(day?'#867060':'#07090e'):'#010206');
  if(this.world==='mars'){r.scene.fog=new THREE.Fog(r.scene.background,170,2000);this.fill.intensity=day?.65:.12;}else r.scene.fog=null;
  r.skySunDirection=new V(...Object.values(skyDirection(sun)));r.sun.intensity=day?(this.world==='mars'?2.3:3.8):0;
  // A low training fill and suit lamp keep nearby instruments legible after sunset.
  r.updateSun();return list;
 }
 aim(name,telescope=false){const b=localSky(this.data,this.world,this.hour).find(x=>x.name===name);if(!b||b.altitude<0)return false;const d=skyDirection(b);this.r.setPerspective('first-person');this.telescope=telescope?name:null;this.r.camera.fov=telescope?Math.max(.03,Math.min(12,b.diameterArcsec/3600*7)):72;this.r.camera.updateProjectionMatrix();this.r.lookYaw=Math.atan2(d.x,d.z);this.r.lookPitch=b.altitude*Math.PI/180;this.r.updateCamera(0);return true;}
 dispose(){this.r.scene.remove(this.group,this.fill);this.group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}
}
