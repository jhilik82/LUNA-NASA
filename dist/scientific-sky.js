import * as THREE from 'three';
import { globe, BODY_COLORS } from './celestial.js';
import { DEG, equatorial, dot, bodyMagnitude } from './astronomy-world.js';
import { clamp } from './engine.js';
const V=THREE.Vector3;
const vec=a=>new V(a.x,a.y,a.z);
export function starColor(bv){const t=clamp((bv+.4)/2.4,0,1);return new THREE.Color().setRGB(1-.28*Math.max(0,.5-t),.88-.23*t,1-.48*t,THREE.SRGBColorSpace);}
function phaseMaterial(original){
 const m=new THREE.ShaderMaterial({uniforms:{map:{value:original.map},tint:{value:original.color||new THREE.Color('#adb5b6')},lightDirection:{value:new V(1,0,0)},sun:{value:0},opticalBlur:{value:0},cloud:{value:0}},vertexShader:'varying vec2 uv0;varying vec3 n;void main(){uv0=uv;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D map;uniform vec3 tint;uniform vec3 lightDirection;uniform float sun;uniform float opticalBlur;uniform float cloud;varying vec2 uv0;varying vec3 n;void main(){vec3 c=vec3(0.0);for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){c+=texture2D(map,uv0+vec2(float(x),float(y))*opticalBlur).rgb/9.0;}}c*=tint;float l=mix(.006+.994*max(0.0,dot(normalize(n),normalize(lightDirection))),1.0,sun);gl_FragColor=vec4(mix(c,vec3(1.0),cloud)*l,mix(1.0,smoothstep(.08,.55,c.r)*.85,cloud));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',depthTest:true,depthWrite:true});return m;
}
// Lambert phase and reference V magnitudes give an approximate brightness model; directions and disk sizes remain geometric.
export class ScientificSky {
 constructor({scene,camera,createCanvas,world,getView}){
  this.scene=scene;this.camera=camera;this.createCanvas=createCanvas;this.world=world;this.getView=getView;this.group=new THREE.Group();this.group.name='shared-astronomical-sky';this.group.renderOrder=-10;scene.add(this.group);this.bodies=new Map();this.lastKey='';
  for(const name of Object.keys(world.data.bodies)){
   const g=globe(name,1,createCanvas,world.data),sphere=g.children[0],m=phaseMaterial(sphere.material);m.uniforms.sun.value=name==='Sun'?1:0;sphere.material=m;if(g.userData.cloud){const cm=phaseMaterial(g.userData.cloud.material);cm.uniforms.cloud.value=1;cm.transparent=true;cm.depthWrite=false;g.userData.cloud.material=cm;g.userData.cloudMaterial=cm;}g.userData.phaseMaterial=m;this.bodies.set(name,g);this.group.add(g);
  }
  const stars=world.catalog.stars,geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(stars.length*3),3));geo.setAttribute('color',new THREE.Float32BufferAttribute(stars.flatMap(s=>starColor(s[4]).toArray()),3));geo.setAttribute('brightness',new THREE.Float32BufferAttribute(new Float32Array(stars.length),1));
  const mat=new THREE.ShaderMaterial({vertexColors:true,uniforms:{pixelRatio:{value:1}},vertexShader:'attribute float brightness;varying vec3 col;varying float b;uniform float pixelRatio;void main(){col=color;b=brightness;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=(1.1+min(2.0,brightness))*pixelRatio;}',fragmentShader:'varying vec3 col;varying float b;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.0||b<=0.0)discard;gl_FragColor=vec4(col*b,exp(-r*r*4.)*min(1.0,b));}',transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
  this.stars=new THREE.Points(geo,mat);this.stars.name='Yale-BSC5-catalogue';this.stars.frustumCulled=false;this.group.add(this.stars);this.planetNames=[...this.bodies.keys()];const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(this.planetNames.length*3),3));pg.setAttribute('color',new THREE.Float32BufferAttribute(this.planetNames.flatMap(n=>new THREE.Color(BODY_COLORS[n]).toArray()),3));pg.setAttribute('brightness',new THREE.Float32BufferAttribute(new Float32Array(this.planetNames.length),1));this.planetPoints=new THREE.Points(pg,mat.clone());this.planetPoints.name='unresolved-body-optical-response';this.planetPoints.frustumCulled=false;this.group.add(this.planetPoints);
  this.milkyWay=new THREE.Mesh(new THREE.SphereGeometry(2350,40,20),new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,depthWrite:false,depthTest:true,uniforms:{normal:{value:new V()},opacity:{value:0}},vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 p;uniform vec3 normal;uniform float opacity;void main(){float h=abs(dot(normalize(p),normal));float band=exp(-pow(h/.095,2.));gl_FragColor=vec4(vec3(.16,.18,.23),band*opacity);}' }));this.milkyWay.name='galactic-plane-reconstruction';this.group.add(this.milkyWay);
  this.marsSky=new THREE.Mesh(new THREE.SphereGeometry(2450,40,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthTest:true,depthWrite:false,uniforms:{sunDirection:{value:new V()},day:{value:0},dust:{value:.2}},vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
    varying vec3 p;uniform vec3 sunDirection;uniform float day;uniform float dust;
    void main(){
      vec3 d=normalize(p);float horizon=pow(1.0-max(0.0,d.y),2.4);
      vec3 color=mix(vec3(.24,.16,.105),vec3(.62,.44,.29),horizon);
      color=mix(color,vec3(.55,.41,.29),clamp(dust*.3,0.0,.5));
      float glow=pow(max(0.0,dot(d,normalize(sunDirection))),140.0)*clamp(1.0-abs(sunDirection.y)*6.,0.0,1.0);
      color=mix(color,vec3(.22,.36,.56),glow*.85);
      gl_FragColor=vec4(mix(vec3(.0005,.0008,.0018),color,day),1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` }));this.marsSky.name='martian-dust-scattering-approximation';this.marsSky.renderOrder=-30;this.group.add(this.marsSky);
 }
 update(){
  const view=this.getView(),camera=this.camera,w=this.world;this.group.position.copy(camera.position);const now=performance.now()/1000,dt=Math.min(.2,Math.max(0,now-(this.lastRealTime||now)));this.lastRealTime=now;this.adaptedLimit=this.adaptedLimit===undefined?view.profile.limitingMagnitude:this.adaptedLimit+(view.profile.limitingMagnitude-this.adaptedLimit)*(1-Math.exp(-dt/3));const key=[Math.floor(w.utc),view.observer.geo?.lat?.toFixed(5),view.observer.geo?.lon?.toFixed(5),w.exposure,w.enhanced,view.dust,this.adaptedLimit.toFixed(2)].join(':');
  for(const b of view.bodies){const g=this.bodies.get(b.name);if(!g)continue;g.position.copy(vec(b.direction).multiplyScalar(1600));g.scale.setScalar(1600*Math.sin(b.diameterDeg*DEG/2));const scope=this.telescope===b.name;g.visible=(b.geometricVisible??b.visible)&&(b.name==='Sun'||bodyMagnitude(b,w)<this.adaptedLimit+(scope?4:0));
   // Correct apparent disk sizes, without minimum planet enlargement. Unresolved bodies use an optical point-spread response below.
   g.userData.phaseMaterial.uniforms.lightDirection.value.copy(vec(b.lightDirection));if(g.userData.cloudMaterial)g.userData.cloudMaterial.uniforms.lightDirection.value.copy(vec(b.lightDirection));this.orient(g,b.name,view.observer);g.userData.apparent=b;g.userData.phaseMaterial.uniforms.opticalBlur.value=this.telescope===b.name?Math.min(.16,1.7/b.diameterArcsec/4):0;const i=this.planetNames.indexOf(b.name),pp=this.planetPoints.geometry.attributes.position,pb=this.planetPoints.geometry.attributes.brightness;pp.setXYZ(i,b.direction.x*1599,b.direction.y*1599,b.direction.z*1599);const mag=bodyMagnitude(b,w),pixelAngle=camera.fov*3600/(this.viewportHeight||720);pb.setX(i,b.visible&&b.diameterArcsec<pixelAngle*1.6&&mag<this.adaptedLimit?clamp(Math.pow(10,-.18*(mag-1)),.09,2.7):0);
  }
  const omitted=this.bodies.get(view.observer.host);if(omitted&&!view.bodies.some(b=>b.name===view.observer.host))omitted.visible=false;this.planetPoints.geometry.attributes.position.needsUpdate=true;this.planetPoints.geometry.attributes.brightness.needsUpdate=true;for(const n of this.planetNames)if(!view.bodies.some(b=>b.name===n))this.planetPoints.geometry.attributes.brightness.setX(this.planetNames.indexOf(n),0);
  this.marsSky.visible=view.observer.world==='mars'&&!view.orbital;this.marsSky.material.uniforms.sunDirection.value.copy(vec(view.sun.direction));this.marsSky.material.uniforms.dust.value=view.dust||0;this.marsSky.material.uniforms.day.value=clamp((view.sun.altitude+9)/16,0,1);
  if(key!==this.lastKey){this.lastKey=key;const stars=w.catalog.stars,positions=this.stars.geometry.attributes.position,brightness=this.stars.geometry.attributes.brightness;
   for(let i=0;i<stars.length;i++){const s=stars[i],d=w.starDirection(s,view.observer),separation=Math.acos(clamp(dot(d,view.sun.direction),-1,1))/DEG,visible=d.y>0&&s[3]<=this.adaptedLimit&&separation>12;
    positions.setXYZ(i,d.x*2200,d.y*2200,d.z*2200);brightness.setX(i,visible?clamp(Math.pow(10,-.18*(s[3]-1)),.09,2.7):0);
   }positions.needsUpdate=true;brightness.needsUpdate=true;
   this.milkyWay.material.uniforms.normal.value.copy(vec(w.toLocal(equatorial(192.85948,27.12825),view.observer.basis)));this.milkyWay.material.uniforms.opacity.value=view.profile.limitingMagnitude>4?(w.enhanced?.38:.12)*Math.exp(-(view.dust||0)):0;
  }
  this.lastView=view;return view;
 }
 orient(g,name,observer){
  const w=this.world,t=w.utc,d=((t+69.184)/86400+2440587.5-2451545),spec={Sun:[286.13,63.87,84.176,14.1844],Mercury:[281.01,61.45,329.548,6.1385025],Venus:[272.76,67.16,160.20,-1.4813688],Earth:[0,90,190.147,360.9856235],Mars:[317.681,52.887,176.63,350.89198226],Jupiter:[268.057,64.495,284.95,870.536],Saturn:[40.589,83.537,38.9,810.7939],Uranus:[257.311,-15.175,203.81,-501.160],Neptune:[299.36,43.46,249.978,536.31285]},poly=w.data.orientation?.[name],evalPoly=(a,x)=>a.reduce((sum,n,i)=>sum+n*x**i,0),p=poly?[evalPoly(poly.POLE_RA,d/36525),evalPoly(poly.POLE_DEC,d/36525),evalPoly(poly.PM,d),0]:spec[name];
  let pole,prime;
   if(name==='Moon'||name==='Mars'){
   const world=name==='Moon'?'moon':'mars',site=w.data.sites[world],frame=w.frame(world,{lat:0,lon:0});pole=frame[1];prime=frame[2];
  }else if(p){pole=equatorial(p[0],p[1]);const e=equatorial(p[0]+90,0),n=new V(pole.x,pole.y,pole.z).cross(new V(e.x,e.y,e.z));prime=new V(e.x,e.y,e.z).multiplyScalar(Math.cos((p[2]+p[3]*d)*DEG)).addScaledVector(n,Math.sin((p[2]+p[3]*d)*DEG));}
  else{pole={x:0,y:0,z:1};prime={x:1,y:0,z:0};}
  const y=vec(w.toLocal(pole,observer.basis)).normalize(),x=vec(w.toLocal(prime,observer.basis)).normalize(),z=new V().crossVectors(x,y).normalize();x.crossVectors(y,z);g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
 }
 dispose(){this.scene.remove(this.group);this.group.traverse(o=>{o.geometry?.dispose();o.material?.uniforms?.map?.value?.dispose();o.material?.dispose();});}
}
export class ScientificSurfaceSky extends ScientificSky {
 constructor(renderer,world,destination){
  super({scene:renderer.scene,camera:renderer.camera,createCanvas:renderer.createCanvas,world,getView:()=>{const m=renderer.mission,geo=world.observerOverride||m.terrain.geo(m.state.player),dust=m.state.expedition?.outpost.dust?? (destination==='mars'?.22:0),view=world.sky(destination,geo,{terrain:world.observerOverride?null:m.terrain,point:m.state.player,dust});return {...view,dust};}});this.r=renderer;this.destination=destination;this.viewportHeight=renderer.height;this.telescope=null;this.magnification=1;this.fill=new THREE.HemisphereLight('#e4c5a9','#322821',.25);renderer.scene.add(this.fill);this.earthshine=new THREE.DirectionalLight('#a8bbd8',0);renderer.scene.add(this.earthshine,this.earthshine.target);this.dustSeeds=Array.from({length:40},(_,i)=>[Math.sin(i*37.13)*24,Math.cos(i*13.4)*24,.15+(i%9)*.14]);const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(120),3));this.surfaceDust=new THREE.Points(dg,new THREE.PointsMaterial({color:'#cbb193',size:.09*renderer.unitsPerMetre,transparent:true,opacity:.025,depthWrite:false,depthTest:true}));renderer.scene.add(this.surfaceDust);this.update();
 }
 get hour(){return (this.world.utc%86400)/3600;}
 set hour(h){this.world.setUTC(Math.floor(this.world.utc/86400)*86400+h*3600);}
 update(){
  const view=super.update(),r=this.r,day=view.sun.altitude>0,mars=this.destination==='mars',u=r.unitsPerMetre;
  r.skySunDirection=vec(view.sun.direction);r.sun.color.set(mars?'#fff1dc':'#fffaf2');r.sun.intensity=day?(mars?2.2:3.7)*Math.exp(-view.dust*.5):0;
  // Grading for play: physically the lunar night is near-black and sunlit shadows are pitch dark. Keep the look
  // (dark, cool night; crisp day shadows) but give enough fill to read terrain, suits and equipment.
  this.fill.color.set(mars?(day?'#efc9a2':'#9fb2cf'):(day?'#cfd3db':'#8ea3c4'));this.fill.groundColor.set(mars?'#4a2c1c':day?'#4a4844':'#2b3140');this.fill.intensity=mars?(day?.78:.22):(day?.16:.34);
  r.scene.background.set(mars?'#000103':'#000000');if(mars){this.marsFog ||= new THREE.FogExp2('#c58f62',1);this.marsFog.color.set(day?'#c58f62':'#0b0f18');this.marsFog.density=(.00011+view.dust*.00010)/u;r.scene.fog=this.marsFog;}else r.scene.fog=null;
  r.device.toneMappingExposure=Math.pow(2,this.world.exposure)*(mars?1.12:day?1.08:1.5);r.updateSun();if(r.suitLamp)r.suitLamp.intensity=(day?(mars?8:.6):120)*u*u;
  const earth=view.bodies.find(b=>b.name==='Earth');this.earthshine.intensity=!mars&&earth?.geometricVisible ? .001*earth.illuminated*(earth.diameterDeg/1.9)**2 : 0;
  this.earthshine.target.position.copy(r.world(r.mission.state.player));if(earth)this.earthshine.position.copy(this.earthshine.target.position).addScaledVector(vec(earth.direction),80);
  this.surfaceDust.visible=mars&&day&&!r.reducedMotion&&!r.skyOnly;this.surfaceDust.material.opacity=.012+Math.min(1,view.dust)*.025;
  const center=r.world(r.mission.state.player),t=performance.now()/1000;for(let i=0;i<this.dustSeeds.length;i++){const [x,z,h]=this.dustSeeds[i],east=((x+t*.7)%48+48)%48-24;this.surfaceDust.geometry.attributes.position.setXYZ(i,center.x+east*u,center.y+h*u,center.z+z*u);}this.surfaceDust.geometry.attributes.position.needsUpdate=true;return view.bodies;
 }
 aim(name,telescope=false){const b=this.lastView?.bodies.find(b=>b.name===name);if(!b||!(telescope?b.geometricVisible:b.visible)||name==='Sun'&&telescope)return false;const r=this.r;r.setPerspective('first-person');this.telescope=telescope?name:null;const fov=telescope?72/this.magnification:72;r.camera.fov=fov;r.camera.updateProjectionMatrix();r.lookYaw=Math.atan2(b.direction.x,b.direction.z);r.lookPitch=b.altitude*DEG;r.updateCamera(0);return true;}
 setMagnification(value){this.magnification=clamp(value,1,160);if(this.telescope)this.aim(this.telescope,true);}
 dispose(){this.r.scene.remove(this.fill,this.earthshine,this.earthshine.target,this.surfaceDust);this.surfaceDust.geometry.dispose();this.surfaceDust.material.dispose();super.dispose();}
}
