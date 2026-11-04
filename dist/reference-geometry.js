import * as THREE from 'three';
import { randomGenerator } from './engine.js';
import { WORLD_SCALE } from './world-layout.js';

function subtractBounds(b,a){
  const x0=Math.max(b.x0,a.x0),x1=Math.min(b.x1,a.x1),y0=Math.max(b.y0,a.y0),y1=Math.min(b.y1,a.y1);
  if(x1<=x0||y1<=y0)return [b];
  return [{...b,x1:x0},{...b,x0:x1},{...b,x0,x1,y1:y0},{...b,x0,x1,y0:y1}].filter(p=>p.x1-p.x0>.001&&p.y1-p.y0>.001);
}

export function referencePatches(mission){
  if(!mission.landscape)return [];
  const t=mission.terrain,sites=[{...mission.objects.base,radius:155},mission.objects.relay,mission.objects.rover,...mission.science],patches=[];
  for(const p of sites){
    const radius=Math.ceil((p.radius||35)/t.cell*2)/2,b={x0:Math.max(0,Math.floor((p.x-radius)*2)/2),x1:Math.min(t.width-1,Math.ceil((p.x+radius)*2)/2),y0:Math.max(0,Math.floor((p.y-radius)*2)/2),y1:Math.min(t.height-1,Math.ceil((p.y+radius)*2)/2)};
    if(!patches.some(a=>b.x0<a.x1&&b.x1>a.x0&&b.y0<a.y1&&b.y1>a.y0))patches.push(b);
  }
  if(mission.config.world==='moon')for(const feature of mission.landscape.features.filter(f=>f.kind==='crater')){
    const p=mission.landscape.grid(feature),radius=feature.r*1.62/t.cell;
    const bounds={x0:Math.max(0,Math.floor((p.x-radius)*2)/2),x1:Math.min(t.width-1,Math.ceil((p.x+radius)*2)/2),y0:Math.max(0,Math.floor((p.y-radius)*2)/2),y1:Math.min(t.height-1,Math.ceil((p.y+radius)*2)/2),stepMetres:1,impact:true};
    let pieces=[bounds];for(const existing of patches){pieces=pieces.flatMap(b=>subtractBounds(b,existing));if(!pieces.length)break;}
    patches.push(...pieces);
  }
  return patches;
}

// The walking surface is the actual rendered triangle, including at LOD seams.
// This prevents boots and gravel from hovering over a bilinear/coarse-grid mismatch.
export function surfaceSample(geometry,bounds){
  return {bounds,nx:geometry.parameters.widthSegments,ny:geometry.parameters.heightSegments,positions:geometry.attributes.position.array};
}
export function renderedSurfaceHeight(samples,x,y){
  const sample=samples?.find(s=>x>=s.bounds.x0&&x<=s.bounds.x1&&y>=s.bounds.y0&&y<=s.bounds.y1);
  if(!sample)return null;
  const {bounds:b,nx,ny,positions:p}=sample,ax=(x-b.x0)/(b.x1-b.x0)*nx,az=(y-b.y0)/(b.y1-b.y0)*ny;
  const ix=Math.min(nx-1,Math.max(0,Math.floor(ax))),iz=Math.min(ny-1,Math.max(0,Math.floor(az))),u=ax-ix,v=az-iz;
  const a=iz*(nx+1)+ix,h00=p[a*3+1],h10=p[(a+1)*3+1],h01=p[(a+nx+1)*3+1],h11=p[(a+nx+2)*3+1];
  return u+v<=1?h00*(1-u-v)+h10*u+h01*v:h11*(u+v-1)+h10*(1-v)+h01*(1-u);
}

export function surfaceGeometry(renderer,bounds,stepMetres){
  const t=renderer.mission.terrain,lunar=renderer.mission.config.world==='moon',subdivisions=Math.ceil(t.cell/2/stepMetres);
  const nx=lunar?Math.round((bounds.x1-bounds.x0)*2*subdivisions):Math.ceil((bounds.x1-bounds.x0)*t.cell/stepMetres),ny=lunar?Math.round((bounds.y1-bounds.y0)*2*subdivisions):Math.ceil((bounds.y1-bounds.y0)*t.cell/stepMetres),g=new THREE.PlaneGeometry((bounds.x1-bounds.x0)*WORLD_SCALE,(bounds.y1-bounds.y0)*WORLD_SCALE,nx,ny);g.rotateX(-Math.PI/2);g.translate(((bounds.x0+bounds.x1)/2-(t.width-1)/2)*WORLD_SCALE,0,((bounds.y0+bounds.y1)/2-(t.height-1)/2)*WORLD_SCALE);
  const p=g.attributes.position,uv=g.attributes.uv,colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i)/WORLD_SCALE+(t.width-1)/2,y=p.getZ(i)/WORLD_SCALE+(t.height-1)/2,h=t.heightAt(x,y),tint=t.reference?.tint(x,y,h)||[.94,.94,.94];
    p.setY(i,renderer.world({x,y}).y);uv.setXY(i,x/(t.width-1),1-y/(t.height-1));colors.set(tint,i*3);
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.computeVertexNormals();return g;
}

export function removePatchTriangles(geometry,patches,terrain){
  const kept=[],a=geometry.index.array,p=geometry.attributes.position;
  for(let i=0;i<a.length;i+=3){const ids=[a[i],a[i+1],a[i+2]],x=ids.reduce((s,j)=>s+p.getX(j),0)/3/WORLD_SCALE+(terrain.width-1)/2,y=ids.reduce((s,j)=>s+p.getZ(j),0)/3/WORLD_SCALE+(terrain.height-1)/2;
    if(!patches.some(b=>x>b.x0&&x<b.x1&&y>b.y0&&y<b.y1))kept.push(...ids);
  }
  geometry.setIndex(kept);return geometry;
}

// One opaque mesh per fractured outcrop; individual plates have exposed edges.
export function layeredOutcropGeometry(radius,height,seed){
  const rng=randomGenerator(seed),positions=[],colors=[],uv=[],levels=8,sides=11,profile=Array.from({length:sides},()=>.80+rng()*.18);
  const triangle=(a,b,c,color)=>{for(const p of [a,b,c]){positions.push(...p);colors.push(...color);uv.push(p[0]/(radius*2)+.5,p[1]/height);}};
  for(let layer=0;layer<levels;layer++){
    const y0=height*layer/levels,y1=height*(layer+1)/levels,shrink=1-layer*.061,lips=layer%3===0?1:.90,palette=layer%2?[.88,.83,.74]:[1.0,.95,.85],bottom=[],top=[];
    for(let j=0;j<sides;j++){const angle=j/sides*Math.PI*2,r=radius*profile[j]*shrink*lips;bottom.push([Math.cos(angle)*r,y0,Math.sin(angle)*r*.81]);top.push([Math.cos(angle)*r*(.95+rng()*.035),y1,Math.sin(angle)*r*.81]);}
    for(let j=0;j<sides;j++){const k=(j+1)%sides;triangle(bottom[j],top[j],bottom[k],palette);triangle(bottom[k],top[j],top[k],palette);triangle([0,y1,0],top[k],top[j],palette);triangle([0,y0,0],bottom[j],bottom[k],palette);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
