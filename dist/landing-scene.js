import * as THREE from 'three';
import { clamp, randomGenerator } from './engine.js';
import { WORLD_SCALE } from './world-layout.js';

const V=THREE.Vector3;
export const SURFACE_APPROACH_PHASES=['capture','speed','angle','descent','go-around','landed'];

export function landingFrame(width,height){
  if(width<=620){const top=height<=550?151:height<=680?177:205,bottom=height<=550?190:height<=680?203:214;return {left:14,top,right:width-14,bottom:Math.max(top+50,height-bottom)};}
  const top=height<=520?232:130;return {left:20,top,right:Math.max(180,width-355),bottom:Math.max(top+50,height-30)};
}

// Render descent in the exact terrain, outpost and sky used for surface play.
// This owns only the exhaust and grains; all borrowed objects stay with Renderer.
export class LandingScene {
  constructor(flightRenderer){
    this.flight=flightRenderer;this.r=flightRenderer.r;this.sim=flightRenderer.sim;this.scene=this.r.scene;
    this.effects=new THREE.Group();this.effects.name='landing-exhaust-and-ballistic-grains';this.effects.visible=false;this.scene.add(this.effects);
    this.plumeMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},strength:{value:0}},vertexShader:'varying vec2 st;void main(){st=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 st;uniform float time;uniform float strength;void main(){float fade=pow(st.y,1.7)*(.86+.14*sin(st.x*31.-time*20.+st.y*26.));vec3 color=mix(vec3(.17,.33,.62),vec3(.82,.94,1.),pow(st.y,3.));gl_FragColor=vec4(color,fade*strength*.30);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
    this.plume=new THREE.Mesh(new THREE.CylinderGeometry(.47,2.0,6.0,28,8,true),this.plumeMaterial);this.plume.name='landing-vacuum-exhaust';this.effects.add(this.plume);
    const rng=randomGenerator(60822);this.seeds=Array.from({length:120},()=>({angle:rng()*Math.PI*2,speed:1+rng()*2.3,lift:.4+rng()*.75,delay:rng()*.6,size:.025+rng()*.055}));
    this.grains=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),this.r.mat.rock,120);this.grains.name='gravity-driven-landing-grains';this.grains.castShadow=false;this.effects.add(this.grains);
  }
  visibleNodes(){const r=this.r;return [r.player,r.marker,r.fieldSample,r.deliveredCargo,r.mentor,r.cinemaGroup,r.lander,r.plume,...r.cinemaDust.map(d=>d.mesh),...Object.values(r.pathGroups)];}
  draw(){
    const v=this.flight,r=this.r,f=this.sim,camera=v.camera,u=r.unitsPerMetre,tele=f.telemetry(),p=f.phase,t=f.elapsed,lander=r.lander;
    const visibility=this.visibleNodes().map(node=>[node,node.visible]),focus=r.focus.clone(),skyCamera=r.surfaceSky?.camera,skyView=r.surfaceSky?.getView;
    const cockpitParent=v.cockpit.parent,cockpitPosition=v.cockpit.position.clone(),cockpitScale=v.cockpit.scale.clone(),cockpitVisible=v.cockpit.visible,windowVisible=v.windowEarth.visible,helmetVisible=v.pilot.userData.helmet.visible,engineIntensity=r.engineLight.intensity,inside=!!f.cabinFlight;
    try{
      for(const [node]of visibility)node.visible=false;r.cinemaGroup.visible=true;lander.visible=!inside;this.effects.visible=true;r.engineLight.intensity=0;
      r.positionLander(tele.altitudeM,p==='descent'?(f.angleLocked||0)*Math.PI/180*clamp(tele.altitudeM/80,0,1):0);
      const target=lander.position.clone().add(new V(0,4.7*u,0));r.focus.copy(target);
      const burning=p!=='landed',strength=p==='descent'?clamp(.45+tele.altitudeM/100,.45,1):.70;this.plume.visible=burning;this.plume.scale.setScalar(u);this.plume.position.copy(new V(0,-1.62*u,0).applyQuaternion(lander.quaternion)).add(lander.position);this.plume.quaternion.copy(lander.quaternion);this.plumeMaterial.uniforms.strength.value=burning?strength:0;this.plumeMaterial.uniforms.time.value=r.reducedMotion?0:t;
      this.drawDust(tele);
      camera.near=.03*u;camera.far=Math.max(3000,70000*u);camera.fov=inside?72:52;camera.aspect=r.width/r.height;camera.clearViewOffset();camera.updateProjectionMatrix();
      if(inside){
        this.scene.add(v.cockpit);v.cockpit.visible=true;v.cockpit.scale.setScalar(.35*u);v.cockpit.position.copy(lander.position).add(new V(0,5*u,0));v.windowEarth.visible=false;v.pilot.userData.helmet.visible=!v.pilotView;v.cockpit.updateMatrixWorld(true);
        const eye=v.cockpit.localToWorld(new V(...(v.pilotView?[0,3.75,-.15]:[3.25,4.85,-3.55]))),aim=v.cockpit.localToWorld(new V(.3,2.9,3.8)),direction=aim.sub(eye).applyAxisAngle(new V(0,1,0),v.lookYaw);direction.y+=v.lookPitch*1.75*u;camera.position.copy(eye);camera.lookAt(eye.clone().add(direction));
      }else{
        const frame=landingFrame(r.width,r.height),h=(frame.bottom-frame.top)/r.height,w=(frame.right-frame.left)/r.width,half=52*Math.PI/360,horizontal=Math.atan(Math.tan(half)*camera.aspect),yaw=.62+v.lookYaw,pitch=clamp(.28+.72*clamp(tele.altitudeM/80,0,1)+v.lookPitch,.10,1.14),verticalRadius=5.3*Math.cos(pitch)+6.9*Math.sin(pitch),distance=1.13*Math.max(26,6.9/(Math.sin(horizontal)*w),verticalRadius/(Math.sin(half)*h))*u;
        camera.position.copy(target).add(new V(Math.sin(yaw)*distance*Math.cos(pitch),distance*Math.sin(pitch),Math.cos(yaw)*distance*Math.cos(pitch)));
        const terrain=r.mission.terrain,point={x:camera.position.x/WORLD_SCALE+(terrain.width-1)/2,y:camera.position.z/WORLD_SCALE+(terrain.height-1)/2};if(terrain.inBounds(point.x,point.y))camera.position.y=Math.max(camera.position.y,r.world(point).y+.6*u);
        camera.lookAt(target);camera.setViewOffset(r.width,r.height,r.width/2-(frame.left+frame.right)/2,r.height/2-(frame.top+frame.bottom)/2,r.width,r.height);
      }
      camera.updateMatrixWorld(true);
      if(r.surfaceSky){r.surfaceSky.camera=camera;if(f.world){r.surfaceSky.getView=()=>{const geo=r.mission.terrain.geo(r.landingPoint),height=(camera.position.y-r.world(r.landingPoint).y)/u;return {...f.world.sky(f.destination,{...geo,elevation:geo.elevation+height},{dust:f.destination==='mars'?.22:0}),dust:f.destination==='mars'?.22:0};};}r.surfaceSky.update();}
      r.updateSun();this.scene.updateMatrixWorld(true);r.device.render(this.scene,camera);this.lastAltitude=tele.altitudeM;this.lastFrame=landingFrame(r.width,r.height);
    }finally{
      r.focus.copy(focus);if(r.surfaceSky){r.surfaceSky.camera=skyCamera;r.surfaceSky.getView=skyView;}
      cockpitParent.add(v.cockpit);v.cockpit.position.copy(cockpitPosition);v.cockpit.scale.copy(cockpitScale);v.cockpit.visible=cockpitVisible;v.windowEarth.visible=windowVisible;v.pilot.userData.helmet.visible=helmetVisible;r.engineLight.intensity=engineIntensity;
      for(const [node,visible]of visibility)node.visible=visible;this.effects.visible=false;
    }
  }
  drawDust(tele){
    const r=this.r,f=this.sim,u=r.unitsPerMetre,gravity=r.mission.config.physics.surfaceGravityMetresPerSecondSquared??r.mission.config.physics.moonSurfaceGravityMetresPerSecondSquared,time=f.phase==='landed'?12+f.elapsed:f.elapsed;
    this.grains.visible=!r.reducedMotion&&(f.phase==='descent'&&tele.altitudeM<10||f.phase==='landed'&&f.elapsed<1.8);this.grains.count=0;if(!this.grains.visible)return;
    for(const s of this.seeds){const life=2*s.lift/gravity,age=f.phase==='landed'?time-11.4-s.delay:(time+s.delay)%life;if(age<0||age>life)continue;const travel=s.speed*age,point={x:r.landingPoint.x+Math.cos(s.angle)*travel/r.mission.terrain.cell,y:r.landingPoint.y+Math.sin(s.angle)*travel/r.mission.terrain.cell},position=r.world(point,(s.lift*age-.5*gravity*age*age+.04)*u),matrix=new THREE.Matrix4().compose(position,new THREE.Quaternion(),new V(s.size*u,s.size*u*.35,s.size*u));this.grains.setMatrixAt(this.grains.count++,matrix);}
    this.grains.instanceMatrix.needsUpdate=true;this.grains.userData.gravity=gravity;
  }
  dispose(){this.scene.remove(this.effects);this.plume.geometry.dispose();this.plumeMaterial.dispose();this.grains.geometry.dispose();}
}
