import * as THREE from 'three';
import {createAstronaut,SUIT_ACCENTS} from './models.js';
import {batchStaticMeshes} from './static-batch.js';
import {isOccupied} from './world-layout.js';

/** Three visible coworkers plus the player = four crew. Decorative routines use
 * the real collision grid, but never secretly complete tasks or spend resources. */
export class CompanionCrew {
 constructor(renderer){
  this.renderer=renderer;this.mission=renderer.mission;this.group=new THREE.Group();this.group.name='haven-three-companions';renderer.scene.add(this.group);
  const m=this.mission,b=m.objects.base,c=m.terrain.cell;
  this.stations=['greenhouse','solar','lab'].map(id=>{
   const prop=m.props.find(p=>p.id===id);if(!prop)return {...b};
   const points=Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return {x:prop.x+Math.cos(a)*(Math.hypot(prop.halfX,prop.halfY)+2/c),y:prop.y+Math.sin(a)*(Math.hypot(prop.halfX,prop.halfY)+2/c)};});
   return points.find(p=>m.terrain.inBounds(p.x,p.y)&&!isOccupied(p,m.colliders(),.4/c)&&m.terrain.route(b,p,m.config.walkMaxSlopeDegrees))||{...b};
  });
  this.actors=this.stations.map((p,i)=>{const model=createAstronaut(renderer.mat,{accent:[SUIT_ACCENTS.botanist,SUIT_ACCENTS.engineer,SUIT_ACCENTS.scientist][i]});batchStaticMeshes(model);model.name=['Botanist Mira','Engineer Sol','Scientist Kai'][i];if(renderer.physical)model.scale.setScalar(.35*renderer.unitsPerMetre);this.group.add(model);return {model,position:{...p},station:i,wait:5+i*3,phase:i,path:[],index:0};});
 }
 update(dt,time){
  const r=this.renderer,m=this.mission;this.group.visible=!r.cinematic&&!r.skyOnly;if(!this.group.visible)return;
  const active=m.state.status==='playing'&&!r.reducedMotion;
  for(const a of this.actors){
   let walking=false;
   if(active&&dt>0){
    if(a.wait>0)a.wait-=dt;
    else if(a.index>=a.path.length){a.station=(a.station+1)%this.stations.length;const destination=this.stations[a.station];const route=m.terrain.route(a.position,destination,m.config.walkMaxSlopeDegrees);a.path=route?.path||[];a.index=0;a.wait=route?0:8;}
    else {const p=a.path[a.index],dx=p.x-a.position.x,dy=p.y-a.position.y,d=Math.hypot(dx,dy),step=Math.min(d,dt*.8/m.terrain.cell),next={x:a.position.x+dx/(d||1)*step,y:a.position.y+dy/(d||1)*step};
     if(m.terrain.canStep(a.position,next,m.config.walkMaxSlopeDegrees)){a.position=next;walking=step>0;a.model.rotation.y=Math.atan2(dx,dy);a.phase+=step*m.terrain.cell*2.5;if(d<=step+.00001)a.index++;if(a.index>=a.path.length)a.wait=7+a.station*2;}
     else {a.path=[];a.index=0;a.wait=3;}
    }
   }
   a.model.position.copy(r.world(a.position));r.poseAstronaut(a.model,a.phase,time,walking?.7:0,!walking&&active?.65:0);
  }
 }
}
