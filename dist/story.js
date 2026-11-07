import {readPreference,writePreference} from './preferences.js';
export const STORY_KEY='luna-story-enabled-v1';
export const STORY_DURATION=26;
export const storyChapters=[
 {start:0,end:6,shot:'arrival',kicker:'CHAPTER 01 / FAR FROM HOME',title:'A small home. A vast universe.',speaker:'ASTRA',caption:'Four explorers. One fragile home. On the Moon or Mars, everything our crew needs must be carried, grown, or carefully saved.'},
 {start:6,end:12,shot:'echo',kicker:'CHAPTER 02 / THE SIGNAL',title:'Haven needs you.',speaker:'MISSION CONTROL',caption:'Haven has lost power. The greenhouse is going dark, and the relay is silent. Our crew needs a mission specialist. That is you.'},
 {start:12,end:19,shot:'relay',kicker:'CHAPTER 03 / A CHOICE THAT MATTERS',title:'Every watt has a job.',speaker:'ASTRA',caption:'Power for a repair means less power for growing food. A trip outside costs oxygen. We will test your plans together, before you decide.'},
 {start:19,end:26,shot:'astronaut',kicker:'CHAPTER 04 / YOUR JOURNEY',title:'Ready, astronaut?',speaker:'ASTRA',caption:'Choose the Moon or Mars. Board Odyssey, take the launch controls, and guide your landing. Then help our four-person crew make Haven a home.'}
];
export class StorySequence {
 constructor(storage=null){this.storage=storage;this.enabled=readPreference(STORY_KEY,true,storage)!==false;this.state='idle';this.elapsed=0;this.index=0;this.generation=0;}
 get shouldPlay(){return this.enabled&&this.state==='idle';}
 setEnabled(value){this.enabled=value===true;writePreference(STORY_KEY,this.enabled,this.storage);}
 get active(){return this.state==='playing';}
 get chapter(){return storyChapters[this.index];}
 attachAudio(audio){this.audio=audio;}
 start(){if(!this.shouldPlay)return false;this.state='playing';this.elapsed=0;this.index=0;this.generation++;return true;}
 // The opening is one continuous timeline: each scene flows straight into the next with no hold.
 update(dt,hidden=false){
  if(!this.active||hidden)return false;
  dt=Math.max(0,Math.min(dt,.5));
  this.elapsed=Math.min(STORY_DURATION,this.elapsed+dt);
  const next=storyChapters.findIndex(c=>this.elapsed<c.end);
  this.index=next<0?storyChapters.length-1:next;
  if(this.elapsed>=STORY_DURATION-1e-8){this.finish();return true;}
  return false;
 }
 finish(skipped=false){if(!this.active)return;this.state=skipped?'skipped':'finished';this.generation++;}
 replay(){this.state='idle';this.generation++;return this.start();}
}