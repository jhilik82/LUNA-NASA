import * as THREE from 'three';
import { randomGenerator } from './engine.js';

// Authored fabric, metal and optical reflection detail; no extra terrain elevations.
export function materialDetail(createCanvas){
  const rng=randomGenerator(174),make=(size,paint,color=false)=>{const c=createCanvas(size,size),ctx=c.getContext('2d');paint(ctx,size);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(color)t.colorSpace=THREE.SRGBColorSpace;return t;};
  const fabric=make(256,(c,n)=>{c.fillStyle='#e7e5df';c.fillRect(0,0,n,n);for(let i=0;i<n;i+=2){c.fillStyle=i%4?'#e2e0d9':'#eeece5';c.fillRect(i,0,1,n);c.globalAlpha=.35;c.fillRect(0,i,n,1);c.globalAlpha=1;}},true);
  const weave=make(256,(c,n)=>{c.fillStyle='#808080';c.fillRect(0,0,n,n);for(let y=0;y<n;y+=4)for(let x=0;x<n;x+=4){const g=115+(x+y)%8*3;c.fillStyle=`rgb(${g},${g},${g})`;c.fillRect(x,y,2,2);}});fabric.repeat.set(6,6);weave.repeat.set(6,6);
  const brushed=make(256,(c,n)=>{c.fillStyle='#808080';c.fillRect(0,0,n,n);for(let y=0;y<n;y++){const g=Math.round(114+rng()*25);c.fillStyle=`rgb(${g},${g},${g})`;c.fillRect(0,y,n,1);}});brushed.repeat.set(2,3);
  const foil=make(256,(c,n)=>{for(let y=0;y<n;y+=2)for(let x=0;x<n;x+=2){const g=Math.round(148+34*Math.sin(x*.13+Math.sin(y*.15)*3)+24*Math.cos(y*.29-x*.07)+rng()*18);c.fillStyle=`rgb(${g},${g},${g})`;c.fillRect(x,y,2,2);}});foil.repeat.set(3,2);
  const faces=Array.from({length:6},(_,i)=>{const canvas=createCanvas(128,128),ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient?.(0,0,0,128);gradient?.addColorStop(0,i===2?'#84919a':'#25323d');gradient?.addColorStop(.5,'#253039');gradient?.addColorStop(1,'#080d12');ctx.fillStyle=gradient||'#25323d';ctx.fillRect(0,0,128,128);ctx.fillStyle=i===2?'#d1d8dd':'#74818a';ctx.fillRect(30+i*3,12,9,72);ctx.fillStyle='#a4adac';ctx.fillRect(90,28,3,38);return canvas;});
  const reflections=new THREE.CubeTexture(faces);reflections.colorSpace=THREE.SRGBColorSpace;reflections.needsUpdate=true;
  return {fabric,weave,brushed,foil,reflections};
}
