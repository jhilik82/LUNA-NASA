import * as THREE from 'three';
import { clamp, randomGenerator } from './engine.js';
import { lunarSurfaceMaps, lunarRockGeometry, applyLunarRegolithShader } from './lunar-surface.js';

const hash=(x,y,seed)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
const mix=(a,b,t)=>a+(b-a)*t;
function noise(x,y,cells,seed){
  const px=x*cells,py=y*cells,ix=Math.floor(px),iy=Math.floor(py),sx=px-ix,sy=py-iy,fx=sx*sx*(3-2*sx),fy=sy*sy*(3-2*sy),at=(a,b)=>hash((a%cells+cells)%cells,(b%cells+cells)%cells,seed);
  return mix(mix(at(ix,iy),at(ix+1,iy),fx),mix(at(ix,iy+1),at(ix+1,iy+1),fx),fy);
}
function texture(data,size,color=false){
  const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;if(color)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
}

// Authored PBR reconstructions, in metres. They do not modify the measured DEM.
export function surfaceMaterials(world,size=512){
  if(world==='moon')return lunarSurfaceMaps(size);
  const mars=world==='mars',seed=mars?8213:3917,rng=randomGenerator(seed),tileMetres=mars?8:12;
  const albedo=new Uint8Array(size*size*4),relief=new Uint8Array(albedo.length),roughness=new Uint8Array(albedo.length),rock=new Uint8Array(albedo.length),rockRelief=new Uint8Array(albedo.length);
  const craters=mars?[]:Array.from({length:42},()=>({x:rng(),y:rng(),r:.008+Math.pow(rng(),2)*.07}));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,i=(y*size+x)*4,broad=noise(u,v,4,seed),medium=noise(u,v,16,seed+13),fine=noise(u,v,64,seed+31),grain=hash(x,y,seed+53),f=.48*broad+.32*medium+.2*fine;
    let h=.45+(fine-.5)*.11+(grain-.5)*.09,r,g,b;
    if(mars){
      const phase=u*27+Math.sin(v*Math.PI*4)*.33+Math.sin(v*Math.PI*10)*.075,ripple=Math.pow(.5+.5*Math.sin(phase*Math.PI*2),5),sand=clamp((broad-.27)*2.6,0,1),plate=noise(u,v,8,seed+89);
      h+=ripple*.27*sand;const tint=(f-.5)*47+(grain-.5)*16-ripple*7*sand;
      r=166+tint;g=129+tint*.86;b=96+tint*.70;
      const dark=clamp((.30-plate)*3,0,.28);r*=1-dark;g*=1-dark*.8;b*=1-dark*.55;
    }else{
      let rim=0,bowl=0;
      for(const c of craters){const dx=Math.min(Math.abs(u-c.x),1-Math.abs(u-c.x)),dy=Math.min(Math.abs(v-c.y),1-Math.abs(v-c.y)),d=Math.hypot(dx,dy)/c.r;if(d<1.5){rim+=Math.exp(-(((d-.91)/.16)**2))*.25;bowl+=Math.max(0,1-d*d)*.20;}}
      h+=rim-bowl;const tint=139+(f-.5)*60+(grain-.5)*23+rim*19-bowl*30;r=tint;g=tint;b=tint*.975;
    }
    albedo.set([clamp(r,0,255),clamp(g,0,255),clamp(b,0,255),255],i);const height=clamp(h*255,0,255);relief.set([height,height,height,255],i);const rough=clamp(233+grain*20,0,255);roughness.set([rough,rough,rough,255],i);
    const bands=mars?Math.pow(.5+.5*Math.sin((v*34+noise(u,v,8,seed+95)*.65)*Math.PI*2),10):fine,base=(mars?119:112)+(medium-.5)*44+(grain-.5)*26-bands*(mars?24:7);
    rock.set([base+(mars?14:0),base+(mars?5:1),base-(mars?6:0),255],i);const rh=clamp(148+fine*35+grain*24-bands*70,0,255);rockRelief.set([rh,rh,rh,255],i);
  }
  const result={world,tileMetres,albedo:texture(albedo,size,true),relief:texture(relief,size),roughness:texture(roughness,size),rock:texture(rock,size,true),rockRelief:texture(rockRelief,size)};
  for(const [name,t] of Object.entries(result))if(t?.isTexture)t.name=world+'-'+name+'-reconstruction';
  return result;
}

export function surfaceRockGeometry(world,seed=213){
  if(world==='moon')return lunarRockGeometry(seed,2);
  const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position,mars=world==='mars';
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),j=.91+.12*hash(Math.round(x*200),Math.round(z*200),213);p.setXYZ(i,x*j*(mars?1.25:1),y*(mars?.35:.64),z*j*(mars?.92:1));}
  g.computeVertexNormals();return g;
}

export function applySurfaceMaps(material,maps,spanMetres,unitsPerMetre=1){
  const lunar=maps.world==='moon';
  // World-space lunar samples share their textures. Updating the decoded tile
  // therefore updates every fine patch and the distant ground together.
  material.color.set('#ffffff');material.map=lunar?maps.albedo:maps.albedo.clone();material.bumpMap=lunar?maps.relief:maps.relief.clone();material.roughnessMap=lunar?maps.roughness:maps.roughness.clone();
  if(!lunar)for(const t of [material.map,material.bumpMap,material.roughnessMap])t.repeat.set(spanMetres/maps.tileMetres,spanMetres/maps.tileMetres);
  material.bumpScale=(maps.world==='mars'?.055:(maps.microHeightMetres??.012))*unitsPerMetre;material.roughness=1;material.metalness=0;
  if(maps.world==='moon')applyLunarRegolithShader(material,unitsPerMetre,maps.tileMetres);
  material.needsUpdate=true;return material;
}
