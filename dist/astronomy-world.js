// One authoritative, Sun-centered ICRF world. Distances are km; timestamps are UTC seconds.
import { clamp } from './engine.js';
export const DEG=Math.PI/180,C=299792.458,AU=149597870.7;
export const v=(x=0,y=0,z=0)=>({x,y,z}),add=(a,b,k=1)=>v(a.x+k*b.x,a.y+k*b.y,a.z+k*b.z),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
export const length=a=>Math.hypot(a.x,a.y,a.z),unit=a=>{const l=length(a)||1;return v(a.x/l,a.y/l,a.z/l);},cross=(a,b)=>v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
export function equatorial(ra,dec){return v(Math.cos(dec*DEG)*Math.cos(ra*DEG),Math.cos(dec*DEG)*Math.sin(ra*DEG),Math.sin(dec*DEG));}
export function horizonDirection(az,alt){return v(Math.sin(az*DEG)*Math.cos(alt*DEG),Math.cos(az*DEG)*Math.cos(alt*DEG),Math.sin(alt*DEG));}
const mix=(a,b,t)=>add(a,add(b,a,-1),t);
const rotate=(a,axis,t)=>add(add({x:a.x*Math.cos(t),y:a.y*Math.cos(t),z:a.z*Math.cos(t)},cross(axis,a),Math.sin(t)),axis,dot(axis,a)*(1-Math.cos(t)));
function bracket(samples,t){let lo=0,hi=samples.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(samples[m][0]>t)hi=m;else lo=m;}return [samples[lo],samples[hi],clamp((t-samples[lo][0])/(samples[hi][0]-samples[lo][0]),0,1)];}
function triad(a,b){const z=unit(cross(a,b));return[unit(a),unit(cross(z,a)),z];}
function transform(basis,p){return add(add(v(),basis[0],p.x),add(v(),basis[1],p.y));}
function basisFromObserver(sun,earth){
 const i=triad(equatorial(sun[7],sun[8]),equatorial(earth[7],earth[8])),l=triad(horizonDirection(sun[1],sun[2]),horizonDirection(earth[1],earth[2]));
 return [v(1,0,0),v(0,1,0),v(0,0,1)].map(p=>i.reduce((o,a,k)=>add(o,a,dot(l[k],p)),v()));
}
export function angularDiameter(radiusKm,distanceKm){return 2*Math.asin(clamp(radiusKm/distanceKm,0,1))/DEG;}
// Approximate V brightness: reference planet magnitudes and a Lambert phase model.
// Small bodies use a generic 0.1-albedo sphere; this is not a coma/ring photometry model.
export function bodyMagnitude(b,w){if(b.name==='Sun')return -26.74+5*Math.log10(b.distanceKm/AU);const reference={Mercury:-.42,Venus:-4.4,Earth:-3.99,Mars:-1.52,Jupiter:-9.4,Saturn:-8.88,Uranus:-7.19,Neptune:-6.87},a=b.phaseDegrees*DEG,phase=Math.max(.0001,(Math.sin(a)+(Math.PI-a)*Math.cos(a))/Math.PI),r=length(w.position(b.name))/AU,H=reference[b.name]??(-26.74-2.5*Math.log10(.1*(b.radiusKm/AU)**2/4));return H+5*Math.log10(Math.max(1e-9,r*b.distanceKm/AU))-2.5*Math.log10(phase);}
export function terrainHorizon(terrain,point,azimuth,radiusKm=1737.4,eyeM=1.7){
 if(!terrain||!point)return 0;const a=azimuth*DEG,dx=Math.sin(a),dy=-Math.cos(a),start=terrain.heightAt(point.x,point.y)+eyeM;let maximum=0;
 for(let step=.25;step<terrain.width*1.5;step+=.5){const x=point.x+dx*step,y=point.y+dy*step;if(x<0||y<0||x>terrain.width-1||y>terrain.height-1)break;const d=step*terrain.cell,h=terrain.heightAt(x,y)-start-d*d/(radiusKm*2000);maximum=Math.max(maximum,Math.atan2(h,d)/DEG);}
 return maximum;
}
export function exposureProfile({sunAltitude,dust=0,exposure=0,enhanced=false}){
 const limit=enhanced?6.5:sunAltitude>0?(sunAltitude>10?-2:-.5):clamp(5.7-.5*Math.max(0,sunAltitude+12),-1,5.7);
 return {limitingMagnitude:limit-dust*1.1+exposure*.6,enhanced,day:sunAltitude>0};
}
export class AstronomicalWorld {
 constructor(data,stars={stars:[]}){
  if(data?.schema!==2||!data.bodies?.Moon||!data.frames?.mars)throw Error('Shared astronomy data is missing.');
  this.data=data;this.catalog=stars;this.start=Date.parse(data.start)/1000;this.stop=Date.parse(data.stop)/1000;this.utc=Date.parse(data.epoch)/1000;this.mode='mission';this.rate=10;this.version=0;this.exposure=0;this.enhanced=false;this.observerOverride=null;
 }
 setUTC(value){const t=typeof value==='number'?value:Date.parse(value)/1000;if(!Number.isFinite(t)||t<this.start||t>this.stop)return false;if(this.mode!=='exploration')return false;this.utc=t;this.version++;return true;}
 beginExploration(){if(this.mode==='exploration')return;this.savedMission={utc:this.utc,rate:this.rate};this.mode='exploration';this.rate=0;this.version++;}
 endExploration(){if(this.savedMission){this.utc=this.savedMission.utc;this.rate=this.savedMission.rate;}this.mode='mission';this.savedMission=null;this.observerOverride=null;this.version++;}
 setMissionUTC(t){if(!Number.isFinite(t)||t<this.start||t>this.stop)throw Error('Mission time is outside cached ephemeris coverage.');this.utc=t;this.version++;}
 advance(realSeconds){if(this.mode==='exploration'&&this.rate){this.utc=clamp(this.utc+realSeconds*this.rate,this.start,this.stop);this.version++;}}
 position(name,t=this.utc,retarded=false){
  const b=this.data.bodies[name];if(!b)throw Error('Unknown astronomical body: '+name);if(t<(retarded?b.samples[0][0]:this.start)||t>this.stop)throw Error('Ephemeris time outside coverage.');
  const [a,c,u]=bracket(b.samples,t),h=c[0]-a[0],h00=2*u**3-3*u*u+1,h10=u**3-2*u*u+u,h01=-2*u**3+3*u*u,h11=u**3-u*u;
  return v(...[1,2,3].map(k=>h00*a[k]+h10*h*a[k+3]+h01*c[k]+h11*h*c[k+3]));
 }
 velocity(name,t=this.utc){const b=this.data.bodies[name],[a,c,u]=bracket(b.samples,t);return v(...[4,5,6].map(k=>a[k]+(c[k]-a[k])*u));}
 referenceFrame(world,t=this.utc){
  const f=this.data.frames[world],[sa,sb,u]=bracket(f.Sun.samples,t),[ea,eb]=bracket(f.Earth.samples,t),a=basisFromObserver(sa,ea),b=basisFromObserver(sb,eb);
  const up=unit(mix(a[2],b[2],u)),east=unit(add(mix(a[0],b[0],u),up,-dot(mix(a[0],b[0],u),up))),north=unit(cross(up,east));return[east,north,up];
 }
 frame(world,geo=null,t=this.utc){
  const ref=this.data.sites[world],f=this.referenceFrame(world,t);if(!geo)return f;
  const geodetic=lat=>world==='mars'?Math.atan(Math.tan(lat*DEG)*(3396.19/3376.2)**2)/DEG:lat;
  const lat=geodetic(geo.lat)*DEG,refLat=(world==='mars'?18.645:ref.latitude)*DEG,dlon=(geo.lon-ref.longitude)*DEG;
  const axis=unit(add({x:f[2].x*Math.sin(refLat),y:f[2].y*Math.sin(refLat),z:f[2].z*Math.sin(refLat)},f[1],Math.cos(refLat)));
  const east=rotate(f[0],axis,dlon),up=rotate(add({x:f[2].x*Math.cos(lat-refLat),y:f[2].y*Math.cos(lat-refLat),z:f[2].z*Math.cos(lat-refLat)},f[1],Math.sin(lat-refLat)),axis,dlon);return[unit(east),unit(cross(up,east)),unit(up)];
 }
 observer(world,geo=null,t=this.utc){
  const site=this.data.sites[world],g=geo||{lat:site.latitude,lon:site.longitude,elevation:site.altitudeKm*1000},basis=this.frame(world,g,t),body=this.data.bodies[site.host],lat=g.lat*DEG,normal=world==='mars'?Math.atan(Math.tan(lat)*(3396.19/3376.2)**2):lat,radial=unit(add(v(basis[2].x*Math.cos(lat-normal),basis[2].y*Math.cos(lat-normal),basis[2].z*Math.cos(lat-normal)),basis[1],Math.sin(lat-normal))),radius=world==='mars'?1/Math.sqrt(Math.cos(lat)**2/3396.19**2+Math.sin(lat)**2/3376.2**2):body.radiusKm;
  const position=add(add(this.position(site.host,t),radial,radius),basis[2],(g.elevation+1.7)/1000);
  return {world,host:site.host,geo:g,basis,position,velocity:this.velocity(site.host,t)};
 }
 toLocal(direction,basis){return v(dot(direction,basis[0]),dot(direction,basis[2]),-dot(direction,basis[1]));}
 apparent(name,observer,t=this.utc){
  const body=this.data.bodies[name];let target=this.position(name,t),distance=length(add(target,observer.position,-1)),lt=distance/C;
  for(let i=0;i<3;i++){target=this.position(name,t-lt,true);distance=length(add(target,observer.position,-1));lt=distance/C;}
  const geometric=unit(add(target,observer.position,-1)),beta=v(observer.velocity.x/C,observer.velocity.y/C,observer.velocity.z/C),direction=unit(add(add(geometric,beta),geometric,-dot(beta,geometric))),local=this.toLocal(direction,observer.basis);
  const toSun=unit(add(this.position('Sun',t-lt,true),target,-1)),toObserver=unit(add(observer.position,target,-1)),phase=Math.acos(clamp(dot(toSun,toObserver),-1,1))/DEG;
  return {name,kind:body.kind,radiusKm:body.radiusKm,distanceKm:distance,lightSeconds:lt,direction:local,icrf:direction,azimuth:(Math.atan2(local.x,-local.z)/DEG+360)%360,altitude:Math.asin(clamp(local.y,-1,1))/DEG,diameterDeg:angularDiameter(body.radiusKm,distance),diameterArcsec:angularDiameter(body.radiusKm,distance)*3600,phaseDegrees:name==='Sun'?0:phase,illuminated:name==='Sun'?1:(1+Math.cos(phase*DEG))/2,lightDirection:this.toLocal(toSun,observer.basis)};
 }
 sky(world,geo=null,{terrain=null,point=null,dust=0}={}){
  const observer=this.observer(world,geo),list=Object.keys(this.data.bodies).filter(n=>n!==observer.host).map(n=>this.apparent(n,observer));
  const sun=list.find(x=>x.name==='Sun'),profile=exposureProfile({sunAltitude:sun.altitude,dust,exposure:this.exposure,enhanced:this.enhanced});
  for(const b of list){b.horizon=terrainHorizon(terrain,point,b.azimuth,this.data.bodies[observer.host].radiusKm);b.obstruction=b.altitude+b.diameterDeg/2<b.horizon?'terrain / horizon':null;
   if(!b.obstruction){for(const other of list){if(other.name===b.name||other.distanceKm>=b.distanceKm)continue;const sep=Math.acos(clamp(dot(b.icrf,other.icrf),-1,1))/DEG;if(sep+b.diameterDeg/2<other.diameterDeg/2){b.obstruction=other.name;break;}}}
   b.geometricVisible=!b.obstruction;b.magnitude=bodyMagnitude(b,this);b.observable=b.name==='Sun'||b.magnitude<=profile.limitingMagnitude;b.visible=b.geometricVisible&&b.observable;if(!b.obstruction&&!b.observable)b.obstruction='below exposure threshold';b.resolved=b.diameterArcsec>60;b.glareDegrees=Math.acos(clamp(dot(b.icrf,sun.icrf),-1,1))/DEG;
  }return {bodies:list,observer,sun,profile};
 }
 starDirection(star,observer){const years=(this.utc/86400+2440587.5-2451545)/365.25,dec=star[2]+(star[6]||0)*years/3600,ra=star[1]+(star[5]||0)*years/(3600*Math.max(.01,Math.cos(dec*DEG))),d=equatorial(ra,dec),beta=v(observer.velocity.x/C,observer.velocity.y/C,observer.velocity.z/C);return this.toLocal(unit(add(add(d,beta),d,-dot(beta,d))),observer.basis);}
 snapshot(){return {utc:this.utc,iso:new Date(this.utc*1000).toISOString(),frame:'Sun-centered ICRF',positions:Object.fromEntries(Object.keys(this.data.bodies).map(n=>[n,this.position(n)])),spacecraft:this.spacecraft?{Odyssey:this.spacecraft.observerState()}:null};}
}
