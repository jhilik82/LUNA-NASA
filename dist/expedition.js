import { TrainingMission } from './academy.js';
import { Mission, Circuit, clamp, distance } from './engine.js';
import { readPreference, writePreference } from './preferences.js';
const copy=x=>JSON.parse(JSON.stringify(x));
export function powerBalance(o,sunlit=true){const supply=(o.arrayOnline&&sunlit?o.arrayKw*Math.exp(-o.dust):0)+o.backupKw,demand=o.lifeKw+o.foodKw+o.commsKw+o.shieldKw+.45;return {supply,demand,net:supply-demand};}
export function simulateOutpost(original,seconds,rules,{inside=true,sunlit=true}={}){
 const o=copy(original);let remaining=Math.max(0,seconds);
 while(remaining>1e-7){
 const p=powerBalance(o,sunlit);let step=Math.min(60,remaining);
 if(p.net<0&&o.energy>1e-8)step=Math.min(step,o.energy/-p.net*3600);
 if(o.backupKw&&o.fuel>1e-8)step=Math.min(step,o.fuel/(o.backupKw*.4)*3600);
 const h=step/3600,lifeFraction=clamp(o.lifeKw/rules.lifeMinimumKw,0,1),powered=p.net>=0||o.energy>1e-8;
 o.energy=clamp(o.energy+p.net*h,0,60);o.oxygen=Math.max(0,o.oxygen-(rules.crew+(o.leak?rules.leakCrewHoursPerHour:0))*h);
 o.water=Math.max(0,o.water-rules.crew*rules.waterLitresPerCrewHour*h-(o.foodKw>2?.22*(o.foodKw-2)*h:0));
 o.food=Math.max(0,o.food-rules.crew*rules.foodPortionsPerCrewHour*h);
 // Accelerated crop cycle is a teaching rule, never a claim about real plant growth.
 o.growthHours=(o.growthHours||0)+(powered&&o.water>0?Math.max(0,o.foodKw-1)*h:0);
 const harvest=Math.floor((o.growthHours+1e-9)/(rules.cropCycleHours||6));
 if(harvest){o.food+=harvest*(rules.cropHarvestPortions||2);o.growthHours=Math.max(0,o.growthHours-harvest*(rules.cropCycleHours||6));o.harvests=(o.harvests||0)+harvest;}
 const shield=inside?(o.shield==='active'&&powered?.06:o.shield==='passive'?.18:.55):1,dose=o.radiationRate*h*shield;
 o.radiation+=dose;o.health=clamp(o.health-dose*rules.radiationHealthLossPerMsv-(!powered?16*h:0)-(1-lifeFraction)*12*h-(o.oxygen<=0?30*h:0),0,100);
 o.fatigue=clamp(o.fatigue+(inside?-2:7*o.suitFactor)*h,0,100);o.habitat=clamp(o.habitat-(o.leak?3*h:0)-o.dust*.5*h,0,100);
 if(o.backupKw){o.fuel=Math.max(0,o.fuel-o.backupKw*h*.4);if(o.fuel<1e-8)o.backupKw=0;}
 remaining-=step;
 }
 return o;
}
export function applyEffects(original,effects){const o=copy(original);for(const[k,a]of Object.entries(effects)){if(['suitOxygen','suitEnergy'].includes(k))continue;if(['oxygen','water','food','energy','habitat','health','fatigue','radiation','fuel','kits','science'].includes(k))o[k]=Math.max(0,o[k]+a);else o[k]=a;}for(const k of ['health','habitat','fatigue'])o[k]=clamp(o[k],0,100);return o;}
export function resourceFailure(o,sunlit=true){return o.oxygen<=0?'Habitat oxygen exhausted':o.water<=0?'Water exhausted':o.food<=0?'Food exhausted':o.health<20?'Crew health critical':o.habitat<30?'Habitat integrity critical':o.energy<=0&&powerBalance(o,sunlit).net<0?'Essential electrical power lost':null;}
export class ExpeditionMission extends TrainingMission {
 constructor(terrain,config,ephemerides,academy,scenarios,storage=null){
  super(terrain,config,ephemerides,academy,null);this.scenario=copy(scenarios[config.world]);this.rules={...scenarios.rates,crew:scenarios.crew};this.expeditionStorage=storage;this.saveKey='luna-expedition-v2-'+config.world;
  this.academy={...academy,levels:[this.lesson]};this.levelIndex=0;this.completed=[];this.unlocked=0;this.newExpedition();
 }
 get isExpedition(){return !!this.scenario;}
 get lesson(){return this.scenario?{...this.scenario,steps:this.scenario.stages.map(s=>s.title),choices:[],explanation:'Your debrief compares the mission outcome with the resources left for resupply.'}:super.lesson;}
 get stage(){return this.scenario.stages[Math.min(this.state.expedition.stage,this.scenario.stages.length-1)];}
 get rank(){return this.scenario?(this.state?.status==='complete'?this.scenario.rank:'Junior Mission Specialist'):super.rank;}
 get xp(){return this.scenario?(this.state.status==='complete'?700+this.state.expedition.outpost.science:0):super.xp;}
 get courseComplete(){return this.state.status==='complete';}
 save(){if(!this.scenario)return;}
 loadLevel(index){return this.scenario?false:super.loadLevel(index);}
 // Later expedition stages get harder circuits (power stage 4×4, relay stage 5×5).
 circuitDifficulty(){return 2+Math.round(this.state.expedition.stage*.75);}
 // The start of an expedition stage is its checkpoint.
 restartLevel(){if(this.checkpoint){this.replayCheckpoint();return true;}this.reset();return true;}
 newExpedition(){
  this.objects=copy(this.original.objects);this.science=copy(this.original.science).slice(0,1);this.science[0].name=this.config.world==='moon'?'BASALT SAMPLE':'JEZERO SCIENCE';
  // Keep the practical sample reachable without a multi-kilometre detour.
  const path=this.terrain.route(this.objects.base,this.objects.relay,this.config.walkMaxSlopeDegrees);this.science[0]={...path.path[Math.min(path.path.length-1,Math.floor(path.path.length*.72))],id:0,name:this.science[0].name};
  Mission.prototype.reset.call(this);this.state.training={inside:false,phase:'expedition',inspected:[],drill:null};this.state.phase='expedition';this.state.expedition={stage:0,taskDone:false,taskPhase:0,decisions:[],outpost:copy(this.scenario.initial),lastChange:'Preflight inventory loaded.',minutes:0,messages:[],askedStages:[],guideReadStages:[],revision:0};
  Object.assign(this.state.rover,{x:this.objects.base.x+2,y:this.objects.base.y,repaired:true,wh:this.config.rover.capacityWh});this.state.relayOnline=false;this.envelopeCache=null;this.checkpoint=null;this.checkpointUTC=null;
 }
 reset(){if(!this.scenario)return super.reset();this.newExpedition();}
 start(){super.start();if(this.state.status==='playing')this.saveCheckpoint();}
 target(){if(!this.scenario)return super.target();return this.stage.location==='relay'?this.objects.relay:this.stage.location==='science'?this.science[0]:this.objects.base;}
 syncTraining(){}
 awardField(){}
 atTarget(){return this.near(this.target());}
 near(point){return distance(this.state.player,point)*this.terrain.cell<=this.config.interactionMetres;}
 nearby(){
  if(!this.scenario)return super.nearby();const s=this.state;if(this.atTarget())return {type:'expedition',label:this.state.expedition.taskDone?'Choose the operating plan':this.stage.title,point:this.target()};
  if(s.rover.occupied)return {type:'exit',label:'Leave Echo',point:s.player};
  if(this.near(s.rover))return {type:'board',label:'Board Echo',point:s.rover};return null;
 }
 interact(){
  if(this.state.status!=='playing')return;const near=this.nearby();if(!near){this.notify('Follow the gold objective. Use Go to objective or WASD, then E beside the equipment.');return;}
  if(near.type==='expedition'){
   this.route=null;if(this.stage.location==='base')this.state.training.inside=true;
   if(this.stage.task==='circuit'&&!this.state.expedition.taskDone){this.repairType=this.stage.location==='relay'?'relay':'outpost';this.circuit=new Circuit(this.config.seed+this.state.expedition.stage*31,this.repairType,this.circuitDifficulty(this.repairType));this.state.status='repair';this.events.push({type:'repair'});}
   else this.events.push({type:'decision'});return;
  }super.interact();
 }
 completeRepair(){
  if(this.state.status!=='repair'||!this.circuit?.connected())return false;this.state.expedition.taskDone=true;this.state.repairs++;this.state.status='playing';this.circuit=null;this.record('repair',this.stage.title+' physically reconnected.');this.events.push({type:'decision'});return true;
 }
 scanNearby(){if(this.isExpedition&&this.stage.task==='sample'&&this.atTarget()){this.performTask();return;}super.scanNearby();}
 taskView(){
  const e=this.state.expedition;if(e.taskDone)return {label:'Equipment task complete',instruction:'Choose a plan. Preview its effects before committing.',done:true};
  const task=this.stage.task;
  if(task==='airlock'){const steps=[['Check suit oxygen and battery','Read actual suit reserves.'],['Seal the inner hatch','Interlock prevents both hatches opening.'],['Vent the airlock','Cabin pressure is released before the outer hatch opens.'],['Open the outer hatch','The suit is sealed; EVA may begin.']];const [label,instruction]=steps[e.taskPhase];return {label,instruction,phase:e.taskPhase};}
  if(task==='sample'){const steps=[['Scan elevation and coordinates','Read the NASA terrain grid at this position.'],['Collect the field sample','The sample rock is an authored reconstruction.'],['Tag and seal the canister','Record the site and secure the sample.']];const [label,instruction]=steps[e.taskPhase];return {label,instruction,phase:e.taskPhase};}
  if(task==='stow')return {label:'Stow sample and close the airlock',instruction:'Confirm the canister is secured inside Haven.'};
  if(task==='shelter')return {label:'Inspect the shelter and crew manifest',instruction:'Confirm four crewmates can shelter; dose protection is an illustrative game model.'};
  if(task==='inspection')return {label:'Inspect seals, filter and bus readings',instruction:'Use the real outpost readings shown below to choose your next action.'};
  return {label:'Reconnect the physical circuit first',instruction:'Close this panel, then press E to open the repair circuit.'};
 }
 performTask(){
  const s=this.state,e=s.expedition;if(!['playing','paused'].includes(s.status)||!this.atTarget()||e.taskDone||this.stage.task==='circuit')return false;
  const task=this.stage.task;
  if(task==='airlock'){
   if(e.taskPhase===0&&(s.oxygen<this.rules.evaOxygenReserveMinutes||s.suitWh<this.rules.evaBatteryReserveWh)){this.notify('Refill suit reserves at Haven before cycling the airlock.','warning');return false;}
   e.taskPhase++;s.training.inside=e.taskPhase<4;s.training.drill={suitChecked:e.taskPhase>=1,innerClosed:e.taskPhase>=2,pressure:e.taskPhase>=3?0:100,outerOpen:e.taskPhase>=4};if(e.taskPhase===4){e.taskDone=true;s.training.drill={complete:true,suitChecked:true,innerClosed:true,pressure:0,outerOpen:true};}
  }else if(task==='sample'){
   e.taskPhase++;if(e.taskPhase===1){const geo=this.terrain.geo(s.player);this.record('science','NASA elevation and coordinates scanned.',geo);if(!s.scans.includes(0))s.scans.push(0);}
   if(e.taskPhase===2)s.training.drill={collected:true,tagged:false,sealed:false,stowed:false};
   if(e.taskPhase===3){e.taskDone=true;s.training.drill={collected:true,tagged:true,sealed:true,stowed:false,site:this.terrain.geo(s.player)};}
  }else{e.taskDone=true;if(task==='stow'){s.training.inside=true;s.training.drill={...(s.training.drill||{}),collected:true,stowed:true};}}
  this.record('field-task',this.taskView().label);return true;
 }
 sunlit(){return this.astroWorld?this.astroWorld.apparent('Sun',this.astroWorld.observer(this.config.world,this.terrain.geo(this.state.player))).altitude>0:true;}
 preview(option){
  if(!option||!Number.isFinite(option.minutes)||option.minutes<0)return null;
  const s=copy(this.state),e=s.expedition,before=copy(e.outpost),inside=this.stage.location==='base';
  e.outpost=applyEffects(e.outpost,option.effects);
  if(option.effects.suitOxygen)s.oxygen=Math.min(this.config.suit.oxygenMinutes,s.oxygen+option.effects.suitOxygen);
  if(option.effects.suitEnergy)s.suitWh=clamp(s.suitWh+option.effects.suitEnergy,0,this.config.suit.batteryWh);
  this.advanceState(s,option.minutes*60,inside);
  return {state:s,before,outpost:e.outpost,power:powerBalance(e.outpost,this.sunlit()),failure:resourceFailure(e.outpost,this.sunlit())||(s.oxygen<=0?'Suit oxygen exhausted':s.suitWh<=0?'Suit battery exhausted':s.water<=0?'Suit water exhausted':null),minutes:option.minutes,
   suit:{oxygen:s.oxygen,energy:s.suitWh,water:s.water},delta:Object.fromEntries(['energy','oxygen','water','food','health','science','kits','fuel'].map(k=>[k,e.outpost[k]-before[k]]))};
 }
 choose(id,expectedStage=this.state.expedition.stage){
  const s=this.state,e=s.expedition,stage=this.stage,option=stage.options.find(x=>x.id===id);
  if(expectedStage!==e.stage||!['playing','paused'].includes(s.status)||!this.atTarget()||!e.taskDone||!option||Object.entries(option.effects).some(([k,v])=>['kits','fuel','water','oxygen','energy'].includes(k)&&typeof v==='number'&&e.outpost[k]+v<0))return false;
  const result=this.preview(option);
  e.outpost=result.outpost;s.oxygen=result.suit.oxygen;s.suitWh=result.suit.energy;s.water=result.suit.water;s.time=result.state.time;e.minutes=s.time/60;
  e.messages=result.state.expedition.messages;
  e.decisions.push({stage:stage.id,title:stage.title,choice:id,label:option.label,effects:copy(option.effects),minutes:option.minutes,time:s.time,before:result.before,after:copy(e.outpost),delta:result.delta});e.lastChange=option.label+'. '+option.explanation;e.revision=(e.revision||0)+1;
  this.record('decision',option.label,{effects:copy(option.effects),minutes:option.minutes});this.notify(option.explanation,'success');e.stage++;e.taskDone=false;e.taskPhase=0;this.envelopeCache=null;
  if(e.stage<this.scenario.stages.length){const hazard=this.stage.hazard;if(hazard){if(hazard.radiation!==undefined)e.outpost.radiationRate=hazard.radiation;if(hazard.dust!==undefined)e.outpost.dust=hazard.dust;this.record('scenario-event',this.stage.description);}
   if(this.stage.location!=='base')s.training.inside=false;if(this.stage.id==='science')s.training.drill=null;s.phase=this.stage.id;s.status='playing';this.saveCheckpoint();
  }else this.finishExpedition();this.checkFailure();return true;
 }
 advanceState(s,seconds,inside,{consumeSuit=true}={}){
  if(!Number.isFinite(seconds)||seconds<0)throw Error('Mission time must be finite and non-negative.');
  const e=s.expedition;e.outpost=simulateOutpost(e.outpost,seconds,this.rules,{inside,sunlit:this.sunlit()});s.time+=seconds;e.minutes=s.time/60;
  if(!inside&&consumeSuit){const factor=e.outpost.suitFactor;s.oxygen=Math.max(0,s.oxygen-seconds/60*factor);s.suitWh=Math.max(0,s.suitWh-seconds/3600*this.config.suit.idleWatts);s.water=Math.max(0,s.water-seconds/3600*this.config.suit.waterLitresPerHour);}
  for(const message of e.messages||[])if(s.time>=message.due)message.delivered=true;
 }
 consumeTime(seconds,inside){this.advanceState(this.state,seconds,inside);}
 earthDelay(){
  if(this.astroWorld){const earth=this.astroWorld.position('Earth'),site=this.astroWorld.observer(this.config.world,this.terrain.geo(this.state.player));return Math.hypot(earth.x-site.position.x,earth.y-site.position.y,earth.z-site.position.z)/299792.458;}
  return this.config.world==='moon'?1.3:720;
 }
 askEarth(){
  const s=this.state,e=s.expedition,cost=this.rules.earthMessageEnergyKwh||.15;
  if(!['playing','paused'].includes(s.status)||e.askedStages.includes(e.stage)||e.outpost.energy<cost)return false;
  const delay=this.earthDelay();e.outpost.energy-=cost;e.askedStages.push(e.stage);
  e.messages.push({stage:e.stage,sent:s.time,due:s.time+2*delay,oneWay:delay,cost,delivered:false,text:'Earth to Haven: '+this.stage.options[0].explanation+' Check the forecast against your current reserves; this reply describes the situation when you sent it.'});
  e.revision=(e.revision||0)+1;this.record('earth-message','Earth advice requested. Round-trip light time '+(2*delay).toFixed(1)+' mission seconds; '+cost+' kWh transmission cost.');this.saveCheckpoint();return true;
 }
 acknowledgeGuide(){const e=this.state.expedition;if(!e.guideReadStages.includes(e.stage))e.guideReadStages.push(e.stage);}
 update(dt,input={}){
  if(!this.scenario)return super.update(dt,input);if(this.state.status!=='playing')return;
  const s=this.state,old=s.time,oxy=s.oxygen,wh=s.suitWh,water=s.water;if(input.dx||input.dy||this.route)s.training.inside=false;super.update(dt,input);
  const elapsed=s.time-old,inside=s.training.inside,e=s.expedition;
  if(inside){s.oxygen=oxy;s.suitWh=wh;s.water=water;}else s.oxygen=Math.max(0,s.oxygen-(oxy-s.oxygen)*(e.outpost.suitFactor-1));
  s.time=old;this.advanceState(s,elapsed,inside,{consumeSuit:false});this.checkFailure();
 }
 checkFailure(){
  const s=this.state;if(s.status==='failed'||s.status==='complete')return;const reason=resourceFailure(s.expedition.outpost,this.sunlit())|| (s.oxygen<=0?'EVA oxygen exhausted':s.suitWh<=0?'EVA battery exhausted':s.water<=0?'Suit water exhausted':null);
  if(reason){s.status='failed';s.failureReason=reason;this.route=null;this.record('abort',reason);this.events.push({type:'ended'});}
 }
 forecast(hours=this.rules.resupplyHours,original=this.state.expedition.outpost){const sunlit=this.sunlit(),final=simulateOutpost(original,hours*3600,this.rules,{inside:true,sunlit}),failure=resourceFailure(final,sunlit);return {final,hours,failure,power:powerBalance(original,sunlit),safe:!failure&&final.health>=45&&final.habitat>=50};}
 finishExpedition(){
  const s=this.state,o=s.expedition.outpost,f=this.forecast(),success=f.safe&&o.science>=this.scenario.minimumScience&&o.relay&&o.habitat>=50;
  s.status=success?'complete':'failed';s.failureReason=success?null:f.failure||(!o.relay?'Field relay not restored':o.science<this.scenario.minimumScience?'Science objective not met':'Resupply safety margin insufficient');s.expedition.forecast=f;s.training.inside=true;this.route=null;
  if(success)this.completed=[{id:this.scenario.id,qualified:true,xp:this.xp}];this.record('debrief',success?'Crew, outpost and science objectives secured.':s.failureReason);this.events.push({type:'ended'});
 }
 objectiveIndex(){return this.scenario?Math.min(this.state.expedition.stage,7):super.objectiveIndex();}
 nextAction(){
  if(!this.scenario)return super.nextAction();const s=this.state;
  if(s.status==='ready')return {title:'Begin the outpost mission',text:this.scenario.brief,action:'Begin mission',command:'start'};
  if(['complete','failed'].includes(s.status))return {title:s.status==='complete'?'Mission secured':'Debrief your attempt',text:s.status==='complete'?'Your decisions protected the crew until resupply. Review the effects and explore another world.':s.failureReason,action:'Open mission debrief',command:'review'};
  if(s.status==='repair')return {title:'Reconnect the circuit',text:this.circuit.instructions,action:'Show a repair hint',command:'hint'};
  const at=this.atTarget();return {title:this.stage.title,text:at?this.stage.description:'Follow the gold '+this.target().name+' marker. '+this.stage.description,action:at?'Operate equipment · E':'Go to objective',command:at?'interact':'route'};
 }
 evaAt(point,{includeOutbound=true}={}){
  const s=this.state,o=s.expedition.outpost,home=this.terrain.route(point,this.objects.base,this.config.walkMaxSlopeDegrees);if(!home)return {status:'unsafe',safe:false,reason:'No traversable return route',returnMinutes:Infinity};
  const speed=this.config.walkMetresPerSecond*clamp(1-o.fatigue/180,.5,1)/o.suitFactor,outgoing=includeOutbound?distance(s.player,point)*this.terrain.cell*1.3/speed/60:0,minutes=home.metres/speed/60+outgoing+5,oxygenNeed=minutes*1.12*o.suitFactor+this.rules.evaOxygenReserveMinutes,energyNeed=minutes/60*this.config.suit.movingWatts+this.rules.evaBatteryReserveWh,dose=minutes/60*o.radiationRate;
  const limits=[{margin:s.oxygen-oxygenNeed,reason:'oxygen reserve'},{margin:(s.suitWh-energyNeed)/2,reason:'battery reserve'},{margin:(s.water-minutes/60*this.config.suit.waterLitresPerHour)/.025,reason:'suit water'},{margin:(o.health-dose*.5-35),reason:'crew health / radiation'}],critical=limits.reduce((a,b)=>a.margin<b.margin?a:b),margin=critical.margin,status=margin<0?'unsafe':margin<10?'caution':'safe';
  return {status,safe:status==='safe',reason:critical.reason,margin,returnMinutes:home.metres/speed/60,outboundMinutes:outgoing,totalMinutes:minutes,oxygenNeed,energyNeed,doseMsv:dose,path:home.path};
 }
 safetyEnvelope(){
  const s=this.state,o=s.expedition.outpost,key=[Math.round(s.oxygen),Math.round(s.suitWh/5),s.water.toFixed(2),Math.round(o.health),Math.round(o.fatigue),o.radiationRate,o.suitFactor,Math.round(s.player.x),Math.round(s.player.y),s.expedition.stage,Math.floor(s.time/20)].join(':');if(this.envelopeCache?.key===key)return this.envelopeCache;
  const cells=[],n=14,speed=this.config.walkMetresPerSecond*clamp(1-o.fatigue/180,.5,1)/o.suitFactor;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p={x:(x+.5)*this.terrain.width/n,y:(y+.5)*this.terrain.height/n},minutes=(distance(s.player,p)+distance(p,this.objects.base))*this.terrain.cell*1.35/speed/60+5,oxygen=s.oxygen-minutes*1.12*o.suitFactor-this.rules.evaOxygenReserveMinutes,battery=(s.suitWh-minutes/60*this.config.suit.movingWatts-this.rules.evaBatteryReserveWh)/2,water=(s.water-minutes/60*this.config.suit.waterLitresPerHour)/.025,health=o.health-minutes/60*o.radiationRate*.5-35,margin=Math.min(oxygen,battery,water,health);cells.push({...p,status:margin<0?'unsafe':margin<10?'caution':'safe'});}
  const current=this.evaAt(s.player,{includeOutbound:false});return this.envelopeCache={key,n,cells,current,reason:'Boundary follows suit oxygen '+s.oxygen.toFixed(1)+' min, battery '+s.suitWh.toFixed(0)+' Wh, fatigue '+o.fatigue.toFixed(0)+'%, radiation '+o.radiationRate.toFixed(2)+' mSv/h and a '+this.rules.evaOxygenReserveMinutes+' min oxygen reserve. Map uses conservative 1.35× distance estimates; the return readout uses the terrain route.'};
 }
 lifeline(){if(!this.scenario)return super.lifeline();const e=this.evaAt(this.state.player,{includeOutbound:false}),route={path:e.path||[],metres:(e.returnMinutes||0)*this.config.walkMetresPerSecond*60};return {safe:e.status!=='unsafe',status:e.status.toUpperCase()+' RETURN',reason:e.reason+' · '+e.returnMinutes.toFixed(1)+' min to Haven · 20 min O₂ reserve',margin:e.margin,route,minutes:e.returnMinutes};}
 saveCheckpoint(){if(!this.scenario)return;this.checkpoint=copy(this.state);this.checkpointUTC=this.astroWorld?this.utcStart+this.state.time:undefined;writePreference(this.saveKey,{schema:2,world:this.config.world,scenario:this.scenario.id,state:this.checkpoint,utc:this.checkpointUTC},this.expeditionStorage);}
 hasSavedCheckpoint(){const s=readPreference(this.saveKey,null,this.expeditionStorage);return s?.schema===2&&s.scenario===this.scenario.id&&s.state?.expedition?.stage>=0&&s.state.expedition.stage<7;}
 replayCheckpoint(){
  const record=readPreference(this.saveKey,null,this.expeditionStorage),saved=this.checkpoint|| (this.hasSavedCheckpoint()?record.state:null);if(!saved)return false;
  if(!Object.values(saved.expedition.outpost).every(x=>typeof x!=='number'||Number.isFinite(x)))return false;this.state=copy(saved);Object.assign(this.state.expedition,{messages:saved.expedition.messages||[],askedStages:saved.expedition.askedStages||[],guideReadStages:saved.expedition.guideReadStages||[],revision:saved.expedition.revision||0});this.state.expedition.outpost.growthHours??=0;this.state.expedition.outpost.harvests??=0;this.state.status='playing';this.route=null;this.circuit=null;this.events=[{type:'replayed'}];this.envelopeCache=null;if(this.astroWorld&&Number.isFinite(record?.utc)){this.astroWorld.setMissionUTC(record.utc);this.utcStart=record.utc-this.state.time;}return true;
 }
 debrief(){const s=this.state,o=s.expedition.outpost,f=s.expedition.forecast||this.forecast();return {success:s.status==='complete',rank:this.rank,lesson:this.lesson,badge:this.scenario.badge,score:this.xp,learning:f.safe?'Your plan preserves four hours of essential reserves.':'Review the energy, oxygen and shielding costs before retrying.',decisions:copy(s.expedition.decisions),outpost:copy(o),forecast:f,minutes:s.time/60,distanceKm:s.distanceMetres/1000,oxygenPercent:s.oxygen/this.config.suit.oxygenMinutes*100,science:o.science,repairs:s.repairs};}
 astra(question='next'){
  if(!this.scenario)return super.astra(question);const q=question.toLowerCase(),s=this.state,o=s.expedition.outpost,p=powerBalance(o,this.sunlit()),f=this.forecast();
  if(/shield/.test(q)){const active=this.forecast(1,{...o,shield:'active',shieldKw:3}),passive=this.forecast(1,{...o,shield:'passive',shieldKw:0});return 'Experimental concept, not flight-ready hardware. Illustrative one-hour forecast: powered shielding uses 3.0 kW extra; battery ends at '+active.final.energy.toFixed(1)+' kWh and habitat dose rises '+(active.final.radiation-o.radiation).toFixed(2)+' mSv. Passive shielding ends at '+passive.final.energy.toFixed(1)+' kWh and adds '+(passive.final.radiation-o.radiation).toFixed(2)+' mSv. These are calculated teaching rates. You choose the plan.';}
  if(/why.*power|power.*(drop|decreas)|energy/.test(q))return 'Supply '+p.supply.toFixed(2)+' kW, demand '+p.demand.toFixed(2)+' kW; balance '+p.net.toFixed(2)+' kW. Battery '+o.energy.toFixed(1)+' kWh. Dust optical depth '+o.dust.toFixed(2)+' attenuates the array; shielding uses '+o.shieldKw.toFixed(1)+' kW. '+s.expedition.lastChange;
  if(/surviv|resupply|water|food/.test(q))return 'Calculated '+f.hours+'-hour resupply forecast: '+(f.safe?'essential reserves hold.':'the plan is unsafe: '+(f.failure||'health or habitat margin is too low')+'.')+' Oxygen '+f.final.oxygen.toFixed(1)+' crew-hours; water '+f.final.water.toFixed(1)+' L; food '+f.final.food.toFixed(1)+' portions; energy '+f.final.energy.toFixed(1)+' kWh; health '+f.final.health.toFixed(0)+'%. Assumes the current daylight and operating plan continue.';
  if(/safe|eva|oxygen|reserve|lifeline/.test(q)){const e=this.evaAt(this.target());return 'EVA estimate to '+this.target().name+': '+e.status.toUpperCase()+'. Outward '+e.outboundMinutes?.toFixed(1)+' min, return '+e.returnMinutes.toFixed(1)+' min, plus 5 min field work. Need '+e.oxygenNeed?.toFixed(1)+' min oxygen including 20 min reserve; suit has '+s.oxygen.toFixed(1)+' min. Need '+e.energyNeed?.toFixed(0)+' Wh; suit has '+s.suitWh.toFixed(0)+' Wh. Limiting factor: '+e.reason+'.';}
  if(/risk|repair.*first|which.*repair/.test(q)){const risk=f.failure|| (o.leak?'a habitat leak draining 5 crew-hours of oxygen per hour':p.net<0?'a '+(-p.net).toFixed(2)+' kW power deficit':o.radiationRate>1&&o.shield==='none'?'radiation exposure without added shielding':this.evaAt(s.player,{includeOutbound:false}).status==='unsafe'?'insufficient suit return reserve':'the remaining science and relay tasks');return 'The largest current risk is '+risk+'. Habitat '+o.habitat.toFixed(0)+'%, crew health '+o.health.toFixed(0)+'%, battery '+o.energy.toFixed(1)+' kWh. '+this.nextAction().title+'.';}
  if(/source|nasa|accur|data/.test(q))return 'Elevation comes from NASA LOLA / MOLA and sky geometry from cached JPL ICRF vectors. Events, consumption, radiation and reconstructed small rocks are editable game assumptions, not exact NASA observations. Open Science for the dataset credits and resolution.';
  return this.nextAction().title+'. '+this.nextAction().text+' '+(s.expedition.lastChange||'');
 }
}
