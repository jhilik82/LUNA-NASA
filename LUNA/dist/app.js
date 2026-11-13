import { clamp } from './engine.js';
import { TrainingMission } from './academy.js';
import { Renderer } from './render-3d.js';
import { AcademyGuide } from './academy-guide.js';
import { Soundtrack } from './audio.js';
import { readPreference, writePreference } from './preferences.js';
import { MovablePanel } from './panels.js';
import { resolveRouteRequest, planSurfaceRoute } from './navigation.js';
import { StorySequence } from './story.js';

const $ = id => document.getElementById(id);
const keys = new Set();
let mission, renderer, life, tutorial, audio, story, tutorialPanel, astraPanel, storage = null, reducedMotion = false, astraLessonAnswered = false;
let lastTime = 0, uiElapsed = 0, noticeTimer, bannerTimer, shownTutorialStep = '', previousOccupied = false, highlightedTutorialTarget = null, circuitHintStep = '';
let toastMessage = '';
let assistedPlan = null, assistedFollowing = false, selectingRoutePoint = false, labelsEnabled = true, displayedLesson = '';
let workbenchOpen=false, panDragMode=false, preferredPerspective='third-person';
const workbenchRanges=new Map();
const formatClock = seconds => {
  const n = Math.max(0, Math.floor(seconds));
  return [Math.floor(n / 3600) % 24, Math.floor(n / 60) % 60, n % 60].map(x => String(x).padStart(2, '0')).join(':');
};
const meters = metres => (metres / 1000).toFixed(2) + ' km';
const dialogOpen = () => document.querySelector('dialog[open]');

function beep(frequency = 440, duration = 0.08) {
  audio?.cue('click');
}
function cinematic(kicker, title, caption) {
  const banner = $('event-banner'); clearTimeout(bannerTimer);
  $('event-kicker').textContent = kicker; $('event-title').textContent = title; $('event-caption').textContent = caption;
  banner.hidden = true; void banner.offsetWidth; banner.hidden = false;
  bannerTimer = setTimeout(() => banner.hidden = true, reducedMotion ? 2000 : 3600);
}
function syncSettings() {
  document.body.classList.toggle('audio-muted', audio.muted);
  document.body.classList.toggle('motion-reduced', reducedMotion);
  $('sound-button').setAttribute('aria-pressed', String(!audio.muted));
  $('sound-button').setAttribute('aria-label', audio.muted ? 'Enable soundtrack' : 'Mute soundtrack');
  $('sound-button').title = audio.muted ? 'Enable soundtrack' : 'Mute soundtrack';
  $('sound-button').innerHTML = audio.muted ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-4v12l-4-4H3V8Zm11-1 4 6m0-6-4 6"/></svg>' : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-4v12l-4-4H3V8Zm10-2c4 2 4 6 0 8m0-6c2 1 2 3 0 4"/></svg>';
  $('music-toggle').textContent = audio.muted ? 'Music and effects off' : 'Music and effects on';
  $('music-toggle').setAttribute('aria-pressed', String(!audio.muted));
  $('music-volume').value = String(Math.round(audio.volume * 100)); $('music-volume-value').textContent = Math.round(audio.volume * 100) + '%';
  $('motion-button').textContent = reducedMotion ? 'Reduced motion enabled' : 'Full cinematic motion';
  $('motion-button').setAttribute('aria-pressed', String(reducedMotion));
  renderer.reducedMotion = reducedMotion;
  $('opening-toggle').textContent=story.enabled?'Opening animation on':'Opening animation off';
  $('opening-toggle').setAttribute('aria-pressed',String(story.enabled));
  const enabled = readPreference('luna-academy-guide-v1', {disabled:false}, storage)?.disabled !== true;
  for(const id of ['tutorial-toggle','tutorial-setting-toggle']) { $(id).textContent = enabled ? 'Tutorial on' : 'Tutorial off'; $(id).setAttribute('aria-pressed',String(enabled)); }
  $('tutorial-setting').textContent = enabled ? 'ASTRA explains each action as you perform it. Each new level has its own guide.' : 'Tutorial hidden. Turn it on or show it below; your mission progress is kept.';
  $('labels-button').textContent = labelsEnabled ? 'High contrast world labels on' : 'World labels off';
  $('labels-button').setAttribute('aria-pressed',String(labelsEnabled));
}
function syncTutorial() {
  if (!tutorial) return;
  const wasActive = tutorial.active; tutorial.sync(mission);
  if (wasActive && !tutorial.active && tutorial.reason === 'lesson-complete') notice('Level complete. Badge earned; the next level is ready.', 'success');
  const card = $('tutorial-card'), modal = dialogOpen();
  const visible = tutorial.active && !workbenchOpen && (!modal || modal.id === 'repair-dialog');
  card.hidden = !visible;
  if (!visible) { highlightedTutorialTarget?.classList.remove('tutorial-target'); highlightedTutorialTarget = null; syncSettings(); return; }
  const step = tutorial.step, insideRepair = modal?.id === 'repair-dialog';
  const parent = insideRepair ? $('repair-dialog') : document.querySelector('.playfield');
  if (card.parentElement !== parent) parent.append(card);
  card.classList.toggle('in-dialog', insideRepair); card.dataset.step = step.id;
  $('tutorial-step').textContent = 'LEVEL ' + (mission.levelIndex + 1) + ' / ' + mission.academy.levels.length + ' · ' + (mission.state.status === 'ready' ? 'BRIEFING' : 'TASK ' + Math.min(mission.lesson.steps.length,Math.max(1,mission.objectiveIndex()+1)) + ' / ' + mission.lesson.steps.length);
  $('tutorial-title').textContent = step.title; $('tutorial-text').textContent = step.text;
  if (step.id === 'astra' && astraLessonAnswered) $('tutorial-text').textContent = 'ASTRA is reading your actual mission state. Try another prompt or type a question. When you are ready, continue below to close ASTRA and return to the expedition.';
  const circuitConnected = ['relay-repair', 'echo-repair'].includes(step.id) && mission.circuit?.connected();
  if (circuitConnected) $('tutorial-text').textContent = 'The output is powered! Select Apply repair below the circuit, or use the button here. You solved the actual connection, so the equipment can now be restored.';
  else if (circuitHintStep === step.id && mission.circuit) $('tutorial-text').textContent = mission.circuit.hint();
  $('tutorial-action').textContent = circuitConnected ? 'Apply the connected repair →' : step.id === 'astra' && astraLessonAnswered ? 'Continue the expedition →' : step.id === 'orbital' && renderer.mode === 'orbital' ? 'Return to the surface →' : step.action + ' →';
  $('tutorial-clock').textContent = renderer.mode==='orbital' || step.hold || mission.state.status === 'repair' ? 'MISSION TIME PAUSED WHILE YOU LEARN' : 'LEARN BY DOING · HIDE ANYTIME';
  let target = $(step.target);
  if (step.id === 'astra' && !$('astra-card').hidden) target = $('astra-message');
  if (insideRepair && step.target !== 'circuit-grid') target = $('circuit-grid');
  if (highlightedTutorialTarget !== target) { highlightedTutorialTarget?.classList.remove('tutorial-target'); highlightedTutorialTarget = target; }
  if (target && target.getClientRects().length) target.classList.add('tutorial-target');
  if (shownTutorialStep !== step.id) {
    shownTutorialStep = step.id;
    $('tutorial-progress').replaceChildren(...tutorial.steps.map((_, i) => { const dot = document.createElement('i'); dot.className = i < tutorial.index ? 'done' : i === tutorial.index ? 'current' : ''; return dot; }));
    if (target && !['world', 'astra-button', 'astra-message'].includes(target.id) && !insideRepair) target.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
  }
  tutorialPanel?.refresh();
  syncSettings();
}
function startExpedition() {
  if(story?.active||dialogOpen())return;
  audio.activate(); mission.start(); renderer.trigger('launch', mission.state.player);
  cinematic('TRAINING LEVEL ' + (mission.levelIndex+1) + ' / '+mission.academy.levels.length, mission.lesson.title.toUpperCase(), mission.lesson.skill);
  audio.cue('launch'); resetCamera(); processEvents(); updateUI(); $('world').focus({ preventScroll: true });
}
function tutorialAction() {
  if (!tutorial.active) return;
  performAction(tutorial.step.command);
}
function performAction(command) {
  if(story?.active)return;
  audio.activate();
  if (command === 'start') startExpedition();
  else if (command === 'next') tutorial.next();
  else if (command === 'astra') {
    if (!astraLessonAnswered) setAstraOpen(true, false);
    else { setAstraOpen(false, false); tutorial.next(); astraLessonAnswered = false; }
  }
  else if (command === 'route') plotObjective();
  else if (command === 'interact') { mission.interact(); processEvents(); }
  else if (command === 'scan') { mission.scanNearby(); processEvents(); }
  else if (command === 'review') showDebrief();
  else if (command === 'advance') advanceLesson();
  else if (command === 'hint') {
    if (mission.circuit?.connected()) { if (mission.completeRepair()) { $('repair-dialog').close(); processEvents(); } }
    else { circuitHintStep = tutorial.step.id; audio.cue('click'); }
  }
  else if (command === 'orbit') setView('orbital');
  else if (command === 'home') { setView('surface'); plotObjective(); }
  updateUI();
}
function notice(message, kind = 'info') {
  toastMessage = message; $('notice').textContent = message; $('notice').className = 'mission-notice ' + kind;
  $('notice').hidden = false; clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { if (toastMessage === message) $('notice').hidden = true; }, 5200);
}
function openDialog(dialog) {
  if (dialog.open) return;
  setAstraOpen(false, false);
  selectingRoutePoint = false;
  keys.clear();
  if (mission?.state.status === 'playing') { mission.state.status = 'paused'; dialog.dataset.resumeMission = 'yes'; }
  else dialog.dataset.resumeMission = 'no';
  dialog.showModal(); updateUI();
}
function setView(mode) {
  keys.clear();
  renderer.mode = mode;
  $('surface-tab').classList.toggle('active', mode === 'surface'); $('orbit-tab').classList.toggle('active', mode === 'orbital');
  $('surface-tab').setAttribute('aria-pressed', String(mode === 'surface')); $('orbit-tab').setAttribute('aria-pressed', String(mode === 'orbital'));
  $('sector-label').textContent = mode === 'surface' ? 'NASA LOLA / SOUTH POLAR SECTOR' : 'JPL HORIZONS / 04 OCT 2026 / TDB';
  $('render-mode').textContent = mode === 'surface' ? '3D terrain · NASA elevation · artistic lighting' : 'Dated positions · mission time paused';
  document.querySelector('.world-tools').hidden = mode !== 'surface';
  $('orbital-tools').hidden = mode !== 'orbital';
  $('world-wayfinding').hidden = mode !== 'surface' || !labelsEnabled;
  $('location-card').hidden = mode !== 'surface';
  $('briefing-card').hidden = mission.state.status !== 'ready' || mode !== 'surface';
  document.querySelector('.world-footer>span:first-child').innerHTML = mode === 'surface' ? '<span class="footer-cross">+</span> TERRAIN: NASA LRO / LOLA' : '<span class="footer-cross">+</span> POSITIONS: NASA / JPL HORIZONS';
  updateUI();
}
function plotObjective() {
  if (mission.state.status !== 'playing') return;
  clearAssistedRoute();
  setView('surface');
  const target = mission.target();
  if (mission.navigate(target)) notice('Route plotted. You can take over with WASD at any time.');
  renderer.trigger('route', target);
  processEvents();
}
function askAstra(question) {
  const request = resolveRouteRequest(mission, question);
  if(request) showAssistedRoute(request);
  else $('astra-message').textContent = mission.astra(question);
  beep(530, 0.1);
  if (tutorial?.active && tutorial.step.id === 'astra' && !$('astra-card').hidden) { astraLessonAnswered = true; syncTutorial(); }
  astraPanel?.refresh();
}
function setAstraOpen(open, focus = true, refreshAdvice = true) {
  const card = $('astra-card');
  keys.clear(); card.hidden = !open;
  $('astra-button').setAttribute('aria-expanded', String(open));
  $('astra-button').setAttribute('aria-label', open ? 'Close ASTRA mission companion' : 'Open ASTRA mission companion');
  if (open) {
    astraPanel?.refresh(); if(refreshAdvice && !assistedPlan) askAstra('next');
    if (focus) $('astra-input').focus({ preventScroll: true });
  } else if (focus) $('astra-button').focus({ preventScroll: true });
}
function clearAssistedRoute() {
  if(assistedFollowing) mission.route=null;
  assistedPlan=null;assistedFollowing=false;selectingRoutePoint=false;renderer.assistedRoute=null;renderer.cameraPinned=null;
  renderer.follow=true; $('follow-button').setAttribute('aria-pressed','true');
  $('astra-route-card').hidden=true;
}
function showAssistedRoute(request) {
  clearAssistedRoute(); const result=planSurfaceRoute(mission,request);
  $('astra-message').textContent=result.error || result.message;
  if(result.error)return;
  assistedPlan=result;renderer.assistedRoute=result;setView('surface');renderer.frameRoute?.(result.path);
  $('follow-button').setAttribute('aria-pressed','false');
  syncAssistedRoute();astraPanel?.refresh();
}
function syncAssistedRoute() {
  if(!assistedPlan)return;
  const s=mission.state;
  if(['complete','failed'].includes(s.status)){clearAssistedRoute();return;}
  if(Math.hypot(s.player.x-assistedPlan.from.x,s.player.y-assistedPlan.from.y)>1||s.rover.occupied!==assistedPlan.rover){
    const refreshed=planSurfaceRoute(mission,assistedPlan.request);
    if(refreshed.error){clearAssistedRoute();$('astra-message').textContent=refreshed.error;return;}
    assistedPlan=refreshed;
  }
  assistedPlan.safe=s.oxygen>assistedPlan.oxygenNeed&&s.water>assistedPlan.waterNeed&&s.suitWh>assistedPlan.suitNeed&&(!s.rover.occupied||s.rover.wh>assistedPlan.roverNeed)&&assistedPlan.hasReturnPath;
  const arrived=Math.hypot(s.player.x-assistedPlan.target.x,s.player.y-assistedPlan.target.y)<.1;
  if(assistedFollowing&&!mission.route)assistedFollowing=false;
  renderer.assistedRoute=assistedFollowing||arrived?null:assistedPlan;
  $('astra-route-card').hidden=false;$('astra-route-card').classList.toggle('caution',!assistedPlan.safe);
  $('astra-route-destination').textContent=assistedPlan.label;
  $('astra-route-distance').textContent=(arrived?0:assistedPlan.metres/1000).toFixed(2)+' km';
  $('astra-route-time').textContent=(arrived?0:assistedPlan.minutes).toFixed(1)+' mission min';
  $('astra-route-status').textContent=arrived?'DESTINATION REACHED':assistedFollowing?'FOLLOWING ROUTE':s.status==='ready'?'BEGIN EXPEDITION TO FOLLOW':assistedPlan.safe?'JOURNEY + RETURN WITHIN RESERVES':'JOURNEY + RETURN RESERVE WARNING';
  $('astra-follow-route').disabled=s.status!=='playing'||arrived||assistedFollowing;
  $('astra-follow-route').textContent=assistedFollowing?'Following route…':'Follow route →';
}
function followAssistedRoute() {
  if(!assistedPlan||mission.state.status!=='playing')return;
  const refreshed=planSurfaceRoute(mission,assistedPlan.request);
  if(refreshed.error){clearAssistedRoute();$('astra-message').textContent=refreshed.error;return;}
  assistedPlan=refreshed;
  if(mission.navigate(assistedPlan.target)){
    assistedFollowing=true;renderer.assistedRoute=null;renderer.cameraPinned=null;renderer.follow=true;$('follow-button').setAttribute('aria-pressed','true');
    if(tutorial.active&&tutorial.step.id==='astra'){tutorial.next();astraLessonAnswered=false;}
    setAstraOpen(false,false);notice('Following ASTRA’s route to '+assistedPlan.label+'. WASD takes over at any time.');
    $('world').focus({preventScroll:true});
  }
  processEvents();updateUI();
}
function openStory() {
  if(!story.start())return;
  keys.clear();document.body.classList.add('in-story');
  openDialog($('story-dialog'));updateStoryCaption();
}
function updateStoryCaption() {
  const chapter=story.chapter;
  if($('story-dialog').dataset.shot!==chapter.shot){
    $('story-dialog').dataset.shot=chapter.shot;
    $('story-chapter').textContent=chapter.kicker;$('story-title').textContent=chapter.title;
    $('story-speaker').textContent=chapter.speaker;$('story-caption').textContent=chapter.caption;
    $('story-caption-card').classList.remove('story-caption-enter');void $('story-caption-card').offsetWidth;$('story-caption-card').classList.add('story-caption-enter');
  }
  $('story-sound').textContent=audio.context&&!audio.muted?'Mute music':'Enable music';
}
function finishStory(skipped=false) {
  story.finish(skipped);$('story-dialog').close();
}
function resetCamera() {
  renderer.setPerspective?.(preferredPerspective);
  renderer.resetCamera?.(); renderer.zoom=1.2; renderer.follow=true; renderer.cameraPinned=null;
  panDragMode=false;$('camera-mode-button').textContent='Pan terrain';$('camera-mode-button').setAttribute('aria-pressed','false');
  $('follow-button').setAttribute('aria-pressed','true');
  syncCameraControls();
}
function togglePerspective() {
  preferredPerspective=renderer.perspective==='first-person'?'third-person':'first-person';
  renderer.setPerspective?.(preferredPerspective);panDragMode=false;keys.clear();updateUI();
  notice(preferredPerspective==='first-person'?'Astronaut view: drag to look all around, WASD to walk, E to interact. Show objective turns your helmet toward the destination.':'Orbit view: drag to look, Shift-drag or Pan terrain to explore, Show objective to inspect the destination.');
}
function syncCameraControls() {
  const first=renderer.perspective==='first-person',yaw=first?renderer.lookYaw:renderer.yaw;
  $('camera-readout').textContent=(first?(mission.state.rover.occupied?'ECHO DRIVER VIEW':'ASTRONAUT VIEW'):'360° ORBIT VIEW')+' · '+Math.round(((yaw||0)*180/Math.PI%360+360)%360)+'°';
  $('first-person-button').setAttribute('aria-pressed',String(first));$('first-person-button').textContent=first?'Astronaut view ✓ · F':'Astronaut view · F';
  $('camera-mode-button').disabled=first;$('camera-mode-button').setAttribute('aria-pressed',String(panDragMode&&!first));$('camera-mode-button').textContent=panDragMode&&!first?'Pan terrain ✓':'Pan terrain';
  $('camera-home').textContent=first?'Reset helmet view ↺':'Follow astronaut ↺';
  $('camera-hint').textContent=first?'Drag to look · WASD to walk':'Drag to look · Shift-drag to pan';
  $('camera-aim').hidden=!first||renderer.mode!=='surface'||story?.active===true;
  $('world').style.cursor=panDragMode&&!first?'grab':'move';
  for(const id of ['zoom-in','zoom-out','follow-button'])$(id).disabled=first;
  $('camera-controls').hidden=renderer.mode!=='surface';
}
function showTutorial() {
  if(workbenchOpen)closeWorkbench();
  tutorial.restart(); shownTutorialStep=''; tutorialPanel?.reset();
  if($('settings-dialog').open)$('settings-dialog').close();
  if(['complete','failed'].includes(mission.state.status))showDebrief();
  else { setView('surface'); updateUI(); }
}
function toggleTutorial() {
  const enabled=readPreference('luna-academy-guide-v1',{disabled:false},storage)?.disabled!==true;
  if(enabled){tutorial.disable();updateUI();}else showTutorial();
}
function refreshLesson() {
  closeWorkbench(false);panDragMode=false;$('camera-mode-button').setAttribute('aria-pressed','false');
  keys.clear(); clearAssistedRoute(); renderer.clearEffects(); renderer.refreshMission?.(); resetCamera();
  tutorial.forLevel(); shownTutorialStep=''; circuitHintStep=''; displayedLesson=''; previousOccupied=false;
  $('notice').hidden=true; $('event-banner').hidden=true; $('astra-message').textContent=mission.astra('next');
  setView('surface'); updateUI();
}
function renderLesson() {
  const l=mission.lesson;
  if(displayedLesson===l.id)return;
  displayedLesson=l.id;
  $('world-title').textContent=l.title; $('world-kicker').textContent='JUNIOR ASTRONAUT / LEVEL '+(mission.levelIndex+1)+' OF '+mission.academy.levels.length;
  $('mission-title').textContent=l.title; $('learning-goal').textContent='Learn: '+l.skill+'.';
  $('briefing-kicker').textContent='LEVEL '+(mission.levelIndex+1)+' / TRAINING BRIEFING';
  $('briefing-title').textContent=l.title; $('briefing-description').textContent=l.brief; $('briefing-skill').textContent=l.skill.toUpperCase();
  $('start-button').textContent='Start level '+(mission.levelIndex+1)+' →';
  $('objectives').replaceChildren(...l.steps.map((text,i)=>{
    const li=document.createElement('li'),num=document.createElement('span'),body=document.createElement('div'),title=document.createElement('strong'),check=document.createElement('span');
    num.className='objective-number';num.textContent=String(i+1).padStart(2,'0');title.textContent=text;body.append(title);check.className='objective-check';check.textContent='↗';li.append(num,body,check);return li;
  }));
}
function renderAcademy() {
  $('cadet-rank').textContent=mission.rank; $('academy-summary').textContent=mission.completed.length+' / '+mission.academy.levels.length+' badges · '+mission.xp+' XP';
  $('academy-badges').replaceChildren(...mission.academy.levels.map((l,i)=>{const b=document.createElement('span'),earned=mission.completed.some(r=>r.id===l.id);b.className=earned?'earned':'';b.textContent=earned?'✓ '+l.badge:String(i+1);b.title=earned?l.skill:l.badge+' · complete level '+(i+1);return b;}));
}
function renderLevels() {
  $('level-list').replaceChildren(...mission.academy.levels.map((l,i)=>{
    const row=document.createElement('section'),number=document.createElement('span'),body=document.createElement('div'),name=document.createElement('h3'),skill=document.createElement('p'),status=document.createElement('small'),button=document.createElement('button');
    const earned=mission.completed.find(r=>r.id===l.id),locked=i>mission.unlocked;
    row.className='level-row'+(locked?' locked':'');number.className='level-number';number.textContent=earned?'✓':String(i+1).padStart(2,'0');name.textContent=l.title;skill.textContent=l.skill;status.textContent=earned?l.badge+' · '+earned.xp+' XP earned':locked?'Complete level '+i+' to unlock':'Ready to train';body.append(name,skill,status);
    button.className='secondary-button';button.disabled=locked;button.textContent=locked?'Locked':earned?'Replay':'Start';button.addEventListener('click',()=>{if(mission.loadLevel(i)){$('levels-dialog').close();refreshLesson();}});row.append(number,body,button);return row;
  }));
}
function inspectBody(name) {
  const body=mission.astronomy().find(b=>b.name===name);
  $('orbital-readout').textContent=body?.inCoverage?name+' · '+Math.round(body.distanceKm).toLocaleString()+' km from the Moon · interpolated dated JPL samples, not live telemetry.':name+' · no sample coverage at this mission time.';
  if(mission.inspect(name)) {
    const seen=mission.state.training.inspected;
    $('orbital-readout').textContent+=' Training observations: '+seen.join(' + ')+'.'+(seen.length===2&&mission.state.scans.length===2?' Both recorded. Return to play, then check in at Haven.':'');
  }
  updateUI();
}
function showSystems() {
  const emergency=mission.lesson.id==='shelter',plan=mission.powerPlan({life:2,food:2,comms:1});
  $('systems-title').textContent=emergency?'Shelter drill: protect the crew.':'Power the essential systems.';
  $('systems-description').textContent=emergency?'Training alert: the supply is reduced to 8 kW. Confirm the crew is inside, seal the shelter, cover each minimum demand and leave at least 1 kW spare.':'The bus is repaired. You have 12 kW available. Set each allocation to cover its minimum demand, and leave at least 1 kW spare. More power is not always better.';
  for(const k of ['life','food','comms']){ $('power-'+k).max=String(plan.supply); $('power-'+k).value=String(mission.state.training.allocations?.[k]??(k==='comms'?1:2)); $('demand-'+k).textContent='Needs '+plan.demands[k]+' kW minimum'; }
  $('seal-control').hidden=!emergency; $('shelter-seal').checked=mission.state.training.sealed; updatePower(); openDialog($('systems-dialog'));
}
function updatePower() {
  const values=Object.fromEntries(['life','food','comms'].map(k=>[k,Number($('power-'+k).value)])),plan=mission.powerPlan(values,$('shelter-seal').checked);
  mission.state.training.powerPreview=plan;
  $('power-supply').textContent=plan.supply+' kW available'; $('power-budget').textContent=plan.total+' kW allocated · '+plan.reserve+' kW spare';
  for(const k of ['life','food','comms'])$('value-'+k).textContent=values[k]+' kW · '+Math.round(plan.coverage[k]*100)+'% demand covered';
  $('apply-power').disabled=!plan.valid;
  $('power-feedback').textContent=plan.reserve<0?'Over budget. Reduce allocations to fit the available supply.':!plan.covered?'One or more systems are below their minimum demand. Adjust the sliders.':plan.reserve<1?'Leave at least 1 kW spare.':plan.emergency&&!plan.sealed?'Power is balanced. Confirm the crew is inside and seal the shelter.':'All essential systems covered. Reserve protected. Ready to confirm.';
  $('power-feedback').classList.toggle('valid',plan.valid); return values;
}
function showWorkbench(){
  if(!mission.drillView())return;
  setView('surface');keys.clear();mission.route=null;if(mission.state.status==='playing')mission.state.status='paused';
  workbenchOpen=true;$('training-workbench').hidden=false;renderer.inspectTraining?.();renderer.demonstrateTraining?.();
  $('demo-status').textContent='Instructor demonstration · watch the equipment, then try the controls.';
  workbenchRanges.clear();$('workbench-ranges').replaceChildren();
  for(const range of mission.drillView().ranges){
    const label=document.createElement('label'),name=document.createElement('span'),output=document.createElement('output'),input=document.createElement('input');
    input.type='range';input.min=String(range.min);input.max=String(range.max);input.step='1';input.value=String(range.value);input.setAttribute('aria-label',range.label);
    name.textContent=range.label;output.textContent=range.value+'°';label.append(name,output,input);$('workbench-ranges').append(label);workbenchRanges.set(range.key,{input,output});
    input.addEventListener('input',()=>{renderer.demonstration=null;if(mission.adjustDrill(range.key,Number(input.value))){$('demo-status').textContent='Your turn · the 3D equipment follows your controls.';updateWorkbench();}});
  }
  updateWorkbench();updateUI();
}
function updateWorkbench(){
  if(!workbenchOpen)return;const view=mission.drillView(),done=mission.state.status==='complete';
  $('workbench-title').textContent=done?'Practical task complete':view.title;
  $('workbench-text').textContent=done?mission.lesson.badge+' earned. Your next lesson is unlocked. You can continue directly.':view.instruction;
  $('workbench-readout').textContent=view.readout;
  $('workbench-action').textContent=view.label+' →';$('workbench-action').disabled=!view.enabled;
  $('workbench-next').hidden=!done;$('workbench-next').textContent=mission.nextAction().action+' →';
  for(const [key,{input,output}] of workbenchRanges){output.textContent=mission.state.training.drill[key]+'°';input.disabled=done;}
}
function closeWorkbench(resume=true){
  workbenchOpen=false;$('training-workbench').hidden=true;renderer&&(renderer.demonstration=null);
  if(resume&&mission.state.status==='paused')mission.state.status='playing';
  if(resume)resetCamera();
}
function advanceLesson(){
  if(mission.state.status!=='complete')return;
  closeWorkbench(false);$('debrief-dialog').close();
  if(mission.nextLevel())refreshLesson();else{renderLevels();openDialog($('levels-dialog'));}
}
function updateWayfinding() {
  if(!renderer.screenMarker||renderer.mode!=='surface'||!labelsEnabled||story.active){$('world-wayfinding').hidden=true;return;}
  $('world-wayfinding').hidden=false;
  for(const [id,point,offset,occlusion] of [['you-tag',mission.state.player,5,true],['goal-tag',mission.target(),4,false]]) {
    const pos=renderer.screenMarker(point,offset,occlusion),el=$(id);el.hidden=!pos.visible;
    el.style.left=pos.x+'px';el.style.top=pos.y+'px';
    if(id==='you-tag'){el.textContent=mission.state.rover.occupied?'YOU · ECHO':'YOU';if(mission.state.training.inside||renderer.perspective==='first-person')el.hidden=true;}
    if(id==='goal-tag')el.textContent=(pos.edge?pos.arrow+' ':'')+(point.name||'OBJECTIVE')+' · '+Math.round(Math.hypot(point.x-mission.state.player.x,point.y-mission.state.player.y)*mission.terrain.cell)+' m';
  }
}
function updateUI() {
  if (!mission) return;
  const s = mission.state, c = mission.config, geo = mission.terrain.geo(s.player);
  life = mission.lifeline();
  renderLesson(); renderAcademy();
  const next=mission.nextAction(); $('next-action-title').textContent=next.title; $('next-action-text').textContent=next.text; $('next-action-button').textContent=next.action+' →';
  $('next-action-button').disabled=['paused','repair'].includes(s.status)||story?.active===true;
  $('briefing-card').hidden = s.status !== 'ready' || renderer.mode!=='surface' || tutorial.active;
  $('paused-banner').hidden = s.status !== 'paused' || !!dialogOpen() || workbenchOpen;
  $('touch-controls').hidden = s.status !== 'playing' || renderer.mode !== 'surface';
  $('latitude').textContent = Math.abs(geo.lat).toFixed(4) + '° S';
  $('longitude').textContent = geo.lon.toFixed(4) + '° E';
  $('elevation').textContent = Math.round(geo.elevation) + ' m elevation';
  $('distance-travelled').textContent = meters(s.distanceMetres) + ' travelled';
  $('actor-mode').textContent = s.rover.occupied ? 'ECHO / ROVER' : 'ASTRONAUT / EVA';
  $('equipment-label').textContent = s.rover.occupied ? 'ROVER & SUIT' : 'EVA SUIT';
  $('oxygen-value').textContent = s.oxygen.toFixed(1) + ' min';
  const oxygenPercent = clamp(s.oxygen / c.suit.oxygenMinutes * 100, 0, 100);
  $('oxygen-bar').style.width = oxygenPercent + '%';
  $('oxygen-bar').style.background = oxygenPercent < 25 ? '#f3a079' : '#b6d5b8';
  $('oxygen-bar').parentElement.setAttribute('aria-valuenow', String(Math.round(oxygenPercent)));
  const wh = s.rover.occupied ? s.rover.wh : s.suitWh, capacity = s.rover.occupied ? c.rover.capacityWh : c.suit.batteryWh;
  $('battery-title').textContent = s.rover.occupied ? 'Rover energy' : 'Suit energy';
  $('battery-value').textContent = Math.round(wh / capacity * 100) + '%';
  $('battery-bar').style.width = clamp(wh / capacity * 100, 0, 100) + '%';
  $('battery-bar').parentElement.setAttribute('aria-valuenow', String(Math.round(wh / capacity * 100)));
  $('battery-detail').textContent = wh.toFixed(0) + ' Wh available';
  $('water-value').textContent = s.water.toFixed(2) + ' L'; $('science-value').textContent = mission.science.length?s.scans.length+' / '+mission.science.length:'—';
  $('lifeline-status').textContent = life.status;
  $('lifeline-detail').textContent = life.reason;
  $('lifeline-card').classList.toggle('danger', !life.safe); $('lifeline-card').classList.toggle('caution', life.safe && life.margin < 15);
  const phaseIndex = mission.objectiveIndex();
  document.querySelectorAll('.objectives li').forEach((el, i) => {
    const complete = i < phaseIndex || s.status === 'complete';
    el.classList.toggle('active', i === phaseIndex && s.status !== 'complete'); el.classList.toggle('complete', complete);
    el.querySelector('.objective-check').textContent = complete ? '✓' : '↗';
    el.querySelector('.objective-number').textContent = complete ? '✓' : String(i + 1).padStart(2, '0');
  });
  document.querySelector('.mission-number').textContent = String(mission.levelIndex + 1).padStart(2, '0') + ' / '+String(mission.academy.levels.length).padStart(2,'0');
  $('mission-status').textContent = ({ ready: 'READY', playing: 'TRAINING', paused: workbenchOpen?'PRACTICE':'PAUSED', repair: 'REPAIRING', complete: 'COMPLETE', failed: 'RETRY' })[s.status];
  $('route-button').disabled = s.status !== 'playing';
  const near = mission.nearby();
  $('interaction-prompt').hidden = !near || s.status !== 'playing' || renderer.mode !== 'surface';
  if (near) $('interact-label').textContent = near.label;
  $('clock').textContent = formatClock(c.startHourTdb * 3600 + s.time);
  $('pause-button').setAttribute('aria-label', s.status === 'paused' ? 'Resume expedition' : ['complete', 'failed'].includes(s.status) ? 'Show expedition debrief' : 'Pause expedition');
  $('pause-button').title = $('pause-button').getAttribute('aria-label');
  $('pause-button').innerHTML = s.status === 'paused' ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 8 6-8 6V4Z"/></svg>' : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4v12m6-12v12"/></svg>';
  $('tracker-status').textContent = 'CREW & EQUIPMENT';
  $('world-subtitle').textContent = renderer.mode==='orbital'?'Observation view · use Return to play to move on the surface':s.status==='ready'?mission.lesson.skill:next.title;
  renderer.drawMini($('minimap'), life);
  syncCameraControls();updateWorkbench();
  $('follow-button').setAttribute('aria-pressed',String(renderer.follow));
  syncAssistedRoute();
  if (s.rover.occupied !== previousOccupied) { previousOccupied = s.rover.occupied; if (s.rover.occupied) { renderer.trigger('board', s.player); audio.cue('board'); cinematic('ECHO / ROVER', 'MOTORS ONLINE', mission.lesson.id==='science'?'Drive to the survey markers. Press Q to scan.':mission.lesson.id==='logistics'?'Drive to the field supply marker. Press E to unload.':'Drive to Haven. Press E to dock.'); } }
  syncTutorial();
}
function processEvents() {
  for (const event of mission.events.splice(0)) {
    if (event.type === 'notice') { notice(event.message, event.kind); if (event.kind === 'success') beep(690, 0.12); }
    if (event.type === 'repair') { renderCircuit(); openDialog($('repair-dialog')); beep(440, 0.12); }
    if (event.type === 'systems') showSystems();
    if (event.type === 'drill') showWorkbench();
    if (event.type === 'repaired') { const relay = mission.state.phase === 'recover',outpost=mission.repairType==='outpost'; renderer.trigger('repair', outpost?mission.objects.base:relay ? mission.objects.relay : mission.state.rover); audio.cue('repair'); cinematic(outpost?'HAVEN / SYSTEMS':relay?'SURFACE RELAY / A':'ECHO / 03', relay ? 'SIGNAL RESTORED' : 'POWER RESTORED', outpost?'Press E again to balance essential systems.':relay ? 'The recovery location is confirmed.' : 'Board Echo. Bring it home.'); }
    if (event.type === 'notice' && event.kind === 'success' && mission.state.journal.at(-1)?.type === 'science') { renderer.trigger('survey', mission.state.player); audio.cue('survey'); }
    if (event.type === 'repaired' || event.type === 'started' || event.type === 'replayed') askAstra('next');
    if (event.type === 'ended') { const success = mission.state.status === 'complete'; renderer.trigger(success ? 'victory' : 'fail', mission.state.player); audio.cue(success ? 'victory' : 'fail'); syncTutorial(); if(workbenchOpen&&success)updateWorkbench();else showDebrief(); }
  }
}
function renderCircuit() {
  const circuit = mission.circuit;
  if (!circuit) return;
  $('repair-title').innerHTML = mission.repairType === 'outpost' ? 'Reconnect Haven’s power bus<span>.</span>' : mission.repairType === 'relay' ? 'Restore the surface relay<span>.</span>' : 'Reconnect Echo’s power bus<span>.</span>';
  $('repair-description').textContent=circuit.instructions;
  $('circuit-design').textContent=circuit.name;$('circuit-frame').dataset.design=circuit.design;
  for(const [id,endpoint] of [['circuit-input',circuit.input],['circuit-output',circuit.output]]){
    const position=circuit.terminalPosition(endpoint);$(id).style.gridRow=String(position.row);$(id).style.gridColumn=String(position.column);
  }
  $('circuit-grid').setAttribute('aria-label',circuit.name+'. '+circuit.instructions);
  const powered = circuit.powered(), connected = circuit.connected(), endpoints = [[30, 0], [60, 30], [30, 60], [0, 30]];
  $('circuit-grid').replaceChildren();
  for (let i = 0; i < 9; i++) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'circuit-tile' + (powered.has(i) ? ' powered' : '');
    button.setAttribute('aria-label', 'Rotate circuit tile ' + (i + 1));
    const paths = circuit.connections(i).map(port => `<path d="M30 30 L${endpoints[port][0]} ${endpoints[port][1]}"/>`).join('');
    button.innerHTML = `<svg viewBox="0 0 60 60" aria-hidden="true">${paths}<circle cx="30" cy="30" r="4" fill="currentColor" stroke="none"/></svg>`;
    button.addEventListener('click', () => { circuit.rotate(i); beep(370 + (powered.has(i) ? 90 : 0), 0.035); renderCircuit(); $('circuit-grid').children[i].focus({ preventScroll: true }); });
    $('circuit-grid').append(button);
  }
  $('circuit-feedback').textContent = connected ? 'Power path connected · ready to apply' : 'Connect input → output';
  $('circuit-feedback').style.color = connected ? '#ccebc0' : '#a6c2a5';
  $('circuit-moves').textContent = circuit.moves + ' rotations';
  $('output-indicator').classList.toggle('connected', connected); $('apply-repair').disabled = !connected;
}
function showDebrief() {
  const d = mission.debrief();
  $('debrief-dialog').dataset.success = String(d.success);
  $('debrief-title').textContent = d.success ? 'Level complete. Badge earned.' : 'Every explorer learns.';
  $('debrief-description').textContent = d.success ? mission.lesson.badge+' earned by completing '+mission.lesson.title+'. '+(mission.courseComplete?'Your training course is complete.':'The next level is unlocked. Continue below, or try the optional 100 XP question.') : d.failureReason+'. Retry this lesson with a safer route. Previously earned badges are kept.';
  $('debrief-emblem').textContent = d.success ? '✦' : '↻'; $('debrief-rank').textContent = d.success?mission.rank:mission.lesson.skill;
  const metrics = [[d.timeMinutes.toFixed(1), 'MISSION MINUTES'], [d.distanceKm.toFixed(2) + ' km', 'DISTANCE TRAVELLED'], [mission.science.length?d.scans+' / '+mission.science.length:'—', 'TERRAIN OBSERVATIONS'], [d.oxygenPercent.toFixed(0) + '%', 'OXYGEN RETURNED'], [String(d.repairs), 'SYSTEMS RESTORED'], [String(d.success?d.score:0), 'LESSON POINTS']];
  $('debrief-metrics').replaceChildren();
  for (const [value, label] of metrics) { const div = document.createElement('div'), strong = document.createElement('strong'), span = document.createElement('span'); strong.textContent = value; span.textContent = label; div.append(strong, span); $('debrief-metrics').append(div); }
  $('debrief-learning').textContent = d.success ? 'Skill demonstrated: '+mission.lesson.skill+'. '+mission.lesson.explanation : 'Longer routes, waiting in the field, and sprinting affect your reserves. Go to objective follows a calculated terrain route. Watch the Lifeline before taking a detour.';
  $('skill-check').hidden=!d.success;
  $('review-question').textContent=mission.lesson.question;
  $('review-feedback').textContent=mission.reviewPassed?'✓ '+mission.lesson.badge+' earned. '+mission.lesson.explanation:'';
  $('review-answers').replaceChildren(...mission.lesson.answers.map((answer,i)=>{
    const button=document.createElement('button');button.className='review-answer';button.textContent=answer;button.disabled=mission.reviewPassed;
    button.addEventListener('click',()=>{
      const result=mission.qualify(i);$('review-feedback').textContent=(result.correct?'✓ ':'Try again. ')+result.message;
      $('review-feedback').classList.toggle('valid',result.correct);
      if(result.correct){audio.cue('victory');for(const b of $('review-answers').children)b.disabled=true;$('debrief-title').textContent='Badge earned.';$('debrief-rank').textContent=mission.rank;syncAdvancement();updateUI();}
    });return button;
  }));
  syncAdvancement();
  $('debrief-journal').replaceChildren();
  for (const entry of d.journal.filter(e => e.type !== 'briefing').slice(-10)) { const div = document.createElement('div'), time = document.createElement('time'), span = document.createElement('span'); time.textContent = (entry.time / 60).toFixed(1) + 'm'; span.textContent = entry.message; div.append(time, span); $('debrief-journal').append(div); }
  try { const best = Number(localStorage.getItem('luna-best') || 0); if (d.success && d.score > best) localStorage.setItem('luna-best', String(d.score)); } catch { /* Storage may be disabled; play still works. */ }
  openDialog($('debrief-dialog'));
}
function syncAdvancement() {
  $('next-level-button').hidden=mission.state.status!=='complete';
  $('next-level-button').textContent=mission.levelIndex===mission.academy.levels.length-1?'View training record →':'Start level '+(mission.levelIndex+2)+' →';
  $('course-certificate').hidden=!mission.courseComplete;
  $('course-certificate').textContent=mission.courseComplete?'QUALIFIED JUNIOR ASTRONAUT · '+mission.xp+' XP · All '+mission.academy.levels.length+' practical skills completed: '+mission.academy.levels.map(l=>l.badge).join(' · '):'';
}
function buildSources() {
  const terrain = mission.terrain.data, ephem = mission.ephemerides;
  const bodyText = ephem.bodies.filter(b => b.available).map(b => `${b.name}: ${b.samples.length} samples (${b.samplingSeconds === 60 ? '1 minute' : '1 hour'} spacing)`).join(' · ');
  const cards = [
    { label: 'NASA DATA · TERRAIN', title: 'LRO / LOLA south polar elevation map', text: `6,400 elevation cells, cropped from ${terrain.source.product} ${terrain.source.productVersion}. Native spacing: 20 m; the prototype averages 2 × 2 cells to a 40 m grid. Elevations are relative to a 1,737.4 km reference sphere. Source observations: July 2009–February 2017.`, detail: 'Measured elevation range in this crop: ' + mission.terrain.min.toFixed(1) + ' to ' + mission.terrain.max.toFixed(1) + ' m. Routes and surface coordinates are derived from this grid.', url: terrain.source.labelUrl, link: 'Open original NASA PDS label ↗' },
    { label: 'NASA / JPL · CELESTIAL POSITIONS', title: 'Horizons geometric ephemerides', text: bodyText + '. Mission coverage: 04–05 October 2026, TDB. The orbital view interpolates these dated vectors in Moon-centred ICRF.', detail: 'Spacecraft ephemerides may include predicted trajectories. This is not live telemetry. Distances in the diagram are compressed, the Moon artwork is illustrative, and the displayed projection is ICRF XY.', url: 'https://ssd.jpl.nasa.gov/horizons/', link: 'Explore NASA / JPL Horizons ↗' },
      { label: 'CALCULATED FROM YOUR ACTIONS', title: 'Resources, routes, tracking & the Lifeline', text: 'Location, distance travelled, oxygen, water, suit energy and rover energy update from movement and mission time. ASTRA plans paths using the terrain grid, solid equipment footprints, and the selected equipment’s slope limit, with a modeled journey-plus-return estimate. Compass directions use the lunar projection; up/down/left/right follow the current camera. The Lifeline includes a 20% modeled return reserve.', detail: 'The 3D terrain follows the measured elevation grid, with vertical exaggeration. Models are enlarged for readability. Characters, equipment, the backdrop Earth, starlight, regolith grain, shadows, navigation effects, dust and sparks are artistic illustrations. They do not represent observed sky positions, sub-grid hazards, lunar illumination, radiation dose, or radio line-of-sight. The opening is an original fictional animation rendered in the game world. Use Orbital for dated celestial vectors.' },
    { label: 'AUTHORED GAME CONTENT', title: 'Ten practical missions in the Junior Astronaut Academy', text: 'EVA basics, power balance, rover recovery, observation, shelter response, solar calibration, airlock cycling, sample handling, antenna pointing and cargo delivery form the campaign. Haven, Echo, crew, equipment targets and teaching budgets are fictional content stored separately from NASA data.', detail: 'Mission time advances 10× while playing. Briefings, puzzles, workbenches and information views freeze the clock. Equipment responds to your inputs; solar and radio readouts are authored models. Lunar gravity of approximately 1.62 m/s² is used for the jump animation.', url: mission.config.physics.source, link: 'Lunar physical reference ↗' }
  ];
  for (const card of cards) {
    const section = document.createElement('section'); section.className = 'source-card';
    const label = document.createElement('div'), title = document.createElement('h3'), text = document.createElement('p'), detail = document.createElement('p');
    label.className = 'source-label'; label.textContent = card.label; title.textContent = card.title; text.textContent = card.text; detail.textContent = card.detail; section.append(label, title, text, detail);
    if (card.url) { const a = document.createElement('a'); a.href = card.url; a.textContent = card.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; section.append(a); }
    $('source-cards').append(section);
  }
  for (const assumption of mission.config.assumptions) { const li = document.createElement('li'); li.textContent = assumption; $('assumptions-list').append(li); }
}
function setupEvents() {
  $('workbench-close').addEventListener('click',()=>{closeWorkbench();updateUI();});
  $('workbench-next').addEventListener('click',advanceLesson);
  $('workbench-demo').addEventListener('click',()=>{renderer.demonstrateTraining?.();$('demo-status').textContent='Instructor demonstration · observe the equipment. Your task progress is kept.';});
  $('workbench-action').addEventListener('click',()=>{
    renderer.demonstration=null;if(mission.performDrill(mission.drillView().action)){
      audio.cue('repair');$('demo-status').textContent='Action performed · watch the equipment respond.';
      if(mission.lesson.id==='logistics'&&mission.state.training.drill.loaded){closeWorkbench();resetCamera();notice('Crate secured. Board Echo with E, then drive to the field supply marker.','success');}
      processEvents();updateWorkbench();updateUI();
    }
  });
  $('camera-mode-button').addEventListener('click',()=>{if(renderer.perspective==='first-person')return;panDragMode=!panDragMode;keys.clear();syncCameraControls();});
  $('first-person-button').addEventListener('click',togglePerspective);
  $('camera-overview').addEventListener('click',()=>{renderer.showOverview?.();panDragMode=false;keys.clear();updateUI();notice('Mission overview: YOU and the gold objective are framed together. Drag to orbit, or pan to inspect the terrain.');});
  $('orbit-left').addEventListener('click',()=>renderer.rotateCamera?.(-Math.PI/8));
  $('orbit-right').addEventListener('click',()=>renderer.rotateCamera?.(Math.PI/8));
  $('tilt-up').addEventListener('click',()=>renderer.rotateCamera?.(0,.15));
  $('tilt-down').addEventListener('click',()=>renderer.rotateCamera?.(0,-.15));
  $('inspect-objective').addEventListener('click',()=>{renderer.showObjective?.();updateUI();notice(renderer.perspective==='first-person'?'Helmet facing the objective. Follow the gold marker; nearby structures and terrain can block the view.':'Objective framed. Drag to inspect it from every side; Follow astronaut returns to your position.');});
  $('camera-home').addEventListener('click',resetCamera);
  $('story-sound').addEventListener('click',()=>{audio.setMuted(audio.context?!audio.muted:false);audio.activate();updateStoryCaption();syncSettings();});
  $('story-skip').addEventListener('click',()=>finishStory(true));
  $('story-dialog').addEventListener('cancel',event=>{event.preventDefault();finishStory(true);});
  $('story-dialog').addEventListener('close',()=>{story.finish(true);document.body.classList.remove('in-story');renderer.endCinematic?.();audio.setHidden(document.hidden);keys.clear();lastTime=0;});
  $('astra-follow-route').addEventListener('click',followAssistedRoute);
  $('astra-clear-route').addEventListener('click',()=>{clearAssistedRoute();askAstra('next');astraPanel.refresh();});
  $('astra-pick-point').addEventListener('click',()=>{selectingRoutePoint=!selectingRoutePoint;setView('surface');if(selectingRoutePoint){mission.route=null;setAstraOpen(false,false);notice('ASTRA: tap a point on the terrain or surface tracker. Escape cancels selection.');$('world').focus({preventScroll:true});}});
  tutorialPanel = new MovablePanel({ panel: $('tutorial-card'), handle: $('tutorial-drag-handle'), resetButton: $('tutorial-position-reset'), storage, storageKey: 'luna-tutorial-position-v2', view: window, onGrab: () => keys.clear() });
  astraPanel = new MovablePanel({ panel: $('astra-card'), handle: $('astra-drag-handle'), resetButton: $('astra-position-reset'), storage, storageKey: 'luna-astra-position-v1', view: window, onGrab: () => keys.clear() });
  $('astra-button').disabled = false;
  $('astra-button').addEventListener('click', () => { audio.activate(); setAstraOpen($('astra-card').hidden); syncTutorial(); });
  $('astra-close').addEventListener('click', () => { setAstraOpen(false); syncTutorial(); });
  $('astra-card').addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setAstraOpen(false); syncTutorial(); } });
  [$('astra-card'), $('tutorial-card')].forEach(panel => panel.addEventListener('pointerdown', () => keys.clear()));
  $('start-button').addEventListener('click', startExpedition);
  $('tutorial-action').addEventListener('click', tutorialAction);
  $('tutorial-skip').addEventListener('click', () => { tutorial.disable('skipped'); notice('Tutorial hidden. Turn it on with Tutorial or Settings. Your progress is kept.'); updateUI(); });
  $('tutorial-restart').addEventListener('click',showTutorial);
  $('tutorial-toggle').addEventListener('click',toggleTutorial);
  $('tutorial-setting-toggle').addEventListener('click',toggleTutorial);
  $('settings-button').addEventListener('click',()=>openDialog($('settings-dialog')));
  $('labels-button').addEventListener('click',()=>{labelsEnabled=!labelsEnabled;writePreference('luna-labels-v1',labelsEnabled,storage);syncSettings();updateWayfinding();});
  $('reset-camera').addEventListener('click',()=>{resetCamera();$('settings-dialog').close();setView('surface');notice('Camera reset. Follow the gold objective marker or use Go to objective.');});
  $('reset-panels').addEventListener('click',()=>{tutorialPanel.reset();astraPanel.reset();notice('Tutorial and ASTRA positions reset.');});
  $('levels-button').addEventListener('click',()=>{renderLevels();openDialog($('levels-dialog'));});
  $('next-action-button').addEventListener('click',()=>performAction(mission.nextAction().command));
  $('return-surface').addEventListener('click',()=>setView('surface'));
  $('inspect-earth').addEventListener('click',()=>inspectBody('Earth'));
  $('inspect-lro').addEventListener('click',()=>inspectBody('LRO'));
  for(const k of ['life','food','comms'])$('power-'+k).addEventListener('input',updatePower);
  $('shelter-seal').addEventListener('change',updatePower);
  $('apply-power').addEventListener('click',()=>{if(mission.applyPower(updatePower(),$('shelter-seal').checked)){$('systems-dialog').close();processEvents();updateUI();}});
  $('brand-home').addEventListener('click', event => { event.preventDefault(); openDialog($('help-dialog')); });
  $('help-button').addEventListener('click', () => openDialog($('help-dialog')));
  $('data-button').addEventListener('click', () => openDialog($('data-dialog')));
  $('route-button').addEventListener('click', plotObjective);
  $('interact-button').addEventListener('click', () => { mission.interact(); processEvents(); updateUI(); });
  $('touch-interact').addEventListener('click', () => { mission.interact(); processEvents(); updateUI(); });
  $('surface-tab').addEventListener('click', () => setView('surface')); $('orbit-tab').addEventListener('click', () => setView('orbital'));
  $('zoom-in').addEventListener('click', () => renderer.zoom = clamp(renderer.zoom * 1.15, 0.3, 3.2));
  $('zoom-out').addEventListener('click', () => renderer.zoom = clamp(renderer.zoom / 1.15, 0.3, 3.2));
  $('camera-button').addEventListener('click',()=>{renderer.rotateCamera?.(Math.PI/4);notice('Camera rotated. WASD follows the current view.');});
  $('follow-button').addEventListener('click', () => { if(renderer.perspective==='first-person')return;renderer.follow=!renderer.follow;renderer.cameraPinned=renderer.follow?null:{...mission.state.player};renderer.cameraFocusHeight=2.8;renderer.routeDistance=54; $('follow-button').setAttribute('aria-pressed', String(renderer.follow)); });
  $('elevation-button').addEventListener('click', () => { renderer.setElevation(!renderer.elevation); $('elevation-button').setAttribute('aria-pressed', String(renderer.elevation)); notice(renderer.elevation ? 'Elevation layer enabled. Colours are derived from the NASA height grid.' : 'Surface illustration restored.'); });
  $('lifeline-button').addEventListener('click', () => { renderer.showLifeline = !renderer.showLifeline; $('lifeline-button').setAttribute('aria-pressed', String(renderer.showLifeline)); $('lifeline-button').innerHTML = (renderer.showLifeline ? 'Return ribbon visible' : 'Show the return ribbon') + ' <span aria-hidden="true">↗</span>'; });
  const pause = () => { audio.activate(); if(workbenchOpen){closeWorkbench();updateUI();return;}if (['complete', 'failed'].includes(mission.state.status)) showDebrief(); else { mission.pause(); keys.clear(); updateUI(); } };
  $('pause-button').addEventListener('click', pause); $('resume-button').addEventListener('click', pause);
  const toggleMusic = () => { audio.setMuted(!audio.muted); audio.activate(); syncSettings(); };
  $('sound-button').addEventListener('click', toggleMusic); $('music-toggle').addEventListener('click', toggleMusic);
  $('music-volume').addEventListener('input', () => { audio.setVolume(Number($('music-volume').value) / 100); audio.activate(); syncSettings(); });
  $('motion-button').addEventListener('click', () => { reducedMotion = !reducedMotion; writePreference('luna-motion-v1', reducedMotion, storage); renderer.clearEffects(); syncSettings(); });
  $('opening-toggle').addEventListener('click',()=>{story.setEnabled(!story.enabled);syncSettings();});
  $('apply-repair').addEventListener('click', () => {
    if (mission.completeRepair()) { $('repair-dialog').close(); processEvents(); updateUI(); }
  });
  $('replay-button').addEventListener('click',()=>{$('debrief-dialog').close();mission.replayCheckpoint();mission.reviewPassed=false;refreshLesson();processEvents();updateUI();});
  $('restart-button').addEventListener('click',()=>{$('debrief-dialog').close();mission.reset();refreshLesson();});
  $('next-level-button').addEventListener('click',advanceLesson);
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', () => {
    if (dialog.id === 'repair-dialog' && mission.state.status === 'repair') mission.cancelRepair();
    if (dialog.dataset.resumeMission === 'yes' && mission.state.status === 'paused') mission.state.status = 'playing';
    keys.clear(); updateUI();
  }));
  document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => askAstra(button.dataset.question)));
  $('astra-form').addEventListener('submit', event => { event.preventDefault(); const question = $('astra-input').value.trim(); if (question) { askAstra(question); $('astra-input').value = ''; } });
  document.addEventListener('keydown', event => {
    if(event.key==='Escape'&&selectingRoutePoint){selectingRoutePoint=false;notice('Map selection cancelled.');return;}
    if (event.target.closest('input, textarea, [contenteditable="true"], [data-floating-panel]') || dialogOpen()) return;
    const k = event.key.toLowerCase();
    if(k==='f'&&renderer.mode==='surface'){event.preventDefault();if(!event.repeat)togglePerspective();return;}
    if(['[',']',',','.'].includes(k)){event.preventDefault();renderer.rotateCamera?.(k==='['?-.15:k===']'?.15:0,k===','?-.1:k==='.'?.1:0);return;}
    if(workbenchOpen)return;
    if (k === ' ' && event.target.closest('button, a, summary')) return;
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift', 'e', 'q', 'm', 'p'].includes(k)) event.preventDefault();
    keys.add(k);
    if (event.repeat) return;
    if (k === 'e' && renderer.mode==='surface') { mission.interact(); processEvents(); updateUI(); }
    if (k === 'q' && renderer.mode==='surface') { mission.scanNearby(); processEvents(); updateUI(); }
    if (k === 'm') setView(renderer.mode === 'surface' ? 'orbital' : 'surface');
    if (k === 'p') pause();
  });
  document.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  document.addEventListener('visibilitychange', () => { audio.setHidden(document.hidden);lastTime=0;if (document.hidden && mission.state.status === 'playing') { mission.pause(); keys.clear(); updateUI(); } });
  let cameraDrag=null;
  $('world').addEventListener('contextmenu',event=>event.preventDefault());
  $('world').addEventListener('pointerdown', event => {
    if(renderer.mode!=='surface'||dialogOpen()||cameraDrag||![0,1,2].includes(event.button))return;
    event.preventDefault();$('world').focus({preventScroll:true});
    cameraDrag={id:event.pointerId,button:event.button,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false,pan:renderer.perspective!=='first-person'&&(event.button===1||event.button===0&&(panDragMode||event.shiftKey))};
    $('world').setPointerCapture(event.pointerId);
  });
  $('world').addEventListener('pointermove',event=>{
    if(!cameraDrag||cameraDrag.id!==event.pointerId)return;
    const drag=cameraDrag;
    if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6)return;
    drag.moved=true;
    if(drag.pan)renderer.panCamera?.(event.clientX-drag.x,event.clientY-drag.y);
    else renderer.rotateCamera?.((event.clientX-drag.x)*.007,(event.clientY-drag.y)*.005*(renderer.perspective==='first-person'?-1:1));
    drag.x=event.clientX;drag.y=event.clientY;syncCameraControls();
  });
  $('world').addEventListener('pointerup',event=>{
    if(!cameraDrag||cameraDrag.id!==event.pointerId)return;
    const drag=cameraDrag;cameraDrag=null;
    if($('world').hasPointerCapture?.(event.pointerId))$('world').releasePointerCapture(event.pointerId);
    const x=event.clientX??drag.x,y=event.clientY??drag.y;
    if(drag.moved||Math.hypot(x-drag.startX,y-drag.startY)>=6||drag.button!==0||drag.pan||workbenchOpen||dialogOpen()||renderer.mode!=='surface')return;
    const rect = $('world').getBoundingClientRect(), point = renderer.fromScreen(x - rect.left, y - rect.top);
    if(!point){notice('Select the lunar surface or use the surface tracker.');return;}
    if(selectingRoutePoint){selectingRoutePoint=false;showAssistedRoute({target:point,label:'Selected map point'});setAstraOpen(true,false,false);return;}
    mission.navigate(point); processEvents(); $('world').focus({ preventScroll: true });
  });
  for(const name of ['pointercancel','lostpointercapture'])$('world').addEventListener(name,event=>{if(cameraDrag?.id===event.pointerId)cameraDrag=null;});
  $('world').addEventListener('wheel', event => { event.preventDefault(); if (renderer.mode === 'surface'&&renderer.perspective!=='first-person') renderer.zoom = clamp(renderer.zoom * (event.deltaY > 0 ? 0.94 : 1.06), 0.3, 3.2); }, { passive: false });
  $('minimap').addEventListener('pointerdown', event => {
    const rect = $('minimap').getBoundingClientRect();
    const point={x:(event.clientX-rect.left)/rect.width*mission.terrain.width-.5,y:(event.clientY-rect.top)/rect.height*mission.terrain.height-.5};
    if(selectingRoutePoint){selectingRoutePoint=false;showAssistedRoute({target:point,label:'Selected map point'});setAstraOpen(true,false,false);return;}
    setView('surface'); mission.navigate(point); processEvents();
  });
  $('minimap').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); plotObjective(); } });
  document.querySelectorAll('[data-direction]').forEach(button => {
    const k = 'arrow' + button.dataset.direction;
    button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); keys.add(k); });
    const release = () => keys.delete(k);
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  });
  const resize = () => { const rect = $('world').getBoundingClientRect(); renderer.resize(rect.width, rect.height, window.devicePixelRatio || 1); };
  new ResizeObserver(resize).observe($('world')); resize();
  if (window.LUNA_DATA) $('download-button').hidden = true;
}
function animate(now) {
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0; lastTime = now;
  if(story.active){
    const ended=story.update(dt,document.hidden);updateStoryCaption();renderer.cinematicFrame?.(story.elapsed,story.chapter.shot);
    $('story-cut').style.opacity=String(renderer.cinematicFade||0);audio.updateOpening(story.elapsed);
    if(ended)finishStory();requestAnimationFrame(animate);return;
  }
  const right = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
  const down = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
  const vector=renderer.inputVector?.(right,down)||{dx:right+down,dy:-right+down};
  if (!tutorial.holdsTime && renderer.mode==='surface') mission.update(dt, { ...vector, sprint: keys.has('shift'), jump: keys.has(' ') });
  else mission.state.moving = false;
  processEvents(); uiElapsed += dt;
  if (uiElapsed >= 0.25) { updateUI(); uiElapsed = 0; }
  audio.update(mission.state, life, tutorial.holdsTime); if(!$('story-dialog').open){renderer.draw(now / 1000, life);updateWayfinding();} requestAnimationFrame(animate);
}
async function boot() {
  try {
    const data = window.LUNA_DATA || await Promise.all(['terrain.json', 'mission.json', 'ephemerides.json','academy.json'].map(async name => {
      const response = await fetch('data/' + name,{cache:'no-cache'});
      if (!response.ok) throw new Error('Could not load ' + name);
      return response.json();
    })).then(([terrain, config, ephemerides,academy]) => ({ terrain, config, ephemerides,academy }));
    try { storage = window.localStorage; } catch { storage = null; }
    mission = new TrainingMission(data.terrain, data.config, data.ephemerides,data.academy,storage);
    renderer = new Renderer($('world'), mission);
    tutorial = new AcademyGuide(mission,storage); audio = new Soundtrack(storage);story=new StorySequence(storage);
    labelsEnabled=readPreference('luna-labels-v1',true,storage)!==false;
    const systemReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    reducedMotion = readPreference('luna-motion-v1', systemReduced, storage) === true;
    setupEvents(); buildSources(); updateUI(); $('loading').hidden = true;openStory();
    // Kept for development and reproducible engine inspection, not used by gameplay.
    window.luna = { mission, renderer, tutorial, audio, story };
    requestAnimationFrame(animate);
  } catch (error) {
    console.error(error);
    $('loading').replaceChildren();
    const title = document.createElement('p'); title.textContent = 'Your expedition could not load.';
    const message = document.createElement('small'); message.textContent = 'LUNA now needs WebGL 2. Enable hardware acceleration in your browser, or try a current Chrome, Edge or Firefox browser.';
    const retry = document.createElement('button'); retry.textContent = 'Try again'; retry.className = 'secondary-button'; retry.style.marginTop = '18px'; retry.addEventListener('click', () => location.reload());
    $('loading').append(title, message, retry);
  }
}
boot();
