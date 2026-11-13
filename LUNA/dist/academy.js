import { Mission, Circuit, distance } from './engine.js';
import { readPreference, writePreference } from './preferences.js';
import { DRILL_IDS, initialDrill, equipmentReadout, drillView } from './training-drills.js';

const copy=x=>JSON.parse(JSON.stringify(x));
const SAVE_KEY='luna-academy-v1';
export class TrainingMission extends Mission {
  constructor(terrain,config,ephemerides,academy,storage=null) {
    super(terrain,config,ephemerides);
    if(!academy?.levels?.length)throw Error('The training curriculum is missing.');
    this.academy=academy;this.storage=storage;this.original={objects:copy(this.objects),science:copy(this.science)};
    const saved=readPreference(SAVE_KEY,{},storage);
    this.completed=Array.isArray(saved.completed)?saved.completed.filter(r=>academy.levels.some(l=>l.id===r.id)&&r.qualified===true):[];
    this.unlocked=Math.min(academy.levels.length-1,this.completed.reduce((n,r)=>Math.max(n,academy.levels.findIndex(l=>l.id===r.id)+1),0));
    this.levelIndex=Number.isInteger(saved.current)&&saved.current>=0&&saved.current<=this.unlocked?saved.current:0;
    this.loadLevel(this.levelIndex);
  }
  get lesson(){return this.academy.levels[this.levelIndex];}
  get isTraining(){return true;}
  get rank(){return this.completed.length?this.academy.levels[Math.max(...this.completed.map(r=>this.academy.levels.findIndex(l=>l.id===r.id)))].rank:'Junior Cadet';}
  get xp(){return this.completed.reduce((n,r)=>n+r.xp,0);}
  get courseComplete(){return this.completed.length===this.academy.levels.length;}
  save(){writePreference(SAVE_KEY,{current:this.levelIndex,completed:this.completed},this.storage);}
  reset(){if(!this.academy)return super.reset();this.loadLevel(this.levelIndex);}
  loadLevel(index){
    if(!Number.isInteger(index)||index<0||index>this.unlocked)return false;
    this.levelIndex=index;this.objects=copy(this.original.objects);this.science=copy(this.original.science);super.reset();
    this.reviewPassed=false;this.state.training={phase:'',inspected:[],powerBus:false,allocations:null,sealed:false};
    const s=this.state,id=this.lesson.id;
    const path=this.terrain.route(s.player,this.objects.relay,this.config.walkMaxSlopeDegrees);
    this.practice={...(path?.path[Math.min(5,path.path.length-1)]||this.science[0]),id:0,name:'TRAINING BEACON'};
    if(id==='eva'){this.science=[this.practice];s.training.phase='walk';s.relayOnline=true;}
    if(id==='systems'){this.science=[];s.training.phase='bus';s.relayOnline=true;}
    if(id==='recovery')s.training.phase='relay';
    if(id==='science'){
      this.science=this.science.slice(0,2);s.training.phase='survey';s.relayOnline=true;
      Object.assign(s.rover,{x:this.objects.base.x+2,y:this.objects.base.y,repaired:true,wh:this.config.rover.capacityWh});
    }
    if(id==='shelter'){
      this.science=[];s.training.phase='shelter';s.relayOnline=true;
      Object.assign(s.player,{x:this.practice.x,y:this.practice.y});
      Object.assign(s.rover,{x:this.objects.base.x+2,y:this.objects.base.y,repaired:true,wh:this.config.rover.capacityWh});
    }
    if(DRILL_IDS.includes(id)){
      this.science=[];s.training.phase=id==='samples'?'collect':id==='logistics'?'load':'equipment';s.training.drill=initialDrill(id);s.relayOnline=id!=='comms';
      this.practice.name=id==='samples'?'FIELD SAMPLE':'FIELD SUPPLY STATION';
      Object.assign(s.rover,{x:this.objects.base.x+2,y:this.objects.base.y,repaired:true,wh:this.config.rover.capacityWh});
    }
    s.phase=s.training.phase==='relay'?'relay':s.training.phase;this.state.journal=[];this.record('briefing',this.lesson.title+' prepared.');this.save();return true;
  }
  nextLevel(){if(this.state.status!=='complete'||!this.completed.some(r=>r.id===this.lesson.id)||this.levelIndex>=this.academy.levels.length-1)return false;return this.loadLevel(this.levelIndex+1);}
  target(){
    if(!this.academy)return super.target();const s=this.state,id=this.lesson.id;
    if(id==='recovery')return s.phase==='return'&&!s.rover.occupied?s.rover:super.target();
    if(id==='eva')return s.training.phase==='return'?this.objects.base:this.practice;
    if(id==='science'&&s.training.phase==='survey')return this.science.find(p=>!s.scans.includes(p.id))||this.objects.base;
    if(id==='comms')return this.objects.relay;
    if(id==='samples'&&!s.training.drill.collected)return this.practice;
    if(id==='logistics'){const d=s.training.drill;if(d.loaded&&!d.delivered)return s.rover.occupied?this.practice:s.rover;}
    return this.objects.base;
  }
  colliders(){const props=super.colliders();return this.academy&&this.lesson.id==='solar'?props.map(p=>p.kind==='solar'?{...p,halfX:Math.hypot(p.halfX,p.halfY),halfY:Math.hypot(p.halfX,p.halfY)}:p):props;}
  near(p){return distance(this.state.player,p)*this.terrain.cell<=this.config.interactionMetres;}
  update(dt,input={}){super.update(dt,input);if(this.academy)this.syncTraining();}
  syncTraining(){
    const s=this.state,id=this.lesson.id;if(s.status==='complete'){this.awardField();return;}if(id==='recovery'){s.training.phase=s.phase;return;}
    if(id==='eva')s.training.phase=s.scans.includes(0)?'return':s.distanceMetres>=40?'scan':'walk';
    if(id==='science')s.training.phase=s.scans.length<2?'survey':s.training.inspected.length<2?'track':'return';
    s.phase=s.training.phase;
  }
  nearby(){
    if(!this.academy||this.lesson.id==='recovery')return super.nearby();
    const s=this.state,id=this.lesson.id;
    if(DRILL_IDS.includes(id)){
      const d=s.training.drill;
      if(id==='samples'&&!d.collected&&this.near(this.practice))return{type:'sample',label:'Collect the field sample',point:this.practice};
      if(id==='logistics'&&d.loaded){
        if(s.rover.occupied&&d.delivered&&this.near(this.objects.base))return{type:'training-dock',label:'Dock Echo at Haven',point:this.objects.base};
        if(s.rover.occupied&&!d.delivered&&this.near(this.practice))return{type:'cargo-delivery',label:'Unload the supply crate',point:this.practice};
        if(!s.rover.occupied&&this.near(s.rover))return{type:'board',label:'Board Echo for the supply run',point:s.rover};
      }
      const station=id==='comms'?this.objects.relay:this.objects.base;
      if(this.near(station)&&(id!=='samples'||d.collected)&&(id!=='logistics'||!d.loaded))return{type:'drill',label:id==='solar'?'Operate the solar array':id==='airlock'?'Practise the airlock cycle':id==='samples'?'Prepare the sample canister':id==='comms'?'Point the relay antenna':'Load Echo’s cargo rack',point:station};
      if(s.rover.occupied)return{type:'exit',label:'Leave Echo',point:s.player};
      return null;
    }
    if(this.near(this.objects.base)){
      if(id==='systems')return{type:s.training.powerBus?'allocation':'outpost',label:s.training.powerBus?'Balance outpost power':'Repair Haven’s power bus',point:this.objects.base};
      if(id==='shelter')return{type:'shelter',label:'Enter Haven and seal the shelter',point:this.objects.base};
      if(s.training.phase==='return')return{type:'training-return',label:'Check in at Haven',point:this.objects.base};
    }
    const survey=this.science.find(p=>!s.scans.includes(p.id)&&this.near(p));
    if(survey)return{type:'scan',label:'Press Q · record terrain observation',point:survey};
    if(id==='science'&&this.near(s.rover))return{type:s.rover.occupied?'exit':'board',label:s.rover.occupied?'Leave Echo':'Board Echo for the survey',point:s.rover};
    if(s.rover.occupied)return{type:'exit',label:'Leave Echo',point:s.player};
    return null;
  }
  interact(){
    if(!this.academy||this.lesson.id==='recovery'){super.interact();if(this.academy)this.syncTraining();return;}
    if(this.state.status!=='playing')return;const n=this.nearby(),s=this.state;
    if(!n){this.notify('Follow your next-action card. Use Go to objective to reach the marked destination.');return;}
    if(n.type==='outpost'){
      this.repairType='outpost';s.status='repair';this.route=null;this.circuit=new Circuit(this.config.seed+88,'outpost');this.events.push({type:'repair'});return;
    }
    if(n.type==='allocation'||n.type==='shelter'){this.route=null;this.events.push({type:'systems',emergency:n.type==='shelter'});return;}
    if(n.type==='drill'){this.route=null;this.events.push({type:'drill'});return;}
    if(n.type==='sample'){
      s.training.drill.collected=true;s.training.drill.site=this.terrain.geo(this.practice);s.training.phase='return';this.record('sample','Collected the field sample.',s.training.drill.site);this.notify('Sample collected. Return to Haven’s laboratory to label, seal and stow it.','success');this.syncTraining();return;
    }
    if(n.type==='cargo-delivery'){s.training.drill.delivered=true;s.training.phase='return';this.record('delivery','Supply crate unloaded at the field station.');this.notify('Crate delivered. Drive Echo back to Haven and press E to dock.','success');this.syncTraining();return;}
    if(n.type==='training-dock'){s.training.drill.complete=true;this.finishTraining();return;}
    if(n.type==='training-return'){this.finishTraining();return;}
    if(n.type==='board'&&['science','logistics'].includes(this.lesson.id)){
      s.rover.occupied=true;s.player.x=s.rover.x;s.player.y=s.rover.y;this.route=null;this.record('board','Boarded Echo.');this.notify(this.lesson.id==='logistics'?'Cargo secured. Drive to the gold field supply marker and press E to unload.':'Echo ready for the survey. Follow the cyan sites and press Q to record each observation.','success');return;
    }
    super.interact();this.syncTraining();
  }
  completeRepair(){
    if(this.lesson.id!=='systems')return super.completeRepair();
    if(this.state.status!=='repair'||!this.circuit?.connected())return false;
    const s=this.state;s.training.powerBus=true;s.training.phase='allocation';s.phase='allocation';s.repairs++;s.status='playing';this.circuit=null;
    this.record('power-bus','Haven power bus restored.');this.events.push({type:'repaired'});this.notify('Power circuit repaired. Press E again to balance Haven’s systems.','success');return true;
  }
  scan(site){super.scan(site);if(this.academy)this.syncTraining();}
  inspect(name){
    if(this.lesson.id!=='science'||!['playing','paused'].includes(this.state.status))return false;
    if(!['Earth','LRO'].includes(name))return false;
    const body=this.astronomy().find(b=>b.name===name&&b.inCoverage);if(!body)return false;
    if(!this.state.training.inspected.includes(name)){this.state.training.inspected.push(name);this.record('tracking',name+' inspected from dated JPL samples.',{distanceKm:body.distanceKm});}
    this.syncTraining();return true;
  }
  powerPlan(values,sealed=false){
    const emergency=this.lesson.id==='shelter',p=this.academy.power;
    const supply=emergency?p.emergencySupplyKw:p.normalSupplyKw;
    const demands={life:p.lifeSupportMinimumKw,food:emergency?p.greenhouseEmergencyMinimumKw:p.greenhouseNormalMinimumKw,comms:emergency?p.communicationsEmergencyMinimumKw:p.communicationsNormalMinimumKw};
    const validNumbers=['life','food','comms'].every(k=>Number.isFinite(values[k])&&values[k]>=0&&values[k]<=supply);
    const total=values.life+values.food+values.comms,reserve=supply-total;
    const covered=validNumbers&&Object.keys(demands).every(k=>values[k]>=demands[k]);
    return {supply,demands,total,reserve,covered,valid:validNumbers&&covered&&reserve>=p.reserveMinimumKw&&(!emergency||sealed),emergency,sealed,coverage:{life:Math.min(1,values.life/demands.life),food:Math.min(1,values.food/demands.food),comms:Math.min(1,values.comms/demands.comms)}};
  }
  applyPower(values,sealed=false){
    if(!['systems','shelter'].includes(this.lesson.id)||!['playing','paused'].includes(this.state.status)||!this.near(this.objects.base)||this.lesson.id==='systems'&&!this.state.training.powerBus)return false;
    const plan=this.powerPlan(values,sealed);if(!plan.valid)return false;
    this.state.training.allocations={...values};this.state.training.sealed=sealed;this.state.training.power=plan;
    this.record('power-allocation','Essential systems powered within the available supply.',{...values,reserveKw:plan.reserve,sealed});this.finishTraining();return true;
  }
  drillView(){return this.state.training.drill?drillView(this.lesson.id,this.state.training.drill):null;}
  atEquipment(){return this.near(this.lesson.id==='comms'?this.objects.relay:this.objects.base);}
  adjustDrill(key,value){
    if(!['playing','paused'].includes(this.state.status)||!this.atEquipment()||!['solar','comms'].includes(this.lesson.id)||!['tilt','bearing'].includes(key)||!Number.isFinite(value)||value<0||value>(key==='tilt'?85:360))return false;
    this.state.training.drill[key]=value;return true;
  }
  performDrill(action){
    const s=this.state,d=s.training.drill,id=this.lesson.id;
    if(!d||!['playing','paused'].includes(s.status)||!this.atEquipment()||d.complete)return false;
    let done=false;
    if(action==='connect-solar'&&id==='solar'&&equipmentReadout(id,d).valid)done=true;
    else if(action==='connect-comms'&&id==='comms'&&equipmentReadout(id,d).valid){s.relayOnline=true;done=true;}
    else if(id==='airlock'){
      if(action==='check-suit'&&!d.suitChecked&&s.oxygen>this.config.suit.oxygenMinutes*.2&&s.suitWh>this.config.suit.batteryWh*.2)d.suitChecked=true;
      else if(action==='seal-inner'&&d.suitChecked&&!d.innerClosed){d.innerClosed=true;s.training.inside=true;}
      else if(action==='vent'&&d.innerClosed&&d.pressure>0)d.pressure=0;
      else if(action==='open-outer'&&d.innerClosed&&d.pressure===0){d.outerOpen=true;s.training.inside=false;done=true;}
      else return false;
    }else if(id==='samples'&&d.collected){
      if(action==='tag-sample'&&!d.tagged)d.tagged=true;
      else if(action==='seal-sample'&&d.tagged&&!d.sealed)d.sealed=true;
      else if(action==='stow-sample'&&d.tagged&&d.sealed){d.stowed=true;done=true;}
      else return false;
    }else if(action==='load-cargo'&&id==='logistics'&&!d.loaded){d.loaded=true;s.training.phase='deliver';}
    else return false;
    this.record('equipment-action',action.replaceAll('-',' ')+' completed.');
    if(done){d.complete=true;this.finishTraining();}else this.syncTraining();return true;
  }
  awardField(){
    if(this.state.status!=='complete'||this.completed.some(r=>r.id===this.lesson.id))return;
    this.completed.push({id:this.lesson.id,qualified:true,fieldComplete:true,reviewPassed:false,xp:this.academy.rewards.stageCompletionXp,timeMinutes:this.state.time/60,oxygenPercent:this.state.oxygen/this.config.suit.oxygenMinutes*100});
    this.unlocked=Math.min(this.academy.levels.length-1,Math.max(this.unlocked,this.levelIndex+1));this.save();
  }
  finishTraining(){
    const s=this.state;if(s.status==='complete')return;
    s.status='complete';this.route=null;s.training.phase='complete';this.record('training-complete',this.lesson.skill+' demonstrated.');this.awardField();this.events.push({type:'ended'});
  }
  qualify(answer){
    if(this.state.status!=='complete')return{correct:false,message:'Complete the field tasks first.'};
    if(Number(answer)!==this.lesson.correct)return{correct:false,message:this.lesson.explanation+' Try the question again.'};
    this.reviewPassed=true;this.awardField();const result=this.completed.find(r=>r.id===this.lesson.id);
    result.reviewPassed=true;result.xp=this.academy.rewards.stageCompletionXp+this.academy.rewards.correctReviewXp;this.save();
    return{correct:true,message:this.lesson.explanation+' Bonus earned: '+this.academy.rewards.correctReviewXp+' XP.'};
  }
  objectiveIndex(){const s=this.state,id=this.lesson.id,d=s.training.drill;if(s.status==='complete')return this.lesson.steps.length;if(id==='recovery')return['relay','recover','return'].indexOf(s.phase);if(id==='eva')return['walk','scan','return'].indexOf(s.training.phase);if(id==='systems')return s.training.powerBus?1:0;if(id==='science')return['survey','track','return'].indexOf(s.training.phase);if(id==='samples')return !d.collected?0:this.near(this.objects.base)?2:1;if(id==='logistics')return !d.loaded?0:!d.delivered?1:2;if(id==='airlock')return !d.suitChecked?0:d.pressure>0?1:2;if(['solar','comms'].includes(id))return !this.atEquipment()?0:equipmentReadout(id,d).valid?2:1;return this.near(this.objects.base)?1:0;}
  nextAction(){
    const s=this.state,n=this.nearby(),id=this.lesson.id;
    if(s.status==='ready')return{title:'Start your lesson',text:this.lesson.brief,action:'Start level '+(this.levelIndex+1),command:'start'};
    if(s.status==='complete')return{title:'Level complete · badge earned',text:this.levelIndex<this.academy.levels.length-1?'Your practical task unlocked the next level. Continue when you are ready.':'You completed the full training course. Review your badges and replay any lesson.',action:this.levelIndex<this.academy.levels.length-1?'Continue to level '+(this.levelIndex+2):'View training record',command:'advance'};
    if(s.status==='failed')return{title:'Try a safer approach',text:'Replay the checkpoint and check the Lifeline before taking a detour.',action:'Review attempt',command:'review'};
    if(s.status==='repair')return{title:'Reconnect the circuit',text:this.circuit.instructions+' Then apply the repair.',action:'Show a repair hint',command:'hint'};
    if(id==='science'&&s.training.phase==='track')return{title:'Inspect Earth and LRO',text:'Open the orbital tracker, then select Inspect Earth and Inspect LRO. These are dated positions, not destinations you can walk to.',action:'Open orbital tracker',command:'orbit'};
    if(n?.type==='scan'&&(id!=='eva'||s.training.phase==='scan'))return{title:'Record the observation',text:'You reached the cyan beacon. Press Q or Scan now to read elevation and coordinates from the NASA terrain.',action:'Scan now · Q',command:'scan'};
    if(n&&['relay','rover','board','dock','outpost','allocation','shelter','training-return','sample','drill','cargo-delivery','training-dock'].includes(n.type))return{title:n.label,text:n.type==='board'?'Press E to board the repaired rover.':n.type==='shelter'?'Enter the shelter, seal it and meet the emergency power demands.':n.type==='drill'?'Open the equipment controls. Watch the instructor demonstration, then practise with the live 3D equipment.':'Press E or use the action button below. The lesson advances after the action succeeds.',action:n.label+' · E',command:'interact'};
    const label=this.target().name||'Haven';return{title:id==='eva'&&s.training.phase==='walk'?'Walk toward the training beacon':'Reach '+label,text:'Drag to look around. Show objective points out your destination; Astronaut view (F) looks through your helmet. Use WASD to move or Go to objective to follow a route. Gold marks the destination; cyan marks surveys.',action:'Go to objective',command:'route'};
  }
  debrief(){const d=super.debrief();if(!this.academy)return d;return{...d,rank:this.lesson.rank,lesson:this.lesson,badge:this.lesson.badge,learning:this.lesson.explanation,score:this.academy.rewards.stageCompletionXp+(this.reviewPassed?this.academy.rewards.correctReviewXp:0)};}
  astra(question='next'){
    if(!/nasa|source|data|real|accur|orbit|planet|earth|satellite|sun|mars|oxygen|safe|reserve|lifeline|slope/.test(question.toLowerCase()))return this.nextAction().title+'. '+this.nextAction().text+' Learning goal: '+this.lesson.skill+'.';
    return super.astra(question);
  }
}
