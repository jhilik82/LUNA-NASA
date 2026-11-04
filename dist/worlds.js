import { Terrain } from './engine.js';
import { TrainingMission } from './academy.js';
import { ExpeditionMission } from './expedition.js';
import { WORLDS } from './voyage.js';
import { installReferenceLandscape } from './reference-landscape.js';
const copy=x=>JSON.parse(JSON.stringify(x));
export function marsTrainingTerrain(regional){
 const t=new Terrain(regional),cell=40,step=cell/regional.cellMetres,stepX=step/Math.cos(18.44*Math.PI/180),centre=(regional.width-1)/2,first=centre-39.5*step,p=regional.projection;
 return {...regional,cellMetres:cell,heights:Array.from({length:6400},(_,i)=>t.heightAt(centre+((i%80)-39.5)*stepX,centre+(Math.floor(i/80)-39.5)*step)),projection:{...p,latitude0:p.latitude0-first*p.degreesPerCell,longitude0:p.longitude0+(centre-39.5*stepX)*p.degreesPerCell,longitudeDegreesPerCell:p.degreesPerCell*stepX,degreesPerCell:p.degreesPerCell*step},source:{...regional.source,nativeResolutionMetres:regional.cellMetres,processing:regional.source.processing+' Playable 3.2 km site bilinearly resampled to a 40 m grid from this region. Effective native resolution remains about 463 m; the finer grid adds no measured detail.'}};
}
export function createDestinationMission(pack,destination,storage,mode='training',astroWorld=null){
 const mars=destination==='mars',config=copy(pack.config),academy=copy(pack.academy),terrain=mars?marsTrainingTerrain(pack.marsTerrain):(pack.tranquillitatis||pack.terrain);
 if(astroWorld){config.physicalScale=true;config.interactionMetres=6;config.art.terrainVerticalExaggeration=1;config.astronomyTrainingTargets=['Earth','Sun'];config.assumptions=['The original terrain elevation grid and celestial directions come from cached NASA / JPL data. Reference-inspired local craters, scarps, dunes, channels, terraces, rocks and outposts are authored reconstructions layered over that grid. Weather, hazards and consumption rates are game models.','Terrain vertical exaggeration is 1.0; equipment and astronaut dimensions are converted to metres. Movement uses 10× mission time.','The apparent sky retains physical angular diameters. Optical points indicate unresolved bright planets; planetary brightness and compressed eye adaptation are approximate.','Outpost choices and forecasts use one shared state. EVA map colours use conservative distance estimates; the exact return readout follows the shared measured-plus-authored surface route.'];}
 config.world=destination;config.worldName=WORLDS[destination].name;config.physics.surfaceGravityMetresPerSecondSquared=WORLDS[destination].gravity;
 config.assumptions=config.assumptions.filter(x=>!/not merged|fixed direction|lunar ICRF|illustrative and is not/i.test(x));
 config.astronomyTrainingTargets=astroWorld?['Earth','Sun']:mars?['Earth','Sun']:['Earth','LRO'];
 if(mars){
  config.timeScale=10;
  const changed=JSON.stringify(academy).replace(/moonwalk/g,'Mars walk').replace(/Moon/g,'Mars').replace(/moon/g,'Mars').replace(/lunar/g,'Martian').replace(/LRO/g,'Sun');Object.assign(academy,JSON.parse(changed));
 }
 let ephemerides=pack.ephemerides;
 if(mars){
  const ob=Math.PI*23.4392911/180;
  ephemerides={schema:1,start:'2026-10-04T00:00:00 TDB',stop:'2026-10-05T00:00:00 TDB',frame:'Mars-centered ICRF',bodies:Object.entries(pack.solar.vectors).filter(([n])=>n!=='Mars').map(([name,b])=>({name,available:true,samplingSeconds:3600,samples:b.samples.map((a,i)=>{const m=pack.solar.vectors.Mars.samples[i],x=a.x-m.x,y=a.y-m.y,z=a.z-m.z;return{jdTdb:a.jdTdb,x,y:y*Math.cos(ob)-z*Math.sin(ob),z:y*Math.sin(ob)+z*Math.cos(ob)};})}))};
 }
 const worldStorage=storage&&{getItem:k=>storage.getItem(k==='luna-academy-v1'&&mars?'luna-academy-mars-v1':k),setItem:(k,v)=>storage.setItem(k==='luna-academy-v1'&&mars?'luna-academy-mars-v1':k,v)};
 const mission=mode==='expedition'&&pack.scenarios?new ExpeditionMission(terrain,config,ephemerides,academy,pack.scenarios,storage):new TrainingMission(terrain,config,ephemerides,academy,worldStorage);mission.solar=pack.solar;mission.astroWorld=astroWorld;mission.regionalTerrain=mars&&astroWorld?new Terrain(pack.marsTerrain):null;
 if(astroWorld){mission.utcStart=astroWorld.utc;mission.astronomy=()=>{const observer=astroWorld.observer(destination,mission.terrain.geo(mission.state.player)),list=astroWorld.sky(destination,mission.terrain.geo(mission.state.player)).bodies;return list.map(b=>({...b,available:true,inCoverage:true,position:{x:b.icrf.x*b.distanceKm,y:b.icrf.y*b.distanceKm,z:b.icrf.z*b.distanceKm},source:'Shared Sun-centered ICRF / UTC clock',timeScale:'UTC'}));};}
 installReferenceLandscape(mission);
 return mission;
}
