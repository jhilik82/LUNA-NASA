import {Renderer} from '../dist/render-3d.js';

// Real geometry; only canvas drawing and GPU submission are replaced in Node.
export function rendererFixture(mission){
  const ctx=new Proxy({measureText:s=>({width:s.length*8}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
  const createCanvas=(width,height)=>({width,height,getContext:()=>ctx});
  const device={shadowMap:{},setClearColor(){},setPixelRatio(){},setSize(){},render(){},dispose(){}};
  return new Renderer(createCanvas(1000,720),mission,{createCanvas,device});
}
