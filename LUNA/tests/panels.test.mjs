import test from 'node:test';
import assert from 'node:assert/strict';
import { MovablePanel } from '../dist/panels.js';

class Surface {
  constructor() { this.events=new Map();this.hidden=false;this.style={};this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)};this.rect={left:100,top:100,width:335,height:240}; }
  addEventListener(name,fn){const list=this.events.get(name)||[];list.push(fn);this.events.set(name,list);}
  fire(name,fields={}){const e={preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.propagationStopped=true;},...fields};for(const fn of this.events.get(name)||[])fn(e);return e;}
  getClientRects(){return this.hidden?[]:[this.getBoundingClientRect()];}
  getBoundingClientRect(){return {...this.rect,left:parseFloat(this.style.left)||this.rect.left,top:parseFloat(this.style.top)||this.rect.top,height:Math.min(this.rect.height,parseFloat(this.style.maxHeight)||this.rect.height)};}
  focus(){} setPointerCapture(id){this.capture=id;} hasPointerCapture(id){return this.capture===id;} releasePointerCapture(){this.capture=null;}
}
function fixture(storage, savedKey='test-panel'){
  const view=new Surface();view.innerWidth=1000;view.innerHeight=700;
  const panel=new Surface(),handle=new Surface(),resetButton=new Surface();let grabs=0;
  const controller=new MovablePanel({panel,handle,resetButton,storage,storageKey:savedKey,view,onGrab:()=>grabs++});controller.refresh();
  return {view,panel,handle,resetButton,controller,get grabs(){return grabs;}};
}
const storageFixture=()=>{const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};

test('touch/pointer dragging stays visible, releases cleanly, survives reopening, and reclamps on a smaller viewport',()=>{
  const storage=storageFixture(),f=fixture(storage);
  f.handle.fire('pointerdown',{button:0,isPrimary:true,pointerId:7,clientX:130,clientY:120});
  f.view.fire('pointermove',{pointerId:99,clientX:5000,clientY:5000});assert.equal(f.panel.style.left,'100px');
  f.view.fire('pointermove',{pointerId:7,clientX:5000,clientY:5000});assert.equal(f.panel.style.left,'653px');assert.equal(f.panel.style.top,'448px');
  f.view.fire('pointercancel',{pointerId:7});assert.equal(f.handle.capture,null);assert.equal(f.panel.classes.has('is-dragging'),false);assert.equal(f.grabs,1);
  const restored=fixture(storage);assert.equal(restored.panel.style.left,'653px');assert.equal(restored.panel.style.top,'448px');
  restored.view.innerWidth=420;restored.view.innerHeight=400;restored.view.fire('resize');assert.equal(restored.panel.style.left,'73px');assert.equal(restored.panel.style.top,'148px');
  restored.panel.rect.height=600;restored.view.fire('resize');assert.equal(restored.panel.style.top,'12px');assert.equal(restored.panel.style.maxHeight,'376px');
});

test('keyboard movement does not propagate to game controls, reset restores the default, and blocked storage remains usable',()=>{
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}},f=fixture(denied);
  const e=f.handle.fire('keydown',{key:'ArrowRight',shiftKey:true});assert.equal(e.defaultPrevented,true);assert.equal(e.propagationStopped,true);assert.equal(f.panel.style.left,'140px');
  f.handle.fire('keydown',{key:'ArrowUp'});assert.equal(f.panel.style.top,'90px');
  f.handle.fire('keydown',{key:'Home'});assert.equal(f.panel.style.left,'100px');assert.equal(f.panel.style.top,'100px');
  f.view.visualViewport={width:420,height:260,offsetLeft:0,offsetTop:250,addEventListener(){}};f.controller.refresh();
  assert.equal(f.panel.style.left,'73px');assert.equal(f.panel.style.top,'262px');assert.equal(f.panel.style.maxHeight,'236px');
});
