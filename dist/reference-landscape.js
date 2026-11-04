import { clamp, randomGenerator } from './engine.js';
import { lunarNoise } from './lunar-surface.js';

const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t); };
const gaussian = (x,z,rx,rz) => Math.exp(-(x*x/(rx*rx)+z*z/(rz*rz)));
const segmentDistance = (p,a,b) => { const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t); };

// Reference-inspired art is layered over, and kept separate from, the NASA grid.
// Every geometric surface, boot, vehicle and navigation query uses this profile.
export class ReferenceLandscape {
  constructor(mission) {
    this.world=mission.config.world;this.terrain=mission.terrain;this.base={...mission.objects.base};this.authored=true;
    const b=this.base,c=this.terrain.cell,local=p=>({x:(p.x-b.x)*c,z:(p.y-b.y)*c});
    const science=this.world==='moon'?[...mission.science,...(mission.original?.science||[])]:mission.science;
    this.sites=[b,mission.objects.relay,mission.objects.rover,...science].map(local);
    this.pads=mission.props.map(p=>({...local(p),rx:p.halfX*c+3,rz:p.halfY*c+3}));
    const relay=local(mission.objects.relay),rover=local(mission.objects.rover);
    this.corridors=[[{x:0,z:0},relay],[relay,rover],...[mission.state.player,...science].map(p=>[{x:0,z:0},local(p)])];
    this.features=this.world==='moon'?[
      {kind:'crater',x:-38,z:30,r:15,depth:2.7}, {kind:'crater',x:76,z:17,r:12,depth:2.1},
      {kind:'crater',x:-108,z:88,r:29,depth:4.9}, {kind:'crater',x:69,z:-87,r:23,depth:3.8},
      {kind:'crater',x:106,z:101,r:8,depth:1.3}, {kind:'crater',x:-11,z:106,r:6,depth:.9},
      {kind:'scarp',x:-88,z:-70,rx:74,rz:47,height:9},
      {kind:'ridge',x:-390,z:-310,rx:130,rz:90,height:32},
      {kind:'ridge',x:-580,z:210,rx:150,rz:100,height:41}
    ]:[
      {kind:'dune',x:45,z:43,rx:48,rz:32,height:1.45},
      {kind:'dune',x:-54,z:65,rx:54,rz:33,height:1.15},
      {kind:'channel',x:-108,z:-5,rx:24,rz:104,depth:3.1},
      {kind:'terrace',x:-65,z:-67,rx:39,rz:27,height:4.1},
      {kind:'mesa',x:-370,z:-270,rx:116,rz:85,height:36},
      {kind:'mesa',x:-610,z:270,rx:159,rz:100,height:47},
      {kind:'mesa',x:150,z:370,rx:110,rz:72,height:25}
    ];
    if(this.world==='moon'){
      // Low, broken mare relief around the outpost; not a polar mountain setting.
      this.features.push(
        {kind:'ridge',x:270,z:-440,rx:170,rz:100,height:25},
        {kind:'ridge',x:670,z:-180,rx:190,rz:110,height:39},
        {kind:'ridge',x:410,z:420,rx:150,rz:83,height:28},
        {kind:'ridge',x:-210,z:530,rx:155,rz:90,height:26},
        {kind:'crater',x:220,z:-95,r:47,depth:7.8,seed:251},
        {kind:'crater',x:-235,z:170,r:64,depth:10.4,seed:123},
        {kind:'crater',x:310,z:235,r:53,depth:8.1,seed:329},
        {kind:'crater',x:130,z:-270,r:71,depth:11.1,seed:513}
      );
      const impacts=randomGenerator(41537);
      for(let i=0;i<76;i++){
        const angle=impacts()*Math.PI*2,range=18+Math.sqrt(impacts())*510;
        const r=1.6+impacts()**2*12;
        this.features.push({kind:'crater',x:Math.cos(angle)*range,z:Math.sin(angle)*range,r,depth:r*(.12+impacts()*.07),seed:i+631});
      }
    }
    // Index small impacts so every boot, route and mesh query shares cheap relief.
    this.featureBuckets=new Map();this.wideFeatures=[];this.bucketMetres=32;
    for(const f of this.features){
      if(f.kind!=='crater'){this.wideFeatures.push(f);continue;}
      const span=f.r*1.62;
      for(let z=Math.floor((f.z-span)/32);z<=Math.floor((f.z+span)/32);z++)for(let x=Math.floor((f.x-span)/32);x<=Math.floor((f.x+span)/32);x++){
        const key=x+':'+z;if(!this.featureBuckets.has(key))this.featureBuckets.set(key,[]);this.featureBuckets.get(key).push(f);
      }
    }
    const rng=randomGenerator(this.world==='moon'?17633:46823);this.clasts=[];
    // Large boulders / layered outcrops have matching solid collision envelopes.
    // The equipment approaches and primary expedition corridors stay accessible.
    for(let i=0;i<(this.world==='moon'?144:68);i++){
      const angle=rng()*Math.PI*2,spread=rng(),range=21+Math.sqrt(spread)*(this.world==='moon'&&i>=68?465:123);
      const impact=this.world==='moon'&&i>=112?this.features[i%6]:null;
      const p=impact?{x:impact.x+Math.cos(angle)*impact.r*(1.1+spread*.3),z:impact.z+Math.sin(angle)*impact.r*(1.1+spread*.3)}:{x:Math.cos(angle)*range,z:Math.sin(angle)*range};
      const radius=this.world==='moon'?.45+Math.pow(rng(),2)*1.55:1.0+Math.pow(rng(),2)*2.6;
      if(this.sites.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<radius+10)||this.pads.some(q=>Math.abs(p.x-q.x)<q.rx+radius&&Math.abs(p.z-q.z)<q.rz+radius)||this.corridors.some(([a,b])=>segmentDistance(p,a,b)<radius+9))continue;
      const point=this.grid(p);if(!this.terrain.inBounds(point.x,point.y))continue;
      this.clasts.push({...p,radius,height:this.world==='moon'?radius*(.9+rng()*.7):.45+rng()*1.65,yaw:rng()*Math.PI*2,seed:i+81});
    }
    this.colliders=this.clasts.map((p,i)=>({id:'geology-'+i,kind:'geology',...this.grid(p),radius:(p.radius+.25)/c}));
    this.bounds=this.world==='moon'?{minX:-620,maxX:1110,minZ:-980,maxZ:700}:{minX:-820,maxX:320,minZ:-440,maxZ:500};
    this.heightCache=this.world==='moon'?new Map():null;
  }
  local(x,y){return {x:(x-this.base.x)*this.terrain.cell,z:(y-this.base.y)*this.terrain.cell};}
  grid(p){return {x:this.base.x+p.x/this.terrain.cell,y:this.base.y+p.z/this.terrain.cell};}
  protection(p){
    let weight=1;
    // Blend relief gradually into foundations; a narrow blend creates artificial
    // cliffs where an equipment pad meets a distant ridge. Keep every lesson's
    // science sites accessible even while the first lesson uses only its beacon.
    const moon=this.world==='moon';
    for(const pad of this.pads){const d=Math.max(Math.abs(p.x-pad.x)-pad.rx,Math.abs(p.z-pad.z)-pad.rz);weight=Math.min(weight,smooth(0,moon?12:5,d));}
    for(const site of this.sites)weight=Math.min(weight,smooth(7,moon?25:13,Math.hypot(p.x-site.x,p.z-site.z)));
    for(const [a,b] of this.corridors)weight=Math.min(weight,smooth(5,moon?20:11,segmentDistance(p,a,b)));
    return weight;
  }
  contribution(f,p){
    const x=p.x-f.x,z=p.z-f.z;
    if(f.kind==='crater'){
      const angle=Math.atan2(z,x),seed=f.seed??(f.x*.11+f.z*.17);
      const irregular=1+.043*Math.sin(angle*5+seed)+.023*Math.sin(angle*9-seed)+.012*Math.sin(angle*17+seed*.7);
      const q=Math.hypot(x,z)/(f.r*irregular);if(q>1.5)return 0;
      const rimWidth=.155+.025*Math.sin(angle*11+seed);
      const rim=f.r*.078*Math.exp(-(((q-1)/rimWidth)**2))*(.94+.09*Math.sin(angle*7+seed));
      const bowl=f.depth*Math.max(0,1-q*q);
      const ejecta=f.r*.009*Math.exp(-(((q-1.19)/.22)**2))*(.5+.5*Math.sin(angle*13+seed));
      // Broken rim and wall material, with subdued relief on the settled floor.
      // It shares the walking surface and stays inside the same protection blend.
      const debris=f.r*.013*(lunarNoise(p.x*.57,p.z*.57,631)-.5)*
        smooth(.40,.72,q)*(1-smooth(1.12,1.45,q));
      return (rim-bowl+ejecta+debris)*(1-smooth(1.22,1.5,q));
    }
    const q=x*x/(f.rx*f.rx)+z*z/(f.rz*f.rz);if(q>9)return 0;
    if(f.kind==='scarp'){
      const face=z+(lunarNoise((x+f.x)*.075,2,721)-.5)*3.5;
      return f.height*Math.exp(-Math.pow(x/f.rx,4))*smooth(-2,3,-face)*(1-smooth(12,f.rz*2,-face));
    }
    if(f.kind==='ridge')return f.height*gaussian(x,z,f.rx,f.rz)*(.84+.26*lunarNoise((x+f.x)*.024,(z+f.z)*.024,339));
    if(f.kind==='dune'){
      const envelope=gaussian(x,z,f.rx,f.rz),ridges=Math.pow(.5+.5*Math.sin((x+z*.23)*.48),3),ripples=Math.pow(.5+.5*Math.sin((x+z*.19)*4.8+.25*Math.sin(z*.25)),4);
      return envelope*(f.height*ridges+.065*ripples);
    }
    if(f.kind==='channel'){const bend=x-5*Math.sin(z*.032),shape=Math.exp(-Math.pow(bend/(f.rx*.42),4))*Math.exp(-Math.pow(z/f.rz,4));return -f.depth*shape;}
    const radius=Math.sqrt(q),edge=f.kind==='mesa'?.10:.16;
    return f.height*(.36*(1-smooth(.72,.72+edge,radius))+.32*(1-smooth(.90,.90+edge,radius))+.32*(1-smooth(1.08,1.08+edge,radius)));
  }
  height(x,y){
    const p=this.local(x,y),b=this.bounds;
    if(p.x<b.minX||p.x>b.maxX||p.z<b.minZ||p.z>b.maxZ)return 0;
    const key=this.heightCache?x.toFixed(7)+':'+y.toFixed(7):null,cached=this.heightCache?.get(key);if(cached!==undefined)return cached;
    let h=0;for(const f of this.wideFeatures)h+=this.contribution(f,p);
    for(const f of this.featureBuckets.get(Math.floor(p.x/32)+':'+Math.floor(p.z/32))||[])h+=this.contribution(f,p);
    const field=gaussian(p.x,p.z,170,170);
    h+=this.world==='moon'?field*((lunarNoise(p.x*.72,p.z*.72,157)-.5)*.045+(lunarNoise(p.x*.12,p.z*.12,341)-.5)*.23):field*.028*Math.sin(p.x*.8)*Math.cos(p.z*.6);
    const t=this.terrain,edge=Math.min(x,y,t.width-1-x,t.height-1-y)*t.cell;
    const extent=Math.min(p.x-b.minX,b.maxX-p.x,p.z-b.minZ,b.maxZ-p.z);
    const result=h*this.protection(p)*smooth(0,60,edge)*smooth(0,25,extent);
    if(this.heightCache){if(this.heightCache.size>=98304)this.heightCache.clear();this.heightCache.set(key,result);}
    return result;
  }
  intersects(a,b){
    const p=this.local(a.x,a.y),q=this.local(b.x,b.y),r=this.bounds;
    return !(Math.max(p.x,q.x)<r.minX||Math.min(p.x,q.x)>r.maxX||Math.max(p.z,q.z)<r.minZ||Math.min(p.z,q.z)>r.maxZ);
  }
  tint(x,y,height){
    const p=this.local(x,y),broad=Math.sin(p.x*.018)+.55*Math.cos(p.z*.022+p.x*.007);
    if(this.world==='moon'){const shade=.94+broad*.026;return [shade,shade,shade];}
    const dune=this.features.filter(f=>f.kind==='dune').reduce((s,f)=>s+gaussian(p.x-f.x,p.z-f.z,f.rx,f.rz),0),band=.045*Math.sin(height*12),s=.85+broad*.055+Math.min(1,dune)*.12;
    return [s+band,s+band*.75,s+band*.5];
  }
}

export function installReferenceLandscape(mission){
  if(!mission.config.physicalScale)return null;
  const landscape=new ReferenceLandscape(mission);mission.terrain.reference=landscape;mission.landscape=landscape;mission.naturalColliders=landscape.colliders;
  return landscape;
}
