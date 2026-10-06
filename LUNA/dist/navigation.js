import { clamp, distance } from './engine.js';

export function compassVectors(terrain, point) {
  const p = terrain.geo(point), r = Math.hypot(p.x, p.y);
  if (!r) return null; // Longitude has no unique direction at the pole itself.
  return { north: { x: p.x / r, y: -p.y / r }, east: { x: p.y / r, y: p.x / r } };
}

export function resolveRouteRequest(mission, question) {
  const q = question.toLowerCase().replace(/[−–]/g, '-').trim();
  const action = /\b(route|path|navigate|go|take|head|walk|drive|travel|guide|lead|plot|show|find|reach|where)\b/.test(q);
  const direction = q.match(/\b(north[ -]?east|north[ -]?west|south[ -]?east|south[ -]?west|north|south|east|west|up|down|left|right)\b/);
  const coordinate = q.match(/\bx\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*[,; ]+y\s*[:=]?\s*(-?\d+(?:\.\d+)?)/);
  const surveyOnly = /^(?:survey|research|science)(?:\s+\d+)?\s*[.!?]?$/.test(q);
  if (!action && !coordinate && !surveyOnly && !(direction && /^\s*(north|south|east|west|up|down|left|right)/.test(q))) return null;
  if (/\b(route|path|navigate|go|walk|drive|travel|plot|reach)\b/.test(q) && /\b(earth|mars|sun|satellite|lro|orbit)\b/.test(q)) return { error: 'I can plot routes within this lunar surface sector. Open Orbital to inspect the dated celestial positions; those bodies are not surface destinations.' };
  if (coordinate) {
    const target = { x: Number(coordinate[1]), y: Number(coordinate[2]) };
    if (!mission.terrain.inBounds(target.x,target.y)) return { error: 'Those grid coordinates are outside the playable NASA terrain crop. Select a point on the surface tracker instead.' };
    return { target, label: `Grid ${target.x.toFixed(1)}, ${target.y.toFixed(1)}` };
  }
  if (action || surveyOnly) {
    if (/\b(haven|home|base|outpost)\b/.test(q)) return { target: { ...mission.objects.base }, label: 'Haven' };
    if (/\b(echo|rover|vehicle)\b/.test(q)) return { target: { ...mission.state.rover }, label: 'Echo' };
    if (/\b(relay|signal)\b/.test(q)) return { target: { ...mission.objects.relay }, label: 'Surface relay' };
    if (/\b(objective|mission|next)\b/.test(q)) return { target: { ...mission.target() }, label: mission.target().name };
    const survey = q.match(/\b(?:survey|research|science)(?:\s+(\d+))?\b/);
    if (survey) {
      const choices = mission.science.filter(s => !mission.state.scans.includes(s.id));
      const site = survey[1] ? mission.science[Number(survey[1])-1] : choices.sort((a,b)=>distance(a,mission.state.player)-distance(b,mission.state.player))[0];
      return site ? { target: { ...site }, label: site.name } : { error: 'No matching uncollected survey remains. Try “survey 1”, “survey 2”, or “survey 3” to revisit a site.' };
    }
  }
  if (direction) {
    const word = direction[1].replace(/[ -]/g,''), compass = compassVectors(mission.terrain, mission.state.player);
    let v;
    const basis=mission.screenBasis;
    const screen = basis ? {up:[-basis.down.dx,-basis.down.dy],down:[basis.down.dx,basis.down.dy],left:[-basis.right.dx,-basis.right.dy],right:[basis.right.dx,basis.right.dy]} : { up:[-1,-1],down:[1,1],left:[-1,1],right:[1,-1] };
    if (screen[word]) v={x:screen[word][0],y:screen[word][1]};
    else {
      if (!compass) return { error: 'Compass north is undefined at the pole. Select a map point or use screen directions.' };
      const north = word.includes('north') ? 1 : word.includes('south') ? -1 : 0;
      const east = word.includes('east') ? 1 : word.includes('west') ? -1 : 0;
      v={x:compass.north.x*north+compass.east.x*east,y:compass.north.y*north+compass.east.y*east};
    }
    const length=Math.hypot(v.x,v.y); v.x/=length;v.y/=length;
    const amount=q.match(/(-?\d+(?:\.\d+)?)\s*(km|kilomet(?:er|re)s?|m|met(?:er|re)s?)\b/);
    const metres=amount?Number(amount[1])*(amount[2].startsWith('k')?1000:1):mission.terrain.cell*5;
    if (!(metres>0)) return { error: 'Choose a positive distance, for example “north 200 m”.' };
    const start=mission.state.player, cells=metres/mission.terrain.cell, terrain=mission.terrain;
    let travel=cells;
    for(const [axis,hi] of [['x',terrain.width-2],['y',terrain.height-2]]) {
      if(v[axis]>0)travel=Math.min(travel,(hi-start[axis])/v[axis]);
      if(v[axis]<0)travel=Math.min(travel,(1-start[axis])/v[axis]);
    }
    if(travel<0.5)return {error:'You are already at this sector’s boundary in that direction. Choose another direction or a destination.'};
    return {target:{x:clamp(start.x+v.x*travel,1,terrain.width-2),y:clamp(start.y+v.y*travel,1,terrain.height-2)},label:word.toUpperCase()+(screen[word]?' (screen direction)':' (lunar compass)'),clipped:travel<cells-0.01,requestedMetres:metres};
  }
  if (action && /\b(route|path|navigate|plot)\b/.test(q)) return { error: 'Tell me a destination: “route to Echo”, “route to Haven”, “north 200 m”, “survey 2”, or “x 25 y 40”. You can also choose a point on the map.' };
  return null;
}

export function planSurfaceRoute(mission, request) {
  if(request.error)return {error:request.error};
  const terrain=mission.terrain, s=mission.state,c=mission.config;
  if (!terrain.inBounds(request.target.x,request.target.y)) return {error:'That point is outside the playable terrain crop.'};
  const target=mission.accessibleDestination(request.target);
  if(!target)return {error:'That destination is occupied by equipment. Choose open ground beside it.',request};
  const route=terrain.route(s.player,target,mission.maxSlope());
  if(!route || route.path.slice(1).some((p,i)=>!terrain.canStep(route.path[i],p,mission.maxSlope()))) return {error:`No traversable path to ${request.label} fits this equipment’s ${mission.maxSlope()}° slope limit. Choose a different endpoint or approach.`,request};
  const back=terrain.route(target,mission.objects.base,mission.maxSlope());
  const speed=s.rover.occupied?c.roverMetresPerSecond:c.walkMetresPerSecond;
  const segments=[route,back].filter(Boolean), seconds=segments.reduce((n,r)=>n+r.metres/speed,0), reserve=1+c.returnReserveFraction;
  const effort=segments.reduce((n,r)=>n+r.metres/speed*(s.rover.occupied?1:1.12*(1+r.maxGrade/160)),0);
  const oxygenNeed=effort/60*reserve, waterNeed=effort/3600*c.suit.waterLitresPerHour*reserve;
  const suitNeed=seconds/3600*(s.rover.occupied?c.suit.idleWatts:c.suit.movingWatts)*reserve;
  const roverNeed=s.rover.occupied?(seconds/3600*c.rover.driveWatts+segments.reduce((n,r)=>n+r.metres,0)*c.rover.consumptionWhPerMetre)*reserve:0;
  const safe=!!back&&s.oxygen>oxygenNeed&&s.water>waterNeed&&s.suitWh>suitNeed&&(!s.rover.occupied||s.rover.wh>roverNeed);
  return {...route,target,label:request.label,request,from:{...s.player},rover:s.rover.occupied,safe,hasReturnPath:!!back,oxygenNeed,waterNeed,suitNeed,roverNeed,minutes:route.metres/speed/60,
    message:`I found a ${(route.metres/1000).toFixed(2)} km path to ${request.label}. The steepest traversed segment is ${route.maxGrade.toFixed(1)}°, within your ${mission.maxSlope()}° limit. ${request.clipped?'The destination is clipped to the edge of this NASA terrain crop. ':''}${safe?'Your modeled supplies cover the journey and return to Haven, including the reserve.':'The journey plus return exceeds a modeled reserve, or no return path is available.'} The ${safe?'cyan':'amber'} line previews the path; choose Follow route to travel.`};
}
