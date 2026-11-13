import { clamp } from './engine.js';
export const WORLDS={earth:{name:'Earth',gravity:9.8,radiusKm:6371,pressureKpa:101.325},moon:{name:'Moon',gravity:1.62,radiusKm:1737.4,pressureKpa:0},mars:{name:'Mars',gravity:3.73,radiusKm:3389.5,pressureKpa:.636}};
export const LANDING={speed:{min:0,max:12,safeMin:1,safeMax:3},angle:{min:-15,max:15,safeMin:-5,safeMax:5}};
const vec=(x=0,y=0,z=0)=>({x,y,z});
const add=(a,b,k=1)=>vec(a.x+b.x*k,a.y+b.y*k,a.z+b.z*k);
const sub=(a,b)=>add(a,b,-1),len=a=>Math.hypot(a.x,a.y,a.z),unit=a=>{const l=len(a);return vec(a.x/l,a.y/l,a.z/l);};
export function interpolateSamples(samples,hour){
 const h=clamp(hour,0,24),i=Math.min(samples.length-2,Math.floor(h)),a=samples[Math.max(0,i)],b=samples[Math.max(1,i+1)],f=h-Math.max(0,i);
 const out={};for(const k of Object.keys(a))if(typeof a[k]==='number'){let d=b[k]-a[k];if(k==='azimuth')d=((d+540)%360)-180;out[k]=a[k]+d*f;}return out;
}
export function vectorAt(data,name,hour=12){return interpolateSamples(data.vectors[name].samples,hour);}
export function localSky(data,world,hour=12){return Object.entries(data.observers[world].bodies).map(([name,b])=>({name,...interpolateSamples(b.samples,hour)}));}
export function skyDirection(body){const a=body.azimuth*Math.PI/180,e=body.altitude*Math.PI/180;return vec(Math.sin(a)*Math.cos(e),Math.sin(e),-Math.cos(a)*Math.cos(e));}
export function makeFlightPlan(data,destination,world=null,departureUTC=null){
 if(!['moon','mars'].includes(destination))throw Error('Select Moon or Mars.');
 const durationSeconds=(destination==='moon'?3:210)*86400;
 const earth=world?world.position('Earth',departureUTC):vectorAt(data,'Earth'),target=world?world.position(WORLDS[destination].name,departureUTC+durationSeconds+800):vectorAt(data,WORLDS[destination].name),d=unit(sub(target,earth));
 const start=add(earth,d,WORLDS.earth.radiusKm+400),end=add(target,d,-(WORLDS[destination].radiusKm+20));
 const separationKm=len(sub(world?world.position(WORLDS[destination].name,departureUTC):target,earth)),span=len(sub(end,start));
 const path=u=>{const p=add(start,sub(end,start),clamp(u,0,1));p.z+=Math.sin(Math.PI*clamp(u,0,1))*span*.16;return p;};
 const table=[0];let prev=path(0);for(let i=1;i<=512;i++){const p=path(i/512);table.push(table.at(-1)+len(sub(p,prev)));prev=p;}
 const curveKm=table.at(-1),totalKm=curveKm+420,distance=u=>{const x=clamp(u,0,1)*512,i=Math.min(511,Math.floor(x));return 400+table[i]+(table[i+1]-table[i])*(x-i);};
 return {destination,separationKm,totalKm,path,distance,earth,target,durationSeconds,epoch:world?new Date(departureUTC*1000).toISOString():data.epoch,classification:'Illustrative curved route between fixed, dated surface endpoints; not an orbital transfer solution.'};
}
const wave=(t,period,min,max)=>min+(max-min)*(.5-.5*Math.cos(t*Math.PI*2/period));
export function daylightDeparture(world,destination){
 const epoch=Date.parse(world.data.epoch)/1000,arrivalOffset=(destination==='moon'?3:210)*86400+900;
 // Schedule the training arrival in real local daylight; never move the Sun or the observer clock independently.
 for(let h=0;h<720;h++){const arrival=epoch+arrivalOffset+h*3600;if(arrival+3600>world.stop)break;const sun=world.apparent('Sun',world.observer(destination,null,arrival),arrival);if(sun.altitude>=28)return epoch+h*3600;}
 return epoch;
}
export class FlightSimulation{
 constructor(data,world=null){this.data=data;this.world=world;this.departure='earth';this.localSortie=false;this.departureUTC=world?Date.parse(world.data.epoch)/1000:null;if(world)world.spacecraft=this;this.cabinFlight=false;this.flightEvent={resolved:false,choice:null};this.phase='briefing';this.destination='moon';this.select('moon');this.paused=false;this.flightCount=0;}
 get active(){return this.phase!=='surface';}
 select(destination){if(this.phase!=='briefing')return false;this.departure='earth';this.localSortie=false;this.departureUTC=this.world?daylightDeparture(this.world,destination):null;this.destination=destination;this.plan=makeFlightPlan(this.data,destination,this.world,this.departureUTC);this.flightEvent={resolved:false,choice:null};this.elapsed=0;this.simSeconds=0;this.routeProgress=0;this.speedLocked=null;this.angleLocked=null;this.attempts=0;return true;}
 startLocalSortie(destination,geo){
  if(!this.world||!['surface','landed'].includes(this.phase)||!['moon','mars'].includes(destination))return false;
  const b=WORLDS[destination],radiusKm=this.world.data.bodies[b.name].radiusKm+400,mu=b.gravity*(b.radiusKm*1000)**2,period=2*Math.PI*Math.sqrt((radiusKm*1000)**3/mu),departureUTC=this.world.utc;
  if(departureUTC+period+1800>this.world.stop)return false;
  this.departure=destination;this.destination=destination;this.departureUTC=departureUTC;this.localSortie=true;this.localGeo={...geo};
  const path=u=>{const t=departureUTC+600+period*u,site=this.world.observer(destination,this.localGeo,t),normal=add(vec(),site.basis[2],Math.cos(u*Math.PI*2));return add(this.world.position(b.name,t),add(normal,site.basis[0],Math.sin(u*Math.PI*2)),radiusKm);};
  const orbitKm=2*Math.PI*radiusKm;this.plan={destination,separationKm:0,totalKm:orbitKm+800,durationSeconds:period,path,distance:u=>400+orbitKm*u,epoch:new Date(departureUTC*1000).toISOString(),earth:this.world.position(b.name),target:this.world.position(b.name),classification:'Illustrative circular body-fixed training orbit; period calculated from surface gravity and radius. Not an orbital propagation solution.'};
  this.flightEvent={resolved:false,choice:null};this.simSeconds=0;this.routeProgress=0;this.speedLocked=this.angleLocked=null;this.attempts=0;this.paused=false;this.enter('boarding');return true;
 }
 enter(phase){this.phase=phase;this.elapsed=0;}
 board(){if(this.phase!=='briefing')return false;this.enter('boarding');return true;}
 launch(){if(this.phase!=='cockpit')return false;this.flightCount++;this.enter('ignition');return true;}
 lock(){
  if(this.phase==='speed'){this.speedLocked=this.gauges.speed;this.enter('angle');return true;}
  if(this.phase==='angle'){
   this.angleLocked=this.gauges.angle;this.attempts++;
   const safe=this.speedLocked>=1&&this.speedLocked<=3&&Math.abs(this.angleLocked)<=5;
   this.feedback=safe?'Landing solution accepted. Retrorockets braking.':this.speedLocked<1?'Speed too low for this exercise. Go-around: aim for 1–3 m/s.':this.speedLocked>3?'Descent too fast. Go-around: aim for 1–3 m/s.':'Attitude outside ±5°. Go-around: lock near the centre.';
   this.enter(safe?'descent':'go-around');return true;
  }return false;
 }
 resolveEvent(choice){if(this.phase!=='transfer'||!['isolate','backup'].includes(choice)||this.flightEvent.resolved)return false;this.flightEvent={resolved:true,choice};return true;}
 skipSegment(){const next={boarding:'cockpit',ascent:'transfer',transfer:'capture',capture:'speed'}[this.phase];if(!next)return false;if(this.phase==='transfer'&&!this.flightEvent.resolved)return false;if(this.phase==='ascent')this.simSeconds=600;if(this.phase==='transfer'){this.simSeconds=600+this.plan.durationSeconds;this.routeProgress=1;}if(this.phase==='capture')this.simSeconds=800+this.plan.durationSeconds;this.enter(next);return true;}
 observerState(){
  if(!this.world)return null;const a=this.world,p=this.phase,w=WORLDS[this.destination],t=this.telemetry(),utc=a.utc,frame=[vec(1,0,0),vec(0,1,0),vec(0,0,1)];let position;
  if(this.localSortie){const site=a.observer(this.destination,this.localGeo);if(p==='transfer')return {...site,world:'space',position:this.plan.path(this.routeProgress)};return {...site,position:add(site.position,site.basis[2],t.altitudeM/1000)};}
  if(['briefing','boarding','cockpit','ignition','ascent'].includes(p)){const d=(utc/86400+2440587.5-2451545),lon=(-80.649+280.46+360.985647*d)*Math.PI/180,lat=28.573*Math.PI/180,up=vec(Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)),east=vec(-Math.sin(lon),Math.cos(lon),0),north=vec(-Math.sin(lat)*Math.cos(lon),-Math.sin(lat)*Math.sin(lon),Math.cos(lat));position=add(a.position('Earth'),up,6378.137+t.altitudeM/1000+.03);return {world:'earth',host:'Earth',position,velocity:a.velocity('Earth'),basis:[east,north,up],geo:{lat:28.573,lon:-80.649}};}
  if(p==='transfer')position=this.plan.path(this.routeProgress);else{const site=a.observer(this.destination);position=add(site.position,site.basis[2],t.altitudeM/1000);return {...site,position};}
  return {world:'space',host:null,position,velocity:a.velocity('Earth'),basis:frame,geo:null};
 }
 get gauges(){return{speed:this.speedLocked??wave(this.elapsed,4.8,0,12),angle:this.angleLocked??wave(this.elapsed+1.15,5.6,-15,15)};}
 update(dt,hidden=false){
  if(hidden||this.paused||!this.active)return;dt=clamp(dt,0,.1);this.elapsed+=dt;
  if(this.world&&this.phase==='transfer'&&this.elapsed>=12&&!this.flightEvent.resolved){this.elapsed=12;this.routeProgress=.5;this.simSeconds=600+this.plan.durationSeconds*.5;return;}
  if(this.phase==='boarding'&&this.elapsed>=6)this.enter('cockpit');
  else if(this.phase==='ignition'&&this.elapsed>=2.4)this.enter('ascent');
  else if(this.phase==='ascent'){this.simSeconds=600*clamp(this.elapsed/18,0,1);if(this.elapsed>=18)this.enter('transfer');}
  else if(this.phase==='transfer'){this.routeProgress=clamp(this.elapsed/24,0,1);this.simSeconds=600+this.plan.durationSeconds*this.routeProgress;if(this.elapsed>=24)this.enter('capture');}
  else if(this.phase==='capture'){this.simSeconds=600+this.plan.durationSeconds+200*clamp(this.elapsed/8,0,1);if(this.elapsed>=8){this.routeProgress=1;this.enter('speed');}}
  else if(this.phase==='go-around'&&this.elapsed>=5){this.speedLocked=this.angleLocked=null;this.enter('speed');}
  else if(this.phase==='descent'){this.simSeconds=800+this.plan.durationSeconds+(160/this.speedLocked)*clamp(this.elapsed/12,0,1);if(this.elapsed>=12)this.enter('landed');}
 }
 telemetry(){
  const p=this.phase,w=WORLDS[this.destination],u=clamp(this.elapsed/18,0,1);let altitudeM=0,velocityMps=0,accelerationMps2=0,gravity=9.8,pressure=101.325,distanceKm=0,location='Earth launch site',hullC=18,simRate=1;
  if(p==='ascent'){altitudeM=400000*u*u;velocityMps=800000*u/600;accelerationMps2=800000/600**2;gravity=9.8*(6371000/(6371000+altitudeM))**2;pressure=101.325*Math.exp(-altitudeM/8500);distanceKm=Math.min(this.plan.totalKm,altitudeM/1000);location='Earth departure';hullC=18-78*u;simRate=600/18;}
  if(p==='transfer'){
   const progress=this.routeProgress,point=this.plan.path(progress),du=.00001,a=this.plan.path(Math.max(0,progress-du)),b=this.plan.path(Math.min(1,progress+du));
   const span=len(sub(this.plan.path(1),this.plan.path(0)));accelerationMps2=Math.abs(Math.sin(progress*Math.PI)*span*.16*Math.PI**2*1000/this.plan.durationSeconds**2);
   velocityMps=len(sub(b,a))*1000/(Math.min(1,progress+du)-Math.max(0,progress-du))/this.plan.durationSeconds;
   const da=len(sub(point,this.plan.earth)),db=len(sub(point,this.plan.target)),ds=len(point);
   gravity=3.986004e14/(da*1000)**2+w.gravity*(w.radiusKm/db)**2+1.3271244e20/(ds*1000)**2;
   distanceKm=this.plan.distance(progress);altitudeM=Math.max(0,(db-w.radiusKm)*1000);pressure=0;location='Transfer · free fall';hullC=-60+35*Math.sin(progress*Math.PI);simRate=this.plan.durationSeconds/24;
  }
  if(['capture','speed','angle','descent','go-around','landed','surface'].includes(p)){
   gravity=w.gravity;location=w.name+' arrival';distanceKm=this.plan.totalKm-.08;pressure=w.pressureKpa;hullC=this.destination==='mars'?-53:-65;
   if(p==='capture'){const f=clamp(this.elapsed/8,0,1);altitudeM=20000*(1-f)**2+80;velocityMps=200*(1-f);accelerationMps2=-1;distanceKm=this.plan.totalKm-20+19.92*(2*f-f*f);simRate=200/8;}
   else if(['speed','angle','go-around'].includes(p)){altitudeM=80;velocityMps=0;location=w.name+' · powered hover';}
   else if(p==='descent'){const f=clamp(this.elapsed/12,0,1);altitudeM=80*(1-f)**2;velocityMps=this.speedLocked*(1-f);accelerationMps2=-(this.speedLocked**2)/160;simRate=160/this.speedLocked/12;distanceKm=this.plan.totalKm-.08*(1-f)**2;}
   if(p==='landed'||p==='surface')distanceKm=this.plan.totalKm;
   if(this.destination==='mars')pressure*=Math.exp(-altitudeM/11100);
  }
  if(this.localSortie){const source=WORLDS[this.departure];if(['briefing','boarding','cockpit','ignition','ascent'].includes(p)){gravity=source.gravity*(source.radiusKm/(source.radiusKm+altitudeM/1000))**2;pressure=source.pressureKpa*Math.exp(-altitudeM/11100);location=source.name+(p==='ascent'?' departure':' launch site');}if(p==='transfer'){altitudeM=400000;gravity=source.gravity*(source.radiusKm/(source.radiusKm+400))**2;velocityMps=2*Math.PI*(source.radiusKm+400)*1000/this.plan.durationSeconds;accelerationMps2=velocityMps**2/((source.radiusKm+400)*1000);location=source.name+' orbital practice · free fall';pressure=0;}if(p==='capture'){const k=clamp(this.elapsed/8,0,1);altitudeM=400000*(1-k)**2+80;velocityMps=4000*(1-k);accelerationMps2=-20;distanceKm=this.plan.totalKm-400+399.92*(2*k-k*k);pressure=source.pressureKpa*Math.exp(-altitudeM/11100);}}
  return{phase:p,location,altitudeM,velocityMps,accelerationMps2,gravityMps2:gravity,downlinkPercent:this.flightEvent.choice==='isolate'?50:100,cabinPressureKpa:101.325,exteriorPressureKpa:pressure,cabinC:22,hullC,distanceKm:Math.min(distanceKm,this.plan.totalKm),remainingKm:Math.max(0,this.plan.totalKm-distanceKm),totalKm:this.plan.totalKm,simSeconds:this.simSeconds,simRate,ready:p==='cockpit',fuelPercent:clamp(100-(['briefing','boarding','cockpit'].includes(p)?0:p==='ignition'?2:p==='ascent'?2+u*42:p==='transfer'?44+this.routeProgress*15:76)-(this.flightEvent.choice==='backup'?3:0),0,100)};
 }
 disembark(){if(this.phase!=='landed')return false;this.enter('surface');return true;}
 restart(){if(this.phase!=='surface'&&this.phase!=='landed')return false;this.enter('briefing');this.select(this.destination);return true;}
}
