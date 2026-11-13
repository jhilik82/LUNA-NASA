import { clamp, randomGenerator } from './engine.js';
const cyan='#8be1cf',orange='#ff8b55';
function line(ctx, points, color, width = 1, dash = []) {
  if (!points.length) return;
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
}
function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
}
function label(ctx,x,y,title,detail='',accent='#c6def6',font=15) {
  ctx.font=`700 ${font}px sans-serif`;const width=Math.max(ctx.measureText(title).width,detail?ctx.measureText(detail).width:0)+24,height=detail?font*2+22:font+16;
  ctx.fillStyle='#07111f';ctx.fillRect(x-width/2,y,width,height);ctx.strokeStyle=accent;ctx.lineWidth=1;ctx.strokeRect(x-width/2,y,width,height);
  ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='#ffffff';ctx.fillText(title,x,y+8);
  if(detail){ctx.font=`${font-2}px monospace`;ctx.fillStyle='#d0e0f0';ctx.fillText(detail,x,y+font+13);}
  ctx.textBaseline='alphabetic';return{x:x-width/2,y,width,height};
}
export class TrackingMaps {
  constructor(mission) { this.mission=mission;this.assistedRoute=null; }
  drawMini(canvas, life) {
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, terrain = this.mission.terrain;
    ctx.clearRect(0, 0, w, h); const cellW = w / terrain.width, cellH = h / terrain.height;
    for (let y = 0; y < terrain.height; y++) for (let x = 0; x < terrain.width; x++) {
      const f = (terrain.heightAt(x, y) - terrain.min) / (terrain.max - terrain.min || 1);
      ctx.fillStyle = `rgb(${Math.round(34 + 50 * f)},${Math.round(49 + 54 * f)},${Math.round(50 + 44 * f)})`;
      ctx.fillRect(x * cellW, y * cellH, cellW + 0.3, cellH + 0.3);
    }
    const map = p => ({ x: (p.x + 0.5) * cellW, y: (p.y + 0.5) * cellH });
    if (life?.route) line(ctx, life.route.path.map(map), '#d9e5d19c', 1.2, [3, 3]);
    if(this.assistedRoute)line(ctx,this.assistedRoute.path.map(map),this.assistedRoute.safe?'#80eadc':'#ffc07e',2);
    if (this.mission.state.trail.length) line(ctx, this.mission.state.trail.map(map), '#80dbc595', 1);
    for (const site of this.mission.science) { const p = map(site); ctx.fillStyle = cyan; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    for (const [name, point] of Object.entries(this.mission.objects)) {
      const p = map(name === 'rover' ? this.mission.state.rover : point);
      ellipse(ctx, p.x, p.y, 3.3, 3.3, name === 'base' ? '#e5ebdc' : orange);
    }
    const goal=map(this.mission.target());ctx.strokeStyle='#ffc185';ctx.lineWidth=2;ctx.strokeRect(goal.x-5,goal.y-5,10,10);
    const p = map(this.mission.state.player); ellipse(ctx, p.x, p.y, 6, 6, '#06121f');ellipse(ctx,p.x,p.y,4,4,'#fff');
    ctx.font='700 11px sans-serif';const tx=clamp(p.x,24,w-24),ty=clamp(p.y+11,11,h-30);label(ctx,tx,ty,'YOU','','#fff',11);
  }
  drawOrbit(canvas,time) { this.width=canvas.width;this.height=canvas.height;const ctx=canvas.getContext('2d');ctx.fillStyle='#080e19';ctx.fillRect(0,0,this.width,this.height);this.paintOrbit(ctx,time); }
  paintOrbit(ctx, time) {
    const cx = this.width / 2, top=165,bottom=Math.max(top+180,this.height-190),cy=(top+bottom)/2,moonR = Math.min(72, this.width * 0.13);
    const maxR = Math.min(this.width * 0.37, (bottom-top)*0.55), bodies = this.mission.astronomy(),font=this.width<600?12:16;
    const boxes=[{x:cx-moonR,y:cy-moonR,width:moonR*2,height:moonR*2}],jobs=[];
    const overlaps=(a,b)=>a.x<b.x+b.width+8&&a.x+a.width+8>b.x&&a.y<b.y+b.height+8&&a.y+a.height+8>b.y;
    for (let i = 1; i <= 3; i++) {
      ctx.strokeStyle = '#acc5c320'; ctx.lineWidth = 1; ctx.setLineDash([3, 7]); ctx.beginPath(); ctx.ellipse(cx, cy, moonR + i * (maxR - moonR) / 3, (moonR + i * (maxR - moonR) / 3) * 0.75, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    const lro = this.mission.ephemerides.bodies.find(b => b.name === 'LRO' && b.available);
    if (lro) {
      const day = lro.samples[0].jdTdb + (this.mission.config.startHourTdb + this.mission.state.time / 3600) / 24;
      const track = lro.samples.filter(p => Math.abs(p.jdTdb - day) < 65 / 1440).map(p => ({ x: cx + p.x / 1737.4 * moonR, y: cy - p.y / 1737.4 * moonR }));
      ctx.shadowColor = '#8af7df'; ctx.shadowBlur = 10; ctx.lineDashOffset = -time * 10; line(ctx, track, '#a8e9d9aa', 2, [3, 4]); ctx.lineDashOffset = 0; ctx.shadowBlur = 0;
    }
    const gradient = ctx.createRadialGradient(cx - 22, cy - 24, 5, cx, cy, moonR);
    gradient.addColorStop(0, '#e5e7d9'); gradient.addColorStop(0.5, '#b5bdb3'); gradient.addColorStop(1, '#505f5d');
    ellipse(ctx, cx, cy, moonR, moonR, gradient);
    const rng = randomGenerator(79);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, moonR, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 32; i++) { const x = cx + (rng() - 0.5) * moonR * 2, y = cy + (rng() - 0.5) * moonR * 2; ellipse(ctx, x, y, 2 + rng() * 7, 2 + rng() * 4, '#35454120'); }
    ctx.restore();
    const points=bodies.filter(b=>b.inCoverage).map(body=>{
      let x, y, radius;
      if (body.name === 'LRO') { x = cx + body.x / 1737.4 * moonR; y = cy - body.y / 1737.4 * moonR; radius = 4; }
      else {
        const log = clamp(Math.log10(body.distanceKm / 1737.4) / 5.4, 0, 1);
        const r = moonR + 55 + log * Math.max(20, maxR - moonR - 50), angle = Math.atan2(-body.y, body.x);
        x = cx + Math.cos(angle) * r; y = cy + Math.sin(angle) * r * 0.75;
        radius = body.name === 'Earth' ? 12 : body.name === 'Sun' ? 15 : 8;
      }
      boxes.push({x:x-radius-6,y:y-radius-6,width:(radius+6)*2,height:(radius+6)*2});
      return{body,x,y,radius};
    });
    ctx.font=`700 ${font}px sans-serif`;const moonWidth=ctx.measureText('ICRF XY projection').width+24,moonHeight=font*2+22;
    const moonY=cy+moonR+16;
    const moonOptions=[cx,cx-moonWidth/2-16,cx+moonWidth/2+16].map(x=>({x:clamp(x,moonWidth/2+12,this.width-moonWidth/2-12),y:moonY}));
    const moonLabel=moonOptions.find(p=>!boxes.some(b=>overlaps({x:p.x-moonWidth/2,y:p.y,width:moonWidth,height:moonHeight},b)))||moonOptions[0];
    boxes.push({x:moonLabel.x-moonWidth/2,y:moonLabel.y,width:moonWidth,height:moonHeight});
    line(ctx,[{x:cx,y:cy+moonR},{x:moonLabel.x,y:moonLabel.y}], '#c9d5e4',1);
    jobs.push({...moonLabel,title:'MOON',detail:'ICRF XY projection',color:'#c9d5e4'});
    for (const {body,x,y,radius} of points) {
      if(body.name!=='LRO')line(ctx, [{ x: cx, y: cy }, { x, y }], '#8aaca430', 1, [3, 7]);
      const colors = { Earth: '#90c7d6', Sun: '#edb76d', Mars: '#cf8361', LRO: '#a2f0cf' };
      const halo = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 3.5); halo.addColorStop(0, colors[body.name] + '55'); halo.addColorStop(1, colors[body.name] + '00'); ellipse(ctx, x, y, radius * 3.5, radius * 3.5, halo);
      ellipse(ctx, x, y, radius, radius, colors[body.name]);
      if (body.name === 'LRO') {
        ctx.strokeStyle = '#9ce6ce'; ctx.strokeRect(x - 10, y - 3, 5, 6); ctx.strokeRect(x + 5, y - 3, 5, 6);
      }
      const title=body.name.toUpperCase(),detail=`${Math.round(body.distanceKm).toLocaleString()} km`;
      ctx.font=`700 ${font}px sans-serif`;const width=Math.max(ctx.measureText(title).width,ctx.measureText(detail).width)+24,height=font*2+22;
      const preferred=body.name==='LRO'?{x:cx+moonR+width/2+22,y:cy-moonR-26}:{x,y:y+radius+12};
      const candidates=[preferred,{x,y:y-radius-height-18},{x:x+width/2+32,y:y-height/2},{x:x-width/2-32,y:y-height/2},{x,y:y+radius+30}];
      for(let row=0;row<5;row++){candidates.push({x:width/2+18,y:top+row*(height+10)});candidates.push({x:this.width-width/2-18,y:top+row*(height+10)});}
      const fit=candidates.map(p=>({x:clamp(p.x,width/2+12,this.width-width/2-12),y:clamp(p.y,top,bottom-height)}));
      const chosen=fit.find(p=>!boxes.some(b=>overlaps({x:p.x-width/2,y:p.y,width,height},b)))||fit[0];
      line(ctx,[{x,y},{x:chosen.x,y:chosen.y+height/2}],colors[body.name],1);
      boxes.push({x:chosen.x-width/2,y:chosen.y,width,height});jobs.push({...chosen,title,detail,color:colors[body.name]});
    }
    // Draw opaque captions after every marker and leader line, so no object can wash out the type.
    this.orbitLabels=jobs.map(p=>({name:p.title,...label(ctx,p.x,p.y,p.title,p.detail,p.color,font)}));
    ctx.textAlign = 'left'; ctx.fillStyle = '#c6d6e9'; ctx.font = '12px sans-serif';
    ctx.fillText('NASA / JPL · dated vectors · distances compressed', 20, this.height - 176,this.width-40);
  }
}
