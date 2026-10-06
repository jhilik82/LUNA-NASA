import { readPreference, writePreference } from './preferences.js';
const KEY='luna-academy-guide-v1';
export class AcademyGuide {
  constructor(mission,storage=null){this.mission=mission;this.storage=storage;this.active=!readPreference(KEY,{disabled:false},storage)?.disabled;this.reason='';}
  get steps(){return [{id:'welcome'},...this.mission.lesson.steps.map((_,i)=>({id:'task-'+i}))];}
  get index(){return this.mission.state.status==='ready'?0:Math.max(1,this.mission.objectiveIndex()+1);}
  get holdsTime(){return false;}
  get step(){const n=this.mission.nextAction(),repair=this.mission.state.status==='repair';return{id:this.mission.state.status==='ready'?'welcome':repair?(this.mission.repairType==='rover'?'echo-repair':'relay-repair'):'task-'+this.mission.objectiveIndex(),title:n.title,text:n.text,action:n.action,command:n.command,target:repair?'circuit-grid':n.command==='scan'?'world':n.command==='interact'?'interact-button':n.command==='start'?'start-button':n.command==='orbit'?'orbit-tab':'route-button',hold:false};}
  next(){}
  forLevel(){this.active=!readPreference(KEY,{disabled:false},this.storage)?.disabled;this.reason='';}
  restart(){this.active=true;this.reason='';writePreference(KEY,{disabled:false},this.storage);}
  disable(reason='skipped'){this.active=false;this.reason=reason;writePreference(KEY,{disabled:true,reason},this.storage);}
  sync(mission){if(mission.state.status==='complete'){this.active=false;this.reason='lesson-complete';}else if(mission.state.status==='failed'){this.active=false;this.reason='failed';}}
}
