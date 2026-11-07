import { clamp } from './engine.js';
import { TrainingMission } from './academy.js';
import { Renderer } from './render-3d.js';
import { AcademyGuide } from './academy-guide.js';
import { MissionAudio } from './mission-audio.js';
import { readPreference, writePreference } from './preferences.js';
import { MovablePanel } from './panels.js';
import { resolveRouteRequest, planSurfaceRoute } from './navigation.js';
import { StorySequence } from './story.js';
import { FlightSimulation, WORLDS, localSky } from './voyage.js';
import { FlightRenderer } from './flight-renderer.js';
import { AstronomicalWorld } from './astronomy-world.js';
import { powerBalance } from './expedition.js';
import { createDestinationMission } from './worlds.js';
import { loadGameData, connectLocalBackend } from './local-backend.js';

const $ = id => document.getElementById(id);
const keys = new Set();
let localSortieState=null;const performanceFrames=[];
let astro=null,gameMode='training',graphicsQuality='balanced',explorationRenderTime=0;
let pack, flight, flightRenderer, previousFlightPhase='', surfaceResumeStatus=null, skyHolding=false, mission, renderer, life, tutorial, audio, story, tutorialPanel, astraPanel, storage = null, reducedMotion = false, astraLessonAnswered = false;
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
  $('music-toggle').textContent = audio.settings.musicOn ? 'Background music on' : 'Background music off';
  $('music-toggle').setAttribute('aria-pressed', String(audio.settings.musicOn));
  $('effects-toggle').textContent='Sound effects'+(audio.settings.effectsOn?' on':' off');$('effects-toggle').setAttribute('aria-pressed',String(audio.settings.effectsOn));
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
  const visible = tutorial.active && !flight?.active && !skyHolding && !workbenchOpen && (!modal || modal.id === 'repair-dialog');
  card.hidden = !visible;
  if (!visible) { highlightedTutorialTarget?.classList.remove('tutorial-target'); highlightedTutorialTarget = null; syncSettings(); return; }
  const step = tutorial.step, insideRepair = modal?.id === 'repair-dialog';
  const parent = insideRepair ? $('repair-dialog') : document.querySelector('.playfield');
  if (card.parentElement !== parent) parent.append(card);
  card.classList.toggle('in-dialog', insideRepair); card.dataset.step = step.id;
  $('tutorial-step').textContent = (mission.isExpedition?'OUTPOST STAGE '+Math.min(7,mission.state.expedition.stage+1)+' / 7':'LEVEL ' + (mission.levelIndex + 1) + ' / ' + mission.academy.levels.length) + ' · ' + (mission.state.status === 'ready' ? 'BRIEFING' : 'TASK ' + Math.min(mission.lesson.steps.length,Math.max(1,mission.objectiveIndex()+1)) + ' / ' + mission.lesson.steps.length);
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
  if(story?.active||flight?.active||dialogOpen())return;
  audio.activate(); mission.start(); renderer.trigger('launch', mission.state.player);
  cinematic(mission.isExpedition?'OUTPOST MISSION / FOUR CREW':'TRAINING LEVEL ' + (mission.levelIndex+1) + ' / '+mission.academy.levels.length, mission.lesson.title.toUpperCase(), mission.lesson.skill);
  audio.cue('launch'); resetCamera(); processEvents(); updateUI(); $('world').focus({ preventScroll: true });
}
function tutorialAction() {
  if (!tutorial.active) return;
  performAction(tutorial.step.command);
}
function performAction(command) {
  if(story?.active||flight?.active)return;
  audio.activate();
  if (command === 'start') startExpedition();
  else if(command==='read-objective')mission.acknowledgeGuide();
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
  if($('solar-explorer'))$('solar-explorer').hidden=mode!=='solar'||!astro;
  $('sector-label').textContent = mode === 'surface' ? (mission.config.world==='mars'?'NASA MOLA / JEZERO REGION':pack?.tranquillitatis?'NASA LOLA / MARE TRANQUILLITATIS':'NASA LOLA / SOUTH POLAR SECTOR') : (astro?'JPL HORIZONS / '+new Date(astro.utc*1000).toISOString().slice(0,10)+' UTC':'JPL HORIZONS / 04 OCT 2026 / TDB');
  $('render-mode').textContent = mode === 'surface' ? '3D reference relief · NASA elevation · dated sky' : mode==='solar'?'Sun-centred 3D · distances compressed · bodies enlarged':'Dated positions · mission time paused';
  $('solar-tab').classList.toggle('active',mode==='solar');$('solar-tab').setAttribute('aria-pressed',String(mode==='solar'));$('solar-labels').hidden=mode!=='solar';
  document.querySelector('.world-tools').hidden = mode !== 'surface';
  $('orbital-tools').hidden = mode !== 'orbital';
  $('inspect-lro').textContent='Inspect '+(mission.config.astronomyTrainingTargets?.[1]||'LRO');
  $('orbital-tools').querySelector('strong').textContent='Observe the sky · surface training paused';
  $('world-wayfinding').hidden = mode !== 'surface' || !labelsEnabled;
  $('location-card').hidden = mode !== 'surface';
  $('briefing-card').hidden = mission.state.status !== 'ready' || mode !== 'surface';
  document.querySelector('.world-footer>span:first-child').innerHTML = mode === 'surface' ? '<span class="footer-cross">+</span> TERRAIN: '+(mission.config.world==='mars'?'NASA MGS / MOLA':'NASA LRO / LOLA') : '<span class="footer-cross">+</span> POSITIONS: NASA / JPL HORIZONS';
  updateUI();
}
function plotObjective() {
  if(tutorial?.holdsTime&&mission.isExpedition)mission.acknowledgeGuide();
  if (mission.state.status !== 'playing') return;
  clearAssistedRoute();
  setView('surface');
  const target = mission.target();
  if (mission.navigate(target)) notice('Route plotted. You can take over with WASD at any time.');
  renderer.trigger('route', target);
  processEvents();
}
function askAstra(question) {
  if(flight?.active){const t=flight.telemetry();$('astra-message').textContent='Odyssey · '+t.location+'. '+(flight.phase==='cockpit'?'Cabin secure. Press the visible amber LAUNCH switch.':flight.phase==='transfer'&&!flight.flightEvent.resolved?'At mid-cruise, choose which electrical circuit to isolate or activate backup power.':'Follow the current flight instruction.')+' Velocity '+t.velocityMps.toFixed(1)+' m/s; cabin '+t.cabinPressureKpa.toFixed(1)+' kPa; external pressure '+t.exteriorPressureKpa.toFixed(3)+' kPa; remaining '+Math.round(t.remainingKm).toLocaleString()+' km. Gravity '+t.gravityMps2.toPrecision(3)+' m/s². This is the actual flight model state.';return;}
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
let storyChromeState=null;
function setStoryPresentation(active) {
  document.body.classList.toggle('in-story',active);
  if(active){
    storyChromeState=['game-header','mission-panel','game-footer','astra-button','astra-card'].map(id=>{
      const element=$(id),state={element,hidden:element.hidden,inert:element.inert};
      element.hidden=true;element.inert=true;return state;
    });
  }else if(storyChromeState){
    for(const {element,hidden,inert} of storyChromeState){element.hidden=hidden;element.inert=inert;}
    storyChromeState=null;
  }
}
function openStory() {
  if(!story.start())return;
  keys.clear();setStoryPresentation(true);
  openDialog($('story-dialog'));audio.activate();updateStoryCaption(); // Starts at once; music joins when the browser allows it.
}
function updateStoryCaption() {
  const chapter=story.chapter;
  if($('story-dialog').dataset.shot!==chapter.shot){
    $('story-dialog').dataset.shot=chapter.shot;
    $('story-chapter').textContent=chapter.kicker;$('story-title').textContent=chapter.title;
    $('story-speaker').textContent=chapter.speaker;$('story-caption').textContent=chapter.caption;
    $('story-caption-card').classList.remove('story-caption-enter');void $('story-caption-card').offsetWidth;$('story-caption-card').classList.add('story-caption-enter');
  }
  $('story-sound').textContent = storyMusicPlaying() ? 'Music on · mute' : 'Music off · play';
}
// Browsers keep audio suspended until the player clicks, so check that sound is really running.
function storyMusicPlaying() {
  return audio.settings.musicOn && !audio.muted && audio.context?.state === 'running';
}
// Mid-cruise fault card: diagram state, choice preview and an 8-second repair sequence after the player confirms.
let flightEventPreview=null;
const REPAIR_SECONDS=8;
function syncFlightEvent(p) {
  const card=$('flight-event'),ev=flight.flightEvent,since=ev.resolved?flight.elapsed-(ev.at??flight.elapsed):0;
  card.hidden=p!=='transfer'||(ev.resolved&&since>=REPAIR_SECONDS);
  if(card.hidden)return;
  $('flight-instruction').hidden=true; // never stack the instruction card behind the decision
  const state=ev.resolved?ev.choice:flightEventPreview?'preview-'+flightEventPreview:'fault';
  if(card.dataset.state!==state)card.dataset.state=state;
  $('flight-event-choices').hidden=ev.resolved;
  const isolate=ev.choice==='isolate',restored=ev.resolved&&since>=(isolate?1.6:1.5);
  $('flight-event-eyebrow').textContent=ev.resolved?'ASTRA / REPAIR IN PROGRESS':'ASTRA / MID-CRUISE DECISION';
  $('flight-event-title').textContent=!ev.resolved?'Auxiliary bus fault':restored?'Auxiliary bus restored':isolate?'Isolating the nonessential circuit…':'Switching to backup power…';
  $('flight-event-readout').textContent=ev.resolved
    ?(isolate?'The breaker cuts the faulty auxiliary bus off from the downlink. Main power stays clean; data downlink drops to 50% for the rest of the flight.':'The backup battery takes the auxiliary load while the fault clears. Every circuit stays on; this costs 3% flight fuel and 3 emergency units after landing.')
    :'Choose a response to the fictional auxiliary-bus fault. Hover or focus a choice to preview it on the circuit.';
  $('flight-event-status').textContent=!ev.resolved
    ?(flightEventPreview==='isolate'?'Preview: breaker opens · downlink 50% · no fuel cost':flightEventPreview==='backup'?'Preview: battery feeds the aux bus · −3% fuel':'Fault: auxiliary bus arcing · main bus unstable')
    :restored?(isolate?'✓ Main bus stable · downlink 50%':'✓ All circuits on · downlink 100% · fuel −3%'):(isolate?(since<.7?'Opening breaker…':'Circuit cut off · stabilising main bus…'):(since<1?'Battery online · taking aux load…':'Fault cleared · stabilising…'));
  const cutOff=isolate?since>=.8:flightEventPreview==='isolate'&&!ev.resolved;
  $('bus-aux-state').textContent=!ev.resolved||since<(isolate?.8:1)?'FAULT':restored?'STABLE':isolate?'ISOLATED':'ON BATTERY';
  $('bus-down-state').textContent=cutOff||(ev.resolved&&isolate)&&since>=.5?'50%':'100%';
  card.setAttribute('aria-label',$('flight-event-title').textContent);
}
function finishStory(skipped=false) {
  story.finish(skipped);$('story-dialog').close();syncFlight();
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
  shownTutorialStep='';tutorial.restart(); shownTutorialStep=''; tutorialPanel?.reset();
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
  if(mission.isExpedition){$('cadet-rank').textContent=mission.rank;$('academy-summary').textContent=mission.state.expedition.decisions.length+' / 7 decisions · '+mission.xp+' mission XP';$('academy-badges').replaceChildren();$('levels-button').textContent='Flight school ↗';return;}
  $('cadet-rank').textContent=mission.rank; $('academy-summary').textContent=mission.completed.length+' / '+mission.academy.levels.length+' badges · '+mission.xp+' XP';
  $('academy-badges').replaceChildren(...mission.academy.levels.map((l,i)=>{const b=document.createElement('span'),earned=mission.completed.some(r=>r.id===l.id);b.className=earned?'earned':'';b.textContent=earned?'✓ '+l.badge:String(i+1);b.title=earned?l.skill:l.badge+' · complete level '+(i+1);return b;}));
}
function renderLevels() {
  if(mission.isExpedition){const row=document.createElement('section'),description=document.createElement('p'),button=document.createElement('button');description.textContent='Ten hands-on lessons on each world: EVA, power, recovery, astronomy, shelter, solar alignment, airlocks, sample handling, antenna pointing, and logistics. Your outpost checkpoint is kept.';button.textContent='Enter flight school →';button.className='primary-button';button.addEventListener('click',()=>{switchSurfaceMode('training');$('levels-dialog').close();});row.append(description,button);$('level-list').replaceChildren(row);return;}
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
  if(mission.isExpedition){$('debrief-dialog').close();openJourney();return;}
  if(mission.state.status!=='complete')return;
  closeWorkbench(false);$('debrief-dialog').close();
  if(mission.nextLevel())refreshLesson();else{renderLevels();openDialog($('levels-dialog'));}
}
function updateWayfinding() {
  if(!renderer.screenMarker||renderer.mode!=='surface'||!labelsEnabled||story.active||flight?.active){$('world-wayfinding').hidden=true;return;}
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
  document.body.classList.toggle('expedition-mode',!!mission.isExpedition);
  $('panel-systems').hidden=!mission.isExpedition;
  if(!mission.isExpedition)setMissionPanel('mission');
  const s = mission.state, c = mission.config, geo = mission.terrain.geo(s.player);
  life = mission.lifeline();
  renderLesson(); renderAcademy();renderOutpost();
  const next=tutorial?.holdsTime?tutorial.step:mission.nextAction(); $('next-action-title').textContent=next.title; $('next-action-text').textContent=next.text; $('next-action-button').textContent=next.action+' →';
  $('next-action-button').disabled=['paused','repair'].includes(s.status)||story?.active===true;
  $('briefing-card').hidden = s.status !== 'ready' || renderer.mode!=='surface' || tutorial.active;
  $('paused-banner').hidden = s.status !== 'paused' || !!dialogOpen() || workbenchOpen;
  $('touch-controls').hidden = s.status !== 'playing' || renderer.mode !== 'surface';
  $('latitude').textContent = Math.abs(geo.lat).toFixed(4) + (geo.lat<0?'° S':'° N');
  $('surface-environment').textContent=mission.config.worldName.toUpperCase()+' · g '+mission.config.physics.surfaceGravityMetresPerSecondSquared+' m/s² · '+(mission.config.world==='mars'?'~0.636 kPa atmosphere':'vacuum');
  document.querySelector('.time-scale').textContent=(astro?'UTC':'TDB')+' · '+(astro?.mode==='exploration'?astro.rate:mission.config.timeScale)+'×';
  $('longitude').textContent = geo.lon.toFixed(4) + '° E';
  $('elevation').textContent = Math.round(geo.elevation) + ' m elevation';
  $('distance-travelled').textContent = meters(s.distanceMetres) + ' travelled';
  $('actor-mode').textContent = s.training?.inside?'ASTRONAUT / HAVEN':s.rover.occupied ? 'ECHO / ROVER' : 'ASTRONAUT / EVA';
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
  document.querySelector('.mission-number').textContent = mission.isExpedition?String(Math.min(7,s.expedition.stage+1)).padStart(2,'0')+' / 07':String(mission.levelIndex + 1).padStart(2, '0') + ' / '+String(mission.academy.levels.length).padStart(2,'0');
  $('mission-status').textContent = ({ ready: 'READY', playing: 'TRAINING', paused: workbenchOpen?'PRACTICE':'PAUSED', repair: 'REPAIRING', complete: 'COMPLETE', failed: 'RETRY' })[s.status];
  $('route-button').disabled = s.status !== 'playing';
  const near = mission.nearby();
  $('interaction-prompt').hidden = !near || s.status !== 'playing' || renderer.mode !== 'surface';
  if (near) $('interact-label').textContent = near.label;
  $('clock').textContent = astro?new Date(astro.utc*1000).toISOString().slice(11,19):formatClock(c.startHourTdb * 3600 + s.time);
  $('pause-button').setAttribute('aria-label', s.status === 'paused' ? 'Resume expedition' : ['complete', 'failed'].includes(s.status) ? 'Show expedition debrief' : 'Pause expedition');
  $('pause-button').title = $('pause-button').getAttribute('aria-label');
  $('pause-button').innerHTML = s.status === 'paused' ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 8 6-8 6V4Z"/></svg>' : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4v12m6-12v12"/></svg>';
  $('tracker-status').textContent = 'CREW & EQUIPMENT';
  $('world-title').textContent=renderer.mode==='solar'?'The solar system.':renderer.mode==='orbital'?'Observe your surroundings.':mission.lesson.title;
  $('world-kicker').textContent=renderer.mode==='surface'?'JUNIOR ASTRONAUT / LEVEL '+(mission.levelIndex+1)+' OF '+mission.academy.levels.length:'NASA/JPL · 04 OCT 2026 · '+(renderer.mode==='solar'?'SUN-CENTRED 3D':'WORLD-CENTRED VECTORS');
  $('world-subtitle').textContent = renderer.mode==='solar'?'Drag for a 360° orbit · distances compressed · bodies enlarged':renderer.mode==='orbital'?'Observation view · use Return to play to move on the surface':s.status==='ready'?mission.lesson.skill:next.title;
  renderer.drawMini($('minimap'), life);
  syncCameraControls();updateWorkbench();
  $('follow-button').setAttribute('aria-pressed',String(renderer.follow));
  syncAssistedRoute();
  if (s.rover.occupied !== previousOccupied) { previousOccupied = s.rover.occupied; if (s.rover.occupied) { renderer.trigger('board', s.player); audio.cue('board'); cinematic('ECHO / ROVER', 'MOTORS ONLINE', mission.lesson.id==='science'?'Drive to the survey markers. Press Q to scan.':mission.lesson.id==='logistics'?'Drive to the field supply marker. Press E to unload.':'Drive to Haven. Press E to dock.'); } }
  syncTutorial();syncFlight();if(astro&&renderer.mode!=='surface')$('world-kicker').textContent='NASA / JPL · '+new Date(astro.utc*1000).toISOString().slice(0,16)+' UTC';if(mission.isExpedition&&renderer.mode==='surface'){$('world-kicker').textContent='OUTPOST MISSION / STAGE '+Math.min(7,s.expedition.stage+1)+' OF 7';$('briefing-kicker').textContent='MISSION BRIEFING';$('start-button').textContent='Begin outpost mission →';}
}
function processEvents() {
  if($('consequence-dialog')?.open)return;
  for (const event of mission.events.splice(0)) {
    if (event.type === 'notice') { notice(event.message, event.kind); if (event.kind === 'success') beep(690, 0.12); }
    if (event.type === 'repair') { renderCircuit(); openDialog($('repair-dialog')); beep(440, 0.12); }
    if(event.type==='decision')showDecision();
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
  if(mission.isExpedition){showExpeditionDebrief();return;}
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
  try { const best = Number(storage?.getItem('luna-best') || 0); if (d.success && d.score > best) storage?.setItem('luna-best', String(d.score)); } catch { /* Storage may be disabled; play still works. */ }
  openDialog($('debrief-dialog'));
}
function syncAdvancement() {
  $('next-level-button').hidden=mission.state.status!=='complete';
  $('next-level-button').textContent=mission.levelIndex===mission.academy.levels.length-1?'View training record →':'Start level '+(mission.levelIndex+2)+' →';
  $('course-certificate').hidden=!mission.courseComplete;
  $('course-certificate').textContent=mission.courseComplete?'QUALIFIED JUNIOR ASTRONAUT · '+mission.xp+' XP · All '+mission.academy.levels.length+' practical skills completed: '+mission.academy.levels.map(l=>l.badge).join(' · '):'';
}
function buildSources() {
  $('source-cards').replaceChildren();$('assumptions-list').replaceChildren();
  const terrain = mission.terrain.data, ephem = mission.ephemerides;
  const bodyText = ephem.bodies.filter(b => b.available).map(b => `${b.name}: ${b.samples.length} samples (${b.samplingSeconds === 60 ? '1 minute' : '1 hour'} spacing)`).join(' · ');
  let cards = [
    { label: 'NASA DATA · TERRAIN', title: terrain.source.name, text: `6,400 elevation cells from ${terrain.source.product} ${terrain.source.productVersion}. Grid spacing: ${mission.terrain.cell.toFixed(1)} m. ${terrain.source.processing}`, detail: 'Measured elevation range in this crop: ' + mission.terrain.min.toFixed(1) + ' to ' + mission.terrain.max.toFixed(1) + ' m. Routes and surface coordinates are derived from this grid.', url: terrain.source.labelUrl, link: 'Open original NASA PDS label ↗' },
    { label: 'NASA / JPL · CELESTIAL POSITIONS', title: 'Horizons geometric ephemerides', text: bodyText + '. Mission coverage: 04–05 October 2026, TDB. The orbital view interpolates these dated vectors in the selected world’s ICRF frame.', detail: 'Spacecraft ephemerides may include predicted trajectories. This is not live telemetry. Distances in the diagram are compressed, the Moon artwork is illustrative, and the displayed projection is ICRF XY.', url: 'https://ssd.jpl.nasa.gov/horizons/', link: 'Explore NASA / JPL Horizons ↗' },
      { label: 'CALCULATED FROM YOUR ACTIONS', title: 'Resources, routes, tracking & the Lifeline', text: 'Location, distance travelled, oxygen, water, suit energy and rover energy update from movement and mission time. ASTRA plans paths using the terrain grid, solid equipment footprints, and the selected equipment’s slope limit, with a modeled journey-plus-return estimate. Compass directions use the lunar projection; up/down/left/right follow the current camera. The Lifeline includes a 20% modeled return reserve.', detail: 'The 3D terrain follows the measured elevation grid, with vertical exaggeration. Models are enlarged for readability. Characters, equipment, starlight, regolith grain, shadows, navigation effects, dust and sparks are artistic illustrations. They do not represent sub-grid hazards, radiation dose, or radio line-of-sight. The opening is an original fictional animation rendered in the game world. Surface sky directions and apparent diameters use separate local observer samples. A training fill light aids visibility.' },
    { label: 'AUTHORED GAME CONTENT', title: 'Ten practical missions in the Junior Astronaut Academy', text: 'EVA basics, power balance, rover recovery, observation, shelter response, solar calibration, airlock cycling, sample handling, antenna pointing and cargo delivery form the campaign. Haven, Echo, crew, equipment targets and teaching budgets are fictional content stored separately from NASA data.', detail: 'Mission time advances 10× while playing. Briefings, puzzles, workbenches and information views freeze the clock. Equipment responds to your inputs; solar and radio readouts are authored models. Surface jumps use selected-world gravity: Moon 1.62 m/s²; Mars 3.73 m/s². Earth launch-site gravity is 9.80 m/s².', url: mission.config.physics.source, link: 'Lunar physical reference ↗' }
  ];
  cards.push({label:'NASA / JPL · LOCAL SKY & JOURNEY',title:'Moon and Mars observer horizons',text:'Cached 04–05 October 2026 UTC observer tables supply azimuth, elevation, apparent diameter and range. Moon observer matches the LOLA crop; Mars observer is 18.44°N, 77.45°E near Jezero. The separate sky preview clock changes illumination and horizon visibility. Earth uses NASA Blue Marble imagery; Moon uses NASA SVS / LROC imagery.',detail:'Solar system is a Sun-centred 3D diagram with compressed distances and enlarged bodies. Stars and other planetary textures are illustrations. The flight route is an illustrative curve between dated departure and arrival endpoints plus an ascent leg, not an orbital transfer. Its 3 / 210 day clock is accelerated. Telemetry uses simplified ascent, coast, hover and braking models; fuel and hull thermal readouts are teaching estimates. No air temperature is assigned to vacuum. Landing speed range 0–12 m/s, safe 1–3; attitude ±15°, safe ±5°.',url:'https://ssd-api.jpl.nasa.gov/doc/horizons.html',link:'Horizons data documentation ↗'});
  if(astro)cards=[
    {label:'NASA / MEASURED ELEVATION',title:terrain.source.name,text:terrain.source.product+' · '+terrain.width+' × '+terrain.height+' samples · native resolution '+(terrain.source.nativeResolutionMetres||mission.terrain.cell).toFixed(1)+' m. '+terrain.source.processing,detail:'Vertical exaggeration 1.0. Astronaut and equipment dimensions use metres. The NASA grid stays intact. Reference-inspired craters, scarps, dunes, channels, terraces, rock layers and outpost placement are authored reconstructions. Walking and navigation use that shared surface; this is not a photogrammetric rover scene.',url:terrain.source.labelUrl,link:'Original NASA PDS product label ↗'},
    {label:'NASA / JPL · ONE SHARED WORLD',title:'Sun-centred ICRF positions and UTC observers',text:Object.keys(astro.data.bodies).length+' bodies, from '+astro.data.start.slice(0,10)+' through '+astro.data.stop.slice(0,10)+'. Cubic Hermite interpolation uses positions and velocities; light-time and first-order stellar aberration are applied. Hourly Sun/Earth observer samples anchor local frames.',detail:'All views use this clock. The active mission locks UTC; exploration pauses play and restores the exact mission time on closing. Far-side Moon is a sky-only observatory. The far-side view contains no substituted surface. Independent Moon→Mars and Mars→Jupiter observer comparisons are included in the source tests.',url:'https://ssd.jpl.nasa.gov/horizons/manual.html',link:'Horizons frames and apparent quantities ↗'},
    {label:'NASA HEASARC / YALE',title:'Bright Star Catalog, fifth revised edition',text:astro.catalog.stars.length.toLocaleString()+' catalogue stars through V=6.5, with J2000 equatorial coordinates, proper motion and B−V colour. Daylight, dust, Sun glare and exposure control star visibility. Enhanced night is labelled as an exploration aid.',detail:'Brightness, compressed eye adaptation and the faint galactic band are approximate visual models. The galactic plane has the correct equatorial orientation. Unresolved planets use an optical point response; physical disks are never enlarged. Telescope is 1–160× with an ideal 80 mm / 1.7″ blur.',url:astro.catalog.source.documentation,link:'Catalogue provenance and fields ↗'},
    {label:'INTERCONNECTED GAME SYSTEMS',title:'Two complete outpost missions',text:'Seven practical stages per world link oxygen, water, food, power, habitat integrity, crew health, fatigue, radiation, suit reserves, emergency fuel and science. Tasks precede operating decisions. Checkpoints preserve the current world and UTC. ASTRA reads this state and clones it for forecasts.',detail:'Forecasts assume current daylight, dust, hazards and settings continue. Safe/caution/unsafe map colours use a conservative 1.35× distance estimate; actual return estimates follow the terrain route. Consumption and radiation are editable educational assumptions, not mission safety calculations.'},
    {label:'FLIGHT / VISUAL RECONSTRUCTION',title:'Odyssey launch, cruise and controlled descent',text:'Press the physical cockpit switch; automatic flight includes a mid-cruise circuit fault and two Space-key landing locks. The 3-day Moon / 210-day Mars clock shares the dated arrival world. The navigation overview uses compressed distances and enlarged bodies; probe view preserves apparent scale.',detail:'Flight is an illustrative curve between dated departure and arrival endpoints, not an orbital transfer solution. Atmosphere, fuel, temperatures, safe bands and spacecraft are authored models. Earth uses static NASA Blue Marble imagery; Moon uses NASA SVS / LROC global imagery. Other planet textures and rotation models are approximate.',url:'https://svs.gsfc.nasa.gov/4720/',link:'NASA lunar global imagery and credits ↗'}
  ];
  if(astro?.data.visualReferences)for(const ref of Object.values(astro.data.visualReferences))cards.push({label:'NASA / VISUAL REFERENCE',title:ref.title,text:ref.publishedResolution+' · '+ref.credit+' · captured '+ref.acquired,detail:ref.purpose,url:ref.url,link:'Original NASA image and context ↗',image:ref.data});
  if(astro)cards.push({label:'NASA LROC / GLOBAL MAP',title:'Lunar visible-light albedo reference',text:'NASA SVS / LROC · Ernie Wright · 2048 × 1024 global equirectangular texture.',detail:'Used on the Moon globe. This global map is much coarser than the local LOLA elevation crop and supplies no near-field rock geometry.',url:'https://svs.gsfc.nasa.gov/4720/',link:'Original CGI Moon Kit ↗',image:astro.data.assets.Moon.data});
  for (const card of cards) {
    const section = document.createElement('section'); section.className = 'source-card';
    const label = document.createElement('div'), title = document.createElement('h3'), text = document.createElement('p'), detail = document.createElement('p');
    label.className = 'source-label'; label.textContent = card.label; title.textContent = card.title; text.textContent = card.text; detail.textContent = card.detail; section.append(label, title, text, detail);if(card.image){const img=document.createElement('img');img.src=card.image;img.alt=card.title;img.loading='lazy';img.className='source-reference-image';section.append(img);}
    if (card.url) { const a = document.createElement('a'); a.href = card.url; a.textContent = card.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; section.append(a); }
    $('source-cards').append(section);
  }
  for (const assumption of mission.config.assumptions) { const li = document.createElement('li'); li.textContent = assumption; $('assumptions-list').append(li); }
}

function syncFlight(){
  if(!flight)return;
  const active=flight.active&&!story.active;
  if(astro&&flight.active)astro.setMissionUTC(flight.departureUTC+flight.telemetry().simSeconds);document.body.classList.toggle('in-flight',active);$('flight-deck').hidden=!active;
  $('sky-button').disabled=flight.active||story.active;$('journey-button').disabled=flight.active||story.active;
  if(!active)return;
  const p=flight.phase,t=flight.telemetry(),name=WORLDS[flight.destination].name;
  $('flight-deck').dataset.phase=p;
  if(previousFlightPhase!==p){previousFlightPhase=p;if(p==='cockpit'){flightRenderer.lookYaw=flightRenderer.lookPitch=0;audio.cue('ready');}if(p==='landed')audio.cue('landing');}
  $('flight-status').textContent=p==='cockpit'?'READY TO LAUNCH':p==='go-around'?'GO-AROUND':p.toUpperCase();
  $('flight-gravity').textContent='g '+(t.gravityMps2<.1?t.gravityMps2.toExponential(2):t.gravityMps2.toFixed(2))+' m/s²';
  $('flight-velocity').textContent=t.velocityMps.toFixed(1)+' m/s';$('flight-acceleration').textContent=t.accelerationMps2.toFixed(3)+' m/s²';
  $('flight-altitude').textContent=t.altitudeM>=10000?(t.altitudeM/1000).toFixed(0)+' km':t.altitudeM.toFixed(0)+' m';$('flight-fuel').textContent=t.fuelPercent.toFixed(0)+'%';
  $('flight-cabin-pressure').textContent=t.cabinPressureKpa.toFixed(1)+' kPa';$('flight-exterior-pressure').textContent=t.exteriorPressureKpa<.001?'≈0 kPa':t.exteriorPressureKpa.toFixed(3)+' kPa';
  $('flight-cabin-temp').textContent=t.cabinC.toFixed(0)+'°C';$('flight-hull-temp').textContent=t.hullC.toFixed(0)+'°C';
  const km=n=>Math.round(n).toLocaleString();$('flight-distance').textContent=km(t.distanceKm)+' / '+km(t.totalKm)+' km';$('flight-progress').style.width=100*t.distanceKm/t.totalKm+'%';
  const departureSun=astro&&['briefing','boarding','cockpit','ignition'].includes(p)?astro.apparent('Sun',flight.observerState()):null;
  const lighting=departureSun?' · '+(departureSun.altitude>0?'Daylight':departureSun.altitude>-12?'Twilight':'Night')+' at '+(flight.localSortie?name:'Earth launch site')+' · Sun '+departureSun.altitude.toFixed(1)+'°':'';
  $('flight-time').textContent=t.location+' · elapsed '+(t.simSeconds/86400>=1?(t.simSeconds/86400).toFixed(1)+' days':Math.floor(t.simSeconds/60)+' min')+' · '+Math.round(t.simRate).toLocaleString()+'× flight time'+(astro?' · '+new Date(astro.utc*1000).toISOString().slice(0,16)+' UTC · downlink '+t.downlinkPercent+'%':'')+lighting;
  $('destination-picker').hidden=p!=='briefing';$('flight-instruction').hidden=p==='briefing'||['speed','angle','descent','go-around'].includes(p);
  $('launch-spacecraft').hidden=p!=='cockpit';$('cockpit-view').hidden=!['cockpit','ascent','transfer','capture','landed'].includes(p);$('cockpit-view').textContent=flight.cabinFlight&&p!=='cockpit'?'Exterior view · F':flightRenderer.pilotView&&p==='cockpit'?'Crew view · F':'Pilot view · F';$('disembark-spacecraft').hidden=p!=='landed';
  $('landing-controls').hidden=!['speed','angle','descent','go-around'].includes(p);
  $('landing-camera-view').textContent=flight.cabinFlight?'Exterior view · F':'Pilot view · F';$('landing-camera-hint').textContent=flight.cabinFlight?'Drag to look around the cabin':'Drag to orbit · 360° view';
  $('journey-distance').textContent='Earth → '+name+' · '+km(flight.plan.totalKm)+' km planned';
  const departureStamp=astro?new Date(flight.departureUTC*1000).toISOString().slice(0,16).replace('T',' ')+' UTC':flight.plan.epoch.replace('T',' ');
  $('journey-distance-basis').textContent='Centre separation: '+km(flight.plan.separationKm)+' km. Departure '+departureStamp+'. Planned route + ascent: '+(flight.plan.durationSeconds/86400).toFixed(flight.localSortie?2:0)+' days.'+(astro&&!flight.localSortie?' Daylight arrival window.':'')+' Earth g 9.80 m/s².';
  for(const w of ['moon','mars'])$('destination-'+w).setAttribute('aria-pressed',String(w===flight.destination));
  if(astro){for(const mode of ['expedition','training'])$('mode-'+mode).setAttribute('aria-pressed',String(mode===gameMode));$('flight-skip').hidden=!['boarding','ascent','transfer','capture'].includes(p);$('flight-skip').disabled=p==='transfer'&&!flight.flightEvent.resolved;syncFlightEvent(p);$('continue-surface').hidden=surfaceResumeStatus===null&&!savedSelectedMission();$('continue-surface').textContent=surfaceResumeStatus===null?'Resume outpost checkpoint →':'Continue surface mission →';}
  const copy={briefing:['Choose your destination.','Earth launch site · drag to orbit through 360°','Select Moon or Mars.','Then board Odyssey. Your destination and calculated distance are loaded into the cockpit.'],boarding:['Welcome aboard Odyssey.','Earth → '+name+' · access gantry · drag to look around','The cadet is boarding.','Watch the astronaut enter the command capsule. Systems check automatically, then you press the physical LAUNCH switch.'],cockpit:['You have the controls.','Earth → '+name+' · cabin secure · navigation loaded','Press the amber LAUNCH switch.','Click the physical switch on the console, press E, or use the button below. The cadet reaches forward to activate it. Drag to look around the cockpit.'],ignition:['Ignition sequence.','Earth → '+name+' · restraints locked','Launch switch engaged.','The engine starts after the astronaut presses the button. Keep an eye on cabin pressure and ascent velocity.'],ascent:['Leaving Earth.','Earth → '+name+' · powered ascent','Odyssey is climbing.','Velocity, acceleration, outside pressure and local gravity follow the ascent model. The animation advances automatically.'],transfer:['Destination: '+name+'.','Earth → '+name+' · transfer cruise','The journey is underway.','Coasting in space. The simulated mission clock runs faster here. Cabin temperature stays controlled while hull temperature follows the teaching model.'],capture:['Prepare for landing.','Arrival at '+name+' · g '+WORLDS[flight.destination].gravity+' m/s²','Two controls are coming up.','First lock descent velocity in the green 1–3 m/s zone with Space. Then lock attitude within ±5°. A go-around lets you retry an unsafe solution.'],speed:['Take command of the landing.','Final approach to '+name,'Lock descent velocity.',''],angle:['Set the landing attitude.','Final approach to '+name,'Lock the angle.',''],descent:['Retrorockets engaged.','Controlled descent to '+name,'Landing.',''], 'go-around':['Go-around commanded.','Your crew is safe · try the landing again','Adjust your parameters.',''],landed:['Welcome to '+name+'.','Touchdown confirmed · cabin pressure stable','Your surface training awaits.','Step outside to explore '+(flight.destination==='mars'?'Jezero’s rust-coloured terrain':'Mare Tranquillitatis')+', inspect the sky and '+(gameMode==='expedition'?'operate Haven in seven linked stages':'complete ten practical lessons')+'. Drag for a 360° view; F switches to astronaut vision.']}[p];
  if(flight.localSortie){copy[0]=copy[0].replace('Earth',name);copy[1]=name+' → orbital practice → '+name;copy[3]=copy[3].replace('Earth',name);$('journey-distance').textContent=name+' orbital practice · '+km(t.totalKm)+' km illustrative path';$('journey-distance-basis').textContent='400 km training orbit; period '+(flight.plan.durationSeconds/60).toFixed(1)+' min derived from gravity and radius. '+flight.plan.classification;}if(p==='ignition')copy[2]='Countdown · T−'+Math.max(0,3-Math.floor(flight.elapsed/2.4*3));
  $('flight-title').textContent=copy[0];$('flight-caption').textContent=copy[1];$('flight-action-title').textContent=copy[2];$('flight-action-text').textContent=copy[3];
  const stage=p==='briefing'||p==='boarding'?0:p==='cockpit'||p==='ignition'?1:p==='ascent'||p==='transfer'?2:3;
  ['earth','cockpit','transfer','landing'].forEach((x,i)=>$('stage-'+x).classList.toggle('active',i===stage));
  const gauges=flight.gauges;$('landing-speed-input').disabled=p!=='speed';$('landing-angle-input').disabled=p!=='angle';$('velocity-arrow').style.bottom=gauges.speed/12*100+'%';$('angle-arrow').style.left=(gauges.angle+15)/30*100+'%';
  $('landing-velocity').textContent=gauges.speed.toFixed(1)+' m/s'+(flight.speedLocked!==null?' ✓':'');$('landing-angle').textContent=gauges.angle.toFixed(1)+'°'+(flight.angleLocked!==null?' ✓':'');
  $('velocity-scale').setAttribute('aria-valuenow',gauges.speed.toFixed(1));$('angle-scale').setAttribute('aria-valuenow',gauges.angle.toFixed(1));
  $('landing-step').textContent=p==='speed'?'1 / 2 · LOCK VELOCITY':p==='angle'?'2 / 2 · LOCK ANGLE':p==='descent'?'BOTH PARAMETERS LOCKED':'AUTOMATIC GO-AROUND';
  $('landing-lock').textContent=p==='angle'?'Lock angle · Space':'Lock velocity · Space';$('landing-lock').disabled=!['speed','angle'].includes(p);
  $('landing-feedback').textContent=['go-around','descent'].includes(p)?flight.feedback:p==='speed'?'The velocity arrow moves from 0 to 12 m/s. Press Space when it enters the green zone.':'Velocity held. Press Space when the angle arrow is in the green centre zone.';
}
function launchSpacecraft(){if(dialogOpen()||story.active)return;audio.activate();if(flight.launch()){keys.clear();audio.cue('launch');syncFlight();$('world').focus({preventScroll:true});}}
function lockLanding(){if(dialogOpen())return;if(flight.lock()){audio.cue('click');keys.clear();syncFlight();}}
function toggleFlightCamera(){flightRenderer.pilotView=!flightRenderer.pilotView;if(flight.phase!=='cockpit')flight.cabinFlight=!flight.cabinFlight;flightRenderer.lookYaw=flightRenderer.lookPitch=0;syncFlight();}
function landOnSurface(){
  if(!flight.disembark())return;
  if(flight.localSortie&&localSortieState){const original=localSortieState;localSortieState=null;mission.state.status=original.status;mission.consumeTime(Math.max(0,astro.utc-original.utc),true);if(flight.flightEvent.choice==='backup')mission.state.expedition.outpost.fuel=Math.max(0,mission.state.expedition.outpost.fuel-3);mission.record('local-flight','Returned from '+mission.config.worldName+' orbital practice.');if(original.status==='complete')mission.finishExpedition();else mission.checkFailure();skyHolding=false;syncFlight();updateUI();processEvents();notice('Back at Haven. Outpost resources include the elapsed flight time.','success');return;}
  keys.clear();skyHolding=false;$('sky-guide').hidden=true;flightRenderer.dispose();renderer.dispose?.();
  mission=createDestinationMission(pack,flight.destination,storage,gameMode,astro);renderer=new Renderer($('world'),mission);renderer.reducedMotion=reducedMotion;renderer.showLandedCraft?.();flightRenderer=new FlightRenderer(renderer,flight,pack.solar);if(astro)flightRenderer.showOrbitLines=$('orbit-lines').checked;
  if(mission.isExpedition&&flight.flightEvent.choice==='backup'){mission.state.expedition.outpost.fuel=Math.max(0,mission.state.expedition.outpost.fuel-3);mission.record('flight-decision','Backup circuit used 3 emergency fuel units during transit.');}
  tutorial=new AcademyGuide(mission,storage);window.luna.mission=mission;window.luna.renderer=renderer;window.luna.tutorial=tutorial;
  writePreference('luna-destination-v1',flight.destination,storage);const rect=$('world').getBoundingClientRect();renderer.resize(rect.width,rect.height,window.devicePixelRatio||1);
  surfaceResumeStatus=null;previousFlightPhase='';if(astro)applyGraphics();refreshLesson();syncFlight();buildSources();
  notice('Touchdown on '+WORLDS[flight.destination].name+'. Start the highlighted lesson; Sky guide helps you find Earth and the Sun.','success');
}
function openJourney(){
  if(!flight||flight.active||story.active||dialogOpen())return;
  if(workbenchOpen)closeWorkbench();if(skyHolding)toggleSky();setView('surface');setAstraOpen(false,false);keys.clear();mission.route=null;surfaceResumeStatus=mission.state.status;
  if(mission.state.status==='playing')mission.state.status='paused';flight.restart();flight.select(mission.config.world);$('continue-surface').hidden=false;syncFlight();
}
function toggleSky(){
  if(astro){toggleScientificSky();return;}
  if(flight.active||story.active)return;
  skyHolding=!skyHolding;$('sky-guide').hidden=!skyHolding;if(skyHolding&&renderer.mode!=='surface')setView('surface');if(!skyHolding&&renderer.surfaceSky){renderer.surfaceSky.telescope=null;renderer.camera&&(renderer.camera.fov=72);renderer.camera?.updateProjectionMatrix();}keys.clear();syncTutorial();if(skyHolding)renderSkyGuide();
}
function renderSkyGuide(){
  if(astro){renderScientificSky();return;}
  if(!renderer.surfaceSky)return;const list=localSky(pack.solar,mission.config.world,renderer.surfaceSky.hour);
  $('sky-world').textContent=mission.config.worldName.toUpperCase()+' · LOCAL HORIZON';$('sky-time-readout').textContent=formatClock(renderer.surfaceSky.hour*3600).slice(0,5);
  $('sky-body-list').replaceChildren(...list.map(b=>{const row=document.createElement('div'),info=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small'),button=document.createElement('button');row.className='sky-row';name.textContent=b.name;detail.textContent=b.altitude.toFixed(1)+'° elevation · '+Math.round(b.distanceKm).toLocaleString()+' km';info.append(name,detail);button.textContent=b.altitude>0?'Aim ↗':'Find rise';button.addEventListener('click',()=>{
   if(b.altitude<=0){const samples=pack.solar.observers[mission.config.world].bodies[b.name].samples,best=samples.reduce((a,x)=>x.altitude>a.altitude?x:a);if(best.altitude<=0){$('sky-advice').textContent=b.name+' stays below this site’s horizon during the cached day. Use Solar system to inspect it in space.';return;}renderer.surfaceSky.hour=best.hour;$('sky-time').value=String(best.hour);renderSkyGuide();}
   renderer.surfaceSky.aim(b.name);preferredPerspective='first-person';panDragMode=false;syncCameraControls();$('sky-advice').textContent='Helmet aimed at '+b.name+'. Nearby terrain may obscure a low body. Use 360° drag to explore the horizon.';
  });const inspect=document.createElement('button');inspect.textContent='Telescope';inspect.disabled=b.altitude<=0;inspect.addEventListener('click',()=>{renderer.surfaceSky.aim(b.name,true);preferredPerspective='first-person';syncCameraControls();$('sky-advice').textContent='Telescope magnification · '+b.name+' · field of view '+renderer.camera.fov.toFixed(2)+'°. Close the guide to restore normal vision.';});row.append(info,button,inspect);return row;}));
}
function setMissionPanel(view){
  const systems=view==='systems'&&!!mission.isExpedition;
  $('mission-panel').classList.toggle('show-systems',systems);
  $('panel-mission').setAttribute('aria-pressed',String(!systems));
  $('panel-systems').setAttribute('aria-pressed',String(systems));
}
function setupViewportControls(){
  const narrow=window.matchMedia('(max-width:840px)');
  const setDrawer=open=>{document.body.classList.toggle('hud-open',open);$('hud-button').setAttribute('aria-expanded',String(open));$('mission-panel').inert=!!narrow.matches&&!open;};
  $('hud-button').addEventListener('click',()=>setDrawer($('hud-button').getAttribute('aria-expanded')!=='true'));
  $('hud-close').addEventListener('click',()=>{setDrawer(false);$('hud-button').focus();});
  narrow.addEventListener?.('change',()=>setDrawer(false));setDrawer(false);
  $('panel-mission').addEventListener('click',()=>setMissionPanel('mission'));
  $('panel-systems').addEventListener('click',()=>setMissionPanel('systems'));
  $('fullscreen-button').hidden=document.fullscreenEnabled===false;
  $('fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen?.();else await document.documentElement?.requestFullscreen?.();}catch{notice('Fullscreen is unavailable in this view. The game still fits the window.','warning');}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen-button').setAttribute('aria-pressed',String(!!document.fullscreenElement));});
}
function setupEvents() {
  setupViewportControls();
  if(astro)setupExpeditionEvents();
  $('board-spaceship').addEventListener('click',()=>{audio.activate();if(flight.board()){keys.clear();audio.cue('board');syncFlight();$('world').focus({preventScroll:true});}});
  for(const w of ['moon','mars'])$('destination-'+w).addEventListener('click',()=>{if(flight.select(w)&&mission.config.world!==w){surfaceResumeStatus=null;replaceSurfaceMission(w,gameMode);}syncFlight();});
  $('cockpit-view').addEventListener('click',toggleFlightCamera);$('landing-camera-view').addEventListener('click',toggleFlightCamera);
  $('launch-spacecraft').addEventListener('click',launchSpacecraft);$('landing-lock').addEventListener('click',lockLanding);$('disembark-spacecraft').addEventListener('click',landOnSurface);
  $('journey-button').addEventListener('click',openJourney);$('continue-surface').addEventListener('click',()=>{if(astro&&surfaceResumeStatus===null){resumeSelectedMission();return;}if(flight.phase!=='briefing'||surfaceResumeStatus===null)return;flight.enter('surface');mission.state.status=surfaceResumeStatus;surfaceResumeStatus=null;updateUI();});
  $('sky-button').addEventListener('click',toggleSky);$('sky-close').addEventListener('click',toggleSky);$('sky-time').addEventListener('input',()=>{if(renderer.surfaceSky){renderer.surfaceSky.hour=Number($('sky-time').value);renderer.surfaceSky.update();renderSkyGuide();}});
  $('solar-tab').addEventListener('click',()=>{if(skyHolding)toggleSky();setView('solar');});

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
  $('story-sound').addEventListener('click', async () => {
    const enableMusic = !storyMusicPlaying();
    audio.setOption('musicOn', enableMusic);
    if (enableMusic) audio.setMuted(false);
    await audio.activate(); // This click is the gesture browsers require before sound can play.
    updateStoryCaption();
    syncSettings();
  });
  $('story-replay').addEventListener('click',()=>{$('settings-dialog').close();story.state='idle';const enabled=story.enabled;story.enabled=true;openStory();story.enabled=enabled;});
  $('story-skip').addEventListener('click',()=>{audio.activate();finishStory(true);});
  $('story-dialog').addEventListener('cancel',event=>{event.preventDefault();finishStory(true);});
  $('story-dialog').addEventListener('close',()=>{story.finish(true);setStoryPresentation(false);renderer.endCinematic?.();audio.setHidden(document.hidden);keys.clear();lastTime=0;});
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
  $('next-action-button').addEventListener('click',()=>performAction(tutorial.active&&mission.isExpedition?tutorial.step.command:mission.nextAction().command));
  $('return-surface').addEventListener('click',()=>setView('surface'));
  $('inspect-earth').addEventListener('click',()=>inspectBody('Earth'));
  $('inspect-lro').addEventListener('click',()=>inspectBody(mission.config.astronomyTrainingTargets?.[1]||'LRO'));
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
  $('sound-button').addEventListener('click',toggleMusic);
  for(const [id,key] of [['music-toggle','musicOn'],['effects-toggle','effectsOn']])$(id).addEventListener('click',()=>{audio.setOption(key,!audio.settings[key]);audio.activate();syncSettings();});
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
    if(flight?.active&&!story.active){if(dialogOpen()||event.target.closest('input,textarea'))return;const k=event.key.toLowerCase();if(k==='f'&&['cockpit','ascent','transfer','capture','speed','angle','descent','go-around','landed'].includes(flight.phase)){event.preventDefault();if(!event.repeat)toggleFlightCamera();return;}if(k===' '||k==='e'){event.preventDefault();if(!event.repeat){if(k===' ')lockLanding();else launchSpacecraft();}}return;}

    if(event.key==='Escape'&&selectingRoutePoint){selectingRoutePoint=false;notice('Map selection cancelled.');return;}
    if (event.target.closest('input, textarea, [contenteditable="true"], [data-floating-panel]') || dialogOpen()) return;
    const k = event.key.toLowerCase();
    if(k==='f'&&renderer.mode==='surface'){event.preventDefault();if(!event.repeat)togglePerspective();return;}
    if(['[',']',',','.'].includes(k)){event.preventDefault();(renderer.mode==='solar'?flightRenderer.rotateSolar(k==='['?-.15:k===']'?.15:0,k===','?-.1:k==='.'?.1:0):renderer.rotateCamera?.(k==='['?-.15:k===']'?.15:0,k===','?-.1:k==='.'?.1:0));return;}
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
    if(!['surface','solar'].includes(renderer.mode)||story.active||dialogOpen()||cameraDrag||![0,1,2].includes(event.button))return;
    event.preventDefault();$('world').focus({preventScroll:true});
    cameraDrag={id:event.pointerId,button:event.button,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false,pan:!flight?.active&&renderer.perspective!=='first-person'&&(event.button===1||event.button===0&&(panDragMode||event.shiftKey))};
    $('world').setPointerCapture(event.pointerId);
  });
  $('world').addEventListener('pointermove',event=>{
    if(!cameraDrag||cameraDrag.id!==event.pointerId)return;
    if(story.active||dialogOpen()){cameraDrag=null;return;}
    const drag=cameraDrag;
    if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6)return;
    drag.moved=true;
    if(flight?.active)flightRenderer.rotate((event.clientX-drag.x)*.005,-(event.clientY-drag.y)*.004);
    else if(renderer.mode==='solar'&&flightRenderer.probeBody)flightRenderer.rotate((event.clientX-drag.x)*.005,-(event.clientY-drag.y)*.004);
    else if(renderer.mode==='solar')flightRenderer.rotateSolar((event.clientX-drag.x)*.006,(event.clientY-drag.y)*.005);
    else if(drag.pan)renderer.panCamera?.(event.clientX-drag.x,event.clientY-drag.y);
    else renderer.rotateCamera?.((event.clientX-drag.x)*.007,(event.clientY-drag.y)*.005*(renderer.perspective==='first-person'?-1:1));
    drag.x=event.clientX;drag.y=event.clientY;syncCameraControls();
  });
  $('world').addEventListener('pointerup',event=>{
    if(!cameraDrag||cameraDrag.id!==event.pointerId)return;
    const drag=cameraDrag;cameraDrag=null;
    if($('world').hasPointerCapture?.(event.pointerId))$('world').releasePointerCapture(event.pointerId);
    const x=event.clientX??drag.x,y=event.clientY??drag.y;
    if(flight?.active){if(!drag.moved&&drag.button===0&&Math.hypot(x-drag.startX,y-drag.startY)<6&&flight.phase==='cockpit'&&!story.active&&!dialogOpen()){const rect=$('world').getBoundingClientRect();if(flightRenderer.hitButton(x-rect.left,y-rect.top))launchSpacecraft();}return;}
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
  const frameMs=lastTime?now-lastTime:0;const dt=lastTime?Math.min(frameMs/1000,.1):0;lastTime=now;if(frameMs>0&&!document.hidden){performanceFrames.push(frameMs);if(performanceFrames.length>120)performanceFrames.shift();if($('performance-readout'))$('performance-readout').textContent='Observed '+(1000/(performanceFrames.reduce((a,b)=>a+b,0)/performanceFrames.length)).toFixed(1)+' FPS · '+graphicsQuality+' · '+(renderer.device?.info?.render?.triangles||0).toLocaleString()+' triangles';}
  if(story.active){
    const ended=story.update(Math.min(frameMs/1000,.5),document.hidden); /* Reading time follows the wall clock, even on slow GPUs. */updateStoryCaption();renderer.cinematicFrame?.(story.elapsed,story.chapter.shot);
    $('story-cut').style.opacity=String(renderer.cinematicFade||0);audio.updateOpening(story.elapsed);
    if(ended)finishStory();requestAnimationFrame(animate);return;
  }
  if(flight?.active){const held=document.hidden||!!dialogOpen();flight.update(dt,held);syncFlight();flightRenderer.draw();audio.updateFlight?.(flight,held);requestAnimationFrame(animate);return;}
  if(astro?.mode==='exploration'&&!document.hidden){astro.advance(dt);explorationRenderTime+=dt;if(explorationRenderTime>.5&&skyHolding){renderScientificSky();explorationRenderTime=0;}}
  const right = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
  const down = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
  const vector=renderer.inputVector?.(right,down)||{dx:right+down,dy:-right+down};
  if (!document.hidden && !dialogOpen() && $('astra-card').hidden && !skyHolding && !tutorial.holdsTime && renderer.mode==='surface') mission.update(dt, { ...vector, sprint: keys.has('shift'), jump: keys.has(' ') });
  else mission.state.moving = false;
  if(astro?.mode==='mission')astro.setMissionUTC(mission.utcStart+mission.state.time);
  processEvents(); uiElapsed += dt;
  if (uiElapsed >= 0.25) { updateUI(); uiElapsed = 0; }
  audio.update(mission.state, life, tutorial.holdsTime); if(!$('story-dialog').open){if(renderer.mode==='solar')flightRenderer.drawSolarSystem();else renderer.draw(now / 1000, life);updateWayfinding();} requestAnimationFrame(animate);
}
function resourceRows(o){return [[o.oxygen.toFixed(1)+' crew·h','O₂ inventory'],[o.water.toFixed(1)+' L','Crew water'],[o.food.toFixed(1)+' portions','Crew food'],[o.energy.toFixed(1)+' kWh','Battery'],[o.habitat.toFixed(0)+'%','Habitat'],[o.health.toFixed(0)+'%','Crew health'],[o.fatigue.toFixed(0)+'%','Fatigue'],[o.radiation.toFixed(2)+' mSv','Training dose'],[o.fuel.toFixed(1)+' units','Emergency fuel'],[String(o.kits),'Maintenance kits'],[String(o.science),'Science points'],[o.relay?'ONLINE':'OFFLINE','Field relay']];}
function fillResourceGrid(node,o){node.replaceChildren(...resourceRows(o).map(([value,label])=>{const cell=document.createElement('div'),title=document.createElement('small'),number=document.createElement('strong');title.textContent=label;number.textContent=value;cell.append(title,number);return cell;}));}
function renderOutpost(){
 const card=$('outpost-card');if(!card)return;card.hidden=!mission.isExpedition;$('envelope-legend').hidden=!mission.isExpedition;if(!mission.isExpedition)return;
 const e=mission.state.expedition,o=e.outpost,p=powerBalance(o,mission.sunlit());fillResourceGrid($('outpost-resources'),o);$('core-power').textContent=o.energy.toFixed(1)+' kWh';$('core-oxygen').textContent=(o.oxygen/mission.rules.crew).toFixed(1)+' crew hours';$('core-health').textContent=o.health.toFixed(0)+'%';renderMessages();$('outpost-phase').textContent=Math.min(7,e.stage+1)+' / 7';
 $('outpost-power').textContent='Supply '+p.supply.toFixed(2)+' kW / load '+p.demand.toFixed(2)+' kW · '+(p.net>=0?'charging ':'drawing ')+Math.abs(p.net).toFixed(2)+' kW. Shield '+o.shield+'.';
 $('outpost-alert').textContent=mission.safetyEnvelope().reason;$('local-sortie').disabled=!['playing','complete'].includes(mission.state.status)||!mission.near(mission.objects.base)||o.fuel<5;$('local-sortie').textContent='Orbital flight · 5 fuel ↗';$('local-sortie').title='Board Odyssey for '+mission.config.worldName+' orbital practice. Crew consumes resources during the flight.';
}
function showDecision(){
 if(!mission.isExpedition)return;openDialog($('decision-dialog'));renderer.showObjective?.();renderDecision();
}
let selectedPlan=null;
function renderDecision(){
 if(!mission.isExpedition)return;const stage=mission.stage,e=mission.state.expedition,task=mission.taskView();
 $('decision-kicker').textContent='STAGE '+(e.stage+1)+' OF 7 · '+mission.config.worldName.toUpperCase();$('decision-title').textContent=stage.title;$('decision-description').textContent=stage.description;
 $('decision-task-instruction').textContent=task.instruction;$('decision-task-action').textContent=task.label+' →';$('decision-task-action').disabled=task.done||stage.task==='circuit';fillResourceGrid($('decision-resources'),e.outpost);
 $('decision-astra').textContent=task.done?'2 · Compare plans below. Previewing is free and does not advance time.':'1 · Perform each equipment step first. Opening this panel alone does not complete the task.';
 $('decision-review').hidden=true;selectedPlan=null;
 $('decision-options').replaceChildren(...stage.options.map(option=>{
  const box=document.createElement('section'),name=document.createElement('h3'),text=document.createElement('p'),preview=document.createElement('pre'),button=document.createElement('button'),p=mission.preview(option);box.className='decision-option';name.textContent=option.label;text.textContent=option.explanation;
  preview.textContent=option.minutes+' mission minutes\nPower: '+p.delta.energy.toFixed(1)+' kWh\nOxygen: '+(p.delta.oxygen/mission.rules.crew).toFixed(1)+' crew hours\nCrew condition: '+p.outpost.health.toFixed(0)+'%'+(p.failure?'\nRisk: '+p.failure:'');
  button.className='primary-button';button.textContent='Review this plan →';button.disabled=!e.taskDone||Object.entries(option.effects).some(([k,v])=>['kits','fuel','water','oxygen','energy'].includes(k)&&typeof v==='number'&&e.outpost[k]+v<0);
  button.addEventListener('click',()=>{selectedPlan={id:option.id,stage:e.stage,revision:e.revision};$('decision-review').hidden=false;$('decision-forecast').textContent=forecastText(p)+'\n'+option.explanation;$('decision-confirm').textContent='Confirm '+option.label+' · '+option.minutes+' min';$('decision-review').scrollIntoView({block:'nearest'})});box.append(name,text,preview,button);return box;
 }));
}
function forecastText(p){return '3 · Before → after this action\nHabitat battery: '+p.before.energy.toFixed(1)+' → '+p.outpost.energy.toFixed(1)+' kWh\nOxygen for all four crew: '+(p.before.oxygen/mission.rules.crew).toFixed(2)+' → '+(p.outpost.oxygen/mission.rules.crew).toFixed(2)+' hours\nCrew condition: '+p.before.health.toFixed(1)+' → '+p.outpost.health.toFixed(1)+'%\nFood: '+p.before.food.toFixed(1)+' → '+p.outpost.food.toFixed(1)+' portions\nWater: '+p.before.water.toFixed(1)+' → '+p.outpost.water.toFixed(1)+' L\nSuit reserves after: '+p.suit.oxygen.toFixed(0)+' min oxygen / '+p.suit.energy.toFixed(0)+' Wh / '+p.suit.water.toFixed(2)+' L water\nScience: '+p.before.science+' → '+p.outpost.science+' · Kits: '+p.before.kits+' → '+p.outpost.kits+'\nTime cost: '+p.minutes+' mission minutes'+(p.failure?'\nWarning: '+p.failure:'');}
function confirmDecision(){
 if(!selectedPlan||selectedPlan.stage!==mission.state.expedition.stage||selectedPlan.revision!==mission.state.expedition.revision){renderDecision();return;}
 const option=mission.stage.options.find(o=>o.id===selectedPlan.id),p=mission.preview(option);
 if(!mission.choose(option.id,selectedPlan.stage))return;
 selectedPlan=null;$('decision-dialog').close();$('consequence-text').textContent=option.explanation+'\n\n'+forecastText(p).replace('3 · Before → after this action','Actual consequence');$('consequence-next').textContent=['complete','failed'].includes(mission.state.status)?'View mission debrief →':'Next objective: '+mission.stage.title+' →';openDialog($('consequence-dialog'));updateUI();
}
function renderMessages(){
 if(!mission.isExpedition)return;const e=mission.state.expedition,latest=e.messages.at(-1);$('earth-request').disabled=!['playing','paused'].includes(mission.state.status)||e.askedStages.includes(e.stage)||e.outpost.energy<(mission.rules.earthMessageEnergyKwh||.15);
 $('earth-reply').textContent=latest?(latest.delivered?latest.text:'Reply in '+Math.ceil(Math.max(0,latest.due-mission.state.time))+' mission seconds. Advice describes the moment you sent it. Time pauses while reading.'): 'One-way signal time: '+mission.earthDelay().toFixed(1)+' seconds. A reply needs a round trip. ASTRA is local and immediate.';
}
function inspectGreenhouse(){
 if(!mission.isExpedition)return;const o=mission.state.expedition.outpost,p=powerBalance(o,mission.sunlit()),cycle=mission.rules.cropCycleHours||6;
 $('greenhouse-readout').textContent='Grow lights: '+o.foodKw+' kW\nCrop progress: '+Math.min(100,(o.growthHours||0)/cycle*100).toFixed(0)+'% · Harvests: '+(o.harvests||0)+'\nFood stored: '+o.food.toFixed(1)+' portions for four crew\nWater: '+o.water.toFixed(1)+' L\nCurrent power balance: '+p.net.toFixed(2)+' kW\nMore growing power uses the battery and extra water now; a completed crop adds '+(mission.rules.cropHarvestPortions||2)+' portions later. Change greenhouse allocation in the power and resupply plans. Inspection is free.';
 openDialog($('greenhouse-dialog'));renderer.follow=false;renderer.cameraPinned={...mission.props.find(p=>p.id==='greenhouse')};renderer.routeDistance=32*renderer.unitsPerMetre;
}

function showExpeditionDebrief(){
 const d=mission.debrief(),f=d.forecast;$('debrief-dialog').dataset.success=String(d.success);$('debrief-title').textContent=d.success?'Mission secured. Crew protected.':'Mission review: try a new plan.';$('debrief-description').textContent=d.success?mission.scenario.title+' complete. The relay is restored, the science goal is met, and the crew has a calculated four-hour resupply margin.':mission.state.failureReason+'. Replay the last checkpoint or restart the mission.';$('debrief-emblem').textContent=d.success?'✦':'↻';$('debrief-rank').textContent=mission.rank;
 $('debrief-metrics').replaceChildren(...[[d.minutes.toFixed(1),'MISSION MINUTES'],[d.distanceKm.toFixed(2)+' km','DISTANCE'],[d.science+' / '+mission.scenario.minimumScience,'SCIENCE'],[d.outpost.energy.toFixed(1)+' kWh','BATTERY'],[d.outpost.health.toFixed(0)+'%','CREW HEALTH'],[d.decisions.length+' / 7','DECISIONS']].map(([value,label])=>{const n=document.createElement('div'),v=document.createElement('strong'),l=document.createElement('span');v.textContent=value;l.textContent=label;n.append(v,l);return n;}));
 $('debrief-learning').textContent='Resupply forecast in '+f.hours+' hours: '+f.final.oxygen.toFixed(1)+' crew·h oxygen, '+f.final.water.toFixed(1)+' L water, '+f.final.food.toFixed(1)+' food portions, '+f.final.energy.toFixed(1)+' kWh, '+f.final.health.toFixed(0)+'% health. '+d.learning+' Forecast keeps the current sunlight and operating plan.';$('skill-check').hidden=true;$('course-certificate').hidden=!d.success;$('course-certificate').textContent=d.success?mission.scenario.badge+' · '+mission.xp+' XP':'';$('next-level-button').hidden=false;$('next-level-button').textContent='Choose another journey →';
 $('debrief-journal').replaceChildren(...d.decisions.map(entry=>{const row=document.createElement('div'),name=document.createElement('strong'),text=document.createElement('span');row.className='debrief-decision';name.textContent=entry.title;text.textContent=entry.label+' · '+entry.minutes+' mission minutes · effects '+Object.entries(entry.effects).map(([k,v])=>k+': '+v).join(', ');row.append(name,text);return row;}));openDialog($('debrief-dialog'));
}
function replaceSurfaceMission(destination,mode){
 keys.clear();flightRenderer.dispose();renderer.dispose?.();mission=createDestinationMission(pack,destination,storage,mode,astro);renderer=new Renderer($('world'),mission);if(flight.phase==='surface')renderer.showLandedCraft?.();flightRenderer=new FlightRenderer(renderer,flight,pack.solar);if(astro)flightRenderer.showOrbitLines=$('orbit-lines').checked;tutorial=new AcademyGuide(mission,storage);window.luna.mission=mission;window.luna.renderer=renderer;window.luna.tutorial=tutorial;displayedLesson='';const rect=$('world').getBoundingClientRect();renderer.resize(rect.width,rect.height,window.devicePixelRatio||1);applyGraphics();refreshLesson();buildSources();
}
function switchSurfaceMode(mode){if(mission.isExpedition&&mission.state.status==='playing')mission.saveCheckpoint();gameMode=mode;writePreference('luna-game-mode-v1',mode,storage);replaceSurfaceMission(mission.config.world,mode);}
function savedSelectedMission(){return gameMode==='expedition'&&readPreference('luna-expedition-v2-'+flight.destination,null,storage)?.schema===2;}
function resumeSelectedMission(){if(flight.phase!=='briefing'||!savedSelectedMission())return;flight.enter('surface');replaceSurfaceMission(flight.destination,gameMode);if(mission.replayCheckpoint()){mission.utcStart=astro.utc-mission.state.time;refreshLesson();notice('Outpost checkpoint restored. Follow the next-action card.','success');}syncFlight();}
function toggleScientificSky(keepSolar=false){
 if(flight.active||story.active)return;skyHolding=!skyHolding;$('sky-guide').hidden=!skyHolding;keys.clear();
 if(skyHolding){astro.beginExploration();if(!keepSolar&&renderer.mode!=='surface')setView('surface');$('astronomy-rate').value='0';$('astronomy-utc').min=astro.data.start.slice(0,16);$('astronomy-utc').max=astro.data.stop.slice(0,16);const far=$('astronomy-observer').children.find?.(o=>o.value==='far')||[...$('astronomy-observer').children].find(o=>o.value==='far');if(far)far.disabled=mission.config.world!=='moon';renderScientificSky();}
 else{astro.endExploration();$('astronomy-observer').value='player';if(renderer.surfaceSky){renderer.surfaceSky.telescope=null;renderer.camera.fov=72;renderer.camera.updateProjectionMatrix();}restoreSurfaceVisibility();renderer.surfaceSky.update();}syncTutorial();updateUI();
}
function setSkyOnly(value){document.body.classList.toggle('sky-only',value);for(const node of [renderer.ground,...(renderer.terrainPatches||[]),renderer.geology,renderer.baseConnections,renderer.scenery,renderer.apron,renderer.rover,renderer.marker,renderer.fieldSample,renderer.deliveredCargo,renderer.fxGroup,...renderer.rocks,...renderer.surveys,...Object.values(renderer.pathGroups)])if(node)node.visible=!value;renderer.skyOnly=value;}
function restoreSurfaceVisibility(){setSkyOnly(false);}
function renderScientificSky(){
 if(!renderer.surfaceSky)return;const list=renderer.surfaceSky.update(),view=renderer.surfaceSky.lastView;$('sky-world').textContent=mission.config.worldName.toUpperCase()+' / EXPLORATION · MISSION PAUSED';$('sky-time-readout').textContent=new Date(astro.utc*1000).toISOString().slice(0,16)+' UTC';$('sky-time').value=String(renderer.surfaceSky.hour);if(document.activeElement!==$('astronomy-utc'))$('astronomy-utc').value=new Date(astro.utc*1000).toISOString().slice(0,16);
 $('sky-body-list').replaceChildren(...list.map(b=>{const row=document.createElement('div'),info=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small'),aim=document.createElement('button'),scope=document.createElement('button');row.className='sky-row';name.textContent=b.name+' · '+(b.visible?'above horizon':b.obstruction||'below horizon');detail.textContent=b.altitude.toFixed(2)+'° elevation / '+b.diameterArcsec.toFixed(2)+'″ disk / '+Math.round(b.distanceKm).toLocaleString()+' km\n'+Math.round(b.illuminated*100)+'% illuminated / light travel '+(b.lightSeconds/60).toFixed(2)+' min'+(b.name!=='Sun'&&b.diameterArcsec<60?' / unresolved to unaided eye':'');info.append(name,detail);aim.className='secondary-button';aim.textContent='Aim';aim.disabled=!b.visible;aim.addEventListener('click',()=>{if(renderer.surfaceSky.aim(b.name)){preferredPerspective='first-person';syncCameraControls();$('sky-advice').textContent='Looking toward '+b.name+'. Disk size is calculated from radius and observer distance; buildings can still block the view.';}});scope.textContent='Telescope';scope.disabled=!(b.geometricVisible??b.visible)||b.name==='Sun';scope.addEventListener('click',()=>{renderer.surfaceSky.setMagnification(Number($('telescope-magnification').value));if(renderer.surfaceSky.aim(b.name,true)){preferredPerspective='first-person';syncCameraControls();$('sky-advice').textContent=b.name+' · '+renderer.surfaceSky.magnification+'× / '+renderer.camera.fov.toFixed(2)+'° field. 80 mm aperture, ideal 1.7″ resolution; ideal aperture blur applied; static imagery and approximate rotation.';}});row.append(info,aim,scope);return row;}));
 $('astronomy-feedback').textContent='Coverage '+astro.data.start.slice(0,10)+' → '+astro.data.stop.slice(0,10)+'. '+astro.rate.toLocaleString()+'× exploration time. Closing restores the active mission clock.';
}
function applyGraphics(){if(!renderer.device)return;renderer.lunarClasts?.setQuality(graphicsQuality);const presets={low:[1,512],balanced:[1.5,2048],high:[2,4096]},[pixels,shadow]=presets[graphicsQuality]||presets.balanced;renderer.maxDpr=pixels;for(const light of [renderer.sun,flightRenderer?.sun].filter(Boolean)){light.shadow.mapSize.set(shadow,shadow);light.shadow.map?.dispose();light.shadow.map=null;}const rect=$('world').getBoundingClientRect();renderer.resize(rect.width,rect.height,Math.min(window.devicePixelRatio||1,pixels));}
function startLocalSortie(){if(!mission.isExpedition||flight.active||dialogOpen()||skyHolding||!mission.near(mission.objects.base)||!['playing','complete'].includes(mission.state.status)||mission.state.expedition.outpost.fuel<5)return;const status=mission.state.status,utc=astro.utc;if(flight.startLocalSortie(mission.config.world,mission.terrain.geo(mission.state.player))){localSortieState={status,utc};mission.state.expedition.outpost.fuel-=5;mission.state.status='paused';mission.route=null;keys.clear();syncFlight();}}
function setupExpeditionEvents(){
 $('decision-confirm').addEventListener('click',confirmDecision);
 $('consequence-next').addEventListener('click',()=>{$('consequence-dialog').close();processEvents();updateUI();});
 $('earth-request').addEventListener('click',()=>{if(mission.askEarth()){audio.cue('radio');renderOutpost();if($('decision-dialog').open)renderDecision();}});
 $('greenhouse-inspect').addEventListener('click',inspectGreenhouse);
 $('greenhouse-dialog').addEventListener('close',resetCamera);
 $('greenhouse-route').addEventListener('click',()=>{$('greenhouse-dialog').close();const point=renderer.crew?.stations[0];if(!point||mission.state.status!=='playing'){notice('Resume the mission first, then walk to the greenhouse.');return;}if(mission.navigate(point))notice('Walking to the greenhouse. Travel uses suit reserves; inspecting the plants is free.');else notice('No safe walking route to the greenhouse from here. Move to open ground and try again.');});
 for(const kind of ['speed','angle'])$('landing-'+kind+'-input').addEventListener('input',()=>{flight.setLandingTarget(kind,Number($('landing-'+kind+'-input').value));syncFlight();});
 document.querySelector('.playfield').append($('solar-explorer'));$('local-sortie').addEventListener('click',startLocalSortie);
 for(const mode of ['expedition','training'])$('mode-'+mode).addEventListener('click',()=>{if(flight.phase==='briefing'){gameMode=mode;writePreference('luna-game-mode-v1',mode,storage);if(!!mission.isExpedition!==(mode==='expedition'))replaceSurfaceMission(flight.destination,mode);syncFlight();}});
 $('decision-task-action').addEventListener('click',()=>{if(mission.performTask()){renderer.trigger('survey',mission.state.player);renderDecision();updateUI();}});
 $('outpost-forecast').addEventListener('click',()=>{setAstraOpen(true,false,false);askAstra('Can the crew survive until resupply?');});
 $('save-checkpoint').addEventListener('click',()=>{if(mission.isExpedition&&['playing','paused'].includes(mission.state.status)){mission.saveCheckpoint();notice('Current outpost checkpoint saved. You can resume it before the next launch.','success');}});
 $('astronomy-utc').addEventListener('change',()=>{if(!astro.setUTC($('astronomy-utc').value+'Z'))$('astronomy-feedback').textContent='Select a UTC time inside the cached coverage.';else renderScientificSky();});
 $('astronomy-rate').addEventListener('change',()=>{astro.rate=Number($('astronomy-rate').value);renderScientificSky();});
 $('astronomy-observer').addEventListener('change',()=>{const value=$('astronomy-observer').value,site=astro.data.sites[mission.config.world];astro.observerOverride=value==='site'?{lat:site.latitude,lon:site.longitude,elevation:site.altitudeKm*1000}:value==='far'&&mission.config.world==='moon'?{lat:0,lon:203.47297,elevation:0}:null;if(value==='far'&&mission.config.world==='moon'){setSkyOnly(true);$('sky-advice').textContent='Far-side sky observatory. Earth is hidden by the lunar horizon. Terrain is not available for this location; this is a sky-only view.';}else restoreSurfaceVisibility();renderScientificSky();});
 $('astronomy-exposure').addEventListener('input',()=>{astro.exposure=Number($('astronomy-exposure').value);$('exposure-output').textContent=astro.exposure.toFixed(2)+' EV';renderScientificSky();});
 $('enhanced-night').addEventListener('change',()=>{astro.enhanced=$('enhanced-night').checked;renderScientificSky();});
 $('telescope-magnification').addEventListener('input',()=>{const m=Number($('telescope-magnification').value);$('telescope-output').textContent=m+'×';renderer.surfaceSky.setMagnification(m);});
 $('graphics-quality').value=readPreference('luna-graphics-v1','balanced',storage);graphicsQuality=$('graphics-quality').value;
 $('graphics-quality').addEventListener('change',()=>{graphicsQuality=$('graphics-quality').value;writePreference('luna-graphics-v1',graphicsQuality,storage);applyGraphics();});
 $('orbit-lines').checked=readPreference('luna-orbits-v1',true,storage)!==false;flightRenderer.showOrbitLines=$('orbit-lines').checked;$('orbit-lines').addEventListener('change',()=>{flightRenderer.showOrbitLines=$('orbit-lines').checked;writePreference('luna-orbits-v1',$('orbit-lines').checked,storage);});
 $('solar-body').replaceChildren(...Object.entries(astro.data.bodies).map(([name,body])=>{const option=document.createElement('option');option.value=name;option.textContent=name+' · '+body.kind;return option;}));$('solar-body').value='Earth';
 $('solar-probe').addEventListener('click',()=>{flightRenderer.probeBody=$('solar-body').value;flightRenderer.lookYaw=0;flightRenderer.lookPitch=0;$('solar-labels').hidden=true;notice('Scientific probe: apparent body size is preserved. Drag to look around. Gas and ice giants have no surface landing.');});
 $('solar-overview').addEventListener('click',()=>{flightRenderer.probeBody=null;$('solar-labels').hidden=false;$('solar-science-readout').textContent='Navigation map: r(AU)^0.42 × 65 scene units; planet radii enlarged; Moon spacing enlarged. All positions and the partial cached orbit arcs derive from the shared UTC world.';});
 $('solar-clock').addEventListener('click',()=>{toggleScientificSky(true);});
 $('flight-skip').addEventListener('click',()=>{if(flight.skipSegment())syncFlight();});
 for(const choice of ['isolate','backup']){const button=$('flight-choice-'+choice),preview=on=>{flightEventPreview=on?choice:null;syncFlightEvent(flight.phase);};
   button.addEventListener('click',()=>{if(flight.resolveEvent(choice)){flightEventPreview=null;audio.cue('ready');syncFlight();}});
   button.addEventListener('pointerenter',()=>preview(true));button.addEventListener('pointerleave',()=>preview(false));button.addEventListener('focus',()=>preview(true));button.addEventListener('blur',()=>preview(false));}
 for(const q of ['Can I safely complete this EVA?','What is our biggest risk right now?','Why did our power decrease?','What happens if I activate shielding?','Which system should I repair first?','Can the crew survive until resupply?']){const button=document.createElement('button');button.textContent=q;button.addEventListener('click',()=>askAstra(q));$('astra-card').querySelector('.astra-prompts').append(button);}
}

async function loadDonkiContext(){try{const d=window.LUNA_DONKI||await (await fetch('data/donki_archive.json')).json();const n=$('donki-context');n.textContent=d.loaded&&d.events?.length?'NASA CCMC / DONKI · archived, not live. '+d.events.length+' solar-flare records. Retrieved '+d.retrievedAt+'. '+d.events.slice(0,3).map(e=>e.beginTime+' / '+e.classType).join('; '):'DONKI: no archive imported. Solar alerts are authored practice events. Flare class is not an astronaut dose.';}catch{$('donki-context').textContent='DONKI archive unavailable. Game hazards remain authored teaching scenarios.';}}
async function boot() {
  try {
    const data = window.LUNA_DATA || await loadGameData();
    pack=data;
    try { storage = window.localStorage; } catch { storage = null; }
    const localConnection = await connectLocalBackend(storage);
    storage = localConnection.storage;
    window.lunaLocal = localConnection;
    if(data.astronomy){astro=new AstronomicalWorld(data.astronomy,data.stars);gameMode=readPreference('luna-game-mode-v1','expedition',storage)==='training'?'training':'expedition';}
    mission = createDestinationMission(data,readPreference('luna-destination-v1','moon',storage)==='mars'?'mars':'moon',storage,gameMode,astro);
    renderer = new Renderer($('world'), mission);
    flight=new FlightSimulation(data.solar,astro);flight.select(mission.config.world);flightRenderer=new FlightRenderer(renderer,flight,data.solar);
    tutorial = new AcademyGuide(mission,storage); audio = new MissionAudio(storage);story=new StorySequence(storage);story.attachAudio(audio);
    labelsEnabled=readPreference('luna-labels-v1',true,storage)!==false;
    const systemReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    reducedMotion = readPreference('luna-motion-v1', systemReduced, storage) === true;
    setupEvents(); buildSources(); loadDonkiContext(); updateUI(); $('loading').hidden = true;openStory();
    // Kept for development and reproducible engine inspection, not used by gameplay.
    window.luna = { mission, renderer, tutorial, audio, story,flight,astro };syncFlight();
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
