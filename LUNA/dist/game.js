(()=>{function Cc(i){let e=i.objects.base,t=i.objects.relay;return[{id:"habitat",kind:"habitat",x:e.x-1.65,y:e.y-1.1,halfX:1.05,halfY:.72},{id:"airlock",kind:"airlock",x:e.x-.36,y:e.y-1.1,halfX:.3,halfY:.44},{id:"solar",kind:"solar",x:e.x-1.1,y:e.y+1.2,halfX:.8,halfY:.43},{id:"tank",kind:"tank",x:e.x-2.25,y:e.y+.5,halfX:.33,halfY:.33},{id:"lab",kind:"lab",x:e.x+1.7,y:e.y-1.1,halfX:.5,halfY:.38},{id:"relay",kind:"relay",x:t.x-.7,y:t.y-.64,halfX:.4,halfY:.4},{id:"relay-panel",kind:"solar",x:t.x-1.6,y:t.y-.7,halfX:.6,halfY:.4}].filter(s=>i.terrain.inBounds(s.x,s.y))}function ld(i,e,t){return e.radius?Math.hypot(i.x-e.x,i.y-e.y)<e.radius+t:Math.abs(i.x-e.x)<e.halfX+t&&Math.abs(i.y-e.y)<e.halfY+t}function Si(i,e,t=.16){return e.some(n=>ld(i,n,t))}function Rc(i,e,t,n=.16){let s=Math.max(1,Math.ceil(Math.hypot(e.x-i.x,e.y-i.y)/.06));for(let r=1;r<=s;r++){let a=r/s;if(Si({x:i.x+(e.x-i.x)*a,y:i.y+(e.y-i.y)*a},t,n))return!0}return!1}function Fo(i,e=0){return{id:"echo-body",kind:"rover",x:i.x,y:i.y,halfX:.46,halfY:.46,heading:e}}var Xe=(i,e,t)=>Math.max(e,Math.min(t,i)),St=(i,e)=>Math.hypot(i.x-e.x,i.y-e.y),Sr=i=>JSON.parse(JSON.stringify(i)),Bo=Math.PI/180;function wn(i){let e=i>>>0;return()=>{e+=1831565813;let t=Math.imul(e^e>>>15,1|e);return t^=t+Math.imul(t^t>>>7,61|t),((t^t>>>14)>>>0)/4294967296}}var zo=class{constructor(){this.items=[]}push(e){let t=this.items;t.push(e);let n=t.length-1;for(;n>0;){let s=n-1>>1;if(t[s].priority<=e.priority)break;t[n]=t[s],n=s}t[n]=e}pop(){let e=this.items,t=e[0],n=e.pop();if(e.length){let s=0;for(;s*2+1<e.length;){let r=s*2+1;if(r+1<e.length&&e[r+1].priority<e[r].priority&&r++,e[r].priority>=n.priority)break;e[s]=e[r],s=r}e[s]=n}return t}get size(){return this.items.length}},Ho=class{constructor(e){if(!Number.isInteger(e.width)||!Number.isInteger(e.height)||e.width<3||e.height<3||e.heights.length!==e.width*e.height||!e.heights.every(Number.isFinite)||!(e.cellMetres>0))throw new Error("The elevation data pack is invalid.");this.data=e,this.width=e.width,this.height=e.height,this.cell=e.cellMetres,this.min=Math.min(...e.heights),this.max=Math.max(...e.heights)}heightAt(e,t){e=Xe(e,0,this.width-1),t=Xe(t,0,this.height-1);let n=Math.floor(e),s=Math.floor(t),r=e-n,a=t-s,o=Math.min(n+1,this.width-1),c=Math.min(s+1,this.height-1),l=(h,u)=>this.data.heights[u*this.width+h];return l(n,s)*(1-r)*(1-a)+l(o,s)*r*(1-a)+l(n,c)*(1-r)*a+l(o,c)*r*a}inBounds(e,t){return e>=1&&t>=1&&e<=this.width-2&&t<=this.height-2}slope(e,t){let n=St(e,t)*this.cell;return n?Math.atan2(Math.abs(this.heightAt(e.x,e.y)-this.heightAt(t.x,t.y)),n)/Bo:0}canStep(e,t,n){if(!this.inBounds(t.x,t.y)||this.slope(e,t)>n||this.blocksSegment?.(e,t))return!1;let s=t.x-e.x,r=t.y-e.y;return!(Math.abs(s)>.5&&Math.abs(r)>.5&&(this.slope(e,{x:t.x,y:e.y})>n||this.slope(e,{x:e.x,y:t.y})>n))}geo(e){let t=this.data.projection,n=t.x0+e.x*this.cell,s=t.y0-e.y*this.cell,r=Math.hypot(n,s),a=-90+2*Math.atan(r/(2*t.radiusMetres))/Bo,o=(Math.atan2(n,s)/Bo+360)%360;return{lat:a,lon:o,elevation:this.heightAt(e.x,e.y),x:n,y:s}}route(e,t,n=32){let s={x:Math.round(e.x),y:Math.round(e.y)},r={x:Math.round(t.x),y:Math.round(t.y)};if(!this.inBounds(s.x,s.y)||!this.inBounds(r.x,r.y))return null;let a=g=>g.y*this.width+g.x,o=a(s),c=a(r),l=this.width*this.height,h=new Float64Array(l).fill(1/0),u=new Int32Array(l).fill(-1),f=new Uint8Array(l),p=new zo;for(h[o]=0,p.push({key:o,priority:St(s,r)});p.size;){let g=p.pop();if(f[g.key])continue;if(f[g.key]=1,g.key===c){let m=[],d=c;for(;d!==-1;)m.push({x:d%this.width,y:Math.floor(d/this.width)}),d=u[d];m.reverse(),m.length&&(m[0]={x:e.x,y:e.y});let w=0,E=0;for(let b=1;b<m.length;b++)w+=St(m[b-1],m[b])*this.cell,E=Math.max(E,this.slope(m[b-1],m[b]));return{path:m,metres:w,maxGrade:E}}let y={x:g.key%this.width,y:Math.floor(g.key/this.width)};for(let m=-1;m<=1;m++)for(let d=-1;d<=1;d++){if(!d&&!m)continue;let w={x:y.x+d,y:y.y+m};if(!this.canStep(y,w,n))continue;let E=a(w),b=this.slope(y,w),R=h[g.key]+St(y,w)*(1+.65*b/n);R<h[E]&&(h[E]=R,u[E]=g.key,p.push({key:E,priority:R+St(w,r)}))}}return null}largestComponent(e){let t=new Uint8Array(this.width*this.height),n=[];for(let s=2;s<this.height-2;s+=2)for(let r=2;r<this.width-2;r+=2){let a=s*this.width+r;if(t[a])continue;let o=[{x:r,y:s}];t[a]=1;for(let c=0;c<o.length;c++){let l=o[c];for(let h=-1;h<=1;h++)for(let u=-1;u<=1;u++){if(!u&&!h)continue;let f={x:l.x+u,y:l.y+h},p=f.y*this.width+f.x;!this.inBounds(f.x,f.y)||t[p]||!this.canStep(l,f,e)||(t[p]=1,o.push(f))}}o.length>n.length&&(n=o)}return n}},ko={outpost:{name:"HAVEN \xB7 VERTICAL DISTRIBUTION BUS",input:{index:0,side:0},output:{index:8,side:2},ports:[[0,1],[2,3],[0,2],[1,2],[0,3],[0,2],[0,1],[1,3],[2,3]]},relay:{name:"RELAY \xB7 SIGNAL BRIDGE",input:{index:3,side:3},output:{index:5,side:1},ports:[[1,2],[1,3],[2,3],[0,3],[0,2],[0,1],[0,1],[0,3],[1,3]]},rover:{name:"ECHO \xB7 MOTOR POWER ROUTE",input:{index:6,side:2},output:{index:2,side:0},ports:[[1,3],[0,2],[0,2],[1,2],[1,2],[0,3],[1,2],[0,3],[0,3]]}},Ic=["top","right","bottom","left"],Pc=["up","right","down","left"],wr=i=>["top","middle","bottom"][Math.floor(i/3)]+"-"+["left","centre","right"][i%3],Ns=class{constructor(e,t=null){let n=wn(e);this.design=ko[t]?t:Object.keys(ko)[Math.abs(Math.trunc(e)||0)%3];let s=ko[this.design];for(this.name=s.name,this.input={...s.input},this.output={...s.output},this.ports=s.ports.map(r=>[...r]),this.turns=this.ports.map(()=>Math.floor(n()*4)),this.moves=0;this.connected();)this.turns[this.input.index]=(this.turns[this.input.index]+1)%4}get instructions(){return"Power enters the "+Ic[this.input.side]+" edge of the "+wr(this.input.index)+" tile. Rotate the wires to reach the OUTPUT at the "+Ic[this.output.side]+" edge of the "+wr(this.output.index)+" tile."}hint(){return"Start at the "+wr(this.input.index)+" tile: one wire must point "+Pc[this.input.side]+" toward INPUT. Match wire ends on neighbouring tiles. Finish at the "+wr(this.output.index)+" tile with a wire pointing "+Pc[this.output.side]+" toward OUTPUT. Glowing tiles have power; you do not need to power every tile."}terminalPosition(e){let t=Math.floor(e.index/3)+2,n=e.index%3+2;return{row:e.side===0?1:e.side===2?5:t,column:e.side===3?1:e.side===1?5:n}}connections(e){return this.ports[e].map(t=>(t+this.turns[e])%4)}rotate(e){this.turns[e]=(this.turns[e]+1)%4,this.moves++}powered(){let e=new Set;if(!this.connections(this.input.index).includes(this.input.side))return e;let t=[this.input.index];e.add(this.input.index);let n=[-3,1,3,-1];for(let s=0;s<t.length;s++){let r=t[s];for(let a of this.connections(r)){let o=r%3,c=Math.floor(r/3);if(a===0&&c===0||a===1&&o===2||a===2&&c===2||a===3&&o===0)continue;let l=r+n[a];this.connections(l).includes((a+2)%4)&&!e.has(l)&&(e.add(l),t.push(l))}}return e}connected(){return this.powered().has(this.output.index)&&this.connections(this.output.index).includes(this.output.side)}},Er=class{constructor(e,t,n){this.terrain=new Ho(e),this.config=t,this.ephemerides=n,this.events=[],this.checkpoint=null,this.circuit=null,this.route=null,this.notice=null,this.placeObjects(),this.reset(),this.props=Cc(this),this.terrain.blocksSegment=(s,r)=>Rc(s,r,this.colliders(),this.state.rover.occupied?.49:.16)}placeObjects(){let e=this.terrain.largestComponent(this.config.roverMaxSlopeDegrees);if(e.length<100)throw new Error("The terrain has no suitable recovery sector.");let t=e.filter(l=>l.x>6&&l.y>6&&l.x<this.terrain.width-7&&l.y<this.terrain.height-7),n=l=>t.reduce((h,u)=>St(u,l)<St(h,l)?u:h,t[0]),s=n({x:this.terrain.width*.28,y:this.terrain.height*.65}),r=n({x:this.terrain.width*.73,y:this.terrain.height*.28}),a=this.terrain.route(s,r,this.config.roverMaxSlopeDegrees);if(!a||a.metres<300)throw new Error("Recovery mission positions are not reachable.");let o=a.path[Math.floor(a.path.length*.47)];this.objects={base:{...s,name:this.config.objectNames.base},relay:{...o,name:this.config.objectNames.relay},rover:{...r,name:this.config.objectNames.rover}};let c=[{x:.34,y:.34},{x:.59,y:.69},{x:.73,y:.48}];this.science=c.map((l,h)=>({...n({x:l.x*this.terrain.width,y:l.y*this.terrain.height}),id:h,name:["RIDGE SURVEY","ELEVATION TRANSECT","SLOPE OBSERVATION"][h]}))}reset(){let e=this.config;this.state={status:"ready",phase:"relay",time:0,distanceMetres:0,walkingMetres:0,drivingMetres:0,player:{x:this.objects.base.x+1,y:this.objects.base.y+1,heading:-Math.PI/4,jump:0,jumpVelocity:0},oxygen:e.suit.oxygenMinutes,water:e.suit.waterLitres,suitWh:e.suit.batteryWh,rover:{...this.objects.rover,repaired:!1,wh:0,occupied:!1},relayOnline:!1,scans:[],trail:[],journal:[],lastTrail:0,blocked:!1,moving:!1,sprinting:!1,repairs:0,failureReason:null},this.events=[],this.route=null,this.checkpoint=null,this.circuit=null,this.record("briefing","Recovery expedition prepared.")}start(){this.state.status==="ready"&&(this.state.status="playing",this.record("launch","Expedition started."),this.events.push({type:"started"}),this.checkpoint=Sr(this.state))}record(e,t,n={}){this.state.journal.push({time:this.state.time,type:e,message:t,...n})}notify(e,t="info"){this.events.push({type:"notice",message:e,kind:t})}pause(){this.state.status==="playing"?(this.state.status="paused",this.route=null):this.state.status==="paused"&&(this.state.status="playing")}target(){return this.state.phase==="relay"?this.objects.relay:this.state.phase==="recover"?this.state.rover:this.objects.base}maxSlope(){return this.state.rover.occupied?this.config.roverMaxSlopeDegrees:this.config.walkMaxSlopeDegrees}colliders(){return this.state.rover.occupied?this.props:[...this.props,Fo(this.state.rover)]}accessibleDestination(e){let t={x:Xe(Math.round(e.x),1,this.terrain.width-2),y:Xe(Math.round(e.y),1,this.terrain.height-2)},n=this.state.rover.occupied?.49:.16;if(!Si(t,this.colliders(),n))return t;if(![this.objects.base,this.objects.relay,this.state.rover].some(a=>St(t,a)<.2))return null;let r=[];for(let a=-2;a<=2;a++)for(let o=-2;o<=2;o++){let c={x:t.x+o,y:t.y+a};St(c,t)*this.terrain.cell<=this.config.interactionMetres&&this.terrain.inBounds(c.x,c.y)&&!Si(c,this.colliders(),n)&&r.push(c)}return r.sort((a,o)=>St(a,this.state.player)-St(o,this.state.player)),r.find(a=>this.terrain.route(this.state.player,a,this.maxSlope()))||null}navigate(e){if(this.state.status!=="playing")return!1;let t=this.accessibleDestination(e);if(!t)return this.notify("That point is occupied by equipment. Select open terrain beside it.","warning"),!1;let n=this.terrain.route(this.state.player,t,this.maxSlope());return n?(this.route={...n,index:1},!0):(this.notify("That route exceeds your equipment\u2019s slope limit. Try the ridge approach.","warning"),!1)}update(e,t={}){let n=this.state,s=this.config;if(n.status!=="playing")return;e=Math.min(e,.2);let r=e*s.timeScale;n.time+=r,t.jump&&n.player.jump===0&&(n.player.jumpVelocity=2.4),n.player.jumpVelocity-=s.physics.moonSurfaceGravityMetresPerSecondSquared*e,n.player.jump=Math.max(0,n.player.jump+n.player.jumpVelocity*e),n.player.jump||(n.player.jumpVelocity=0);let a=t.dx||0,o=t.dy||0;if((a||o)&&(this.route=null),!a&&!o&&this.route){let y=this.route.path[this.route.index];y?(a=y.x-n.player.x,o=y.y-n.player.y):this.route=null}let c=Math.hypot(a,o),l=n.rover.occupied,h=!!t.sprint&&!l,u=l?s.roverMetresPerSecond:s.walkMetresPerSecond*(h?s.sprintMultiplier:1),f=0,p=0;if(n.blocked=!1,n.moving=!1,n.sprinting=h&&c>0,c&&(!l||n.rover.wh>0)){let y=u*r/this.terrain.cell;this.route&&(y=Math.min(y,c));let m={x:n.player.x,y:n.player.y},d={x:m.x+a/c*y,y:m.y+o/c*y};this.terrain.canStep(m,d,this.maxSlope())?(p=this.terrain.slope(m,d),n.player.x=d.x,n.player.y=d.y,n.player.heading=Math.atan2(o,a),f=y*this.terrain.cell,n.distanceMetres+=f,n.moving=!0,l?(n.drivingMetres+=f,n.rover.x=d.x,n.rover.y=d.y):n.walkingMetres+=f,this.route&&y>=c-1e-4&&this.route.index++):(n.blocked=!0,this.route=null)}let g=n.moving?(h?s.suit.sprintOxygenMultiplier:1.12)*(1+p/160):1;n.oxygen=Math.max(0,n.oxygen-r/60*(l?1:g)),n.water=Math.max(0,n.water-r/3600*s.suit.waterLitresPerHour*g),n.suitWh=Math.max(0,n.suitWh-r/3600*(n.moving&&!l?s.suit.movingWatts:s.suit.idleWatts)),l&&(n.rover.wh=Math.max(0,n.rover.wh-r/3600*(n.moving?s.rover.driveWatts:s.rover.idleWatts)-f*s.rover.consumptionWhPerMetre)),(n.time-n.lastTrail>=30||!n.trail.length)&&(n.trail.push({x:n.player.x,y:n.player.y,time:n.time,mode:l?"rover":"EVA",oxygen:n.oxygen}),n.lastTrail=n.time),(n.oxygen<=0||n.suitWh<=0||n.water<=0)&&(n.status="failed",n.failureReason=n.oxygen<=0?"Oxygen reserve exhausted":n.suitWh<=0?"Suit battery exhausted":"Water reserve exhausted",this.record("abort",n.failureReason),this.events.push({type:"ended"}))}nearby(){let e=this.state,t=this.config.interactionMetres/this.terrain.cell;if(e.rover.occupied)return St(e.player,this.objects.base)<=t?{type:"dock",label:"Dock at Haven",point:this.objects.base}:{type:"exit",label:"Leave the rover",point:e.player};if(St(e.player,this.objects.relay)<=t&&!e.relayOnline)return{type:"relay",label:"Reconnect the relay",point:this.objects.relay};if(St(e.player,e.rover)<=t)return{type:e.rover.repaired?"board":"rover",label:e.rover.repaired?"Board Echo":"Repair Echo\u2019s power bus",point:e.rover};for(let n of this.science)if(!e.scans.includes(n.id)&&St(e.player,n)<=t)return{type:"scan",label:"Record terrain observation",point:n};return St(e.player,this.objects.base)<=t?{type:"base",label:"Refill your suit",point:this.objects.base}:null}interact(){if(this.state.status!=="playing")return;let e=this.nearby(),t=this.state;if(!e){this.notify("Move closer to a structure, rover, or survey marker to interact.");return}if(e.type==="relay"||e.type==="rover"){if(e.type==="rover"&&!t.relayOnline){this.notify("Restore the surface relay first. Echo needs the diagnostic uplink.","warning");return}t.status="repair",this.route=null,this.repairType=e.type,this.circuit=new Ns(this.config.seed+(e.type==="relay"?11:37),e.type),this.events.push({type:"repair"})}else if(e.type==="board")t.rover.occupied=!0,t.player.x=t.rover.x,t.player.y=t.rover.y,this.route=null,this.record("board","Boarded Echo."),this.notify("Echo online. Bring the rover home to Haven.","success");else if(e.type==="exit"){let s=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:1,y:1},{x:-1,y:-1},{x:1,y:-1},{x:-1,y:1}].map(r=>({x:t.rover.x+r.x,y:t.rover.y+r.y})).find(r=>this.terrain.inBounds(r.x,r.y)&&this.terrain.slope(t.rover,r)<=this.config.walkMaxSlopeDegrees&&!Si(r,[...this.props,Fo(t.rover)],.16));if(!s){this.notify("No clear exit here. Drive onto open terrain before leaving Echo.","warning");return}t.rover.occupied=!1,Object.assign(t.player,s),this.route=null,this.record("exit","Left Echo."),this.notify("EVA mode. Echo stays at its last position.")}else e.type==="dock"?t.relayOnline&&t.rover.repaired&&(t.status="complete",this.route=null,this.record("dock","Echo and its research returned to Haven."),this.events.push({type:"ended"})):e.type==="scan"?this.scan(e.point):e.type==="base"&&(t.oxygen=this.config.suit.oxygenMinutes,t.water=this.config.suit.waterLitres,t.suitWh=this.config.suit.batteryWh,this.record("resupply","Suit refilled at Haven."),this.notify("Suit replenished. Follow the orange mission marker."))}completeRepair(){if(this.state.status!=="repair"||!this.circuit?.connected())return!1;let e=this.state;return e.repairs++,e.status="playing",this.repairType==="relay"?(e.relayOnline=!0,e.phase="recover",this.record("relay","Surface relay restored.",{moves:this.circuit.moves}),this.checkpoint=Sr(e),this.notify("Signal restored. Echo\u2019s recovery position is now confirmed.","success")):(e.rover.repaired=!0,e.rover.wh=this.config.rover.recoveryWh,e.phase="return",this.record("repair","Echo\u2019s power bus repaired.",{moves:this.circuit.moves}),this.notify("Echo\u2019s motors are online. Board the rover and return to Haven.","success")),this.circuit=null,this.events.push({type:"repaired"}),!0}cancelRepair(){this.state.status==="repair"&&(this.state.status="playing",this.circuit=null)}scan(e){if(this.state.status!=="playing"||this.state.suitWh<this.config.suit.scanWh||this.state.scans.includes(e.id))return;this.state.scans.push(e.id),this.state.suitWh-=this.config.suit.scanWh,this.state.oxygen=Math.max(0,this.state.oxygen-this.config.suit.scanMinutes);let t=this.terrain.geo(e);this.record("science",e.name+" recorded.",{elevation:t.elevation,latitude:t.lat,longitude:t.lon}),this.notify(`Observation saved: ${Math.round(t.elevation)} m relative to the lunar reference sphere.`,"success")}scanNearby(){let e=this.nearby();e?.type==="scan"?this.scan(e.point):this.notify("Look for the cyan survey markers. Get close, then press Q to record an observation.")}replayCheckpoint(){this.checkpoint&&(this.state=Sr(this.checkpoint),this.state.status="playing",this.events=[],this.route=null,this.circuit=null,this.record("replay","Replayed the same mission from the last checkpoint."),this.events.push({type:"replayed"}))}lifeline(){let e=this.state,t=this.config,n=this.terrain.route(e.player,this.objects.base,this.maxSlope());if(!n)return{safe:!1,status:"NO ROUTE",reason:"No traversable return route for this equipment.",route:null,seconds:1/0,oxygenNeed:1/0,batteryNeed:1/0};let s=e.rover.occupied?t.roverMetresPerSecond:t.walkMetresPerSecond,r=n.metres/s,a=1+t.returnReserveFraction,o=r/60*(e.rover.occupied?1:1.12*(1+n.maxGrade/160))*a,c=r/3600*(e.rover.occupied?t.suit.idleWatts:t.suit.movingWatts)*a,l=r/3600*t.suit.waterLitresPerHour*(e.rover.occupied?1:1.12*(1+n.maxGrade/160))*a,h=e.rover.occupied?(r/3600*t.rover.driveWatts+n.metres*t.rover.consumptionWhPerMetre)*a:0,u=e.oxygen>o&&e.suitWh>c&&e.water>l&&(!e.rover.occupied||e.rover.wh>h),f=e.oxygen-o;return{route:n,seconds:r,oxygenNeed:o,batteryNeed:c,vehicleNeed:h,waterNeed:l,safe:u,margin:f,status:u?f<15?"CAUTION":"WITHIN RESERVE":"RETURN NOW",reason:`${(n.metres/1e3).toFixed(2)} km return route \xB7 ${(r/60).toFixed(0)} mission min \xB7 ${(t.returnReserveFraction*100).toFixed(0)}% reserve`}}astronomy(){if(!this.ephemerides?.bodies)return[];let e=this.config.startHourTdb+this.state.time/3600;return this.ephemerides.bodies.filter(t=>t.available).map(t=>{let n=t.samples,s=n[0].jdTdb+e/24;if(!(s>=n[0].jdTdb&&s<=n.at(-1).jdTdb))return{name:t.name,inCoverage:!1};let a=0;for(;a<n.length-2&&n[a+1].jdTdb<s;)a++;let o=n[a],c=n[a+1],l=Xe((s-o.jdTdb)/(c.jdTdb-o.jdTdb),0,1),h=o.x+(c.x-o.x)*l,u=o.y+(c.y-o.y)*l,f=o.z+(c.z-o.z)*l;return{name:t.name,x:h,y:u,z:f,distanceKm:Math.hypot(h,u,f),inCoverage:!0,frame:t.frame,timeScale:t.timeScale,samplingSeconds:t.samplingSeconds}})}debrief(){let e=this.state;return{success:e.status==="complete",timeMinutes:e.time/60,distanceKm:e.distanceMetres/1e3,walkingKm:e.walkingMetres/1e3,drivingKm:e.drivingMetres/1e3,scans:e.scans.length,oxygenPercent:e.oxygen/this.config.suit.oxygenMinutes*100,repairs:e.repairs,journal:Sr(e.journal),score:Math.round((e.status==="complete"?500:0)+e.scans.length*100+(e.status==="complete"?e.oxygen*2:0)),rank:e.status!=="complete"?"EXPEDITION REVIEW":e.scans.length===3?"SCIENCE COMMANDER":e.oxygen>50?"MISSION SPECIALIST":"LUNAR EXPLORER",failureReason:e.failureReason}}astra(e="next"){let t=e.toLowerCase(),n=this.state,s=this.config,r=this.target();if(/nasa|source|data|real|accur/.test(t))return"This terrain is an 80 \xD7 80 crop of NASA LRO/LOLA elevations, averaged from 20 m to 40 m cells. Earth, Sun, Mars and available LRO positions use dated JPL Horizons vectors. Our equipment, structures and recovery story are authored teaching assumptions. Open Data & science for the sources.";if(/orbit|planet|earth|satellite|spacecraft|sun|mars/.test(t)){let o=this.astronomy().find(c=>c.name==="Earth"&&c.inCoverage);return`Switch to Orbital view to inspect Moon-centred positions at the mission clock. ${o?`Earth is ${Math.round(o.distanceKm).toLocaleString()} km from the Moon\u2019s centre. `:""}These are interpolated ephemerides, not live telemetry. Surface positions use a separate lunar body-fixed frame.`}if(/oxygen|safe|return|reserve|lifeline/.test(t)){let o=this.lifeline();return`You have ${n.oxygen.toFixed(1)} nominal oxygen minutes left. ${o.route?`The current route to Haven needs about ${o.oxygenNeed.toFixed(1)} minutes including the return reserve. ${o.safe?"The modeled supplies cover that route.":"At least one modeled reserve is insufficient. Return or resupply before continuing."}`:o.reason} This is our game model\u2019s estimate.`}if(/rover|board|drive|vehicle/.test(t))return n.rover.repaired?`Echo has ${(n.rover.wh/s.rover.capacityWh*100).toFixed(0)}% battery. ${n.rover.occupied?"You are driving. Press E near Haven to dock, or elsewhere to dismount.":"Get close to Echo and press E to board. Vehicle routes use a stricter slope limit than walking."}`:"Restore the surface relay, then approach Echo and reconnect its power bus. Rotate the circuit tiles until power reaches the output. Echo\u2019s position is marked in orange.";if(/battery|power|energy|water/.test(t))return`Suit energy: ${n.suitWh.toFixed(0)} Wh. Water: ${n.water.toFixed(2)} L. Moving and scanning consume energy; sprinting increases modeled oxygen and water use. The repair puzzle freezes mission time while you work. These are fictional equipment settings you can inspect in Data & science.`;if(/slope|route|short|navigate|terrain/.test(t))return`Routes are calculated from the NASA elevation grid. Walking allows up to ${s.walkMaxSlopeDegrees}\xB0; Echo allows up to ${s.roverMaxSlopeDegrees}\xB0. A direct shortcut can be blocked by terrain. Click the mission marker or use Plot route for a traversable route. The return ribbon shows the route to Haven.`;if(/control|keyboard|help|jump/.test(t))return"WASD or arrows to move; Shift to sprint; Space for a lunar hop; E to interact or board; Q to record a nearby survey; M to switch maps; P to pause. You can also click the ground to navigate and use the on-screen controls.";if(/why|learn|science|scan/.test(t))return"Cyan markers let you record elevation and coordinates from the real LOLA grid. Each observation costs suit energy. Bring research home while protecting your return reserve. The debrief shows what your choices consumed.";if(n.status==="complete")return"Echo and its research are home. Review your route and resource use in the debrief, then replay the checkpoint to test another approach.";if(n.status==="failed")return"The expedition reached a resource limit. Replay the checkpoint and compare a more direct route, fewer detours, or a return to Haven for supplies.";let a=St(n.player,r)*this.terrain.cell;return n.phase==="relay"?`Your first objective is the surface relay, about ${(a/1e3).toFixed(2)} km away. Follow its orange marker. Get close and press E to reconnect the power path. Cyan surveys are optional.`:n.phase==="recover"?`The relay is online. Echo is ${(a/1e3).toFixed(2)} km from your current position. Approach the rover, press E, and reconnect its power bus. Keep an eye on the Lifeline.`:`Echo\u2019s power bus is repaired. ${n.rover.occupied?"Drive the rover to Haven and press E to dock.":"Get close to Echo and press E to board, then bring it home."} The white return ribbon leads to the outpost.`}};function Bt(i,e,t=globalThis.localStorage){try{let n=t?.getItem(i);return n==null?e:JSON.parse(n)}catch{return e}}function kt(i,e,t=globalThis.localStorage){try{return t?.setItem(i,JSON.stringify(e)),!!t}catch{return!1}}var Vo=["solar","airlock","samples","comms","logistics"],Tr=(i,e)=>Math.abs((i-e+540)%360-180);function Us(i,e){return i==="solar"?{value:6*Math.max(0,Math.cos((e.tilt-35)*Math.PI/180)*Math.cos(Tr(e.bearing,110)*Math.PI/180)),valid:Tr(e.bearing,110)<=5&&Math.abs(e.tilt-35)<=5}:i==="comms"?{value:100*Math.max(0,Math.cos(Tr(e.bearing,72)*Math.PI/180)*Math.cos((e.tilt-32)*Math.PI/180)),valid:Tr(e.bearing,72)<=5&&Math.abs(e.tilt-32)<=5}:{value:0,valid:!1}}function Lc(i){return{type:i,tilt:0,bearing:0,suitChecked:!1,innerClosed:!1,pressure:100,outerOpen:!1,collected:!1,tagged:!1,sealed:!1,stowed:!1,loaded:!1,delivered:!1}}function Dc(i,e){let t=e.complete;if(i==="solar"||i==="comms"){let n=i==="solar",s=Us(i,e);return{title:n?"Align the solar array":"Point the relay antenna",instruction:n?"Set tilt to 35\xB0 and bearing to 110\xB0. Watch the actual panel rotate and the output change. Connect when both axes are within 5\xB0.":"Point toward the authored training beacon: bearing 72\xB0, elevation 32\xB0. Watch the dish turn. Establish a link when both axes are within 5\xB0.",readout:n?s.value.toFixed(2)+" / 6 kW modeled output":s.value.toFixed(0)+"% modeled signal quality",ranges:[{key:"tilt",label:n?"Panel tilt":"Dish elevation",min:0,max:85,value:e.tilt},{key:"bearing",label:"Bearing",min:0,max:360,value:e.bearing}],action:n?"connect-solar":"connect-comms",label:t?"Equipment commissioned":n?"Connect the array":"Establish the link",enabled:s.valid&&!t}}if(i==="airlock"){let n=[["check-suit","Check suit reserves","Check that the suit can support the EVA before you isolate the chamber."],["seal-inner","Seal the inner hatch","Close the inner hatch before venting. Watch the hatch indicator and pressure column."],["vent","Depressurise the chamber","The inner hatch is sealed. Vent the chamber; its visible pressure column will fall."],["open-outer","Open the outer hatch","The chamber is vented. Open the outer hatch and step out onto the surface."]],s=e.suitChecked?e.innerClosed?e.pressure>0?2:3:1:0,r=n[s];return{title:"Practise an EVA airlock cycle",instruction:r[2],readout:e.pressure+"% chamber pressure \xB7 inner "+(e.innerClosed?"sealed":"open")+" \xB7 outer "+(e.outerOpen?"open":"sealed"),ranges:[],action:r[0],label:t?"EVA cycle complete":r[1],enabled:!t}}if(i==="samples"){let n=e.tagged?e.sealed?["stow-sample","Stow in the sample rack","Place the sealed, labelled canister into the laboratory rack."]:["seal-sample","Seal the canister","Close the visible canister lid to isolate the sample before storage."]:["tag-sample","Attach the site record","Attach the coordinates and elevation recorded where you picked up the sample. Watch its identity light turn green."],s=e.tagged&&e.site?" \xB7 "+Math.abs(e.site.lat).toFixed(4)+"\xB0 S, "+e.site.lon.toFixed(4)+"\xB0 E \xB7 "+Math.round(e.site.elevation)+" m elevation":"";return{title:"Prepare the lunar sample",instruction:n[2],readout:(e.collected?"Sample collected":"Collect the field sample first")+" \xB7 "+(e.tagged?"labelled":"unlabelled")+" \xB7 "+(e.sealed?"sealed":"open")+s,ranges:[],action:n[0],label:t?"Sample archived":n[1],enabled:e.collected&&!t}}return{title:"Load a rover supply crate",instruction:"Secure a life-support supply crate to Echo. Board the rover, deliver it at the gold field marker, then drive home and dock. The crate appears on the rover and at the delivery site.",readout:e.delivered?"Crate delivered":e.loaded?"Crate secured to Echo":"Cargo rack empty",ranges:[],action:"load-cargo",label:"Secure the supply crate",enabled:!e.loaded&&!t}}var Ar=i=>JSON.parse(JSON.stringify(i)),Nc="luna-academy-v1",Cr=class extends Er{constructor(e,t,n,s,r=null){if(super(e,t,n),!s?.levels?.length)throw Error("The training curriculum is missing.");this.academy=s,this.storage=r,this.original={objects:Ar(this.objects),science:Ar(this.science)};let a=Bt(Nc,{},r);this.completed=Array.isArray(a.completed)?a.completed.filter(o=>s.levels.some(c=>c.id===o.id)&&o.qualified===!0):[],this.unlocked=Math.min(s.levels.length-1,this.completed.reduce((o,c)=>Math.max(o,s.levels.findIndex(l=>l.id===c.id)+1),0)),this.levelIndex=Number.isInteger(a.current)&&a.current>=0&&a.current<=this.unlocked?a.current:0,this.loadLevel(this.levelIndex)}get lesson(){return this.academy.levels[this.levelIndex]}get isTraining(){return!0}get rank(){return this.completed.length?this.academy.levels[Math.max(...this.completed.map(e=>this.academy.levels.findIndex(t=>t.id===e.id)))].rank:"Junior Cadet"}get xp(){return this.completed.reduce((e,t)=>e+t.xp,0)}get courseComplete(){return this.completed.length===this.academy.levels.length}save(){kt(Nc,{current:this.levelIndex,completed:this.completed},this.storage)}reset(){if(!this.academy)return super.reset();this.loadLevel(this.levelIndex)}loadLevel(e){if(!Number.isInteger(e)||e<0||e>this.unlocked)return!1;this.levelIndex=e,this.objects=Ar(this.original.objects),this.science=Ar(this.original.science),super.reset(),this.reviewPassed=!1,this.state.training={phase:"",inspected:[],powerBus:!1,allocations:null,sealed:!1};let t=this.state,n=this.lesson.id,s=this.terrain.route(t.player,this.objects.relay,this.config.walkMaxSlopeDegrees);return this.practice={...s?.path[Math.min(5,s.path.length-1)]||this.science[0],id:0,name:"TRAINING BEACON"},n==="eva"&&(this.science=[this.practice],t.training.phase="walk",t.relayOnline=!0),n==="systems"&&(this.science=[],t.training.phase="bus",t.relayOnline=!0),n==="recovery"&&(t.training.phase="relay"),n==="science"&&(this.science=this.science.slice(0,2),t.training.phase="survey",t.relayOnline=!0,Object.assign(t.rover,{x:this.objects.base.x+2,y:this.objects.base.y,repaired:!0,wh:this.config.rover.capacityWh})),n==="shelter"&&(this.science=[],t.training.phase="shelter",t.relayOnline=!0,Object.assign(t.player,{x:this.practice.x,y:this.practice.y}),Object.assign(t.rover,{x:this.objects.base.x+2,y:this.objects.base.y,repaired:!0,wh:this.config.rover.capacityWh})),Vo.includes(n)&&(this.science=[],t.training.phase=n==="samples"?"collect":n==="logistics"?"load":"equipment",t.training.drill=Lc(n),t.relayOnline=n!=="comms",this.practice.name=n==="samples"?"FIELD SAMPLE":"FIELD SUPPLY STATION",Object.assign(t.rover,{x:this.objects.base.x+2,y:this.objects.base.y,repaired:!0,wh:this.config.rover.capacityWh})),t.phase=t.training.phase==="relay"?"relay":t.training.phase,this.state.journal=[],this.record("briefing",this.lesson.title+" prepared."),this.save(),!0}nextLevel(){return this.state.status!=="complete"||!this.completed.some(e=>e.id===this.lesson.id)||this.levelIndex>=this.academy.levels.length-1?!1:this.loadLevel(this.levelIndex+1)}target(){if(!this.academy)return super.target();let e=this.state,t=this.lesson.id;if(t==="recovery")return e.phase==="return"&&!e.rover.occupied?e.rover:super.target();if(t==="eva")return e.training.phase==="return"?this.objects.base:this.practice;if(t==="science"&&e.training.phase==="survey")return this.science.find(n=>!e.scans.includes(n.id))||this.objects.base;if(t==="comms")return this.objects.relay;if(t==="samples"&&!e.training.drill.collected)return this.practice;if(t==="logistics"){let n=e.training.drill;if(n.loaded&&!n.delivered)return e.rover.occupied?this.practice:e.rover}return this.objects.base}colliders(){let e=super.colliders();return this.academy&&this.lesson.id==="solar"?e.map(t=>t.kind==="solar"?{...t,halfX:Math.hypot(t.halfX,t.halfY),halfY:Math.hypot(t.halfX,t.halfY)}:t):e}near(e){return St(this.state.player,e)*this.terrain.cell<=this.config.interactionMetres}update(e,t={}){super.update(e,t),this.academy&&this.syncTraining()}syncTraining(){let e=this.state,t=this.lesson.id;if(e.status==="complete"){this.awardField();return}if(t==="recovery"){e.training.phase=e.phase;return}t==="eva"&&(e.training.phase=e.scans.includes(0)?"return":e.distanceMetres>=40?"scan":"walk"),t==="science"&&(e.training.phase=e.scans.length<2?"survey":e.training.inspected.length<2?"track":"return"),e.phase=e.training.phase}nearby(){if(!this.academy||this.lesson.id==="recovery")return super.nearby();let e=this.state,t=this.lesson.id;if(Vo.includes(t)){let s=e.training.drill;if(t==="samples"&&!s.collected&&this.near(this.practice))return{type:"sample",label:"Collect the field sample",point:this.practice};if(t==="logistics"&&s.loaded){if(e.rover.occupied&&s.delivered&&this.near(this.objects.base))return{type:"training-dock",label:"Dock Echo at Haven",point:this.objects.base};if(e.rover.occupied&&!s.delivered&&this.near(this.practice))return{type:"cargo-delivery",label:"Unload the supply crate",point:this.practice};if(!e.rover.occupied&&this.near(e.rover))return{type:"board",label:"Board Echo for the supply run",point:e.rover}}let r=t==="comms"?this.objects.relay:this.objects.base;return this.near(r)&&(t!=="samples"||s.collected)&&(t!=="logistics"||!s.loaded)?{type:"drill",label:t==="solar"?"Operate the solar array":t==="airlock"?"Practise the airlock cycle":t==="samples"?"Prepare the sample canister":t==="comms"?"Point the relay antenna":"Load Echo\u2019s cargo rack",point:r}:e.rover.occupied?{type:"exit",label:"Leave Echo",point:e.player}:null}if(this.near(this.objects.base)){if(t==="systems")return{type:e.training.powerBus?"allocation":"outpost",label:e.training.powerBus?"Balance outpost power":"Repair Haven\u2019s power bus",point:this.objects.base};if(t==="shelter")return{type:"shelter",label:"Enter Haven and seal the shelter",point:this.objects.base};if(e.training.phase==="return")return{type:"training-return",label:"Check in at Haven",point:this.objects.base}}let n=this.science.find(s=>!e.scans.includes(s.id)&&this.near(s));return n?{type:"scan",label:"Press Q \xB7 record terrain observation",point:n}:t==="science"&&this.near(e.rover)?{type:e.rover.occupied?"exit":"board",label:e.rover.occupied?"Leave Echo":"Board Echo for the survey",point:e.rover}:e.rover.occupied?{type:"exit",label:"Leave Echo",point:e.player}:null}interact(){if(!this.academy||this.lesson.id==="recovery"){super.interact(),this.academy&&this.syncTraining();return}if(this.state.status!=="playing")return;let e=this.nearby(),t=this.state;if(!e){this.notify("Follow your next-action card. Use Go to objective to reach the marked destination.");return}if(e.type==="outpost"){this.repairType="outpost",t.status="repair",this.route=null,this.circuit=new Ns(this.config.seed+88,"outpost"),this.events.push({type:"repair"});return}if(e.type==="allocation"||e.type==="shelter"){this.route=null,this.events.push({type:"systems",emergency:e.type==="shelter"});return}if(e.type==="drill"){this.route=null,this.events.push({type:"drill"});return}if(e.type==="sample"){t.training.drill.collected=!0,t.training.drill.site=this.terrain.geo(this.practice),t.training.phase="return",this.record("sample","Collected the field sample.",t.training.drill.site),this.notify("Sample collected. Return to Haven\u2019s laboratory to label, seal and stow it.","success"),this.syncTraining();return}if(e.type==="cargo-delivery"){t.training.drill.delivered=!0,t.training.phase="return",this.record("delivery","Supply crate unloaded at the field station."),this.notify("Crate delivered. Drive Echo back to Haven and press E to dock.","success"),this.syncTraining();return}if(e.type==="training-dock"){t.training.drill.complete=!0,this.finishTraining();return}if(e.type==="training-return"){this.finishTraining();return}if(e.type==="board"&&["science","logistics"].includes(this.lesson.id)){t.rover.occupied=!0,t.player.x=t.rover.x,t.player.y=t.rover.y,this.route=null,this.record("board","Boarded Echo."),this.notify(this.lesson.id==="logistics"?"Cargo secured. Drive to the gold field supply marker and press E to unload.":"Echo ready for the survey. Follow the cyan sites and press Q to record each observation.","success");return}super.interact(),this.syncTraining()}completeRepair(){if(this.lesson.id!=="systems")return super.completeRepair();if(this.state.status!=="repair"||!this.circuit?.connected())return!1;let e=this.state;return e.training.powerBus=!0,e.training.phase="allocation",e.phase="allocation",e.repairs++,e.status="playing",this.circuit=null,this.record("power-bus","Haven power bus restored."),this.events.push({type:"repaired"}),this.notify("Power circuit repaired. Press E again to balance Haven\u2019s systems.","success"),!0}scan(e){super.scan(e),this.academy&&this.syncTraining()}inspect(e){if(this.lesson.id!=="science"||!["playing","paused"].includes(this.state.status)||!["Earth","LRO"].includes(e))return!1;let t=this.astronomy().find(n=>n.name===e&&n.inCoverage);return t?(this.state.training.inspected.includes(e)||(this.state.training.inspected.push(e),this.record("tracking",e+" inspected from dated JPL samples.",{distanceKm:t.distanceKm})),this.syncTraining(),!0):!1}powerPlan(e,t=!1){let n=this.lesson.id==="shelter",s=this.academy.power,r=n?s.emergencySupplyKw:s.normalSupplyKw,a={life:s.lifeSupportMinimumKw,food:n?s.greenhouseEmergencyMinimumKw:s.greenhouseNormalMinimumKw,comms:n?s.communicationsEmergencyMinimumKw:s.communicationsNormalMinimumKw},o=["life","food","comms"].every(u=>Number.isFinite(e[u])&&e[u]>=0&&e[u]<=r),c=e.life+e.food+e.comms,l=r-c,h=o&&Object.keys(a).every(u=>e[u]>=a[u]);return{supply:r,demands:a,total:c,reserve:l,covered:h,valid:o&&h&&l>=s.reserveMinimumKw&&(!n||t),emergency:n,sealed:t,coverage:{life:Math.min(1,e.life/a.life),food:Math.min(1,e.food/a.food),comms:Math.min(1,e.comms/a.comms)}}}applyPower(e,t=!1){if(!["systems","shelter"].includes(this.lesson.id)||!["playing","paused"].includes(this.state.status)||!this.near(this.objects.base)||this.lesson.id==="systems"&&!this.state.training.powerBus)return!1;let n=this.powerPlan(e,t);return n.valid?(this.state.training.allocations={...e},this.state.training.sealed=t,this.state.training.power=n,this.record("power-allocation","Essential systems powered within the available supply.",{...e,reserveKw:n.reserve,sealed:t}),this.finishTraining(),!0):!1}drillView(){return this.state.training.drill?Dc(this.lesson.id,this.state.training.drill):null}atEquipment(){return this.near(this.lesson.id==="comms"?this.objects.relay:this.objects.base)}adjustDrill(e,t){return!["playing","paused"].includes(this.state.status)||!this.atEquipment()||!["solar","comms"].includes(this.lesson.id)||!["tilt","bearing"].includes(e)||!Number.isFinite(t)||t<0||t>(e==="tilt"?85:360)?!1:(this.state.training.drill[e]=t,!0)}performDrill(e){let t=this.state,n=t.training.drill,s=this.lesson.id;if(!n||!["playing","paused"].includes(t.status)||!this.atEquipment()||n.complete)return!1;let r=!1;if(e==="connect-solar"&&s==="solar"&&Us(s,n).valid)r=!0;else if(e==="connect-comms"&&s==="comms"&&Us(s,n).valid)t.relayOnline=!0,r=!0;else if(s==="airlock")if(e==="check-suit"&&!n.suitChecked&&t.oxygen>this.config.suit.oxygenMinutes*.2&&t.suitWh>this.config.suit.batteryWh*.2)n.suitChecked=!0;else if(e==="seal-inner"&&n.suitChecked&&!n.innerClosed)n.innerClosed=!0,t.training.inside=!0;else if(e==="vent"&&n.innerClosed&&n.pressure>0)n.pressure=0;else if(e==="open-outer"&&n.innerClosed&&n.pressure===0)n.outerOpen=!0,t.training.inside=!1,r=!0;else return!1;else if(s==="samples"&&n.collected)if(e==="tag-sample"&&!n.tagged)n.tagged=!0;else if(e==="seal-sample"&&n.tagged&&!n.sealed)n.sealed=!0;else if(e==="stow-sample"&&n.tagged&&n.sealed)n.stowed=!0,r=!0;else return!1;else if(e==="load-cargo"&&s==="logistics"&&!n.loaded)n.loaded=!0,t.training.phase="deliver";else return!1;return this.record("equipment-action",e.replaceAll("-"," ")+" completed."),r?(n.complete=!0,this.finishTraining()):this.syncTraining(),!0}awardField(){this.state.status!=="complete"||this.completed.some(e=>e.id===this.lesson.id)||(this.completed.push({id:this.lesson.id,qualified:!0,fieldComplete:!0,reviewPassed:!1,xp:this.academy.rewards.stageCompletionXp,timeMinutes:this.state.time/60,oxygenPercent:this.state.oxygen/this.config.suit.oxygenMinutes*100}),this.unlocked=Math.min(this.academy.levels.length-1,Math.max(this.unlocked,this.levelIndex+1)),this.save())}finishTraining(){let e=this.state;e.status!=="complete"&&(e.status="complete",this.route=null,e.training.phase="complete",this.record("training-complete",this.lesson.skill+" demonstrated."),this.awardField(),this.events.push({type:"ended"}))}qualify(e){if(this.state.status!=="complete")return{correct:!1,message:"Complete the field tasks first."};if(Number(e)!==this.lesson.correct)return{correct:!1,message:this.lesson.explanation+" Try the question again."};this.reviewPassed=!0,this.awardField();let t=this.completed.find(n=>n.id===this.lesson.id);return t.reviewPassed=!0,t.xp=this.academy.rewards.stageCompletionXp+this.academy.rewards.correctReviewXp,this.save(),{correct:!0,message:this.lesson.explanation+" Bonus earned: "+this.academy.rewards.correctReviewXp+" XP."}}objectiveIndex(){let e=this.state,t=this.lesson.id,n=e.training.drill;return e.status==="complete"?this.lesson.steps.length:t==="recovery"?["relay","recover","return"].indexOf(e.phase):t==="eva"?["walk","scan","return"].indexOf(e.training.phase):t==="systems"?e.training.powerBus?1:0:t==="science"?["survey","track","return"].indexOf(e.training.phase):t==="samples"?n.collected?this.near(this.objects.base)?2:1:0:t==="logistics"?n.loaded?n.delivered?2:1:0:t==="airlock"?n.suitChecked?n.pressure>0?1:2:0:["solar","comms"].includes(t)?this.atEquipment()?Us(t,n).valid?2:1:0:this.near(this.objects.base)?1:0}nextAction(){let e=this.state,t=this.nearby(),n=this.lesson.id;if(e.status==="ready")return{title:"Start your lesson",text:this.lesson.brief,action:"Start level "+(this.levelIndex+1),command:"start"};if(e.status==="complete")return{title:"Level complete \xB7 badge earned",text:this.levelIndex<this.academy.levels.length-1?"Your practical task unlocked the next level. Continue when you are ready.":"You completed the full training course. Review your badges and replay any lesson.",action:this.levelIndex<this.academy.levels.length-1?"Continue to level "+(this.levelIndex+2):"View training record",command:"advance"};if(e.status==="failed")return{title:"Try a safer approach",text:"Replay the checkpoint and check the Lifeline before taking a detour.",action:"Review attempt",command:"review"};if(e.status==="repair")return{title:"Reconnect the circuit",text:this.circuit.instructions+" Then apply the repair.",action:"Show a repair hint",command:"hint"};if(n==="science"&&e.training.phase==="track")return{title:"Inspect Earth and LRO",text:"Open the orbital tracker, then select Inspect Earth and Inspect LRO. These are dated positions, not destinations you can walk to.",action:"Open orbital tracker",command:"orbit"};if(t?.type==="scan"&&(n!=="eva"||e.training.phase==="scan"))return{title:"Record the observation",text:"You reached the cyan beacon. Press Q or Scan now to read elevation and coordinates from the NASA terrain.",action:"Scan now \xB7 Q",command:"scan"};if(t&&["relay","rover","board","dock","outpost","allocation","shelter","training-return","sample","drill","cargo-delivery","training-dock"].includes(t.type))return{title:t.label,text:t.type==="board"?"Press E to board the repaired rover.":t.type==="shelter"?"Enter the shelter, seal it and meet the emergency power demands.":t.type==="drill"?"Open the equipment controls. Watch the instructor demonstration, then practise with the live 3D equipment.":"Press E or use the action button below. The lesson advances after the action succeeds.",action:t.label+" \xB7 E",command:"interact"};let s=this.target().name||"Haven";return{title:n==="eva"&&e.training.phase==="walk"?"Walk toward the training beacon":"Reach "+s,text:"Drag to look around. Show objective points out your destination; Astronaut view (F) looks through your helmet. Use WASD to move or Go to objective to follow a route. Gold marks the destination; cyan marks surveys.",action:"Go to objective",command:"route"}}debrief(){let e=super.debrief();return this.academy?{...e,rank:this.lesson.rank,lesson:this.lesson,badge:this.lesson.badge,learning:this.lesson.explanation,score:this.academy.rewards.stageCompletionXp+(this.reviewPassed?this.academy.rewards.correctReviewXp:0)}:e}astra(e="next"){return/nasa|source|data|real|accur|orbit|planet|earth|satellite|sun|mars|oxygen|safe|reserve|lifeline|slope/.test(e.toLowerCase())?super.astra(e):this.nextAction().title+". "+this.nextAction().text+" Learning goal: "+this.lesson.skill+"."}};/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */var rh=0,wl=1,ah=2;var El=1,va=2,In=3,Wn=0,Yt=1,Kt=2,jn=0,Ri=1,Tl=2,Al=3,Cl=4,oh=5,di=100,lh=101,ch=102,hh=103,uh=104,dh=200,fh=201,ph=202,mh=203,Jr=204,Kr=205,gh=206,yh=207,xh=208,vh=209,_h=210,Mh=211,bh=212,Sh=213,wh=214,_a=0,Ma=1,ba=2,Ii=3,Sa=4,wa=5,Ea=6,Ta=7,Rl=0,Eh=1,Th=2,Qn=0,Ah=1,Ch=2,Rh=3,Aa=4,Ih=5,Ph=6,Lh=7;var Il=300,Fi=301,Oi=302,Ca=303,Ra=304,or=306,fi=1e3,ui=1001,jr=1002,un=1003,Dh=1004;var lr=1005;var yn=1006,Ia=1007;var yi=1008;var _n=1009,Pl=1010,Ll=1011,xs=1012,Pa=1013,xi=1014,Pn=1015,vs=1016,La=1017,Da=1018,_s=1020,Dl=35902,Nl=35899,Ul=1021,Fl=1022,dn=1023,as=1026,Ms=1027,Ol=1028,Na=1029,Bl=1030,Ua=1031;var Fa=1033,cr=33776,hr=33777,ur=33778,dr=33779,Oa=35840,Ba=35841,ka=35842,za=35843,Ha=36196,Va=37492,Ga=37496,Wa=37808,Xa=37809,qa=37810,Ya=37811,Za=37812,$a=37813,Ja=37814,Ka=37815,ja=37816,Qa=37817,eo=37818,to=37819,no=37820,io=37821,so=36492,ro=36494,ao=36495,oo=36283,lo=36284,co=36285,ho=36286;var Vs=2300,Qr=2301,$r=2302,pl=2400,ml=2401,gl=2402;var Nh=3200,Uh=3201;var kl=0,Fh=1,ei="",Lt="srgb",Pi="srgb-linear",Gs="linear",it="srgb";var Ci=7680;var yl=519,Oh=512,Bh=513,kh=514,zl=515,zh=516,Hh=517,Vh=518,Gh=519,xl=35044;var Hl="300 es",gn=2e3,Ws=2001;var Xn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},zt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Go=Math.PI/180,ea=180/Math.PI;function fr(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(zt[i&255]+zt[i>>8&255]+zt[i>>16&255]+zt[i>>24&255]+"-"+zt[e&255]+zt[e>>8&255]+"-"+zt[e>>16&15|64]+zt[e>>24&255]+"-"+zt[t&63|128]+zt[t>>8&255]+"-"+zt[t>>16&255]+zt[t>>24&255]+zt[n&255]+zt[n>>8&255]+zt[n>>16&255]+zt[n>>24&255]).toLowerCase()}function Ye(i,e,t){return Math.max(e,Math.min(t,i))}function cd(i,e){return(i%e+e)%e}function Wo(i,e,t){return(1-t)*i+t*e}function Fs(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function $t(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Ge=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ye(this.x,e.x,t.x),this.y=Ye(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ye(this.x,e,t),this.y=Ye(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ye(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ye(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},qn=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let c=n[s+0],l=n[s+1],h=n[s+2],u=n[s+3],f=r[a+0],p=r[a+1],g=r[a+2],y=r[a+3];if(o===0){e[t+0]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u;return}if(o===1){e[t+0]=f,e[t+1]=p,e[t+2]=g,e[t+3]=y;return}if(u!==y||c!==f||l!==p||h!==g){let m=1-o,d=c*f+l*p+h*g+u*y,w=d>=0?1:-1,E=1-d*d;if(E>Number.EPSILON){let R=Math.sqrt(E),C=Math.atan2(R,d*w);m=Math.sin(m*C)/R,o=Math.sin(o*C)/R}let b=o*w;if(c=c*m+f*b,l=l*m+p*b,h=h*m+g*b,u=u*m+y*b,m===1-o){let R=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=R,l*=R,h*=R,u*=R}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],c=n[s+1],l=n[s+2],h=n[s+3],u=r[a],f=r[a+1],p=r[a+2],g=r[a+3];return e[t]=o*g+h*u+c*p-l*f,e[t+1]=c*g+h*f+l*u-o*p,e[t+2]=l*g+h*p+o*f-c*u,e[t+3]=h*g-o*u-c*f-l*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(s/2),u=o(r/2),f=c(n/2),p=c(s/2),g=c(r/2);switch(a){case"XYZ":this._x=f*h*u+l*p*g,this._y=l*p*u-f*h*g,this._z=l*h*g+f*p*u,this._w=l*h*u-f*p*g;break;case"YXZ":this._x=f*h*u+l*p*g,this._y=l*p*u-f*h*g,this._z=l*h*g-f*p*u,this._w=l*h*u+f*p*g;break;case"ZXY":this._x=f*h*u-l*p*g,this._y=l*p*u+f*h*g,this._z=l*h*g+f*p*u,this._w=l*h*u-f*p*g;break;case"ZYX":this._x=f*h*u-l*p*g,this._y=l*p*u+f*h*g,this._z=l*h*g-f*p*u,this._w=l*h*u+f*p*g;break;case"YZX":this._x=f*h*u+l*p*g,this._y=l*p*u+f*h*g,this._z=l*h*g-f*p*u,this._w=l*h*u-f*p*g;break;case"XZY":this._x=f*h*u-l*p*g,this._y=l*p*u-f*h*g,this._z=l*h*g+f*p*u,this._w=l*h*u+f*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],c=t[9],l=t[2],h=t[6],u=t[10],f=n+o+u;if(f>0){let p=.5/Math.sqrt(f+1);this._w=.25/p,this._x=(h-c)*p,this._y=(r-l)*p,this._z=(a-s)*p}else if(n>o&&n>u){let p=2*Math.sqrt(1+n-o-u);this._w=(h-c)/p,this._x=.25*p,this._y=(s+a)/p,this._z=(r+l)/p}else if(o>u){let p=2*Math.sqrt(1+o-n-u);this._w=(r-l)/p,this._x=(s+a)/p,this._y=.25*p,this._z=(c+h)/p}else{let p=2*Math.sqrt(1+u-n-o);this._w=(a-s)/p,this._x=(r+l)/p,this._y=(c+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ye(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+a*o+s*l-r*c,this._y=s*h+a*c+r*o-n*l,this._z=r*h+a*l+n*c-s*o,this._w=a*h-n*o-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,a=this._w,o=a*e._w+n*e._x+s*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;let c=1-o*o;if(c<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*n+t*this._x,this._y=p*s+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}let l=Math.sqrt(c),h=Math.atan2(l,o),u=Math.sin((1-t)*h)/l,f=Math.sin(t*h)/l;return this._w=a*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},N=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Uc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Uc.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,c=e.w,l=2*(a*s-o*n),h=2*(o*t-r*s),u=2*(r*n-a*t);return this.x=t+c*l+a*u-o*h,this.y=n+c*h+o*l-r*u,this.z=s+c*u+r*h-a*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ye(this.x,e.x,t.x),this.y=Ye(this.y,e.y,t.y),this.z=Ye(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ye(this.x,e,t),this.y=Ye(this.y,e,t),this.z=Ye(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ye(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,c=t.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Xo.copy(this).projectOnVector(e),this.sub(Xo)}reflect(e){return this.sub(Xo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ye(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Xo=new N,Uc=new qn,Fe=class i{constructor(e,t,n,s,r,a,o,c,l){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,l)}set(e,t,n,s,r,a,o,c,l){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=c,h[6]=n,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],h=n[4],u=n[7],f=n[2],p=n[5],g=n[8],y=s[0],m=s[3],d=s[6],w=s[1],E=s[4],b=s[7],R=s[2],C=s[5],T=s[8];return r[0]=a*y+o*w+c*R,r[3]=a*m+o*E+c*C,r[6]=a*d+o*b+c*T,r[1]=l*y+h*w+u*R,r[4]=l*m+h*E+u*C,r[7]=l*d+h*b+u*T,r[2]=f*y+p*w+g*R,r[5]=f*m+p*E+g*C,r[8]=f*d+p*b+g*T,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8];return t*a*h-t*o*l-n*r*h+n*o*c+s*r*l-s*a*c}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],u=h*a-o*l,f=o*c-h*r,p=l*r-a*c,g=t*u+n*f+s*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/g;return e[0]=u*y,e[1]=(s*l-h*n)*y,e[2]=(o*n-s*a)*y,e[3]=f*y,e[4]=(h*t-s*c)*y,e[5]=(s*r-o*t)*y,e[6]=p*y,e[7]=(n*c-l*t)*y,e[8]=(a*t-n*r)*y,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+e,-s*l,s*c,-s*(-l*a+c*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(qo.makeScale(e,t)),this}rotate(e){return this.premultiply(qo.makeRotation(-e)),this}translate(e,t){return this.premultiply(qo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},qo=new Fe;function Vl(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Xs(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Wh(){let i=Xs("canvas");return i.style.display="block",i}var Fc={};function os(i){i in Fc||(Fc[i]=!0,console.warn(i))}function Xh(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var Oc=new Fe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Bc=new Fe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function hd(){let i={enabled:!0,workingColorSpace:Pi,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===it&&(s.r=Gn(s.r),s.g=Gn(s.g),s.b=Gn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===it&&(s.r=rs(s.r),s.g=rs(s.g),s.b=rs(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===ei?Gs:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return os("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return os("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Pi]:{primaries:e,whitePoint:n,transfer:Gs,toXYZ:Oc,fromXYZ:Bc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Lt},outputColorSpaceConfig:{drawingBufferColorSpace:Lt}},[Lt]:{primaries:e,whitePoint:n,transfer:it,toXYZ:Oc,fromXYZ:Bc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Lt}}}),i}var $e=hd();function Gn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function rs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Yi,ta=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Yi===void 0&&(Yi=Xs("canvas")),Yi.width=e.width,Yi.height=e.height;let s=Yi.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=Yi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Xs("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Gn(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Gn(t[n]/255)*255):t[n]=Gn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},ud=0,ls=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:ud++}),this.uuid=fr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Yo(s[a].image)):r.push(Yo(s[a]))}else r=Yo(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function Yo(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ta.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var dd=0,Zo=new N,Jt=class i extends Xn{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=ui,s=ui,r=yn,a=yi,o=dn,c=_n,l=i.DEFAULT_ANISOTROPY,h=ei){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:dd++}),this.uuid=fr(),this.name="",this.source=new ls(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new Ge(0,0),this.repeat=new Ge(1,1),this.center=new Ge(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Fe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Zo).x}get height(){return this.source.getSize(Zo).y}get depth(){return this.source.getSize(Zo).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Il)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case fi:e.x=e.x-Math.floor(e.x);break;case ui:e.x=e.x<0?0:1;break;case jr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case fi:e.y=e.y-Math.floor(e.y);break;case ui:e.y=e.y<0?0:1;break;case jr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Jt.DEFAULT_IMAGE=null;Jt.DEFAULT_MAPPING=Il;Jt.DEFAULT_ANISOTROPY=1;var nt=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,c=e.elements,l=c[0],h=c[4],u=c[8],f=c[1],p=c[5],g=c[9],y=c[2],m=c[6],d=c[10];if(Math.abs(h-f)<.01&&Math.abs(u-y)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+y)<.1&&Math.abs(g+m)<.1&&Math.abs(l+p+d-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let E=(l+1)/2,b=(p+1)/2,R=(d+1)/2,C=(h+f)/4,T=(u+y)/4,I=(g+m)/4;return E>b&&E>R?E<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(E),s=C/n,r=T/n):b>R?b<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),n=C/s,r=I/s):R<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(R),n=T/r,s=I/r),this.set(n,s,r,t),this}let w=Math.sqrt((m-g)*(m-g)+(u-y)*(u-y)+(f-h)*(f-h));return Math.abs(w)<.001&&(w=1),this.x=(m-g)/w,this.y=(u-y)/w,this.z=(f-h)/w,this.w=Math.acos((l+p+d-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ye(this.x,e.x,t.x),this.y=Ye(this.y,e.y,t.y),this.z=Ye(this.z,e.z,t.z),this.w=Ye(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ye(this.x,e,t),this.y=Ye(this.y,e,t),this.z=Ye(this.z,e,t),this.w=Ye(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ye(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},na=class extends Xn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:yn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new nt(0,0,e,t),this.scissorTest=!1,this.viewport=new nt(0,0,e,t);let s={width:e,height:t,depth:n.depth},r=new Jt(s);this.textures=[];let a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){let t={minFilter:yn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isArrayTexture=this.textures[s].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new ls(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Tn=class extends na{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},qs=class extends Jt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=un,this.minFilter=un,this.wrapR=ui,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var ia=class extends Jt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=un,this.minFilter=un,this.wrapR=ui,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var An=class{constructor(e=new N(1/0,1/0,1/0),t=new N(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(fn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(fn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=fn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,fn):fn.fromBufferAttribute(r,a),fn.applyMatrix4(e.matrixWorld),this.expandByPoint(fn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Rr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Rr.copy(n.boundingBox)),Rr.applyMatrix4(e.matrixWorld),this.union(Rr)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,fn),fn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Os),Ir.subVectors(this.max,Os),Zi.subVectors(e.a,Os),$i.subVectors(e.b,Os),Ji.subVectors(e.c,Os),si.subVectors($i,Zi),ri.subVectors(Ji,$i),wi.subVectors(Zi,Ji);let t=[0,-si.z,si.y,0,-ri.z,ri.y,0,-wi.z,wi.y,si.z,0,-si.x,ri.z,0,-ri.x,wi.z,0,-wi.x,-si.y,si.x,0,-ri.y,ri.x,0,-wi.y,wi.x,0];return!$o(t,Zi,$i,Ji,Ir)||(t=[1,0,0,0,1,0,0,0,1],!$o(t,Zi,$i,Ji,Ir))?!1:(Pr.crossVectors(si,ri),t=[Pr.x,Pr.y,Pr.z],$o(t,Zi,$i,Ji,Ir))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,fn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(fn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Bn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Bn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Bn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Bn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Bn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Bn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Bn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Bn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Bn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Bn=[new N,new N,new N,new N,new N,new N,new N,new N],fn=new N,Rr=new An,Zi=new N,$i=new N,Ji=new N,si=new N,ri=new N,wi=new N,Os=new N,Ir=new N,Pr=new N,Ei=new N;function $o(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Ei.fromArray(i,r);let o=s.x*Math.abs(Ei.x)+s.y*Math.abs(Ei.y)+s.z*Math.abs(Ei.z),c=e.dot(Ei),l=t.dot(Ei),h=n.dot(Ei);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}var fd=new An,Bs=new N,Jo=new N,Li=class{constructor(e=new N,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):fd.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Bs.subVectors(e,this.center);let t=Bs.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Bs,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Jo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Bs.copy(e.center).add(Jo)),this.expandByPoint(Bs.copy(e.center).sub(Jo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},kn=new N,Ko=new N,Lr=new N,ai=new N,jo=new N,Dr=new N,Qo=new N,cs=class{constructor(e=new N,t=new N(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,kn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=kn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(kn.copy(this.origin).addScaledVector(this.direction,t),kn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Ko.copy(e).add(t).multiplyScalar(.5),Lr.copy(t).sub(e).normalize(),ai.copy(this.origin).sub(Ko);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Lr),o=ai.dot(this.direction),c=-ai.dot(Lr),l=ai.lengthSq(),h=Math.abs(1-a*a),u,f,p,g;if(h>0)if(u=a*c-o,f=a*o-c,g=r*h,u>=0)if(f>=-g)if(f<=g){let y=1/h;u*=y,f*=y,p=u*(u+a*f+2*o)+f*(a*u+f+2*c)+l}else f=r,u=Math.max(0,-(a*f+o)),p=-u*u+f*(f+2*c)+l;else f=-r,u=Math.max(0,-(a*f+o)),p=-u*u+f*(f+2*c)+l;else f<=-g?(u=Math.max(0,-(-a*r+o)),f=u>0?-r:Math.min(Math.max(-r,-c),r),p=-u*u+f*(f+2*c)+l):f<=g?(u=0,f=Math.min(Math.max(-r,-c),r),p=f*(f+2*c)+l):(u=Math.max(0,-(a*r+o)),f=u>0?r:Math.min(Math.max(-r,-c),r),p=-u*u+f*(f+2*c)+l);else f=a>0?-r:r,u=Math.max(0,-(a*f+o)),p=-u*u+f*(f+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Ko).addScaledVector(Lr,f),p}intersectSphere(e,t){kn.subVectors(e.center,this.origin);let n=kn.dot(this.direction),s=kn.dot(kn)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,c,l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return l>=0?(n=(e.min.x-f.x)*l,s=(e.max.x-f.x)*l):(n=(e.max.x-f.x)*l,s=(e.min.x-f.x)*l),h>=0?(r=(e.min.y-f.y)*h,a=(e.max.y-f.y)*h):(r=(e.max.y-f.y)*h,a=(e.min.y-f.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(e.min.z-f.z)*u,c=(e.max.z-f.z)*u):(o=(e.max.z-f.z)*u,c=(e.min.z-f.z)*u),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,kn)!==null}intersectTriangle(e,t,n,s,r){jo.subVectors(t,e),Dr.subVectors(n,e),Qo.crossVectors(jo,Dr);let a=this.direction.dot(Qo),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;ai.subVectors(this.origin,e);let c=o*this.direction.dot(Dr.crossVectors(ai,Dr));if(c<0)return null;let l=o*this.direction.dot(jo.cross(ai));if(l<0||c+l>a)return null;let h=-o*ai.dot(Qo);return h<0?null:this.at(h/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},xt=class i{constructor(e,t,n,s,r,a,o,c,l,h,u,f,p,g,y,m){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,l,h,u,f,p,g,y,m)}set(e,t,n,s,r,a,o,c,l,h,u,f,p,g,y,m){let d=this.elements;return d[0]=e,d[4]=t,d[8]=n,d[12]=s,d[1]=r,d[5]=a,d[9]=o,d[13]=c,d[2]=l,d[6]=h,d[10]=u,d[14]=f,d[3]=p,d[7]=g,d[11]=y,d[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/Ki.setFromMatrixColumn(e,0).length(),r=1/Ki.setFromMatrixColumn(e,1).length(),a=1/Ki.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let f=a*h,p=a*u,g=o*h,y=o*u;t[0]=c*h,t[4]=-c*u,t[8]=l,t[1]=p+g*l,t[5]=f-y*l,t[9]=-o*c,t[2]=y-f*l,t[6]=g+p*l,t[10]=a*c}else if(e.order==="YXZ"){let f=c*h,p=c*u,g=l*h,y=l*u;t[0]=f+y*o,t[4]=g*o-p,t[8]=a*l,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=p*o-g,t[6]=y+f*o,t[10]=a*c}else if(e.order==="ZXY"){let f=c*h,p=c*u,g=l*h,y=l*u;t[0]=f-y*o,t[4]=-a*u,t[8]=g+p*o,t[1]=p+g*o,t[5]=a*h,t[9]=y-f*o,t[2]=-a*l,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){let f=a*h,p=a*u,g=o*h,y=o*u;t[0]=c*h,t[4]=g*l-p,t[8]=f*l+y,t[1]=c*u,t[5]=y*l+f,t[9]=p*l-g,t[2]=-l,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){let f=a*c,p=a*l,g=o*c,y=o*l;t[0]=c*h,t[4]=y-f*u,t[8]=g*u+p,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-l*h,t[6]=p*u+g,t[10]=f-y*u}else if(e.order==="XZY"){let f=a*c,p=a*l,g=o*c,y=o*l;t[0]=c*h,t[4]=-u,t[8]=l*h,t[1]=f*u+y,t[5]=a*h,t[9]=p*u-g,t[2]=g*u-p,t[6]=o*h,t[10]=y*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(pd,e,md)}lookAt(e,t,n){let s=this.elements;return nn.subVectors(e,t),nn.lengthSq()===0&&(nn.z=1),nn.normalize(),oi.crossVectors(n,nn),oi.lengthSq()===0&&(Math.abs(n.z)===1?nn.x+=1e-4:nn.z+=1e-4,nn.normalize(),oi.crossVectors(n,nn)),oi.normalize(),Nr.crossVectors(nn,oi),s[0]=oi.x,s[4]=Nr.x,s[8]=nn.x,s[1]=oi.y,s[5]=Nr.y,s[9]=nn.y,s[2]=oi.z,s[6]=Nr.z,s[10]=nn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],h=n[1],u=n[5],f=n[9],p=n[13],g=n[2],y=n[6],m=n[10],d=n[14],w=n[3],E=n[7],b=n[11],R=n[15],C=s[0],T=s[4],I=s[8],M=s[12],_=s[1],L=s[5],O=s[9],z=s[13],X=s[2],q=s[6],G=s[10],se=s[14],W=s[3],oe=s[7],he=s[11],fe=s[15];return r[0]=a*C+o*_+c*X+l*W,r[4]=a*T+o*L+c*q+l*oe,r[8]=a*I+o*O+c*G+l*he,r[12]=a*M+o*z+c*se+l*fe,r[1]=h*C+u*_+f*X+p*W,r[5]=h*T+u*L+f*q+p*oe,r[9]=h*I+u*O+f*G+p*he,r[13]=h*M+u*z+f*se+p*fe,r[2]=g*C+y*_+m*X+d*W,r[6]=g*T+y*L+m*q+d*oe,r[10]=g*I+y*O+m*G+d*he,r[14]=g*M+y*z+m*se+d*fe,r[3]=w*C+E*_+b*X+R*W,r[7]=w*T+E*L+b*q+R*oe,r[11]=w*I+E*O+b*G+R*he,r[15]=w*M+E*z+b*se+R*fe,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],c=e[9],l=e[13],h=e[2],u=e[6],f=e[10],p=e[14],g=e[3],y=e[7],m=e[11],d=e[15];return g*(+r*c*u-s*l*u-r*o*f+n*l*f+s*o*p-n*c*p)+y*(+t*c*p-t*l*f+r*a*f-s*a*p+s*l*h-r*c*h)+m*(+t*l*u-t*o*p-r*a*u+n*a*p+r*o*h-n*l*h)+d*(-s*o*h-t*c*u+t*o*f+s*a*u-n*a*f+n*c*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],u=e[9],f=e[10],p=e[11],g=e[12],y=e[13],m=e[14],d=e[15],w=u*m*l-y*f*l+y*c*p-o*m*p-u*c*d+o*f*d,E=g*f*l-h*m*l-g*c*p+a*m*p+h*c*d-a*f*d,b=h*y*l-g*u*l+g*o*p-a*y*p-h*o*d+a*u*d,R=g*u*c-h*y*c-g*o*f+a*y*f+h*o*m-a*u*m,C=t*w+n*E+s*b+r*R;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/C;return e[0]=w*T,e[1]=(y*f*r-u*m*r-y*s*p+n*m*p+u*s*d-n*f*d)*T,e[2]=(o*m*r-y*c*r+y*s*l-n*m*l-o*s*d+n*c*d)*T,e[3]=(u*c*r-o*f*r-u*s*l+n*f*l+o*s*p-n*c*p)*T,e[4]=E*T,e[5]=(h*m*r-g*f*r+g*s*p-t*m*p-h*s*d+t*f*d)*T,e[6]=(g*c*r-a*m*r-g*s*l+t*m*l+a*s*d-t*c*d)*T,e[7]=(a*f*r-h*c*r+h*s*l-t*f*l-a*s*p+t*c*p)*T,e[8]=b*T,e[9]=(g*u*r-h*y*r-g*n*p+t*y*p+h*n*d-t*u*d)*T,e[10]=(a*y*r-g*o*r+g*n*l-t*y*l-a*n*d+t*o*d)*T,e[11]=(h*o*r-a*u*r-h*n*l+t*u*l+a*n*p-t*o*p)*T,e[12]=R*T,e[13]=(h*y*s-g*u*s+g*n*f-t*y*f-h*n*m+t*u*m)*T,e[14]=(g*o*s-a*y*s-g*n*c+t*y*c+a*n*m-t*o*m)*T,e[15]=(a*u*s-h*o*s+h*n*c-t*u*c-a*n*f+t*o*f)*T,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,c=e.z,l=r*a,h=r*o;return this.set(l*a+n,l*o-s*c,l*c+s*o,0,l*o+s*c,h*o+n,h*c-s*a,0,l*c-s*o,h*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,c=t._w,l=r+r,h=a+a,u=o+o,f=r*l,p=r*h,g=r*u,y=a*h,m=a*u,d=o*u,w=c*l,E=c*h,b=c*u,R=n.x,C=n.y,T=n.z;return s[0]=(1-(y+d))*R,s[1]=(p+b)*R,s[2]=(g-E)*R,s[3]=0,s[4]=(p-b)*C,s[5]=(1-(f+d))*C,s[6]=(m+w)*C,s[7]=0,s[8]=(g+E)*T,s[9]=(m-w)*T,s[10]=(1-(f+y))*T,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=Ki.set(s[0],s[1],s[2]).length(),a=Ki.set(s[4],s[5],s[6]).length(),o=Ki.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],pn.copy(this);let l=1/r,h=1/a,u=1/o;return pn.elements[0]*=l,pn.elements[1]*=l,pn.elements[2]*=l,pn.elements[4]*=h,pn.elements[5]*=h,pn.elements[6]*=h,pn.elements[8]*=u,pn.elements[9]*=u,pn.elements[10]*=u,t.setFromRotationMatrix(pn),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,s,r,a,o=gn,c=!1){let l=this.elements,h=2*r/(t-e),u=2*r/(n-s),f=(t+e)/(t-e),p=(n+s)/(n-s),g,y;if(c)g=r/(a-r),y=a*r/(a-r);else if(o===gn)g=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===Ws)g=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=u,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=gn,c=!1){let l=this.elements,h=2/(t-e),u=2/(n-s),f=-(t+e)/(t-e),p=-(n+s)/(n-s),g,y;if(c)g=1/(a-r),y=a/(a-r);else if(o===gn)g=-2/(a-r),y=-(a+r)/(a-r);else if(o===Ws)g=-1/(a-r),y=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=0,l[12]=f,l[1]=0,l[5]=u,l[9]=0,l[13]=p,l[2]=0,l[6]=0,l[10]=g,l[14]=y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Ki=new N,pn=new xt,pd=new N(0,0,0),md=new N(1,1,1),oi=new N,Nr=new N,nn=new N,kc=new xt,zc=new qn,xn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],h=s[9],u=s[2],f=s[6],p=s[10];switch(t){case"XYZ":this._y=Math.asin(Ye(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Ye(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ye(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Ye(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,p),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Ye(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Ye(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return kc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(kc,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return zc.setFromEuler(this),this.setFromQuaternion(zc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};xn.DEFAULT_ORDER="XYZ";var hs=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},gd=0,Hc=new N,ji=new qn,zn=new xt,Ur=new N,ks=new N,yd=new N,xd=new qn,Vc=new N(1,0,0),Gc=new N(0,1,0),Wc=new N(0,0,1),Xc={type:"added"},vd={type:"removed"},Qi={type:"childadded",child:null},el={type:"childremoved",child:null},Nt=class i extends Xn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:gd++}),this.uuid=fr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new N,t=new xn,n=new qn,s=new N(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new xt},normalMatrix:{value:new Fe}}),this.matrix=new xt,this.matrixWorld=new xt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new hs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ji.setFromAxisAngle(e,t),this.quaternion.multiply(ji),this}rotateOnWorldAxis(e,t){return ji.setFromAxisAngle(e,t),this.quaternion.premultiply(ji),this}rotateX(e){return this.rotateOnAxis(Vc,e)}rotateY(e){return this.rotateOnAxis(Gc,e)}rotateZ(e){return this.rotateOnAxis(Wc,e)}translateOnAxis(e,t){return Hc.copy(e).applyQuaternion(this.quaternion),this.position.add(Hc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Vc,e)}translateY(e){return this.translateOnAxis(Gc,e)}translateZ(e){return this.translateOnAxis(Wc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(zn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ur.copy(e):Ur.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),ks.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?zn.lookAt(ks,Ur,this.up):zn.lookAt(Ur,ks,this.up),this.quaternion.setFromRotationMatrix(zn),s&&(zn.extractRotation(s.matrixWorld),ji.setFromRotationMatrix(zn),this.quaternion.premultiply(ji.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Xc),Qi.child=e,this.dispatchEvent(Qi),Qi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(vd),el.child=e,this.dispatchEvent(el),el.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),zn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),zn.multiply(e.parent.matrixWorld)),e.applyMatrix4(zn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Xc),Qi.child=e,this.dispatchEvent(Qi),Qi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ks,e,yd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ks,xd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let u=c[l];r(e.shapes,u)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(e.materials,this.material[c]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let c=this.animations[o];s.animations.push(r(e.animations,c))}}if(t){let o=a(e.geometries),c=a(e.materials),l=a(e.textures),h=a(e.images),u=a(e.shapes),f=a(e.skeletons),p=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let c=[];for(let l in o){let h=o[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};Nt.DEFAULT_UP=new N(0,1,0);Nt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Nt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var mn=new N,Hn=new N,tl=new N,Vn=new N,es=new N,ts=new N,qc=new N,nl=new N,il=new N,sl=new N,rl=new nt,al=new nt,ol=new nt,hi=class i{constructor(e=new N,t=new N,n=new N){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),mn.subVectors(e,t),s.cross(mn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){mn.subVectors(s,t),Hn.subVectors(n,t),tl.subVectors(e,t);let a=mn.dot(mn),o=mn.dot(Hn),c=mn.dot(tl),l=Hn.dot(Hn),h=Hn.dot(tl),u=a*l-o*o;if(u===0)return r.set(0,0,0),null;let f=1/u,p=(l*c-o*h)*f,g=(a*h-o*c)*f;return r.set(1-p-g,g,p)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Vn)===null?!1:Vn.x>=0&&Vn.y>=0&&Vn.x+Vn.y<=1}static getInterpolation(e,t,n,s,r,a,o,c){return this.getBarycoord(e,t,n,s,Vn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Vn.x),c.addScaledVector(a,Vn.y),c.addScaledVector(o,Vn.z),c)}static getInterpolatedAttribute(e,t,n,s,r,a){return rl.setScalar(0),al.setScalar(0),ol.setScalar(0),rl.fromBufferAttribute(e,t),al.fromBufferAttribute(e,n),ol.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(rl,r.x),a.addScaledVector(al,r.y),a.addScaledVector(ol,r.z),a}static isFrontFacing(e,t,n,s){return mn.subVectors(n,t),Hn.subVectors(e,t),mn.cross(Hn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return mn.subVectors(this.c,this.b),Hn.subVectors(this.a,this.b),mn.cross(Hn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;es.subVectors(s,n),ts.subVectors(r,n),nl.subVectors(e,n);let c=es.dot(nl),l=ts.dot(nl);if(c<=0&&l<=0)return t.copy(n);il.subVectors(e,s);let h=es.dot(il),u=ts.dot(il);if(h>=0&&u<=h)return t.copy(s);let f=c*u-h*l;if(f<=0&&c>=0&&h<=0)return a=c/(c-h),t.copy(n).addScaledVector(es,a);sl.subVectors(e,r);let p=es.dot(sl),g=ts.dot(sl);if(g>=0&&p<=g)return t.copy(r);let y=p*l-c*g;if(y<=0&&l>=0&&g<=0)return o=l/(l-g),t.copy(n).addScaledVector(ts,o);let m=h*g-p*u;if(m<=0&&u-h>=0&&p-g>=0)return qc.subVectors(r,s),o=(u-h)/(u-h+(p-g)),t.copy(s).addScaledVector(qc,o);let d=1/(m+y+f);return a=y*d,o=f*d,t.copy(n).addScaledVector(es,a).addScaledVector(ts,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},qh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},li={h:0,s:0,l:0},Fr={h:0,s:0,l:0};function ll(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var ke=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Lt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,$e.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=$e.workingColorSpace){return this.r=e,this.g=t,this.b=n,$e.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=$e.workingColorSpace){if(e=cd(e,1),t=Ye(t,0,1),n=Ye(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=ll(a,r,e+1/3),this.g=ll(a,r,e),this.b=ll(a,r,e-1/3)}return $e.colorSpaceToWorking(this,s),this}setStyle(e,t=Lt){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Lt){let n=qh[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Gn(e.r),this.g=Gn(e.g),this.b=Gn(e.b),this}copyLinearToSRGB(e){return this.r=rs(e.r),this.g=rs(e.g),this.b=rs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Lt){return $e.workingToColorSpace(Ht.copy(this),e),Math.round(Ye(Ht.r*255,0,255))*65536+Math.round(Ye(Ht.g*255,0,255))*256+Math.round(Ye(Ht.b*255,0,255))}getHexString(e=Lt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=$e.workingColorSpace){$e.workingToColorSpace(Ht.copy(this),t);let n=Ht.r,s=Ht.g,r=Ht.b,a=Math.max(n,s,r),o=Math.min(n,s,r),c,l,h=(o+a)/2;if(o===a)c=0,l=0;else{let u=a-o;switch(l=h<=.5?u/(a+o):u/(2-a-o),a){case n:c=(s-r)/u+(s<r?6:0);break;case s:c=(r-n)/u+2;break;case r:c=(n-s)/u+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=$e.workingColorSpace){return $e.workingToColorSpace(Ht.copy(this),t),e.r=Ht.r,e.g=Ht.g,e.b=Ht.b,e}getStyle(e=Lt){$e.workingToColorSpace(Ht.copy(this),e);let t=Ht.r,n=Ht.g,s=Ht.b;return e!==Lt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(li),this.setHSL(li.h+e,li.s+t,li.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(li),e.getHSL(Fr);let n=Wo(li.h,Fr.h,t),s=Wo(li.s,Fr.s,t),r=Wo(li.l,Fr.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ht=new ke;ke.NAMES=qh;var _d=0,Yn=class extends Xn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:_d++}),this.uuid=fr(),this.name="",this.type="Material",this.blending=Ri,this.side=Wn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Jr,this.blendDst=Kr,this.blendEquation=di,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ke(0,0,0),this.blendAlpha=0,this.depthFunc=Ii,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=yl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ci,this.stencilZFail=Ci,this.stencilZPass=Ci,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ri&&(n.blending=this.blending),this.side!==Wn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Jr&&(n.blendSrc=this.blendSrc),this.blendDst!==Kr&&(n.blendDst=this.blendDst),this.blendEquation!==di&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ii&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==yl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ci&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ci&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ci&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let c=r[o];delete c.metadata,a.push(c)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Cn=class extends Yn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ke(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new xn,this.combine=Rl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Et=new N,Or=new Ge,Md=0,Vt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Md++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=xl,this.updateRanges=[],this.gpuType=Pn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Or.fromBufferAttribute(this,t),Or.applyMatrix3(e),this.setXY(t,Or.x,Or.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix3(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix4(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyNormalMatrix(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.transformDirection(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Fs(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=$t(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Fs(t,this.array)),t}setX(e,t){return this.normalized&&(t=$t(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Fs(t,this.array)),t}setY(e,t){return this.normalized&&(t=$t(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Fs(t,this.array)),t}setZ(e,t){return this.normalized&&(t=$t(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Fs(t,this.array)),t}setW(e,t){return this.normalized&&(t=$t(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=$t(t,this.array),n=$t(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=$t(t,this.array),n=$t(n,this.array),s=$t(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=$t(t,this.array),n=$t(n,this.array),s=$t(s,this.array),r=$t(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==xl&&(e.usage=this.usage),e}};var Ys=class extends Vt{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Zs=class extends Vt{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var lt=class extends Vt{constructor(e,t,n){super(new Float32Array(e),t,n)}},bd=0,hn=new xt,cl=new Nt,ns=new N,sn=new An,zs=new An,Pt=new N,Ut=class i extends Xn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:bd++}),this.uuid=fr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Vl(e)?Zs:Ys)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Fe().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return hn.makeRotationFromQuaternion(e),this.applyMatrix4(hn),this}rotateX(e){return hn.makeRotationX(e),this.applyMatrix4(hn),this}rotateY(e){return hn.makeRotationY(e),this.applyMatrix4(hn),this}rotateZ(e){return hn.makeRotationZ(e),this.applyMatrix4(hn),this}translate(e,t,n){return hn.makeTranslation(e,t,n),this.applyMatrix4(hn),this}scale(e,t,n){return hn.makeScale(e,t,n),this.applyMatrix4(hn),this}lookAt(e){return cl.lookAt(e),cl.updateMatrix(),this.applyMatrix4(cl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ns).negate(),this.translate(ns.x,ns.y,ns.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new lt(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new An);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new N(-1/0,-1/0,-1/0),new N(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];sn.setFromBufferAttribute(r),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,sn.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,sn.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(sn.min),this.boundingBox.expandByPoint(sn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Li);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new N,1/0);return}if(e){let n=this.boundingSphere.center;if(sn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];zs.setFromBufferAttribute(o),this.morphTargetsRelative?(Pt.addVectors(sn.min,zs.min),sn.expandByPoint(Pt),Pt.addVectors(sn.max,zs.max),sn.expandByPoint(Pt)):(sn.expandByPoint(zs.min),sn.expandByPoint(zs.max))}sn.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Pt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Pt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)Pt.fromBufferAttribute(o,l),c&&(ns.fromBufferAttribute(e,l),Pt.add(ns)),s=Math.max(s,n.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Vt(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],c=[];for(let I=0;I<n.count;I++)o[I]=new N,c[I]=new N;let l=new N,h=new N,u=new N,f=new Ge,p=new Ge,g=new Ge,y=new N,m=new N;function d(I,M,_){l.fromBufferAttribute(n,I),h.fromBufferAttribute(n,M),u.fromBufferAttribute(n,_),f.fromBufferAttribute(r,I),p.fromBufferAttribute(r,M),g.fromBufferAttribute(r,_),h.sub(l),u.sub(l),p.sub(f),g.sub(f);let L=1/(p.x*g.y-g.x*p.y);isFinite(L)&&(y.copy(h).multiplyScalar(g.y).addScaledVector(u,-p.y).multiplyScalar(L),m.copy(u).multiplyScalar(p.x).addScaledVector(h,-g.x).multiplyScalar(L),o[I].add(y),o[M].add(y),o[_].add(y),c[I].add(m),c[M].add(m),c[_].add(m))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let I=0,M=w.length;I<M;++I){let _=w[I],L=_.start,O=_.count;for(let z=L,X=L+O;z<X;z+=3)d(e.getX(z+0),e.getX(z+1),e.getX(z+2))}let E=new N,b=new N,R=new N,C=new N;function T(I){R.fromBufferAttribute(s,I),C.copy(R);let M=o[I];E.copy(M),E.sub(R.multiplyScalar(R.dot(M))).normalize(),b.crossVectors(C,M);let L=b.dot(c[I])<0?-1:1;a.setXYZW(I,E.x,E.y,E.z,L)}for(let I=0,M=w.length;I<M;++I){let _=w[I],L=_.start,O=_.count;for(let z=L,X=L+O;z<X;z+=3)T(e.getX(z+0)),T(e.getX(z+1)),T(e.getX(z+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Vt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,p=n.count;f<p;f++)n.setXYZ(f,0,0,0);let s=new N,r=new N,a=new N,o=new N,c=new N,l=new N,h=new N,u=new N;if(e)for(let f=0,p=e.count;f<p;f+=3){let g=e.getX(f+0),y=e.getX(f+1),m=e.getX(f+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,y),a.fromBufferAttribute(t,m),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),o.fromBufferAttribute(n,g),c.fromBufferAttribute(n,y),l.fromBufferAttribute(n,m),o.add(h),c.add(h),l.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(y,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let f=0,p=t.count;f<p;f+=3)s.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),a.fromBufferAttribute(t,f+2),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(o,c){let l=o.array,h=o.itemSize,u=o.normalized,f=new l.constructor(c.length*h),p=0,g=0;for(let y=0,m=c.length;y<m;y++){o.isInterleavedBufferAttribute?p=c[y]*o.data.stride+o.offset:p=c[y]*h;for(let d=0;d<h;d++)f[g++]=l[p++]}return new Vt(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let c=s[o],l=e(c,n);t.setAttribute(o,l)}let r=this.morphAttributes;for(let o in r){let c=[],l=r[o];for(let h=0,u=l.length;h<u;h++){let f=l[h],p=e(f,n);c.push(p)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,c=a.length;o<c;o++){let l=a[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let c in n){let l=n[c];e.data.attributes[c]=l.toJSON(e.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let u=0,f=l.length;u<f;u++){let p=l[u];h.push(p.toJSON(e.data))}h.length>0&&(s[c]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let l in s){let h=s[l];this.setAttribute(l,h.clone(t))}let r=e.morphAttributes;for(let l in r){let h=[],u=r[l];for(let f=0,p=u.length;f<p;f++)h.push(u[f].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let l=0,h=a.length;l<h;l++){let u=a[l];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Yc=new xt,Ti=new cs,Br=new Li,Zc=new N,kr=new N,zr=new N,Hr=new N,hl=new N,Vr=new N,$c=new N,Gr=new N,At=class extends Nt{constructor(e=new Ut,t=new Cn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){Vr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=o[c],u=r[c];h!==0&&(hl.fromBufferAttribute(u,e),a?Vr.addScaledVector(hl,h):Vr.addScaledVector(hl.sub(t),h))}t.add(Vr)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Br.copy(n.boundingSphere),Br.applyMatrix4(r),Ti.copy(e.ray).recast(e.near),!(Br.containsPoint(Ti.origin)===!1&&(Ti.intersectSphere(Br,Zc)===null||Ti.origin.distanceToSquared(Zc)>(e.far-e.near)**2))&&(Yc.copy(r).invert(),Ti.copy(e.ray).applyMatrix4(Yc),!(n.boundingBox!==null&&Ti.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Ti)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,y=f.length;g<y;g++){let m=f[g],d=a[m.materialIndex],w=Math.max(m.start,p.start),E=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let b=w,R=E;b<R;b+=3){let C=o.getX(b),T=o.getX(b+1),I=o.getX(b+2);s=Wr(this,d,e,n,l,h,u,C,T,I),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,p.start),y=Math.min(o.count,p.start+p.count);for(let m=g,d=y;m<d;m+=3){let w=o.getX(m),E=o.getX(m+1),b=o.getX(m+2);s=Wr(this,a,e,n,l,h,u,w,E,b),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,y=f.length;g<y;g++){let m=f[g],d=a[m.materialIndex],w=Math.max(m.start,p.start),E=Math.min(c.count,Math.min(m.start+m.count,p.start+p.count));for(let b=w,R=E;b<R;b+=3){let C=b,T=b+1,I=b+2;s=Wr(this,d,e,n,l,h,u,C,T,I),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,p.start),y=Math.min(c.count,p.start+p.count);for(let m=g,d=y;m<d;m+=3){let w=m,E=m+1,b=m+2;s=Wr(this,a,e,n,l,h,u,w,E,b),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function Sd(i,e,t,n,s,r,a,o){let c;if(e.side===Yt?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,e.side===Wn,o),c===null)return null;Gr.copy(o),Gr.applyMatrix4(i.matrixWorld);let l=t.ray.origin.distanceTo(Gr);return l<t.near||l>t.far?null:{distance:l,point:Gr.clone(),object:i}}function Wr(i,e,t,n,s,r,a,o,c,l){i.getVertexPosition(o,kr),i.getVertexPosition(c,zr),i.getVertexPosition(l,Hr);let h=Sd(i,e,t,n,kr,zr,Hr,$c);if(h){let u=new N;hi.getBarycoord($c,kr,zr,Hr,u),s&&(h.uv=hi.getInterpolatedAttribute(s,o,c,l,u,new Ge)),r&&(h.uv1=hi.getInterpolatedAttribute(r,o,c,l,u,new Ge)),a&&(h.normal=hi.getInterpolatedAttribute(a,o,c,l,u,new N),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a:o,b:c,c:l,normal:new N,materialIndex:0};hi.getNormal(kr,zr,Hr,f.normal),h.face=f,h.barycoord=u}return h}var rn=class i extends Ut{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let c=[],l=[],h=[],u=[],f=0,p=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,s,a,2),g("x","z","y",1,-1,e,n,-t,s,a,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new lt(l,3)),this.setAttribute("normal",new lt(h,3)),this.setAttribute("uv",new lt(u,2));function g(y,m,d,w,E,b,R,C,T,I,M){let _=b/T,L=R/I,O=b/2,z=R/2,X=C/2,q=T+1,G=I+1,se=0,W=0,oe=new N;for(let he=0;he<G;he++){let fe=he*L-z;for(let He=0;He<q;He++){let ct=He*_-O;oe[y]=ct*w,oe[m]=fe*E,oe[d]=X,l.push(oe.x,oe.y,oe.z),oe[y]=0,oe[m]=0,oe[d]=C>0?1:-1,h.push(oe.x,oe.y,oe.z),u.push(He/T),u.push(1-he/I),se+=1}}for(let he=0;he<I;he++)for(let fe=0;fe<T;fe++){let He=f+fe+q*he,ct=f+fe+q*(he+1),mt=f+(fe+1)+q*(he+1),Qe=f+(fe+1)+q*he;c.push(He,ct,Qe),c.push(ct,mt,Qe),W+=6}o.addGroup(p,W,M),p+=W,f+=se}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Bi(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function Gt(i){let e={};for(let t=0;t<i.length;t++){let n=Bi(i[t]);for(let s in n)e[s]=n[s]}return e}function wd(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Gl(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:$e.workingColorSpace}var Yh={clone:Bi,merge:Gt},Ed=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Td=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,vn=class extends Yn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ed,this.fragmentShader=Td,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Bi(e.uniforms),this.uniformsGroups=wd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},$s=class extends Nt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new xt,this.projectionMatrix=new xt,this.projectionMatrixInverse=new xt,this.coordinateSystem=gn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ci=new N,Jc=new Ge,Kc=new Ge,Dt=class extends $s{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ea*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Go*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ea*2*Math.atan(Math.tan(Go*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ci.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ci.x,ci.y).multiplyScalar(-e/ci.z),ci.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ci.x,ci.y).multiplyScalar(-e/ci.z)}getViewSize(e,t){return this.getViewBounds(e,Jc,Kc),t.subVectors(Kc,Jc)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Go*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,t-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},is=-90,ss=1,sa=class extends Nt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Dt(is,ss,e,t);s.layers=this.layers,this.add(s);let r=new Dt(is,ss,e,t);r.layers=this.layers,this.add(r);let a=new Dt(is,ss,e,t);a.layers=this.layers,this.add(a);let o=new Dt(is,ss,e,t);o.layers=this.layers,this.add(o);let c=new Dt(is,ss,e,t);c.layers=this.layers,this.add(c);let l=new Dt(is,ss,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,c]=t;for(let l of t)this.remove(l);if(e===gn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Ws)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,c,l,h]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let y=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,a),e.setRenderTarget(n,2,s),e.render(t,o),e.setRenderTarget(n,3,s),e.render(t,c),e.setRenderTarget(n,4,s),e.render(t,l),n.texture.generateMipmaps=y,e.setRenderTarget(n,5,s),e.render(t,h),e.setRenderTarget(u,f,p),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Js=class extends Jt{constructor(e=[],t=Fi,n,s,r,a,o,c,l,h){super(e,t,n,s,r,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ra=class extends Tn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Js(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new rn(5,5,5),r=new vn({name:"CubemapFromEquirect",uniforms:Bi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Yt,blending:jn});r.uniforms.tEquirect.value=t;let a=new At(s,r),o=t.minFilter;return t.minFilter===yi&&(t.minFilter=yn),new sa(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}},Ve=class extends Nt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Ad={type:"move"},us=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ve,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ve,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new N,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new N),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ve,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new N,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new N),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){a=!0;for(let y of e.hand.values()){let m=t.getJointPose(y,n),d=this._getHandJoint(l,y);m!==null&&(d.matrix.fromArray(m.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=m.radius),d.visible=m!==null}let h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],f=h.position.distanceTo(u.position),p=.02,g=.005;l.inputState.pinching&&f>p+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&f<=p-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Ad)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Ve;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}};var ds=class extends Nt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new xn,this.environmentIntensity=1,this.environmentRotation=new xn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var ul=new N,Cd=new N,Rd=new Fe,En=class{constructor(e=new N(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=ul.subVectors(n,t).cross(Cd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(ul),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Rd.getNormalMatrix(e),s=this.coplanarPoint(ul).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ai=new Li,Id=new Ge(.5,.5),Xr=new N,fs=class{constructor(e=new En,t=new En,n=new En,s=new En,r=new En,a=new En){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=gn,n=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],c=r[2],l=r[3],h=r[4],u=r[5],f=r[6],p=r[7],g=r[8],y=r[9],m=r[10],d=r[11],w=r[12],E=r[13],b=r[14],R=r[15];if(s[0].setComponents(l-a,p-h,d-g,R-w).normalize(),s[1].setComponents(l+a,p+h,d+g,R+w).normalize(),s[2].setComponents(l+o,p+u,d+y,R+E).normalize(),s[3].setComponents(l-o,p-u,d-y,R-E).normalize(),n)s[4].setComponents(c,f,m,b).normalize(),s[5].setComponents(l-c,p-f,d-m,R-b).normalize();else if(s[4].setComponents(l-c,p-f,d-m,R-b).normalize(),t===gn)s[5].setComponents(l+c,p+f,d+m,R+b).normalize();else if(t===Ws)s[5].setComponents(c,f,m,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ai.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ai.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ai)}intersectsSprite(e){Ai.center.set(0,0,0);let t=Id.distanceTo(e.center);return Ai.radius=.7071067811865476+t,Ai.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ai)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Xr.x=s.normal.x>0?e.max.x:e.min.x,Xr.y=s.normal.y>0?e.max.y:e.min.y,Xr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Xr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ps=class extends Yn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ke(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},jc=new xt,vl=new cs,qr=new Li,Yr=new N,Ks=class extends Nt{constructor(e=new Ut,t=new ps){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),qr.copy(n.boundingSphere),qr.applyMatrix4(s),qr.radius+=r,e.ray.intersectsSphere(qr)===!1)return;jc.copy(s).invert(),vl.copy(e.ray).applyMatrix4(jc);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=n.index,u=n.attributes.position;if(l!==null){let f=Math.max(0,a.start),p=Math.min(l.count,a.start+a.count);for(let g=f,y=p;g<y;g++){let m=l.getX(g);Yr.fromBufferAttribute(u,m),Qc(Yr,m,c,s,e,t,this)}}else{let f=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let g=f,y=p;g<y;g++)Yr.fromBufferAttribute(u,g),Qc(Yr,g,c,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Qc(i,e,t,n,s,r,a){let o=vl.distanceSqToPoint(i);if(o<t){let c=new N;vl.closestPointToPoint(i,c),c.applyMatrix4(n);let l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var Zn=class extends Jt{constructor(e,t,n,s,r,a,o,c,l){super(e,t,n,s,r,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}},js=class extends Jt{constructor(e,t,n=xi,s,r,a,o=un,c=un,l,h=as,u=1){if(h!==as&&h!==Ms)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:u};super(f,s,r,a,o,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ls(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Qs=class extends Jt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},er=class i extends Ut{constructor(e=1,t=1,n=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:n,radialSegments:s,heightSegments:r},t=Math.max(0,t),n=Math.max(1,Math.floor(n)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));let a=[],o=[],c=[],l=[],h=t/2,u=Math.PI/2*e,f=t,p=2*u+f,g=n*2+r,y=s+1,m=new N,d=new N;for(let w=0;w<=g;w++){let E=0,b=0,R=0,C=0;if(w<=n){let M=w/n,_=M*Math.PI/2;b=-h-e*Math.cos(_),R=e*Math.sin(_),C=-e*Math.cos(_),E=M*u}else if(w<=n+r){let M=(w-n)/r;b=-h+M*t,R=e,C=0,E=u+M*f}else{let M=(w-n-r)/n,_=M*Math.PI/2;b=h+e*Math.sin(_),R=e*Math.cos(_),C=e*Math.sin(_),E=u+f+M*u}let T=Math.max(0,Math.min(1,E/p)),I=0;w===0?I=.5/s:w===g&&(I=-.5/s);for(let M=0;M<=s;M++){let _=M/s,L=_*Math.PI*2,O=Math.sin(L),z=Math.cos(L);d.x=-R*z,d.y=b,d.z=R*O,o.push(d.x,d.y,d.z),m.set(-R*z,C,R*O),m.normalize(),c.push(m.x,m.y,m.z),l.push(_+I,T)}if(w>0){let M=(w-1)*y;for(let _=0;_<s;_++){let L=M+_,O=M+_+1,z=w*y+_,X=w*y+_+1;a.push(L,O,z),a.push(O,X,z)}}}this.setIndex(a),this.setAttribute("position",new lt(o,3)),this.setAttribute("normal",new lt(c,3)),this.setAttribute("uv",new lt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}};var Rn=class i extends Ut{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:c};let l=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],f=[],p=[],g=0,y=[],m=n/2,d=0;w(),a===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(h),this.setAttribute("position",new lt(u,3)),this.setAttribute("normal",new lt(f,3)),this.setAttribute("uv",new lt(p,2));function w(){let b=new N,R=new N,C=0,T=(t-e)/n;for(let I=0;I<=r;I++){let M=[],_=I/r,L=_*(t-e)+e;for(let O=0;O<=s;O++){let z=O/s,X=z*c+o,q=Math.sin(X),G=Math.cos(X);R.x=L*q,R.y=-_*n+m,R.z=L*G,u.push(R.x,R.y,R.z),b.set(q,T,G).normalize(),f.push(b.x,b.y,b.z),p.push(z,1-_),M.push(g++)}y.push(M)}for(let I=0;I<s;I++)for(let M=0;M<r;M++){let _=y[M][I],L=y[M+1][I],O=y[M+1][I+1],z=y[M][I+1];(e>0||M!==0)&&(h.push(_,L,z),C+=3),(t>0||M!==r-1)&&(h.push(L,O,z),C+=3)}l.addGroup(d,C,0),d+=C}function E(b){let R=g,C=new Ge,T=new N,I=0,M=b===!0?e:t,_=b===!0?1:-1;for(let O=1;O<=s;O++)u.push(0,m*_,0),f.push(0,_,0),p.push(.5,.5),g++;let L=g;for(let O=0;O<=s;O++){let X=O/s*c+o,q=Math.cos(X),G=Math.sin(X);T.x=M*G,T.y=m*_,T.z=M*q,u.push(T.x,T.y,T.z),f.push(0,_,0),C.x=q*.5+.5,C.y=G*.5*_+.5,p.push(C.x,C.y),g++}for(let O=0;O<s;O++){let z=R+O,X=L+O;b===!0?h.push(X,X+1,z):h.push(X+1,X,z),I+=3}l.addGroup(d,I,b===!0?1:2),d+=I}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},tr=class i extends Rn{constructor(e=1,t=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},nr=class i extends Ut{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],a=[];o(s),l(n),h(),this.setAttribute("position",new lt(r,3)),this.setAttribute("normal",new lt(r.slice(),3)),this.setAttribute("uv",new lt(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(w){let E=new N,b=new N,R=new N;for(let C=0;C<t.length;C+=3)p(t[C+0],E),p(t[C+1],b),p(t[C+2],R),c(E,b,R,w)}function c(w,E,b,R){let C=R+1,T=[];for(let I=0;I<=C;I++){T[I]=[];let M=w.clone().lerp(b,I/C),_=E.clone().lerp(b,I/C),L=C-I;for(let O=0;O<=L;O++)O===0&&I===C?T[I][O]=M:T[I][O]=M.clone().lerp(_,O/L)}for(let I=0;I<C;I++)for(let M=0;M<2*(C-I)-1;M++){let _=Math.floor(M/2);M%2===0?(f(T[I][_+1]),f(T[I+1][_]),f(T[I][_])):(f(T[I][_+1]),f(T[I+1][_+1]),f(T[I+1][_]))}}function l(w){let E=new N;for(let b=0;b<r.length;b+=3)E.x=r[b+0],E.y=r[b+1],E.z=r[b+2],E.normalize().multiplyScalar(w),r[b+0]=E.x,r[b+1]=E.y,r[b+2]=E.z}function h(){let w=new N;for(let E=0;E<r.length;E+=3){w.x=r[E+0],w.y=r[E+1],w.z=r[E+2];let b=m(w)/2/Math.PI+.5,R=d(w)/Math.PI+.5;a.push(b,1-R)}g(),u()}function u(){for(let w=0;w<a.length;w+=6){let E=a[w+0],b=a[w+2],R=a[w+4],C=Math.max(E,b,R),T=Math.min(E,b,R);C>.9&&T<.1&&(E<.2&&(a[w+0]+=1),b<.2&&(a[w+2]+=1),R<.2&&(a[w+4]+=1))}}function f(w){r.push(w.x,w.y,w.z)}function p(w,E){let b=w*3;E.x=e[b+0],E.y=e[b+1],E.z=e[b+2]}function g(){let w=new N,E=new N,b=new N,R=new N,C=new Ge,T=new Ge,I=new Ge;for(let M=0,_=0;M<r.length;M+=9,_+=6){w.set(r[M+0],r[M+1],r[M+2]),E.set(r[M+3],r[M+4],r[M+5]),b.set(r[M+6],r[M+7],r[M+8]),C.set(a[_+0],a[_+1]),T.set(a[_+2],a[_+3]),I.set(a[_+4],a[_+5]),R.copy(w).add(E).add(b).divideScalar(3);let L=m(R);y(C,_+0,w,L),y(T,_+2,E,L),y(I,_+4,b,L)}}function y(w,E,b,R){R<0&&w.x===1&&(a[E]=w.x-1),b.x===0&&b.z===0&&(a[E]=R/2/Math.PI+.5)}function m(w){return Math.atan2(w.z,-w.x)}function d(w){return Math.atan2(-w.y,Math.sqrt(w.x*w.x+w.z*w.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.details)}},ms=class i extends nr{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-n,0,-s,n,0,s,-n,0,s,n,-s,-n,0,-s,n,0,s,-n,0,s,n,0,-n,0,-s,n,0,-s,-n,0,s,n,0,s],a=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,a,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}};var Di=class i extends nr{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}};var $n=class i extends Ut{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),c=Math.floor(s),l=o+1,h=c+1,u=e/o,f=t/c,p=[],g=[],y=[],m=[];for(let d=0;d<h;d++){let w=d*f-a;for(let E=0;E<l;E++){let b=E*u-r;g.push(b,-w,0),y.push(0,0,1),m.push(E/o),m.push(1-d/c)}}for(let d=0;d<c;d++)for(let w=0;w<o;w++){let E=w+l*d,b=w+l*(d+1),R=w+1+l*(d+1),C=w+1+l*d;p.push(E,b,C),p.push(b,R,C)}this.setIndex(p),this.setAttribute("position",new lt(g,3)),this.setAttribute("normal",new lt(y,3)),this.setAttribute("uv",new lt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};var Jn=class i extends Ut{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let c=Math.min(a+o,Math.PI),l=0,h=[],u=new N,f=new N,p=[],g=[],y=[],m=[];for(let d=0;d<=n;d++){let w=[],E=d/n,b=0;d===0&&a===0?b=.5/t:d===n&&c===Math.PI&&(b=-.5/t);for(let R=0;R<=t;R++){let C=R/t;u.x=-e*Math.cos(s+C*r)*Math.sin(a+E*o),u.y=e*Math.cos(a+E*o),u.z=e*Math.sin(s+C*r)*Math.sin(a+E*o),g.push(u.x,u.y,u.z),f.copy(u).normalize(),y.push(f.x,f.y,f.z),m.push(C+b,1-E),w.push(l++)}h.push(w)}for(let d=0;d<n;d++)for(let w=0;w<t;w++){let E=h[d][w+1],b=h[d][w],R=h[d+1][w],C=h[d+1][w+1];(d!==0||a>0)&&p.push(E,b,C),(d!==n-1||c<Math.PI)&&p.push(b,R,C)}this.setIndex(p),this.setAttribute("position",new lt(g,3)),this.setAttribute("normal",new lt(y,3)),this.setAttribute("uv",new lt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var pi=class i extends Ut{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);let a=[],o=[],c=[],l=[],h=new N,u=new N,f=new N;for(let p=0;p<=n;p++)for(let g=0;g<=s;g++){let y=g/s*r,m=p/n*Math.PI*2;u.x=(e+t*Math.cos(m))*Math.cos(y),u.y=(e+t*Math.cos(m))*Math.sin(y),u.z=t*Math.sin(m),o.push(u.x,u.y,u.z),h.x=e*Math.cos(y),h.y=e*Math.sin(y),f.subVectors(u,h).normalize(),c.push(f.x,f.y,f.z),l.push(g/s),l.push(p/n)}for(let p=1;p<=n;p++)for(let g=1;g<=s;g++){let y=(s+1)*p+g-1,m=(s+1)*(p-1)+g-1,d=(s+1)*(p-1)+g,w=(s+1)*p+g;a.push(y,m,w),a.push(m,d,w)}this.setIndex(a),this.setAttribute("position",new lt(o,3)),this.setAttribute("normal",new lt(c,3)),this.setAttribute("uv",new lt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var Kn=class extends Yn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ke(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ke(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=kl,this.normalScale=new Ge(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new xn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var aa=class extends Yn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Nh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},oa=class extends Yn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Zr(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Pd(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Ni=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},la=class extends Ni{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:pl,endingEnd:pl}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],c=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case ml:r=e,o=2*t-n;break;case gl:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(c===void 0)switch(this.getSettings_().endingEnd){case ml:a=e,c=2*n-t;break;case gl:a=1,c=n+s[1]-s[0];break;default:a=e-1,c=t}let l=(n-t)*.5,h=this.valueSize;this._weightPrev=l/(t-o),this._weightNext=l/(c-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,l=c-o,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,p=this._weightNext,g=(n-t)/(s-t),y=g*g,m=y*g,d=-f*m+2*f*y-f*g,w=(1+f)*m+(-1.5-2*f)*y+(-.5+f)*g+1,E=(-1-p)*m+(1.5+p)*y+.5*g,b=p*m-p*y;for(let R=0;R!==o;++R)r[R]=d*a[h+R]+w*a[l+R]+E*a[c+R]+b*a[u+R];return r}},ca=class extends Ni{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,l=c-o,h=(n-t)/(s-t),u=1-h;for(let f=0;f!==o;++f)r[f]=a[l+f]*u+a[c+f]*h;return r}},ha=class extends Ni{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},an=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Zr(t,this.TimeBufferType),this.values=Zr(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Zr(e.times,Array),values:Zr(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new ha(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new ca(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new la(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Vs:t=this.InterpolantFactoryMethodDiscrete;break;case Qr:t=this.InterpolantFactoryMethodLinear;break;case $r:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Vs;case this.InterpolantFactoryMethodLinear:return Qr;case this.InterpolantFactoryMethodSmooth:return $r}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let c=n[o];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,c),e=!1;break}if(a!==null&&a>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,c,a),e=!1;break}a=c}if(s!==void 0&&Pd(s))for(let o=0,c=s.length;o!==c;++o){let l=s[o];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===$r,r=e.length-1,a=1;for(let o=1;o<r;++o){let c=!1,l=e[o],h=e[o+1];if(l!==h&&(o!==1||l!==e[0]))if(s)c=!0;else{let u=o*n,f=u-n,p=u+n;for(let g=0;g!==n;++g){let y=t[u+g];if(y!==t[f+g]||y!==t[p+g]){c=!0;break}}}if(c){if(o!==a){e[a]=e[o];let u=o*n,f=a*n;for(let p=0;p!==n;++p)t[f+p]=t[u+p]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,c=a*n,l=0;l!==n;++l)t[c+l]=t[o+l];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};an.prototype.ValueTypeName="";an.prototype.TimeBufferType=Float32Array;an.prototype.ValueBufferType=Float32Array;an.prototype.DefaultInterpolation=Qr;var mi=class extends an{constructor(e,t,n){super(e,t,n)}};mi.prototype.ValueTypeName="bool";mi.prototype.ValueBufferType=Array;mi.prototype.DefaultInterpolation=Vs;mi.prototype.InterpolantFactoryMethodLinear=void 0;mi.prototype.InterpolantFactoryMethodSmooth=void 0;var ua=class extends an{constructor(e,t,n,s){super(e,t,n,s)}};ua.prototype.ValueTypeName="color";var da=class extends an{constructor(e,t,n,s){super(e,t,n,s)}};da.prototype.ValueTypeName="number";var fa=class extends Ni{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=(n-t)/(s-t),l=e*o;for(let h=l+o;l!==h;l+=4)qn.slerpFlat(r,0,a,l-o,a,l,c);return r}},ir=class extends an{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new fa(this.times,this.values,this.getValueSize(),e)}};ir.prototype.ValueTypeName="quaternion";ir.prototype.InterpolantFactoryMethodSmooth=void 0;var gi=class extends an{constructor(e,t,n){super(e,t,n)}};gi.prototype.ValueTypeName="string";gi.prototype.ValueBufferType=Array;gi.prototype.DefaultInterpolation=Vs;gi.prototype.InterpolantFactoryMethodLinear=void 0;gi.prototype.InterpolantFactoryMethodSmooth=void 0;var pa=class extends an{constructor(e,t,n,s){super(e,t,n,s)}};pa.prototype.ValueTypeName="vector";var ma=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.abortController=new AbortController,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){let u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=l.length;u<f;u+=2){let p=l[u],g=l[u+1];if(p.global&&(p.lastIndex=0),p.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},Zh=new ma,ga=class{constructor(e){this.manager=e!==void 0?e:Zh,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};ga.DEFAULT_MATERIAL_NAME="__DEFAULT";var gs=class extends Nt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ke(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},sr=class extends gs{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Nt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ke(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},dl=new xt,eh=new N,th=new N,ya=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ge(512,512),this.mapType=_n,this.map=null,this.mapPass=null,this.matrix=new xt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new fs,this._frameExtents=new Ge(1,1),this._viewportCount=1,this._viewports=[new nt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;eh.setFromMatrixPosition(e.matrixWorld),t.position.copy(eh),th.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(th),t.updateMatrixWorld(),dl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(dl,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(dl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var nh=new xt,Hs=new N,fl=new N,_l=class extends ya{constructor(){super(new Dt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Ge(4,2),this._viewportCount=6,this._viewports=[new nt(2,1,1,1),new nt(0,1,1,1),new nt(3,1,1,1),new nt(1,1,1,1),new nt(3,0,1,1),new nt(1,0,1,1)],this._cubeDirections=[new N(1,0,0),new N(-1,0,0),new N(0,0,1),new N(0,0,-1),new N(0,1,0),new N(0,-1,0)],this._cubeUps=[new N(0,1,0),new N(0,1,0),new N(0,1,0),new N(0,1,0),new N(0,0,1),new N(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Hs.setFromMatrixPosition(e.matrixWorld),n.position.copy(Hs),fl.copy(n.position),fl.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(fl),n.updateMatrixWorld(),s.makeTranslation(-Hs.x,-Hs.y,-Hs.z),nh.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(nh,n.coordinateSystem,n.reversedDepth)}},rr=class extends gs{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new _l}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Ui=class extends $s{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,c=s-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ml=class extends ya{constructor(){super(new Ui(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ar=class extends gs{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Nt.DEFAULT_UP),this.updateMatrix(),this.target=new Nt,this.shadow=new Ml}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var xa=class extends Dt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var Wl="\\[\\]\\.:\\/",Ld=new RegExp("["+Wl+"]","g"),Xl="[^"+Wl+"]",Dd="[^"+Wl.replace("\\.","")+"]",Nd=/((?:WC+[\/:])*)/.source.replace("WC",Xl),Ud=/(WCOD+)?/.source.replace("WCOD",Dd),Fd=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Xl),Od=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Xl),Bd=new RegExp("^"+Nd+Ud+Fd+Od+"$"),kd=["material","materials","bones","map"],bl=class{constructor(e,t,n){let s=n||ft.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},ft=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Ld,"")}static parseTrackName(e){let t=Bd.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);kd.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let c=n(o.children);if(c)return c}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let a=e[s];if(a===void 0){let l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(c=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ft.Composite=bl;ft.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ft.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ft.prototype.GetterByBindingType=[ft.prototype._getValue_direct,ft.prototype._getValue_array,ft.prototype._getValue_arrayElement,ft.prototype._getValue_toArray];ft.prototype.SetterByBindingTypeAndVersioning=[[ft.prototype._setValue_direct,ft.prototype._setValue_direct_setNeedsUpdate,ft.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ft.prototype._setValue_array,ft.prototype._setValue_array_setNeedsUpdate,ft.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ft.prototype._setValue_arrayElement,ft.prototype._setValue_arrayElement_setNeedsUpdate,ft.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ft.prototype._setValue_fromArray,ft.prototype._setValue_fromArray_setNeedsUpdate,ft.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var G0=new Float32Array(1);var ih=new xt,ys=class{constructor(e,t,n=0,s=1/0){this.ray=new cs(e,t),this.near=n,this.far=s,this.camera=null,this.layers=new hs,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return ih.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(ih),this}intersectObject(e,t=!0,n=[]){return Sl(e,this,n,t),n.sort(sh),n}intersectObjects(e,t=!0,n=[]){for(let s=0,r=e.length;s<r;s++)Sl(e[s],this,n,t);return n.sort(sh),n}};function sh(i,e){return i.distance-e.distance}function Sl(i,e,t,n){let s=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let a=0,o=r.length;a<o;a++)Sl(r[a],e,t,!0)}}function ql(i,e,t,n){let s=zd(n);switch(t){case Ul:return i*e;case Ol:return i*e/s.components*s.byteLength;case Na:return i*e/s.components*s.byteLength;case Bl:return i*e*2/s.components*s.byteLength;case Ua:return i*e*2/s.components*s.byteLength;case Fl:return i*e*3/s.components*s.byteLength;case dn:return i*e*4/s.components*s.byteLength;case Fa:return i*e*4/s.components*s.byteLength;case cr:case hr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case ur:case dr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ba:case za:return Math.max(i,16)*Math.max(e,8)/4;case Oa:case ka:return Math.max(i,8)*Math.max(e,8)/2;case Ha:case Va:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Ga:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Wa:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Xa:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case qa:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Ya:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Za:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case $a:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Ja:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Ka:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case ja:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Qa:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case eo:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case to:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case no:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case io:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case so:case ro:case ao:return Math.ceil(i/4)*Math.ceil(e/4)*16;case oo:case lo:return Math.ceil(i/4)*Math.ceil(e/4)*8;case co:case ho:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function zd(i){switch(i){case _n:case Pl:return{byteLength:1,components:1};case xs:case Ll:case vs:return{byteLength:2,components:1};case La:case Da:return{byteLength:2,components:4};case xi:case Pa:case Pn:return{byteLength:4,components:1};case Dl:case Nl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function xu(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Vd(i){let e=new WeakMap;function t(o,c){let l=o.array,h=o.usage,u=l.byteLength,f=i.createBuffer();i.bindBuffer(c,f),i.bufferData(c,l,h),o.onUploadCallback();let p;if(l instanceof Float32Array)p=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)p=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)p=i.SHORT;else if(l instanceof Uint32Array)p=i.UNSIGNED_INT;else if(l instanceof Int32Array)p=i.INT;else if(l instanceof Int8Array)p=i.BYTE;else if(l instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:f,type:p,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,c,l){let h=c.array,u=c.updateRanges;if(i.bindBuffer(l,o),u.length===0)i.bufferSubData(l,0,h);else{u.sort((p,g)=>p.start-g.start);let f=0;for(let p=1;p<u.length;p++){let g=u[f],y=u[p];y.start<=g.start+g.count+1?g.count=Math.max(g.count,y.start+y.count-g.start):(++f,u[f]=y)}u.length=f+1;for(let p=0,g=u.length;p<g;p++){let y=u[p];i.bufferSubData(l,y.start*h.BYTES_PER_ELEMENT,h,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:s,remove:r,update:a}}var Gd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Wd=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Xd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,qd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Yd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Zd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,$d=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT )
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN )
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Jd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Kd=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,jd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Qd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ef=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,tf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,nf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,sf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,rf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,af=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,of=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,lf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,cf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,hf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,uf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,df=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,ff=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,pf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,mf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,gf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,yf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,xf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,vf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,_f="gl_FragColor = linearToOutputTexel( gl_FragColor );",Mf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,bf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Sf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif

#endif`,wf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ef=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Tf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Af=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Cf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Rf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,If=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Pf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Lf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Df=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Nf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Uf=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Ff=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Of=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Bf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,kf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,zf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Hf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Vf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Gf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Wf=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Xf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,qf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Yf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Zf=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$f=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Jf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Kf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,jf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Qf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ep=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,tp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,np=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ip=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,sp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,rp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,ap=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,op=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,lp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,cp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,hp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,up=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,dp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,fp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,pp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,mp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,gp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,yp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,xp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,vp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,_p=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Mp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,bp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Sp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,wp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Ep=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;

		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Tp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Ap=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Cp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Rp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ip=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Pp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Lp=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Dp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Np=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Up=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Fp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Op=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Bp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,kp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,zp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Hp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Vp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Gp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Wp=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Xp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,qp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Zp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$p=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Jp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Kp=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,jp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Qp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,em=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,tm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,nm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,im=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,sm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,rm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,am=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,om=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,lm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,hm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,um=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,dm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,fm=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,pm=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ym=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,xm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,vm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_m=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Mm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,bm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ze={alphahash_fragment:Gd,alphahash_pars_fragment:Wd,alphamap_fragment:Xd,alphamap_pars_fragment:qd,alphatest_fragment:Yd,alphatest_pars_fragment:Zd,aomap_fragment:$d,aomap_pars_fragment:Jd,batching_pars_vertex:Kd,batching_vertex:jd,begin_vertex:Qd,beginnormal_vertex:ef,bsdfs:tf,iridescence_fragment:nf,bumpmap_pars_fragment:sf,clipping_planes_fragment:rf,clipping_planes_pars_fragment:af,clipping_planes_pars_vertex:of,clipping_planes_vertex:lf,color_fragment:cf,color_pars_fragment:hf,color_pars_vertex:uf,color_vertex:df,common:ff,cube_uv_reflection_fragment:pf,defaultnormal_vertex:mf,displacementmap_pars_vertex:gf,displacementmap_vertex:yf,emissivemap_fragment:xf,emissivemap_pars_fragment:vf,colorspace_fragment:_f,colorspace_pars_fragment:Mf,envmap_fragment:bf,envmap_common_pars_fragment:Sf,envmap_pars_fragment:wf,envmap_pars_vertex:Ef,envmap_physical_pars_fragment:Ff,envmap_vertex:Tf,fog_vertex:Af,fog_pars_vertex:Cf,fog_fragment:Rf,fog_pars_fragment:If,gradientmap_pars_fragment:Pf,lightmap_pars_fragment:Lf,lights_lambert_fragment:Df,lights_lambert_pars_fragment:Nf,lights_pars_begin:Uf,lights_toon_fragment:Of,lights_toon_pars_fragment:Bf,lights_phong_fragment:kf,lights_phong_pars_fragment:zf,lights_physical_fragment:Hf,lights_physical_pars_fragment:Vf,lights_fragment_begin:Gf,lights_fragment_maps:Wf,lights_fragment_end:Xf,logdepthbuf_fragment:qf,logdepthbuf_pars_fragment:Yf,logdepthbuf_pars_vertex:Zf,logdepthbuf_vertex:$f,map_fragment:Jf,map_pars_fragment:Kf,map_particle_fragment:jf,map_particle_pars_fragment:Qf,metalnessmap_fragment:ep,metalnessmap_pars_fragment:tp,morphinstance_vertex:np,morphcolor_vertex:ip,morphnormal_vertex:sp,morphtarget_pars_vertex:rp,morphtarget_vertex:ap,normal_fragment_begin:op,normal_fragment_maps:lp,normal_pars_fragment:cp,normal_pars_vertex:hp,normal_vertex:up,normalmap_pars_fragment:dp,clearcoat_normal_fragment_begin:fp,clearcoat_normal_fragment_maps:pp,clearcoat_pars_fragment:mp,iridescence_pars_fragment:gp,opaque_fragment:yp,packing:xp,premultiplied_alpha_fragment:vp,project_vertex:_p,dithering_fragment:Mp,dithering_pars_fragment:bp,roughnessmap_fragment:Sp,roughnessmap_pars_fragment:wp,shadowmap_pars_fragment:Ep,shadowmap_pars_vertex:Tp,shadowmap_vertex:Ap,shadowmask_pars_fragment:Cp,skinbase_vertex:Rp,skinning_pars_vertex:Ip,skinning_vertex:Pp,skinnormal_vertex:Lp,specularmap_fragment:Dp,specularmap_pars_fragment:Np,tonemapping_fragment:Up,tonemapping_pars_fragment:Fp,transmission_fragment:Op,transmission_pars_fragment:Bp,uv_pars_fragment:kp,uv_pars_vertex:zp,uv_vertex:Hp,worldpos_vertex:Vp,background_vert:Gp,background_frag:Wp,backgroundCube_vert:Xp,backgroundCube_frag:qp,cube_vert:Yp,cube_frag:Zp,depth_vert:$p,depth_frag:Jp,distanceRGBA_vert:Kp,distanceRGBA_frag:jp,equirect_vert:Qp,equirect_frag:em,linedashed_vert:tm,linedashed_frag:nm,meshbasic_vert:im,meshbasic_frag:sm,meshlambert_vert:rm,meshlambert_frag:am,meshmatcap_vert:om,meshmatcap_frag:lm,meshnormal_vert:cm,meshnormal_frag:hm,meshphong_vert:um,meshphong_frag:dm,meshphysical_vert:fm,meshphysical_frag:pm,meshtoon_vert:mm,meshtoon_frag:gm,points_vert:ym,points_frag:xm,shadow_vert:vm,shadow_frag:_m,sprite_vert:Mm,sprite_frag:bm},le={common:{diffuse:{value:new ke(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Fe}},envmap:{envMap:{value:null},envMapRotation:{value:new Fe},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Fe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Fe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Fe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Fe},normalScale:{value:new Ge(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Fe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Fe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Fe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Fe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ke(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ke(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0},uvTransform:{value:new Fe}},sprite:{diffuse:{value:new ke(16777215)},opacity:{value:1},center:{value:new Ge(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}}},Ln={basic:{uniforms:Gt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:ze.meshbasic_vert,fragmentShader:ze.meshbasic_frag},lambert:{uniforms:Gt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new ke(0)}}]),vertexShader:ze.meshlambert_vert,fragmentShader:ze.meshlambert_frag},phong:{uniforms:Gt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new ke(0)},specular:{value:new ke(1118481)},shininess:{value:30}}]),vertexShader:ze.meshphong_vert,fragmentShader:ze.meshphong_frag},standard:{uniforms:Gt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new ke(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ze.meshphysical_vert,fragmentShader:ze.meshphysical_frag},toon:{uniforms:Gt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new ke(0)}}]),vertexShader:ze.meshtoon_vert,fragmentShader:ze.meshtoon_frag},matcap:{uniforms:Gt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:ze.meshmatcap_vert,fragmentShader:ze.meshmatcap_frag},points:{uniforms:Gt([le.points,le.fog]),vertexShader:ze.points_vert,fragmentShader:ze.points_frag},dashed:{uniforms:Gt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ze.linedashed_vert,fragmentShader:ze.linedashed_frag},depth:{uniforms:Gt([le.common,le.displacementmap]),vertexShader:ze.depth_vert,fragmentShader:ze.depth_frag},normal:{uniforms:Gt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:ze.meshnormal_vert,fragmentShader:ze.meshnormal_frag},sprite:{uniforms:Gt([le.sprite,le.fog]),vertexShader:ze.sprite_vert,fragmentShader:ze.sprite_frag},background:{uniforms:{uvTransform:{value:new Fe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ze.background_vert,fragmentShader:ze.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Fe}},vertexShader:ze.backgroundCube_vert,fragmentShader:ze.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ze.cube_vert,fragmentShader:ze.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ze.equirect_vert,fragmentShader:ze.equirect_frag},distanceRGBA:{uniforms:Gt([le.common,le.displacementmap,{referencePosition:{value:new N},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ze.distanceRGBA_vert,fragmentShader:ze.distanceRGBA_frag},shadow:{uniforms:Gt([le.lights,le.fog,{color:{value:new ke(0)},opacity:{value:1}}]),vertexShader:ze.shadow_vert,fragmentShader:ze.shadow_frag}};Ln.physical={uniforms:Gt([Ln.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Fe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Fe},clearcoatNormalScale:{value:new Ge(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Fe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Fe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Fe},sheen:{value:0},sheenColor:{value:new ke(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Fe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Fe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Fe},transmissionSamplerSize:{value:new Ge},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Fe},attenuationDistance:{value:0},attenuationColor:{value:new ke(0)},specularColor:{value:new ke(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Fe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Fe},anisotropyVector:{value:new Ge},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Fe}}]),vertexShader:ze.meshphysical_vert,fragmentShader:ze.meshphysical_frag};var uo={r:0,b:0,g:0},ki=new xn,Sm=new xt;function wm(i,e,t,n,s,r,a){let o=new ke(0),c=r===!0?0:1,l,h,u=null,f=0,p=null;function g(E){let b=E.isScene===!0?E.background:null;return b&&b.isTexture&&(b=(E.backgroundBlurriness>0?t:e).get(b)),b}function y(E){let b=!1,R=g(E);R===null?d(o,c):R&&R.isColor&&(d(R,1),b=!0);let C=i.xr.getEnvironmentBlendMode();C==="additive"?n.buffers.color.setClear(0,0,0,1,a):C==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||b)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(E,b){let R=g(b);R&&(R.isCubeTexture||R.mapping===or)?(h===void 0&&(h=new At(new rn(1,1,1),new vn({name:"BackgroundCubeMaterial",uniforms:Bi(Ln.backgroundCube.uniforms),vertexShader:Ln.backgroundCube.vertexShader,fragmentShader:Ln.backgroundCube.fragmentShader,side:Yt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(C,T,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),ki.copy(b.backgroundRotation),ki.x*=-1,ki.y*=-1,ki.z*=-1,R.isCubeTexture&&R.isRenderTargetTexture===!1&&(ki.y*=-1,ki.z*=-1),h.material.uniforms.envMap.value=R,h.material.uniforms.flipEnvMap.value=R.isCubeTexture&&R.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Sm.makeRotationFromEuler(ki)),h.material.toneMapped=$e.getTransfer(R.colorSpace)!==it,(u!==R||f!==R.version||p!==i.toneMapping)&&(h.material.needsUpdate=!0,u=R,f=R.version,p=i.toneMapping),h.layers.enableAll(),E.unshift(h,h.geometry,h.material,0,0,null)):R&&R.isTexture&&(l===void 0&&(l=new At(new $n(2,2),new vn({name:"BackgroundMaterial",uniforms:Bi(Ln.background.uniforms),vertexShader:Ln.background.vertexShader,fragmentShader:Ln.background.fragmentShader,side:Wn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=R,l.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,l.material.toneMapped=$e.getTransfer(R.colorSpace)!==it,R.matrixAutoUpdate===!0&&R.updateMatrix(),l.material.uniforms.uvTransform.value.copy(R.matrix),(u!==R||f!==R.version||p!==i.toneMapping)&&(l.material.needsUpdate=!0,u=R,f=R.version,p=i.toneMapping),l.layers.enableAll(),E.unshift(l,l.geometry,l.material,0,0,null))}function d(E,b){E.getRGB(uo,Gl(i)),n.buffers.color.setClear(uo.r,uo.g,uo.b,b,a)}function w(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(E,b=1){o.set(E),c=b,d(o,c)},getClearAlpha:function(){return c},setClearAlpha:function(E){c=E,d(o,c)},render:y,addToRenderList:m,dispose:w}}function Em(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,a=!1;function o(_,L,O,z,X){let q=!1,G=u(z,O,L);r!==G&&(r=G,l(r.object)),q=p(_,z,O,X),q&&g(_,z,O,X),X!==null&&e.update(X,i.ELEMENT_ARRAY_BUFFER),(q||a)&&(a=!1,b(_,L,O,z),X!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(X).buffer))}function c(){return i.createVertexArray()}function l(_){return i.bindVertexArray(_)}function h(_){return i.deleteVertexArray(_)}function u(_,L,O){let z=O.wireframe===!0,X=n[_.id];X===void 0&&(X={},n[_.id]=X);let q=X[L.id];q===void 0&&(q={},X[L.id]=q);let G=q[z];return G===void 0&&(G=f(c()),q[z]=G),G}function f(_){let L=[],O=[],z=[];for(let X=0;X<t;X++)L[X]=0,O[X]=0,z[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:O,attributeDivisors:z,object:_,attributes:{},index:null}}function p(_,L,O,z){let X=r.attributes,q=L.attributes,G=0,se=O.getAttributes();for(let W in se)if(se[W].location>=0){let he=X[W],fe=q[W];if(fe===void 0&&(W==="instanceMatrix"&&_.instanceMatrix&&(fe=_.instanceMatrix),W==="instanceColor"&&_.instanceColor&&(fe=_.instanceColor)),he===void 0||he.attribute!==fe||fe&&he.data!==fe.data)return!0;G++}return r.attributesNum!==G||r.index!==z}function g(_,L,O,z){let X={},q=L.attributes,G=0,se=O.getAttributes();for(let W in se)if(se[W].location>=0){let he=q[W];he===void 0&&(W==="instanceMatrix"&&_.instanceMatrix&&(he=_.instanceMatrix),W==="instanceColor"&&_.instanceColor&&(he=_.instanceColor));let fe={};fe.attribute=he,he&&he.data&&(fe.data=he.data),X[W]=fe,G++}r.attributes=X,r.attributesNum=G,r.index=z}function y(){let _=r.newAttributes;for(let L=0,O=_.length;L<O;L++)_[L]=0}function m(_){d(_,0)}function d(_,L){let O=r.newAttributes,z=r.enabledAttributes,X=r.attributeDivisors;O[_]=1,z[_]===0&&(i.enableVertexAttribArray(_),z[_]=1),X[_]!==L&&(i.vertexAttribDivisor(_,L),X[_]=L)}function w(){let _=r.newAttributes,L=r.enabledAttributes;for(let O=0,z=L.length;O<z;O++)L[O]!==_[O]&&(i.disableVertexAttribArray(O),L[O]=0)}function E(_,L,O,z,X,q,G){G===!0?i.vertexAttribIPointer(_,L,O,X,q):i.vertexAttribPointer(_,L,O,z,X,q)}function b(_,L,O,z){y();let X=z.attributes,q=O.getAttributes(),G=L.defaultAttributeValues;for(let se in q){let W=q[se];if(W.location>=0){let oe=X[se];if(oe===void 0&&(se==="instanceMatrix"&&_.instanceMatrix&&(oe=_.instanceMatrix),se==="instanceColor"&&_.instanceColor&&(oe=_.instanceColor)),oe!==void 0){let he=oe.normalized,fe=oe.itemSize,He=e.get(oe);if(He===void 0)continue;let ct=He.buffer,mt=He.type,Qe=He.bytesPerElement,$=mt===i.INT||mt===i.UNSIGNED_INT||oe.gpuType===Pa;if(oe.isInterleavedBufferAttribute){let Q=oe.data,ge=Q.stride,De=oe.offset;if(Q.isInstancedInterleavedBuffer){for(let Te=0;Te<W.locationSize;Te++)d(W.location+Te,Q.meshPerAttribute);_.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let Te=0;Te<W.locationSize;Te++)m(W.location+Te);i.bindBuffer(i.ARRAY_BUFFER,ct);for(let Te=0;Te<W.locationSize;Te++)E(W.location+Te,fe/W.locationSize,mt,he,ge*Qe,(De+fe/W.locationSize*Te)*Qe,$)}else{if(oe.isInstancedBufferAttribute){for(let Q=0;Q<W.locationSize;Q++)d(W.location+Q,oe.meshPerAttribute);_.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=oe.meshPerAttribute*oe.count)}else for(let Q=0;Q<W.locationSize;Q++)m(W.location+Q);i.bindBuffer(i.ARRAY_BUFFER,ct);for(let Q=0;Q<W.locationSize;Q++)E(W.location+Q,fe/W.locationSize,mt,he,fe*Qe,fe/W.locationSize*Q*Qe,$)}}else if(G!==void 0){let he=G[se];if(he!==void 0)switch(he.length){case 2:i.vertexAttrib2fv(W.location,he);break;case 3:i.vertexAttrib3fv(W.location,he);break;case 4:i.vertexAttrib4fv(W.location,he);break;default:i.vertexAttrib1fv(W.location,he)}}}}w()}function R(){I();for(let _ in n){let L=n[_];for(let O in L){let z=L[O];for(let X in z)h(z[X].object),delete z[X];delete L[O]}delete n[_]}}function C(_){if(n[_.id]===void 0)return;let L=n[_.id];for(let O in L){let z=L[O];for(let X in z)h(z[X].object),delete z[X];delete L[O]}delete n[_.id]}function T(_){for(let L in n){let O=n[L];if(O[_.id]===void 0)continue;let z=O[_.id];for(let X in z)h(z[X].object),delete z[X];delete O[_.id]}}function I(){M(),a=!0,r!==s&&(r=s,l(r.object))}function M(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:I,resetDefaultState:M,dispose:R,releaseStatesOfGeometry:C,releaseStatesOfProgram:T,initAttributes:y,enableAttribute:m,disableUnusedAttributes:w}}function Tm(i,e,t){let n;function s(l){n=l}function r(l,h){i.drawArrays(n,l,h),t.update(h,n,1)}function a(l,h,u){u!==0&&(i.drawArraysInstanced(n,l,h,u),t.update(h,n,u))}function o(l,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let p=0;for(let g=0;g<u;g++)p+=h[g];t.update(p,n,1)}function c(l,h,u,f){if(u===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<l.length;g++)a(l[g],h[g],f[g]);else{p.multiDrawArraysInstancedWEBGL(n,l,0,h,0,f,0,u);let g=0;for(let y=0;y<u;y++)g+=h[y]*f[y];t.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=c}function Am(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let T=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(T){return!(T!==dn&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){let I=T===vs&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(T!==_n&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==Pn&&!I)}function c(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let u=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),d=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),E=i.getParameter(i.MAX_VARYING_VECTORS),b=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),R=g>0,C=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:u,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:g,maxTextureSize:y,maxCubemapSize:m,maxAttributes:d,maxVertexUniforms:w,maxVaryings:E,maxFragmentUniforms:b,vertexTextures:R,maxSamples:C}}function Cm(i){let e=this,t=null,n=0,s=!1,r=!1,a=new En,o=new Fe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let p=u.length!==0||f||n!==0||s;return s=f,n=u.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){t=h(u,f,0)},this.setState=function(u,f,p){let g=u.clippingPlanes,y=u.clipIntersection,m=u.clipShadows,d=i.get(u);if(!s||g===null||g.length===0||r&&!m)r?h(null):l();else{let w=r?0:n,E=w*4,b=d.clippingState||null;c.value=b,b=h(g,f,E,p);for(let R=0;R!==E;++R)b[R]=t[R];d.clippingState=b,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=w}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,f,p,g){let y=u!==null?u.length:0,m=null;if(y!==0){if(m=c.value,g!==!0||m===null){let d=p+y*4,w=f.matrixWorldInverse;o.getNormalMatrix(w),(m===null||m.length<d)&&(m=new Float32Array(d));for(let E=0,b=p;E!==y;++E,b+=4)a.copy(u[E]).applyMatrix4(w,o),a.normal.toArray(m,b),m[b+3]=a.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=y,e.numIntersection=0,m}}function Rm(i){let e=new WeakMap;function t(a,o){return o===Ca?a.mapping=Fi:o===Ra&&(a.mapping=Oi),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===Ca||o===Ra)if(e.has(a)){let c=e.get(a).texture;return t(c,a.mapping)}else{let c=a.image;if(c&&c.height>0){let l=new ra(c.height);return l.fromEquirectangularTexture(i,a),e.set(a,l),a.addEventListener("dispose",s),t(l.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let c=e.get(o);c!==void 0&&(e.delete(o),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var Ss=4,$h=[.125,.215,.35,.446,.526,.582],Vi=20,Yl=new Ui,Jh=new ke,Zl=null,$l=0,Jl=0,Kl=!1,Hi=(1+Math.sqrt(5))/2,bs=1/Hi,Kh=[new N(-Hi,bs,0),new N(Hi,bs,0),new N(-bs,0,Hi),new N(bs,0,Hi),new N(0,Hi,-bs),new N(0,Hi,bs),new N(-1,1,-1),new N(1,1,-1),new N(-1,1,1),new N(1,1,1)],Im=new N,mo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100,r={}){let{size:a=256,position:o=Im}=r;Zl=this._renderer.getRenderTarget(),$l=this._renderer.getActiveCubeFace(),Jl=this._renderer.getActiveMipmapLevel(),Kl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,s,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=eu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Qh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Zl,$l,Jl),this._renderer.xr.enabled=Kl,e.scissorTest=!1,fo(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Fi||e.mapping===Oi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Zl=this._renderer.getRenderTarget(),$l=this._renderer.getActiveCubeFace(),Jl=this._renderer.getActiveMipmapLevel(),Kl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:yn,minFilter:yn,generateMipmaps:!1,type:vs,format:dn,colorSpace:Pi,depthBuffer:!1},s=jh(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=jh(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Pm(r)),this._blurMaterial=Lm(r,e,t)}return s}_compileMaterial(e){let t=new At(this._lodPlanes[0],e);this._renderer.compile(t,Yl)}_sceneToCubeUV(e,t,n,s,r){let c=new Dt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,p=u.toneMapping;u.getClearColor(Jh),u.toneMapping=Qn,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(s),u.clearDepth(),u.setRenderTarget(null));let y=new Cn({name:"PMREM.Background",side:Yt,depthWrite:!1,depthTest:!1}),m=new At(new rn,y),d=!1,w=e.background;w?w.isColor&&(y.color.copy(w),e.background=null,d=!0):(y.color.copy(Jh),d=!0);for(let E=0;E<6;E++){let b=E%3;b===0?(c.up.set(0,l[E],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+h[E],r.y,r.z)):b===1?(c.up.set(0,0,l[E]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+h[E],r.z)):(c.up.set(0,l[E],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+h[E]));let R=this._cubeSize;fo(s,b*R,E>2?R:0,R,R),u.setRenderTarget(s),d&&u.render(m,c),u.render(e,c)}m.geometry.dispose(),m.material.dispose(),u.toneMapping=p,u.autoClear=f,e.background=w}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===Fi||e.mapping===Oi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=eu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Qh());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new At(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;let c=this._cubeSize;fo(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(a,Yl)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Kh[(s-r-1)%Kh.length];this._blur(e,r-1,r,a,o)}t.autoClear=n}_blur(e,t,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){let c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new At(this._lodPlanes[s],l),f=l.uniforms,p=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*Vi-1),y=r/g,m=isFinite(r)?1+Math.floor(h*y):Vi;m>Vi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Vi}`);let d=[],w=0;for(let T=0;T<Vi;++T){let I=T/y,M=Math.exp(-I*I/2);d.push(M),T===0?w+=M:T<m&&(w+=2*M)}for(let T=0;T<d.length;T++)d[T]=d[T]/w;f.envMap.value=e.texture,f.samples.value=m,f.weights.value=d,f.latitudinal.value=a==="latitudinal",o&&(f.poleAxis.value=o);let{_lodMax:E}=this;f.dTheta.value=g,f.mipInt.value=E-n;let b=this._sizeLods[s],R=3*b*(s>E-Ss?s-E+Ss:0),C=4*(this._cubeSize-b);fo(t,R,C,3*b,2*b),c.setRenderTarget(t),c.render(u,Yl)}};function Pm(i){let e=[],t=[],n=[],s=i,r=i-Ss+1+$h.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let c=1/o;a>i-Ss?c=$h[a-i+Ss-1]:a===0&&(c=0),n.push(c);let l=1/(o-2),h=-l,u=1+l,f=[h,h,u,h,u,u,h,h,u,u,h,u],p=6,g=6,y=3,m=2,d=1,w=new Float32Array(y*g*p),E=new Float32Array(m*g*p),b=new Float32Array(d*g*p);for(let C=0;C<p;C++){let T=C%3*2/3-1,I=C>2?0:-1,M=[T,I,0,T+2/3,I,0,T+2/3,I+1,0,T,I,0,T+2/3,I+1,0,T,I+1,0];w.set(M,y*g*C),E.set(f,m*g*C);let _=[C,C,C,C,C,C];b.set(_,d*g*C)}let R=new Ut;R.setAttribute("position",new Vt(w,y)),R.setAttribute("uv",new Vt(E,m)),R.setAttribute("faceIndex",new Vt(b,d)),e.push(R),s>Ss&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function jh(i,e,t){let n=new Tn(i,e,t);return n.texture.mapping=or,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function fo(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function Lm(i,e,t){let n=new Float32Array(Vi),s=new N(0,1,0);return new vn({name:"SphericalGaussianBlur",defines:{n:Vi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:jn,depthTest:!1,depthWrite:!1})}function Qh(){return new vn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:jn,depthTest:!1,depthWrite:!1})}function eu(){return new vn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:jn,depthTest:!1,depthWrite:!1})}function oc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Dm(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){let c=o.mapping,l=c===Ca||c===Ra,h=c===Fi||c===Oi;if(l||h){let u=e.get(o),f=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==f)return t===null&&(t=new mo(i)),u=l?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{let p=o.image;return l&&p&&p.height>0||h&&p&&s(p)?(t===null&&(t=new mo(i)),u=l?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",r),u.texture):null}}}return o}function s(o){let c=0,l=6;for(let h=0;h<l;h++)o[h]!==void 0&&c++;return c===l}function r(o){let c=o.target;c.removeEventListener("dispose",r);let l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function Nm(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&os("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Um(i,e,t,n){let s={},r=new WeakMap;function a(u){let f=u.target;f.index!==null&&e.remove(f.index);for(let g in f.attributes)e.remove(f.attributes[g]);f.removeEventListener("dispose",a),delete s[f.id];let p=r.get(f);p&&(e.remove(p),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function o(u,f){return s[f.id]===!0||(f.addEventListener("dispose",a),s[f.id]=!0,t.memory.geometries++),f}function c(u){let f=u.attributes;for(let p in f)e.update(f[p],i.ARRAY_BUFFER)}function l(u){let f=[],p=u.index,g=u.attributes.position,y=0;if(p!==null){let w=p.array;y=p.version;for(let E=0,b=w.length;E<b;E+=3){let R=w[E+0],C=w[E+1],T=w[E+2];f.push(R,C,C,T,T,R)}}else if(g!==void 0){let w=g.array;y=g.version;for(let E=0,b=w.length/3-1;E<b;E+=3){let R=E+0,C=E+1,T=E+2;f.push(R,C,C,T,T,R)}}else return;let m=new(Vl(f)?Zs:Ys)(f,1);m.version=y;let d=r.get(u);d&&e.remove(d),r.set(u,m)}function h(u){let f=r.get(u);if(f){let p=u.index;p!==null&&f.version<p.version&&l(u)}else l(u);return r.get(u)}return{get:o,update:c,getWireframeAttribute:h}}function Fm(i,e,t){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function c(f,p){i.drawElements(n,p,r,f*a),t.update(p,n,1)}function l(f,p,g){g!==0&&(i.drawElementsInstanced(n,p,r,f*a,g),t.update(p,n,g))}function h(f,p,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,r,f,0,g);let m=0;for(let d=0;d<g;d++)m+=p[d];t.update(m,n,1)}function u(f,p,g,y){if(g===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let d=0;d<f.length;d++)l(f[d]/a,p[d],y[d]);else{m.multiDrawElementsInstancedWEBGL(n,p,0,r,f,0,y,0,g);let d=0;for(let w=0;w<g;w++)d+=p[w]*y[w];t.update(d,n,1)}}this.setMode=s,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Om(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Bm(i,e,t){let n=new WeakMap,s=new nt;function r(a,o,c){let l=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0,f=n.get(o);if(f===void 0||f.count!==u){let M=function(){T.dispose(),n.delete(o),o.removeEventListener("dispose",M)};f!==void 0&&f.texture.dispose();let p=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],d=o.morphAttributes.normal||[],w=o.morphAttributes.color||[],E=0;p===!0&&(E=1),g===!0&&(E=2),y===!0&&(E=3);let b=o.attributes.position.count*E,R=1;b>e.maxTextureSize&&(R=Math.ceil(b/e.maxTextureSize),b=e.maxTextureSize);let C=new Float32Array(b*R*4*u),T=new qs(C,b,R,u);T.type=Pn,T.needsUpdate=!0;let I=E*4;for(let _=0;_<u;_++){let L=m[_],O=d[_],z=w[_],X=b*R*4*_;for(let q=0;q<L.count;q++){let G=q*I;p===!0&&(s.fromBufferAttribute(L,q),C[X+G+0]=s.x,C[X+G+1]=s.y,C[X+G+2]=s.z,C[X+G+3]=0),g===!0&&(s.fromBufferAttribute(O,q),C[X+G+4]=s.x,C[X+G+5]=s.y,C[X+G+6]=s.z,C[X+G+7]=0),y===!0&&(s.fromBufferAttribute(z,q),C[X+G+8]=s.x,C[X+G+9]=s.y,C[X+G+10]=s.z,C[X+G+11]=z.itemSize===4?s.w:1)}}f={count:u,texture:T,size:new Ge(b,R)},n.set(o,f),o.addEventListener("dispose",M)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let p=0;for(let y=0;y<l.length;y++)p+=l[y];let g=o.morphTargetsRelative?1:1-p;c.getUniforms().setValue(i,"morphTargetBaseInfluence",g),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",f.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function km(i,e,t,n){let s=new WeakMap;function r(c){let l=n.render.frame,h=c.geometry,u=e.get(c,h);if(s.get(u)!==l&&(e.update(u),s.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",o)===!1&&c.addEventListener("dispose",o),s.get(c)!==l&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){let f=c.skeleton;s.get(f)!==l&&(f.update(),s.set(f,l))}return u}function a(){s=new WeakMap}function o(c){let l=c.target;l.removeEventListener("dispose",o),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:a}}var vu=new Jt,tu=new js(1,1),_u=new qs,Mu=new ia,bu=new Js,nu=[],iu=[],su=new Float32Array(16),ru=new Float32Array(9),au=new Float32Array(4);function Es(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=nu[s];if(r===void 0&&(r=new Float32Array(s),nu[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Ct(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Rt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function yo(i,e){let t=iu[e];t===void 0&&(t=new Int32Array(e),iu[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function zm(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Hm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ct(t,e))return;i.uniform2fv(this.addr,e),Rt(t,e)}}function Vm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ct(t,e))return;i.uniform3fv(this.addr,e),Rt(t,e)}}function Gm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ct(t,e))return;i.uniform4fv(this.addr,e),Rt(t,e)}}function Wm(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Ct(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Rt(t,e)}else{if(Ct(t,n))return;au.set(n),i.uniformMatrix2fv(this.addr,!1,au),Rt(t,n)}}function Xm(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Ct(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Rt(t,e)}else{if(Ct(t,n))return;ru.set(n),i.uniformMatrix3fv(this.addr,!1,ru),Rt(t,n)}}function qm(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Ct(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Rt(t,e)}else{if(Ct(t,n))return;su.set(n),i.uniformMatrix4fv(this.addr,!1,su),Rt(t,n)}}function Ym(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Zm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ct(t,e))return;i.uniform2iv(this.addr,e),Rt(t,e)}}function $m(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ct(t,e))return;i.uniform3iv(this.addr,e),Rt(t,e)}}function Jm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ct(t,e))return;i.uniform4iv(this.addr,e),Rt(t,e)}}function Km(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function jm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ct(t,e))return;i.uniform2uiv(this.addr,e),Rt(t,e)}}function Qm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ct(t,e))return;i.uniform3uiv(this.addr,e),Rt(t,e)}}function eg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ct(t,e))return;i.uniform4uiv(this.addr,e),Rt(t,e)}}function tg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(tu.compareFunction=zl,r=tu):r=vu,t.setTexture2D(e||r,s)}function ng(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Mu,s)}function ig(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||bu,s)}function sg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||_u,s)}function rg(i){switch(i){case 5126:return zm;case 35664:return Hm;case 35665:return Vm;case 35666:return Gm;case 35674:return Wm;case 35675:return Xm;case 35676:return qm;case 5124:case 35670:return Ym;case 35667:case 35671:return Zm;case 35668:case 35672:return $m;case 35669:case 35673:return Jm;case 5125:return Km;case 36294:return jm;case 36295:return Qm;case 36296:return eg;case 35678:case 36198:case 36298:case 36306:case 35682:return tg;case 35679:case 36299:case 36307:return ng;case 35680:case 36300:case 36308:case 36293:return ig;case 36289:case 36303:case 36311:case 36292:return sg}}function ag(i,e){i.uniform1fv(this.addr,e)}function og(i,e){let t=Es(e,this.size,2);i.uniform2fv(this.addr,t)}function lg(i,e){let t=Es(e,this.size,3);i.uniform3fv(this.addr,t)}function cg(i,e){let t=Es(e,this.size,4);i.uniform4fv(this.addr,t)}function hg(i,e){let t=Es(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function ug(i,e){let t=Es(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function dg(i,e){let t=Es(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function fg(i,e){i.uniform1iv(this.addr,e)}function pg(i,e){i.uniform2iv(this.addr,e)}function mg(i,e){i.uniform3iv(this.addr,e)}function gg(i,e){i.uniform4iv(this.addr,e)}function yg(i,e){i.uniform1uiv(this.addr,e)}function xg(i,e){i.uniform2uiv(this.addr,e)}function vg(i,e){i.uniform3uiv(this.addr,e)}function _g(i,e){i.uniform4uiv(this.addr,e)}function Mg(i,e,t){let n=this.cache,s=e.length,r=yo(t,s);Ct(n,r)||(i.uniform1iv(this.addr,r),Rt(n,r));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||vu,r[a])}function bg(i,e,t){let n=this.cache,s=e.length,r=yo(t,s);Ct(n,r)||(i.uniform1iv(this.addr,r),Rt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Mu,r[a])}function Sg(i,e,t){let n=this.cache,s=e.length,r=yo(t,s);Ct(n,r)||(i.uniform1iv(this.addr,r),Rt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||bu,r[a])}function wg(i,e,t){let n=this.cache,s=e.length,r=yo(t,s);Ct(n,r)||(i.uniform1iv(this.addr,r),Rt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||_u,r[a])}function Eg(i){switch(i){case 5126:return ag;case 35664:return og;case 35665:return lg;case 35666:return cg;case 35674:return hg;case 35675:return ug;case 35676:return dg;case 5124:case 35670:return fg;case 35667:case 35671:return pg;case 35668:case 35672:return mg;case 35669:case 35673:return gg;case 5125:return yg;case 36294:return xg;case 36295:return vg;case 36296:return _g;case 35678:case 36198:case 36298:case 36306:case 35682:return Mg;case 35679:case 36299:case 36307:return bg;case 35680:case 36300:case 36308:case 36293:return Sg;case 36289:case 36303:case 36311:case 36292:return wg}}var Ql=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=rg(t.type)}},ec=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Eg(t.type)}},tc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},jl=/(\w+)(\])?(\[|\.)?/g;function ou(i,e){i.seq.push(e),i.map[e.id]=e}function Tg(i,e,t){let n=i.name,s=n.length;for(jl.lastIndex=0;;){let r=jl.exec(n),a=jl.lastIndex,o=r[1],c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){ou(t,l===void 0?new Ql(o,i,e):new ec(o,i,e));break}else{let u=t.map[o];u===void 0&&(u=new tc(o),ou(t,u)),t=u}}}var ws=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),a=e.getUniformLocation(t,r.name);Tg(r,a,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function lu(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Ag=37297,Cg=0;function Rg(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var cu=new Fe;function Ig(i){$e._getMatrix(cu,$e.workingColorSpace,i);let e=`mat3( ${cu.elements.map(t=>t.toFixed(4))} )`;switch($e.getTransfer(i)){case Gs:return[e,"LinearTransferOETF"];case it:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function hu(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+Rg(i.getShaderSource(e),o)}else return r}function Pg(i,e){let t=Ig(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Lg(i,e){let t;switch(e){case Ah:t="Linear";break;case Ch:t="Reinhard";break;case Rh:t="Cineon";break;case Aa:t="ACESFilmic";break;case Ph:t="AgX";break;case Lh:t="Neutral";break;case Ih:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var po=new N;function Dg(){$e.getLuminanceCoefficients(po);let i=po.x.toFixed(4),e=po.y.toFixed(4),t=po.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Ng(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(pr).join(`
`)}function Ug(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Fg(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function pr(i){return i!==""}function uu(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function du(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Og=/^[ \t]*#include +<([\w\d./]+)>/gm;function nc(i){return i.replace(Og,kg)}var Bg=new Map;function kg(i,e){let t=ze[e];if(t===void 0){let n=Bg.get(e);if(n!==void 0)t=ze[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return nc(t)}var zg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function fu(i){return i.replace(zg,Hg)}function Hg(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function pu(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Vg(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===El?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===va?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===In&&(e="SHADOWMAP_TYPE_VSM"),e}function Gg(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Fi:case Oi:e="ENVMAP_TYPE_CUBE";break;case or:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Wg(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Oi:e="ENVMAP_MODE_REFRACTION";break}return e}function Xg(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Rl:e="ENVMAP_BLENDING_MULTIPLY";break;case Eh:e="ENVMAP_BLENDING_MIX";break;case Th:e="ENVMAP_BLENDING_ADD";break}return e}function qg(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Yg(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,c=Vg(t),l=Gg(t),h=Wg(t),u=Xg(t),f=qg(t),p=Ng(t),g=Ug(r),y=s.createProgram(),m,d,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(pr).join(`
`),m.length>0&&(m+=`
`),d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(pr).join(`
`),d.length>0&&(d+=`
`)):(m=[pu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(pr).join(`
`),d=[pu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Qn?"#define TONE_MAPPING":"",t.toneMapping!==Qn?ze.tonemapping_pars_fragment:"",t.toneMapping!==Qn?Lg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ze.colorspace_pars_fragment,Pg("linearToOutputTexel",t.outputColorSpace),Dg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(pr).join(`
`)),a=nc(a),a=uu(a,t),a=du(a,t),o=nc(o),o=uu(o,t),o=du(o,t),a=fu(a),o=fu(o),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,d=["#define varying in",t.glslVersion===Hl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Hl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);let E=w+m+a,b=w+d+o,R=lu(s,s.VERTEX_SHADER,E),C=lu(s,s.FRAGMENT_SHADER,b);s.attachShader(y,R),s.attachShader(y,C),t.index0AttributeName!==void 0?s.bindAttribLocation(y,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(y,0,"position"),s.linkProgram(y);function T(L){if(i.debug.checkShaderErrors){let O=s.getProgramInfoLog(y)||"",z=s.getShaderInfoLog(R)||"",X=s.getShaderInfoLog(C)||"",q=O.trim(),G=z.trim(),se=X.trim(),W=!0,oe=!0;if(s.getProgramParameter(y,s.LINK_STATUS)===!1)if(W=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,y,R,C);else{let he=hu(s,R,"vertex"),fe=hu(s,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(y,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+q+`
`+he+`
`+fe)}else q!==""?console.warn("THREE.WebGLProgram: Program Info Log:",q):(G===""||se==="")&&(oe=!1);oe&&(L.diagnostics={runnable:W,programLog:q,vertexShader:{log:G,prefix:m},fragmentShader:{log:se,prefix:d}})}s.deleteShader(R),s.deleteShader(C),I=new ws(s,y),M=Fg(s,y)}let I;this.getUniforms=function(){return I===void 0&&T(this),I};let M;this.getAttributes=function(){return M===void 0&&T(this),M};let _=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=s.getProgramParameter(y,Ag)),_},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(y),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Cg++,this.cacheKey=e,this.usedTimes=1,this.program=y,this.vertexShader=R,this.fragmentShader=C,this}var Zg=0,ic=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new sc(e),t.set(e,n)),n}},sc=class{constructor(e){this.id=Zg++,this.code=e,this.usedTimes=0}};function $g(i,e,t,n,s,r,a){let o=new hs,c=new ic,l=new Set,h=[],u=s.logarithmicDepthBuffer,f=s.vertexTextures,p=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function y(M){return l.add(M),M===0?"uv":`uv${M}`}function m(M,_,L,O,z){let X=O.fog,q=z.geometry,G=M.isMeshStandardMaterial?O.environment:null,se=(M.isMeshStandardMaterial?t:e).get(M.envMap||G),W=se&&se.mapping===or?se.image.height:null,oe=g[M.type];M.precision!==null&&(p=s.getMaxPrecision(M.precision),p!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",p,"instead."));let he=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,fe=he!==void 0?he.length:0,He=0;q.morphAttributes.position!==void 0&&(He=1),q.morphAttributes.normal!==void 0&&(He=2),q.morphAttributes.color!==void 0&&(He=3);let ct,mt,Qe,$;if(oe){let et=Ln[oe];ct=et.vertexShader,mt=et.fragmentShader}else ct=M.vertexShader,mt=M.fragmentShader,c.update(M),Qe=c.getVertexShaderID(M),$=c.getFragmentShaderID(M);let Q=i.getRenderTarget(),ge=i.state.buffers.depth.getReversed(),De=z.isInstancedMesh===!0,Te=z.isBatchedMesh===!0,Ze=!!M.map,Ot=!!M.matcap,P=!!se,gt=!!M.aoMap,Ue=!!M.lightMap,Pe=!!M.bumpMap,ve=!!M.normalMap,yt=!!M.displacementMap,_e=!!M.emissiveMap,Be=!!M.metalnessMap,It=!!M.roughnessMap,wt=M.anisotropy>0,A=M.clearcoat>0,v=M.dispersion>0,k=M.iridescence>0,Z=M.sheen>0,j=M.transmission>0,Y=wt&&!!M.anisotropyMap,Ee=A&&!!M.clearcoatMap,re=A&&!!M.clearcoatNormalMap,be=A&&!!M.clearcoatRoughnessMap,Se=k&&!!M.iridescenceMap,ne=k&&!!M.iridescenceThicknessMap,de=Z&&!!M.sheenColorMap,Ie=Z&&!!M.sheenRoughnessMap,we=!!M.specularMap,ce=!!M.specularColorMap,Oe=!!M.specularIntensityMap,D=j&&!!M.transmissionMap,ie=j&&!!M.thicknessMap,ae=!!M.gradientMap,me=!!M.alphaMap,ee=M.alphaTest>0,J=!!M.alphaHash,xe=!!M.extensions,Ne=Qn;M.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(Ne=i.toneMapping);let ht={shaderID:oe,shaderType:M.type,shaderName:M.name,vertexShader:ct,fragmentShader:mt,defines:M.defines,customVertexShaderID:Qe,customFragmentShaderID:$,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:p,batching:Te,batchingColor:Te&&z._colorsTexture!==null,instancing:De,instancingColor:De&&z.instanceColor!==null,instancingMorph:De&&z.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:Q===null?i.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Pi,alphaToCoverage:!!M.alphaToCoverage,map:Ze,matcap:Ot,envMap:P,envMapMode:P&&se.mapping,envMapCubeUVHeight:W,aoMap:gt,lightMap:Ue,bumpMap:Pe,normalMap:ve,displacementMap:f&&yt,emissiveMap:_e,normalMapObjectSpace:ve&&M.normalMapType===Fh,normalMapTangentSpace:ve&&M.normalMapType===kl,metalnessMap:Be,roughnessMap:It,anisotropy:wt,anisotropyMap:Y,clearcoat:A,clearcoatMap:Ee,clearcoatNormalMap:re,clearcoatRoughnessMap:be,dispersion:v,iridescence:k,iridescenceMap:Se,iridescenceThicknessMap:ne,sheen:Z,sheenColorMap:de,sheenRoughnessMap:Ie,specularMap:we,specularColorMap:ce,specularIntensityMap:Oe,transmission:j,transmissionMap:D,thicknessMap:ie,gradientMap:ae,opaque:M.transparent===!1&&M.blending===Ri&&M.alphaToCoverage===!1,alphaMap:me,alphaTest:ee,alphaHash:J,combine:M.combine,mapUv:Ze&&y(M.map.channel),aoMapUv:gt&&y(M.aoMap.channel),lightMapUv:Ue&&y(M.lightMap.channel),bumpMapUv:Pe&&y(M.bumpMap.channel),normalMapUv:ve&&y(M.normalMap.channel),displacementMapUv:yt&&y(M.displacementMap.channel),emissiveMapUv:_e&&y(M.emissiveMap.channel),metalnessMapUv:Be&&y(M.metalnessMap.channel),roughnessMapUv:It&&y(M.roughnessMap.channel),anisotropyMapUv:Y&&y(M.anisotropyMap.channel),clearcoatMapUv:Ee&&y(M.clearcoatMap.channel),clearcoatNormalMapUv:re&&y(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&y(M.clearcoatRoughnessMap.channel),iridescenceMapUv:Se&&y(M.iridescenceMap.channel),iridescenceThicknessMapUv:ne&&y(M.iridescenceThicknessMap.channel),sheenColorMapUv:de&&y(M.sheenColorMap.channel),sheenRoughnessMapUv:Ie&&y(M.sheenRoughnessMap.channel),specularMapUv:we&&y(M.specularMap.channel),specularColorMapUv:ce&&y(M.specularColorMap.channel),specularIntensityMapUv:Oe&&y(M.specularIntensityMap.channel),transmissionMapUv:D&&y(M.transmissionMap.channel),thicknessMapUv:ie&&y(M.thicknessMap.channel),alphaMapUv:me&&y(M.alphaMap.channel),vertexTangents:!!q.attributes.tangent&&(ve||wt),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!q.attributes.uv&&(Ze||me),fog:!!X,useFog:M.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:M.flatShading===!0&&M.wireframe===!1,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:ge,skinning:z.isSkinnedMesh===!0,morphTargets:q.morphAttributes.position!==void 0,morphNormals:q.morphAttributes.normal!==void 0,morphColors:q.morphAttributes.color!==void 0,morphTargetsCount:fe,morphTextureStride:He,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&L.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ne,decodeVideoTexture:Ze&&M.map.isVideoTexture===!0&&$e.getTransfer(M.map.colorSpace)===it,decodeVideoTextureEmissive:_e&&M.emissiveMap.isVideoTexture===!0&&$e.getTransfer(M.emissiveMap.colorSpace)===it,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===Kt,flipSided:M.side===Yt,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:xe&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(xe&&M.extensions.multiDraw===!0||Te)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return ht.vertexUv1s=l.has(1),ht.vertexUv2s=l.has(2),ht.vertexUv3s=l.has(3),l.clear(),ht}function d(M){let _=[];if(M.shaderID?_.push(M.shaderID):(_.push(M.customVertexShaderID),_.push(M.customFragmentShaderID)),M.defines!==void 0)for(let L in M.defines)_.push(L),_.push(M.defines[L]);return M.isRawShaderMaterial===!1&&(w(_,M),E(_,M),_.push(i.outputColorSpace)),_.push(M.customProgramCacheKey),_.join()}function w(M,_){M.push(_.precision),M.push(_.outputColorSpace),M.push(_.envMapMode),M.push(_.envMapCubeUVHeight),M.push(_.mapUv),M.push(_.alphaMapUv),M.push(_.lightMapUv),M.push(_.aoMapUv),M.push(_.bumpMapUv),M.push(_.normalMapUv),M.push(_.displacementMapUv),M.push(_.emissiveMapUv),M.push(_.metalnessMapUv),M.push(_.roughnessMapUv),M.push(_.anisotropyMapUv),M.push(_.clearcoatMapUv),M.push(_.clearcoatNormalMapUv),M.push(_.clearcoatRoughnessMapUv),M.push(_.iridescenceMapUv),M.push(_.iridescenceThicknessMapUv),M.push(_.sheenColorMapUv),M.push(_.sheenRoughnessMapUv),M.push(_.specularMapUv),M.push(_.specularColorMapUv),M.push(_.specularIntensityMapUv),M.push(_.transmissionMapUv),M.push(_.thicknessMapUv),M.push(_.combine),M.push(_.fogExp2),M.push(_.sizeAttenuation),M.push(_.morphTargetsCount),M.push(_.morphAttributeCount),M.push(_.numDirLights),M.push(_.numPointLights),M.push(_.numSpotLights),M.push(_.numSpotLightMaps),M.push(_.numHemiLights),M.push(_.numRectAreaLights),M.push(_.numDirLightShadows),M.push(_.numPointLightShadows),M.push(_.numSpotLightShadows),M.push(_.numSpotLightShadowsWithMaps),M.push(_.numLightProbes),M.push(_.shadowMapType),M.push(_.toneMapping),M.push(_.numClippingPlanes),M.push(_.numClipIntersection),M.push(_.depthPacking)}function E(M,_){o.disableAll(),_.supportsVertexTextures&&o.enable(0),_.instancing&&o.enable(1),_.instancingColor&&o.enable(2),_.instancingMorph&&o.enable(3),_.matcap&&o.enable(4),_.envMap&&o.enable(5),_.normalMapObjectSpace&&o.enable(6),_.normalMapTangentSpace&&o.enable(7),_.clearcoat&&o.enable(8),_.iridescence&&o.enable(9),_.alphaTest&&o.enable(10),_.vertexColors&&o.enable(11),_.vertexAlphas&&o.enable(12),_.vertexUv1s&&o.enable(13),_.vertexUv2s&&o.enable(14),_.vertexUv3s&&o.enable(15),_.vertexTangents&&o.enable(16),_.anisotropy&&o.enable(17),_.alphaHash&&o.enable(18),_.batching&&o.enable(19),_.dispersion&&o.enable(20),_.batchingColor&&o.enable(21),_.gradientMap&&o.enable(22),M.push(o.mask),o.disableAll(),_.fog&&o.enable(0),_.useFog&&o.enable(1),_.flatShading&&o.enable(2),_.logarithmicDepthBuffer&&o.enable(3),_.reversedDepthBuffer&&o.enable(4),_.skinning&&o.enable(5),_.morphTargets&&o.enable(6),_.morphNormals&&o.enable(7),_.morphColors&&o.enable(8),_.premultipliedAlpha&&o.enable(9),_.shadowMapEnabled&&o.enable(10),_.doubleSided&&o.enable(11),_.flipSided&&o.enable(12),_.useDepthPacking&&o.enable(13),_.dithering&&o.enable(14),_.transmission&&o.enable(15),_.sheen&&o.enable(16),_.opaque&&o.enable(17),_.pointsUvs&&o.enable(18),_.decodeVideoTexture&&o.enable(19),_.decodeVideoTextureEmissive&&o.enable(20),_.alphaToCoverage&&o.enable(21),M.push(o.mask)}function b(M){let _=g[M.type],L;if(_){let O=Ln[_];L=Yh.clone(O.uniforms)}else L=M.uniforms;return L}function R(M,_){let L;for(let O=0,z=h.length;O<z;O++){let X=h[O];if(X.cacheKey===_){L=X,++L.usedTimes;break}}return L===void 0&&(L=new Yg(i,_,M,r),h.push(L)),L}function C(M){if(--M.usedTimes===0){let _=h.indexOf(M);h[_]=h[h.length-1],h.pop(),M.destroy()}}function T(M){c.remove(M)}function I(){c.dispose()}return{getParameters:m,getProgramCacheKey:d,getUniforms:b,acquireProgram:R,releaseProgram:C,releaseShaderCache:T,programs:h,dispose:I}}function Jg(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,c){i.get(a)[o]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function Kg(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function mu(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function gu(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(u,f,p,g,y,m){let d=i[e];return d===void 0?(d={id:u.id,object:u,geometry:f,material:p,groupOrder:g,renderOrder:u.renderOrder,z:y,group:m},i[e]=d):(d.id=u.id,d.object=u,d.geometry=f,d.material=p,d.groupOrder=g,d.renderOrder=u.renderOrder,d.z=y,d.group=m),e++,d}function o(u,f,p,g,y,m){let d=a(u,f,p,g,y,m);p.transmission>0?n.push(d):p.transparent===!0?s.push(d):t.push(d)}function c(u,f,p,g,y,m){let d=a(u,f,p,g,y,m);p.transmission>0?n.unshift(d):p.transparent===!0?s.unshift(d):t.unshift(d)}function l(u,f){t.length>1&&t.sort(u||Kg),n.length>1&&n.sort(f||mu),s.length>1&&s.sort(f||mu)}function h(){for(let u=e,f=i.length;u<f;u++){let p=i[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:o,unshift:c,finish:h,sort:l}}function jg(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new gu,i.set(n,[a])):s>=r.length?(a=new gu,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function Qg(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new N,color:new ke};break;case"SpotLight":t={position:new N,direction:new N,color:new ke,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new N,color:new ke,distance:0,decay:0};break;case"HemisphereLight":t={direction:new N,skyColor:new ke,groundColor:new ke};break;case"RectAreaLight":t={color:new ke,position:new N,halfWidth:new N,halfHeight:new N};break}return i[e.id]=t,t}}}function e0(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var t0=0;function n0(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function i0(i){let e=new Qg,t=e0(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new N);let s=new N,r=new xt,a=new xt;function o(l){let h=0,u=0,f=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let p=0,g=0,y=0,m=0,d=0,w=0,E=0,b=0,R=0,C=0,T=0;l.sort(n0);for(let M=0,_=l.length;M<_;M++){let L=l[M],O=L.color,z=L.intensity,X=L.distance,q=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)h+=O.r*z,u+=O.g*z,f+=O.b*z;else if(L.isLightProbe){for(let G=0;G<9;G++)n.probe[G].addScaledVector(L.sh.coefficients[G],z);T++}else if(L.isDirectionalLight){let G=e.get(L);if(G.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let se=L.shadow,W=t.get(L);W.shadowIntensity=se.intensity,W.shadowBias=se.bias,W.shadowNormalBias=se.normalBias,W.shadowRadius=se.radius,W.shadowMapSize=se.mapSize,n.directionalShadow[p]=W,n.directionalShadowMap[p]=q,n.directionalShadowMatrix[p]=L.shadow.matrix,w++}n.directional[p]=G,p++}else if(L.isSpotLight){let G=e.get(L);G.position.setFromMatrixPosition(L.matrixWorld),G.color.copy(O).multiplyScalar(z),G.distance=X,G.coneCos=Math.cos(L.angle),G.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),G.decay=L.decay,n.spot[y]=G;let se=L.shadow;if(L.map&&(n.spotLightMap[R]=L.map,R++,se.updateMatrices(L),L.castShadow&&C++),n.spotLightMatrix[y]=se.matrix,L.castShadow){let W=t.get(L);W.shadowIntensity=se.intensity,W.shadowBias=se.bias,W.shadowNormalBias=se.normalBias,W.shadowRadius=se.radius,W.shadowMapSize=se.mapSize,n.spotShadow[y]=W,n.spotShadowMap[y]=q,b++}y++}else if(L.isRectAreaLight){let G=e.get(L);G.color.copy(O).multiplyScalar(z),G.halfWidth.set(L.width*.5,0,0),G.halfHeight.set(0,L.height*.5,0),n.rectArea[m]=G,m++}else if(L.isPointLight){let G=e.get(L);if(G.color.copy(L.color).multiplyScalar(L.intensity),G.distance=L.distance,G.decay=L.decay,L.castShadow){let se=L.shadow,W=t.get(L);W.shadowIntensity=se.intensity,W.shadowBias=se.bias,W.shadowNormalBias=se.normalBias,W.shadowRadius=se.radius,W.shadowMapSize=se.mapSize,W.shadowCameraNear=se.camera.near,W.shadowCameraFar=se.camera.far,n.pointShadow[g]=W,n.pointShadowMap[g]=q,n.pointShadowMatrix[g]=L.shadow.matrix,E++}n.point[g]=G,g++}else if(L.isHemisphereLight){let G=e.get(L);G.skyColor.copy(L.color).multiplyScalar(z),G.groundColor.copy(L.groundColor).multiplyScalar(z),n.hemi[d]=G,d++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=le.LTC_FLOAT_1,n.rectAreaLTC2=le.LTC_FLOAT_2):(n.rectAreaLTC1=le.LTC_HALF_1,n.rectAreaLTC2=le.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;let I=n.hash;(I.directionalLength!==p||I.pointLength!==g||I.spotLength!==y||I.rectAreaLength!==m||I.hemiLength!==d||I.numDirectionalShadows!==w||I.numPointShadows!==E||I.numSpotShadows!==b||I.numSpotMaps!==R||I.numLightProbes!==T)&&(n.directional.length=p,n.spot.length=y,n.rectArea.length=m,n.point.length=g,n.hemi.length=d,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.pointShadow.length=E,n.pointShadowMap.length=E,n.spotShadow.length=b,n.spotShadowMap.length=b,n.directionalShadowMatrix.length=w,n.pointShadowMatrix.length=E,n.spotLightMatrix.length=b+R-C,n.spotLightMap.length=R,n.numSpotLightShadowsWithMaps=C,n.numLightProbes=T,I.directionalLength=p,I.pointLength=g,I.spotLength=y,I.rectAreaLength=m,I.hemiLength=d,I.numDirectionalShadows=w,I.numPointShadows=E,I.numSpotShadows=b,I.numSpotMaps=R,I.numLightProbes=T,n.version=t0++)}function c(l,h){let u=0,f=0,p=0,g=0,y=0,m=h.matrixWorldInverse;for(let d=0,w=l.length;d<w;d++){let E=l[d];if(E.isDirectionalLight){let b=n.directional[u];b.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(m),u++}else if(E.isSpotLight){let b=n.spot[p];b.position.setFromMatrixPosition(E.matrixWorld),b.position.applyMatrix4(m),b.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(m),p++}else if(E.isRectAreaLight){let b=n.rectArea[g];b.position.setFromMatrixPosition(E.matrixWorld),b.position.applyMatrix4(m),a.identity(),r.copy(E.matrixWorld),r.premultiply(m),a.extractRotation(r),b.halfWidth.set(E.width*.5,0,0),b.halfHeight.set(0,E.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),g++}else if(E.isPointLight){let b=n.point[f];b.position.setFromMatrixPosition(E.matrixWorld),b.position.applyMatrix4(m),f++}else if(E.isHemisphereLight){let b=n.hemi[y];b.direction.setFromMatrixPosition(E.matrixWorld),b.direction.transformDirection(m),y++}}}return{setup:o,setupView:c,state:n}}function yu(i){let e=new i0(i),t=[],n=[];function s(h){l.camera=h,t.length=0,n.length=0}function r(h){t.push(h)}function a(h){n.push(h)}function o(){e.setup(t)}function c(h){e.setupView(t,h)}let l={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:l,setupLights:o,setupLightsView:c,pushLight:r,pushShadow:a}}function s0(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new yu(i),e.set(s,[o])):r>=a.length?(o=new yu(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var r0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,a0=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function o0(i,e,t){let n=new fs,s=new Ge,r=new Ge,a=new nt,o=new aa({depthPacking:Uh}),c=new oa,l={},h=t.maxTextureSize,u={[Wn]:Yt,[Yt]:Wn,[Kt]:Kt},f=new vn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ge},radius:{value:4}},vertexShader:r0,fragmentShader:a0}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let g=new Ut;g.setAttribute("position",new Vt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new At(g,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=El;let d=this.type;this.render=function(C,T,I){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||C.length===0)return;let M=i.getRenderTarget(),_=i.getActiveCubeFace(),L=i.getActiveMipmapLevel(),O=i.state;O.setBlending(jn),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);let z=d!==In&&this.type===In,X=d===In&&this.type!==In;for(let q=0,G=C.length;q<G;q++){let se=C[q],W=se.shadow;if(W===void 0){console.warn("THREE.WebGLShadowMap:",se,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;s.copy(W.mapSize);let oe=W.getFrameExtents();if(s.multiply(oe),r.copy(W.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/oe.x),s.x=r.x*oe.x,W.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/oe.y),s.y=r.y*oe.y,W.mapSize.y=r.y)),W.map===null||z===!0||X===!0){let fe=this.type!==In?{minFilter:un,magFilter:un}:{};W.map!==null&&W.map.dispose(),W.map=new Tn(s.x,s.y,fe),W.map.texture.name=se.name+".shadowMap",W.camera.updateProjectionMatrix()}i.setRenderTarget(W.map),i.clear();let he=W.getViewportCount();for(let fe=0;fe<he;fe++){let He=W.getViewport(fe);a.set(r.x*He.x,r.y*He.y,r.x*He.z,r.y*He.w),O.viewport(a),W.updateMatrices(se,fe),n=W.getFrustum(),b(T,I,W.camera,se,this.type)}W.isPointLightShadow!==!0&&this.type===In&&w(W,I),W.needsUpdate=!1}d=this.type,m.needsUpdate=!1,i.setRenderTarget(M,_,L)};function w(C,T){let I=e.update(y);f.defines.VSM_SAMPLES!==C.blurSamples&&(f.defines.VSM_SAMPLES=C.blurSamples,p.defines.VSM_SAMPLES=C.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new Tn(s.x,s.y)),f.uniforms.shadow_pass.value=C.map.texture,f.uniforms.resolution.value=C.mapSize,f.uniforms.radius.value=C.radius,i.setRenderTarget(C.mapPass),i.clear(),i.renderBufferDirect(T,null,I,f,y,null),p.uniforms.shadow_pass.value=C.mapPass.texture,p.uniforms.resolution.value=C.mapSize,p.uniforms.radius.value=C.radius,i.setRenderTarget(C.map),i.clear(),i.renderBufferDirect(T,null,I,p,y,null)}function E(C,T,I,M){let _=null,L=I.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(L!==void 0)_=L;else if(_=I.isPointLight===!0?c:o,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0||T.alphaToCoverage===!0){let O=_.uuid,z=T.uuid,X=l[O];X===void 0&&(X={},l[O]=X);let q=X[z];q===void 0&&(q=_.clone(),X[z]=q,T.addEventListener("dispose",R)),_=q}if(_.visible=T.visible,_.wireframe=T.wireframe,M===In?_.side=T.shadowSide!==null?T.shadowSide:T.side:_.side=T.shadowSide!==null?T.shadowSide:u[T.side],_.alphaMap=T.alphaMap,_.alphaTest=T.alphaToCoverage===!0?.5:T.alphaTest,_.map=T.map,_.clipShadows=T.clipShadows,_.clippingPlanes=T.clippingPlanes,_.clipIntersection=T.clipIntersection,_.displacementMap=T.displacementMap,_.displacementScale=T.displacementScale,_.displacementBias=T.displacementBias,_.wireframeLinewidth=T.wireframeLinewidth,_.linewidth=T.linewidth,I.isPointLight===!0&&_.isMeshDistanceMaterial===!0){let O=i.properties.get(_);O.light=I}return _}function b(C,T,I,M,_){if(C.visible===!1)return;if(C.layers.test(T.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&_===In)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,C.matrixWorld);let z=e.update(C),X=C.material;if(Array.isArray(X)){let q=z.groups;for(let G=0,se=q.length;G<se;G++){let W=q[G],oe=X[W.materialIndex];if(oe&&oe.visible){let he=E(C,oe,M,_);C.onBeforeShadow(i,C,T,I,z,he,W),i.renderBufferDirect(I,null,z,he,C,W),C.onAfterShadow(i,C,T,I,z,he,W)}}}else if(X.visible){let q=E(C,X,M,_);C.onBeforeShadow(i,C,T,I,z,q,null),i.renderBufferDirect(I,null,z,q,C,null),C.onAfterShadow(i,C,T,I,z,q,null)}}let O=C.children;for(let z=0,X=O.length;z<X;z++)b(O[z],T,I,M,_)}function R(C){C.target.removeEventListener("dispose",R);for(let I in l){let M=l[I],_=C.target.uuid;_ in M&&(M[_].dispose(),delete M[_])}}}var l0={[_a]:Ma,[ba]:Ea,[Sa]:Ta,[Ii]:wa,[Ma]:_a,[Ea]:ba,[Ta]:Sa,[wa]:Ii};function c0(i,e){function t(){let D=!1,ie=new nt,ae=null,me=new nt(0,0,0,0);return{setMask:function(ee){ae!==ee&&!D&&(i.colorMask(ee,ee,ee,ee),ae=ee)},setLocked:function(ee){D=ee},setClear:function(ee,J,xe,Ne,ht){ht===!0&&(ee*=Ne,J*=Ne,xe*=Ne),ie.set(ee,J,xe,Ne),me.equals(ie)===!1&&(i.clearColor(ee,J,xe,Ne),me.copy(ie))},reset:function(){D=!1,ae=null,me.set(-1,0,0,0)}}}function n(){let D=!1,ie=!1,ae=null,me=null,ee=null;return{setReversed:function(J){if(ie!==J){let xe=e.get("EXT_clip_control");J?xe.clipControlEXT(xe.LOWER_LEFT_EXT,xe.ZERO_TO_ONE_EXT):xe.clipControlEXT(xe.LOWER_LEFT_EXT,xe.NEGATIVE_ONE_TO_ONE_EXT),ie=J;let Ne=ee;ee=null,this.setClear(Ne)}},getReversed:function(){return ie},setTest:function(J){J?Q(i.DEPTH_TEST):ge(i.DEPTH_TEST)},setMask:function(J){ae!==J&&!D&&(i.depthMask(J),ae=J)},setFunc:function(J){if(ie&&(J=l0[J]),me!==J){switch(J){case _a:i.depthFunc(i.NEVER);break;case Ma:i.depthFunc(i.ALWAYS);break;case ba:i.depthFunc(i.LESS);break;case Ii:i.depthFunc(i.LEQUAL);break;case Sa:i.depthFunc(i.EQUAL);break;case wa:i.depthFunc(i.GEQUAL);break;case Ea:i.depthFunc(i.GREATER);break;case Ta:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}me=J}},setLocked:function(J){D=J},setClear:function(J){ee!==J&&(ie&&(J=1-J),i.clearDepth(J),ee=J)},reset:function(){D=!1,ae=null,me=null,ee=null,ie=!1}}}function s(){let D=!1,ie=null,ae=null,me=null,ee=null,J=null,xe=null,Ne=null,ht=null;return{setTest:function(et){D||(et?Q(i.STENCIL_TEST):ge(i.STENCIL_TEST))},setMask:function(et){ie!==et&&!D&&(i.stencilMask(et),ie=et)},setFunc:function(et,On,Sn){(ae!==et||me!==On||ee!==Sn)&&(i.stencilFunc(et,On,Sn),ae=et,me=On,ee=Sn)},setOp:function(et,On,Sn){(J!==et||xe!==On||Ne!==Sn)&&(i.stencilOp(et,On,Sn),J=et,xe=On,Ne=Sn)},setLocked:function(et){D=et},setClear:function(et){ht!==et&&(i.clearStencil(et),ht=et)},reset:function(){D=!1,ie=null,ae=null,me=null,ee=null,J=null,xe=null,Ne=null,ht=null}}}let r=new t,a=new n,o=new s,c=new WeakMap,l=new WeakMap,h={},u={},f=new WeakMap,p=[],g=null,y=!1,m=null,d=null,w=null,E=null,b=null,R=null,C=null,T=new ke(0,0,0),I=0,M=!1,_=null,L=null,O=null,z=null,X=null,q=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),G=!1,se=0,W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(se=parseFloat(/^WebGL (\d)/.exec(W)[1]),G=se>=1):W.indexOf("OpenGL ES")!==-1&&(se=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),G=se>=2);let oe=null,he={},fe=i.getParameter(i.SCISSOR_BOX),He=i.getParameter(i.VIEWPORT),ct=new nt().fromArray(fe),mt=new nt().fromArray(He);function Qe(D,ie,ae,me){let ee=new Uint8Array(4),J=i.createTexture();i.bindTexture(D,J),i.texParameteri(D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(D,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let xe=0;xe<ae;xe++)D===i.TEXTURE_3D||D===i.TEXTURE_2D_ARRAY?i.texImage3D(ie,0,i.RGBA,1,1,me,0,i.RGBA,i.UNSIGNED_BYTE,ee):i.texImage2D(ie+xe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ee);return J}let $={};$[i.TEXTURE_2D]=Qe(i.TEXTURE_2D,i.TEXTURE_2D,1),$[i.TEXTURE_CUBE_MAP]=Qe(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[i.TEXTURE_2D_ARRAY]=Qe(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),$[i.TEXTURE_3D]=Qe(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),Q(i.DEPTH_TEST),a.setFunc(Ii),Pe(!1),ve(wl),Q(i.CULL_FACE),gt(jn);function Q(D){h[D]!==!0&&(i.enable(D),h[D]=!0)}function ge(D){h[D]!==!1&&(i.disable(D),h[D]=!1)}function De(D,ie){return u[D]!==ie?(i.bindFramebuffer(D,ie),u[D]=ie,D===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ie),D===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ie),!0):!1}function Te(D,ie){let ae=p,me=!1;if(D){ae=f.get(ie),ae===void 0&&(ae=[],f.set(ie,ae));let ee=D.textures;if(ae.length!==ee.length||ae[0]!==i.COLOR_ATTACHMENT0){for(let J=0,xe=ee.length;J<xe;J++)ae[J]=i.COLOR_ATTACHMENT0+J;ae.length=ee.length,me=!0}}else ae[0]!==i.BACK&&(ae[0]=i.BACK,me=!0);me&&i.drawBuffers(ae)}function Ze(D){return g!==D?(i.useProgram(D),g=D,!0):!1}let Ot={[di]:i.FUNC_ADD,[lh]:i.FUNC_SUBTRACT,[ch]:i.FUNC_REVERSE_SUBTRACT};Ot[hh]=i.MIN,Ot[uh]=i.MAX;let P={[dh]:i.ZERO,[fh]:i.ONE,[ph]:i.SRC_COLOR,[Jr]:i.SRC_ALPHA,[_h]:i.SRC_ALPHA_SATURATE,[xh]:i.DST_COLOR,[gh]:i.DST_ALPHA,[mh]:i.ONE_MINUS_SRC_COLOR,[Kr]:i.ONE_MINUS_SRC_ALPHA,[vh]:i.ONE_MINUS_DST_COLOR,[yh]:i.ONE_MINUS_DST_ALPHA,[Mh]:i.CONSTANT_COLOR,[bh]:i.ONE_MINUS_CONSTANT_COLOR,[Sh]:i.CONSTANT_ALPHA,[wh]:i.ONE_MINUS_CONSTANT_ALPHA};function gt(D,ie,ae,me,ee,J,xe,Ne,ht,et){if(D===jn){y===!0&&(ge(i.BLEND),y=!1);return}if(y===!1&&(Q(i.BLEND),y=!0),D!==oh){if(D!==m||et!==M){if((d!==di||b!==di)&&(i.blendEquation(i.FUNC_ADD),d=di,b=di),et)switch(D){case Ri:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Tl:i.blendFunc(i.ONE,i.ONE);break;case Al:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Cl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case Ri:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Tl:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Al:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Cl:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}w=null,E=null,R=null,C=null,T.set(0,0,0),I=0,m=D,M=et}return}ee=ee||ie,J=J||ae,xe=xe||me,(ie!==d||ee!==b)&&(i.blendEquationSeparate(Ot[ie],Ot[ee]),d=ie,b=ee),(ae!==w||me!==E||J!==R||xe!==C)&&(i.blendFuncSeparate(P[ae],P[me],P[J],P[xe]),w=ae,E=me,R=J,C=xe),(Ne.equals(T)===!1||ht!==I)&&(i.blendColor(Ne.r,Ne.g,Ne.b,ht),T.copy(Ne),I=ht),m=D,M=!1}function Ue(D,ie){D.side===Kt?ge(i.CULL_FACE):Q(i.CULL_FACE);let ae=D.side===Yt;ie&&(ae=!ae),Pe(ae),D.blending===Ri&&D.transparent===!1?gt(jn):gt(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),a.setFunc(D.depthFunc),a.setTest(D.depthTest),a.setMask(D.depthWrite),r.setMask(D.colorWrite);let me=D.stencilWrite;o.setTest(me),me&&(o.setMask(D.stencilWriteMask),o.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),o.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),_e(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?Q(i.SAMPLE_ALPHA_TO_COVERAGE):ge(i.SAMPLE_ALPHA_TO_COVERAGE)}function Pe(D){_!==D&&(D?i.frontFace(i.CW):i.frontFace(i.CCW),_=D)}function ve(D){D!==rh?(Q(i.CULL_FACE),D!==L&&(D===wl?i.cullFace(i.BACK):D===ah?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ge(i.CULL_FACE),L=D}function yt(D){D!==O&&(G&&i.lineWidth(D),O=D)}function _e(D,ie,ae){D?(Q(i.POLYGON_OFFSET_FILL),(z!==ie||X!==ae)&&(i.polygonOffset(ie,ae),z=ie,X=ae)):ge(i.POLYGON_OFFSET_FILL)}function Be(D){D?Q(i.SCISSOR_TEST):ge(i.SCISSOR_TEST)}function It(D){D===void 0&&(D=i.TEXTURE0+q-1),oe!==D&&(i.activeTexture(D),oe=D)}function wt(D,ie,ae){ae===void 0&&(oe===null?ae=i.TEXTURE0+q-1:ae=oe);let me=he[ae];me===void 0&&(me={type:void 0,texture:void 0},he[ae]=me),(me.type!==D||me.texture!==ie)&&(oe!==ae&&(i.activeTexture(ae),oe=ae),i.bindTexture(D,ie||$[D]),me.type=D,me.texture=ie)}function A(){let D=he[oe];D!==void 0&&D.type!==void 0&&(i.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function v(){try{i.compressedTexImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function k(){try{i.compressedTexImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Z(){try{i.texSubImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function j(){try{i.texSubImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Y(){try{i.compressedTexSubImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ee(){try{i.compressedTexSubImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function re(){try{i.texStorage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function be(){try{i.texStorage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Se(){try{i.texImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ne(){try{i.texImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function de(D){ct.equals(D)===!1&&(i.scissor(D.x,D.y,D.z,D.w),ct.copy(D))}function Ie(D){mt.equals(D)===!1&&(i.viewport(D.x,D.y,D.z,D.w),mt.copy(D))}function we(D,ie){let ae=l.get(ie);ae===void 0&&(ae=new WeakMap,l.set(ie,ae));let me=ae.get(D);me===void 0&&(me=i.getUniformBlockIndex(ie,D.name),ae.set(D,me))}function ce(D,ie){let me=l.get(ie).get(D);c.get(ie)!==me&&(i.uniformBlockBinding(ie,me,D.__bindingPointIndex),c.set(ie,me))}function Oe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},oe=null,he={},u={},f=new WeakMap,p=[],g=null,y=!1,m=null,d=null,w=null,E=null,b=null,R=null,C=null,T=new ke(0,0,0),I=0,M=!1,_=null,L=null,O=null,z=null,X=null,ct.set(0,0,i.canvas.width,i.canvas.height),mt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:Q,disable:ge,bindFramebuffer:De,drawBuffers:Te,useProgram:Ze,setBlending:gt,setMaterial:Ue,setFlipSided:Pe,setCullFace:ve,setLineWidth:yt,setPolygonOffset:_e,setScissorTest:Be,activeTexture:It,bindTexture:wt,unbindTexture:A,compressedTexImage2D:v,compressedTexImage3D:k,texImage2D:Se,texImage3D:ne,updateUBOMapping:we,uniformBlockBinding:ce,texStorage2D:re,texStorage3D:be,texSubImage2D:Z,texSubImage3D:j,compressedTexSubImage2D:Y,compressedTexSubImage3D:Ee,scissor:de,viewport:Ie,reset:Oe}}function h0(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ge,h=new WeakMap,u,f=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(A,v){return p?new OffscreenCanvas(A,v):Xs("canvas")}function y(A,v,k){let Z=1,j=wt(A);if((j.width>k||j.height>k)&&(Z=k/Math.max(j.width,j.height)),Z<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let Y=Math.floor(Z*j.width),Ee=Math.floor(Z*j.height);u===void 0&&(u=g(Y,Ee));let re=v?g(Y,Ee):u;return re.width=Y,re.height=Ee,re.getContext("2d").drawImage(A,0,0,Y,Ee),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+Y+"x"+Ee+")."),re}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),A;return A}function m(A){return A.generateMipmaps}function d(A){i.generateMipmap(A)}function w(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function E(A,v,k,Z,j=!1){if(A!==null){if(i[A]!==void 0)return i[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let Y=v;if(v===i.RED&&(k===i.FLOAT&&(Y=i.R32F),k===i.HALF_FLOAT&&(Y=i.R16F),k===i.UNSIGNED_BYTE&&(Y=i.R8)),v===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.R8UI),k===i.UNSIGNED_SHORT&&(Y=i.R16UI),k===i.UNSIGNED_INT&&(Y=i.R32UI),k===i.BYTE&&(Y=i.R8I),k===i.SHORT&&(Y=i.R16I),k===i.INT&&(Y=i.R32I)),v===i.RG&&(k===i.FLOAT&&(Y=i.RG32F),k===i.HALF_FLOAT&&(Y=i.RG16F),k===i.UNSIGNED_BYTE&&(Y=i.RG8)),v===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RG8UI),k===i.UNSIGNED_SHORT&&(Y=i.RG16UI),k===i.UNSIGNED_INT&&(Y=i.RG32UI),k===i.BYTE&&(Y=i.RG8I),k===i.SHORT&&(Y=i.RG16I),k===i.INT&&(Y=i.RG32I)),v===i.RGB_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),k===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),k===i.UNSIGNED_INT&&(Y=i.RGB32UI),k===i.BYTE&&(Y=i.RGB8I),k===i.SHORT&&(Y=i.RGB16I),k===i.INT&&(Y=i.RGB32I)),v===i.RGBA_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),k===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),k===i.UNSIGNED_INT&&(Y=i.RGBA32UI),k===i.BYTE&&(Y=i.RGBA8I),k===i.SHORT&&(Y=i.RGBA16I),k===i.INT&&(Y=i.RGBA32I)),v===i.RGB&&(k===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),k===i.UNSIGNED_INT_10F_11F_11F_REV&&(Y=i.R11F_G11F_B10F)),v===i.RGBA){let Ee=j?Gs:$e.getTransfer(Z);k===i.FLOAT&&(Y=i.RGBA32F),k===i.HALF_FLOAT&&(Y=i.RGBA16F),k===i.UNSIGNED_BYTE&&(Y=Ee===it?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function b(A,v){let k;return A?v===null||v===xi||v===_s?k=i.DEPTH24_STENCIL8:v===Pn?k=i.DEPTH32F_STENCIL8:v===xs&&(k=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===xi||v===_s?k=i.DEPTH_COMPONENT24:v===Pn?k=i.DEPTH_COMPONENT32F:v===xs&&(k=i.DEPTH_COMPONENT16),k}function R(A,v){return m(A)===!0||A.isFramebufferTexture&&A.minFilter!==un&&A.minFilter!==yn?Math.log2(Math.max(v.width,v.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?v.mipmaps.length:1}function C(A){let v=A.target;v.removeEventListener("dispose",C),I(v),v.isVideoTexture&&h.delete(v)}function T(A){let v=A.target;v.removeEventListener("dispose",T),_(v)}function I(A){let v=n.get(A);if(v.__webglInit===void 0)return;let k=A.source,Z=f.get(k);if(Z){let j=Z[v.__cacheKey];j.usedTimes--,j.usedTimes===0&&M(A),Object.keys(Z).length===0&&f.delete(k)}n.remove(A)}function M(A){let v=n.get(A);i.deleteTexture(v.__webglTexture);let k=A.source,Z=f.get(k);delete Z[v.__cacheKey],a.memory.textures--}function _(A){let v=n.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),n.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(v.__webglFramebuffer[Z]))for(let j=0;j<v.__webglFramebuffer[Z].length;j++)i.deleteFramebuffer(v.__webglFramebuffer[Z][j]);else i.deleteFramebuffer(v.__webglFramebuffer[Z]);v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer[Z])}else{if(Array.isArray(v.__webglFramebuffer))for(let Z=0;Z<v.__webglFramebuffer.length;Z++)i.deleteFramebuffer(v.__webglFramebuffer[Z]);else i.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&i.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let Z=0;Z<v.__webglColorRenderbuffer.length;Z++)v.__webglColorRenderbuffer[Z]&&i.deleteRenderbuffer(v.__webglColorRenderbuffer[Z]);v.__webglDepthRenderbuffer&&i.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let k=A.textures;for(let Z=0,j=k.length;Z<j;Z++){let Y=n.get(k[Z]);Y.__webglTexture&&(i.deleteTexture(Y.__webglTexture),a.memory.textures--),n.remove(k[Z])}n.remove(A)}let L=0;function O(){L=0}function z(){let A=L;return A>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+s.maxTextures),L+=1,A}function X(A){let v=[];return v.push(A.wrapS),v.push(A.wrapT),v.push(A.wrapR||0),v.push(A.magFilter),v.push(A.minFilter),v.push(A.anisotropy),v.push(A.internalFormat),v.push(A.format),v.push(A.type),v.push(A.generateMipmaps),v.push(A.premultiplyAlpha),v.push(A.flipY),v.push(A.unpackAlignment),v.push(A.colorSpace),v.join()}function q(A,v){let k=n.get(A);if(A.isVideoTexture&&Be(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&k.__version!==A.version){let Z=A.image;if(Z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(k,A,v);return}}else A.isExternalTexture&&(k.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+v)}function G(A,v){let k=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&k.__version!==A.version){$(k,A,v);return}t.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+v)}function se(A,v){let k=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&k.__version!==A.version){$(k,A,v);return}t.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+v)}function W(A,v){let k=n.get(A);if(A.version>0&&k.__version!==A.version){Q(k,A,v);return}t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+v)}let oe={[fi]:i.REPEAT,[ui]:i.CLAMP_TO_EDGE,[jr]:i.MIRRORED_REPEAT},he={[un]:i.NEAREST,[Dh]:i.NEAREST_MIPMAP_NEAREST,[lr]:i.NEAREST_MIPMAP_LINEAR,[yn]:i.LINEAR,[Ia]:i.LINEAR_MIPMAP_NEAREST,[yi]:i.LINEAR_MIPMAP_LINEAR},fe={[Oh]:i.NEVER,[Gh]:i.ALWAYS,[Bh]:i.LESS,[zl]:i.LEQUAL,[kh]:i.EQUAL,[Vh]:i.GEQUAL,[zh]:i.GREATER,[Hh]:i.NOTEQUAL};function He(A,v){if(v.type===Pn&&e.has("OES_texture_float_linear")===!1&&(v.magFilter===yn||v.magFilter===Ia||v.magFilter===lr||v.magFilter===yi||v.minFilter===yn||v.minFilter===Ia||v.minFilter===lr||v.minFilter===yi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,oe[v.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,oe[v.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,oe[v.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,he[v.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,he[v.minFilter]),v.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,fe[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===un||v.minFilter!==lr&&v.minFilter!==yi||v.type===Pn&&e.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||n.get(v).__currentAnisotropy){let k=e.get("EXT_texture_filter_anisotropic");i.texParameterf(A,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy}}}function ct(A,v){let k=!1;A.__webglInit===void 0&&(A.__webglInit=!0,v.addEventListener("dispose",C));let Z=v.source,j=f.get(Z);j===void 0&&(j={},f.set(Z,j));let Y=X(v);if(Y!==A.__cacheKey){j[Y]===void 0&&(j[Y]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,k=!0),j[Y].usedTimes++;let Ee=j[A.__cacheKey];Ee!==void 0&&(j[A.__cacheKey].usedTimes--,Ee.usedTimes===0&&M(v)),A.__cacheKey=Y,A.__webglTexture=j[Y].texture}return k}function mt(A,v,k){return Math.floor(Math.floor(A/k)/v)}function Qe(A,v,k,Z){let Y=A.updateRanges;if(Y.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,v.width,v.height,k,Z,v.data);else{Y.sort((ne,de)=>ne.start-de.start);let Ee=0;for(let ne=1;ne<Y.length;ne++){let de=Y[Ee],Ie=Y[ne],we=de.start+de.count,ce=mt(Ie.start,v.width,4),Oe=mt(de.start,v.width,4);Ie.start<=we+1&&ce===Oe&&mt(Ie.start+Ie.count-1,v.width,4)===ce?de.count=Math.max(de.count,Ie.start+Ie.count-de.start):(++Ee,Y[Ee]=Ie)}Y.length=Ee+1;let re=i.getParameter(i.UNPACK_ROW_LENGTH),be=i.getParameter(i.UNPACK_SKIP_PIXELS),Se=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,v.width);for(let ne=0,de=Y.length;ne<de;ne++){let Ie=Y[ne],we=Math.floor(Ie.start/4),ce=Math.ceil(Ie.count/4),Oe=we%v.width,D=Math.floor(we/v.width),ie=ce,ae=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,Oe),i.pixelStorei(i.UNPACK_SKIP_ROWS,D),t.texSubImage2D(i.TEXTURE_2D,0,Oe,D,ie,ae,k,Z,v.data)}A.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,re),i.pixelStorei(i.UNPACK_SKIP_PIXELS,be),i.pixelStorei(i.UNPACK_SKIP_ROWS,Se)}}function $(A,v,k){let Z=i.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(Z=i.TEXTURE_2D_ARRAY),v.isData3DTexture&&(Z=i.TEXTURE_3D);let j=ct(A,v),Y=v.source;t.bindTexture(Z,A.__webglTexture,i.TEXTURE0+k);let Ee=n.get(Y);if(Y.version!==Ee.__version||j===!0){t.activeTexture(i.TEXTURE0+k);let re=$e.getPrimaries($e.workingColorSpace),be=v.colorSpace===ei?null:$e.getPrimaries(v.colorSpace),Se=v.colorSpace===ei||re===be?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Se);let ne=y(v.image,!1,s.maxTextureSize);ne=It(v,ne);let de=r.convert(v.format,v.colorSpace),Ie=r.convert(v.type),we=E(v.internalFormat,de,Ie,v.colorSpace,v.isVideoTexture);He(Z,v);let ce,Oe=v.mipmaps,D=v.isVideoTexture!==!0,ie=Ee.__version===void 0||j===!0,ae=Y.dataReady,me=R(v,ne);if(v.isDepthTexture)we=b(v.format===Ms,v.type),ie&&(D?t.texStorage2D(i.TEXTURE_2D,1,we,ne.width,ne.height):t.texImage2D(i.TEXTURE_2D,0,we,ne.width,ne.height,0,de,Ie,null));else if(v.isDataTexture)if(Oe.length>0){D&&ie&&t.texStorage2D(i.TEXTURE_2D,me,we,Oe[0].width,Oe[0].height);for(let ee=0,J=Oe.length;ee<J;ee++)ce=Oe[ee],D?ae&&t.texSubImage2D(i.TEXTURE_2D,ee,0,0,ce.width,ce.height,de,Ie,ce.data):t.texImage2D(i.TEXTURE_2D,ee,we,ce.width,ce.height,0,de,Ie,ce.data);v.generateMipmaps=!1}else D?(ie&&t.texStorage2D(i.TEXTURE_2D,me,we,ne.width,ne.height),ae&&Qe(v,ne,de,Ie)):t.texImage2D(i.TEXTURE_2D,0,we,ne.width,ne.height,0,de,Ie,ne.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){D&&ie&&t.texStorage3D(i.TEXTURE_2D_ARRAY,me,we,Oe[0].width,Oe[0].height,ne.depth);for(let ee=0,J=Oe.length;ee<J;ee++)if(ce=Oe[ee],v.format!==dn)if(de!==null)if(D){if(ae)if(v.layerUpdates.size>0){let xe=ql(ce.width,ce.height,v.format,v.type);for(let Ne of v.layerUpdates){let ht=ce.data.subarray(Ne*xe/ce.data.BYTES_PER_ELEMENT,(Ne+1)*xe/ce.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ee,0,0,Ne,ce.width,ce.height,1,de,ht)}v.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ee,0,0,0,ce.width,ce.height,ne.depth,de,ce.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ee,we,ce.width,ce.height,ne.depth,0,ce.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else D?ae&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,ee,0,0,0,ce.width,ce.height,ne.depth,de,Ie,ce.data):t.texImage3D(i.TEXTURE_2D_ARRAY,ee,we,ce.width,ce.height,ne.depth,0,de,Ie,ce.data)}else{D&&ie&&t.texStorage2D(i.TEXTURE_2D,me,we,Oe[0].width,Oe[0].height);for(let ee=0,J=Oe.length;ee<J;ee++)ce=Oe[ee],v.format!==dn?de!==null?D?ae&&t.compressedTexSubImage2D(i.TEXTURE_2D,ee,0,0,ce.width,ce.height,de,ce.data):t.compressedTexImage2D(i.TEXTURE_2D,ee,we,ce.width,ce.height,0,ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):D?ae&&t.texSubImage2D(i.TEXTURE_2D,ee,0,0,ce.width,ce.height,de,Ie,ce.data):t.texImage2D(i.TEXTURE_2D,ee,we,ce.width,ce.height,0,de,Ie,ce.data)}else if(v.isDataArrayTexture)if(D){if(ie&&t.texStorage3D(i.TEXTURE_2D_ARRAY,me,we,ne.width,ne.height,ne.depth),ae)if(v.layerUpdates.size>0){let ee=ql(ne.width,ne.height,v.format,v.type);for(let J of v.layerUpdates){let xe=ne.data.subarray(J*ee/ne.data.BYTES_PER_ELEMENT,(J+1)*ee/ne.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,J,ne.width,ne.height,1,de,Ie,xe)}v.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ne.width,ne.height,ne.depth,de,Ie,ne.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,we,ne.width,ne.height,ne.depth,0,de,Ie,ne.data);else if(v.isData3DTexture)D?(ie&&t.texStorage3D(i.TEXTURE_3D,me,we,ne.width,ne.height,ne.depth),ae&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ne.width,ne.height,ne.depth,de,Ie,ne.data)):t.texImage3D(i.TEXTURE_3D,0,we,ne.width,ne.height,ne.depth,0,de,Ie,ne.data);else if(v.isFramebufferTexture){if(ie)if(D)t.texStorage2D(i.TEXTURE_2D,me,we,ne.width,ne.height);else{let ee=ne.width,J=ne.height;for(let xe=0;xe<me;xe++)t.texImage2D(i.TEXTURE_2D,xe,we,ee,J,0,de,Ie,null),ee>>=1,J>>=1}}else if(Oe.length>0){if(D&&ie){let ee=wt(Oe[0]);t.texStorage2D(i.TEXTURE_2D,me,we,ee.width,ee.height)}for(let ee=0,J=Oe.length;ee<J;ee++)ce=Oe[ee],D?ae&&t.texSubImage2D(i.TEXTURE_2D,ee,0,0,de,Ie,ce):t.texImage2D(i.TEXTURE_2D,ee,we,de,Ie,ce);v.generateMipmaps=!1}else if(D){if(ie){let ee=wt(ne);t.texStorage2D(i.TEXTURE_2D,me,we,ee.width,ee.height)}ae&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,de,Ie,ne)}else t.texImage2D(i.TEXTURE_2D,0,we,de,Ie,ne);m(v)&&d(Z),Ee.__version=Y.version,v.onUpdate&&v.onUpdate(v)}A.__version=v.version}function Q(A,v,k){if(v.image.length!==6)return;let Z=ct(A,v),j=v.source;t.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+k);let Y=n.get(j);if(j.version!==Y.__version||Z===!0){t.activeTexture(i.TEXTURE0+k);let Ee=$e.getPrimaries($e.workingColorSpace),re=v.colorSpace===ei?null:$e.getPrimaries(v.colorSpace),be=v.colorSpace===ei||Ee===re?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,be);let Se=v.isCompressedTexture||v.image[0].isCompressedTexture,ne=v.image[0]&&v.image[0].isDataTexture,de=[];for(let J=0;J<6;J++)!Se&&!ne?de[J]=y(v.image[J],!0,s.maxCubemapSize):de[J]=ne?v.image[J].image:v.image[J],de[J]=It(v,de[J]);let Ie=de[0],we=r.convert(v.format,v.colorSpace),ce=r.convert(v.type),Oe=E(v.internalFormat,we,ce,v.colorSpace),D=v.isVideoTexture!==!0,ie=Y.__version===void 0||Z===!0,ae=j.dataReady,me=R(v,Ie);He(i.TEXTURE_CUBE_MAP,v);let ee;if(Se){D&&ie&&t.texStorage2D(i.TEXTURE_CUBE_MAP,me,Oe,Ie.width,Ie.height);for(let J=0;J<6;J++){ee=de[J].mipmaps;for(let xe=0;xe<ee.length;xe++){let Ne=ee[xe];v.format!==dn?we!==null?D?ae&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,xe,0,0,Ne.width,Ne.height,we,Ne.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,xe,Oe,Ne.width,Ne.height,0,Ne.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?ae&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,xe,0,0,Ne.width,Ne.height,we,ce,Ne.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,xe,Oe,Ne.width,Ne.height,0,we,ce,Ne.data)}}}else{if(ee=v.mipmaps,D&&ie){ee.length>0&&me++;let J=wt(de[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,me,Oe,J.width,J.height)}for(let J=0;J<6;J++)if(ne){D?ae&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,de[J].width,de[J].height,we,ce,de[J].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Oe,de[J].width,de[J].height,0,we,ce,de[J].data);for(let xe=0;xe<ee.length;xe++){let ht=ee[xe].image[J].image;D?ae&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,xe+1,0,0,ht.width,ht.height,we,ce,ht.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,xe+1,Oe,ht.width,ht.height,0,we,ce,ht.data)}}else{D?ae&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,we,ce,de[J]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Oe,we,ce,de[J]);for(let xe=0;xe<ee.length;xe++){let Ne=ee[xe];D?ae&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,xe+1,0,0,we,ce,Ne.image[J]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,xe+1,Oe,we,ce,Ne.image[J])}}}m(v)&&d(i.TEXTURE_CUBE_MAP),Y.__version=j.version,v.onUpdate&&v.onUpdate(v)}A.__version=v.version}function ge(A,v,k,Z,j,Y){let Ee=r.convert(k.format,k.colorSpace),re=r.convert(k.type),be=E(k.internalFormat,Ee,re,k.colorSpace),Se=n.get(v),ne=n.get(k);if(ne.__renderTarget=v,!Se.__hasExternalTextures){let de=Math.max(1,v.width>>Y),Ie=Math.max(1,v.height>>Y);j===i.TEXTURE_3D||j===i.TEXTURE_2D_ARRAY?t.texImage3D(j,Y,be,de,Ie,v.depth,0,Ee,re,null):t.texImage2D(j,Y,be,de,Ie,0,Ee,re,null)}t.bindFramebuffer(i.FRAMEBUFFER,A),_e(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,j,ne.__webglTexture,0,yt(v)):(j===i.TEXTURE_2D||j>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Z,j,ne.__webglTexture,Y),t.bindFramebuffer(i.FRAMEBUFFER,null)}function De(A,v,k){if(i.bindRenderbuffer(i.RENDERBUFFER,A),v.depthBuffer){let Z=v.depthTexture,j=Z&&Z.isDepthTexture?Z.type:null,Y=b(v.stencilBuffer,j),Ee=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,re=yt(v);_e(v)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,re,Y,v.width,v.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,re,Y,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,Y,v.width,v.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Ee,i.RENDERBUFFER,A)}else{let Z=v.textures;for(let j=0;j<Z.length;j++){let Y=Z[j],Ee=r.convert(Y.format,Y.colorSpace),re=r.convert(Y.type),be=E(Y.internalFormat,Ee,re,Y.colorSpace),Se=yt(v);k&&_e(v)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Se,be,v.width,v.height):_e(v)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Se,be,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,be,v.width,v.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Te(A,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,A),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let Z=n.get(v.depthTexture);Z.__renderTarget=v,(!Z.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),q(v.depthTexture,0);let j=Z.__webglTexture,Y=yt(v);if(v.depthTexture.format===as)_e(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,j,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,j,0);else if(v.depthTexture.format===Ms)_e(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,j,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,j,0);else throw new Error("Unknown depthTexture format")}function Ze(A){let v=n.get(A),k=A.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==A.depthTexture){let Z=A.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),Z){let j=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,Z.removeEventListener("dispose",j)};Z.addEventListener("dispose",j),v.__depthDisposeCallback=j}v.__boundDepthTexture=Z}if(A.depthTexture&&!v.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");let Z=A.texture.mipmaps;Z&&Z.length>0?Te(v.__webglFramebuffer[0],A):Te(v.__webglFramebuffer,A)}else if(k){v.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[Z]),v.__webglDepthbuffer[Z]===void 0)v.__webglDepthbuffer[Z]=i.createRenderbuffer(),De(v.__webglDepthbuffer[Z],A,!1);else{let j=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=v.__webglDepthbuffer[Z];i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,Y)}}else{let Z=A.texture.mipmaps;if(Z&&Z.length>0?t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=i.createRenderbuffer(),De(v.__webglDepthbuffer,A,!1);else{let j=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=v.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,Y)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ot(A,v,k){let Z=n.get(A);v!==void 0&&ge(Z.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&Ze(A)}function P(A){let v=A.texture,k=n.get(A),Z=n.get(v);A.addEventListener("dispose",T);let j=A.textures,Y=A.isWebGLCubeRenderTarget===!0,Ee=j.length>1;if(Ee||(Z.__webglTexture===void 0&&(Z.__webglTexture=i.createTexture()),Z.__version=v.version,a.memory.textures++),Y){k.__webglFramebuffer=[];for(let re=0;re<6;re++)if(v.mipmaps&&v.mipmaps.length>0){k.__webglFramebuffer[re]=[];for(let be=0;be<v.mipmaps.length;be++)k.__webglFramebuffer[re][be]=i.createFramebuffer()}else k.__webglFramebuffer[re]=i.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){k.__webglFramebuffer=[];for(let re=0;re<v.mipmaps.length;re++)k.__webglFramebuffer[re]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(Ee)for(let re=0,be=j.length;re<be;re++){let Se=n.get(j[re]);Se.__webglTexture===void 0&&(Se.__webglTexture=i.createTexture(),a.memory.textures++)}if(A.samples>0&&_e(A)===!1){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let re=0;re<j.length;re++){let be=j[re];k.__webglColorRenderbuffer[re]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[re]);let Se=r.convert(be.format,be.colorSpace),ne=r.convert(be.type),de=E(be.internalFormat,Se,ne,be.colorSpace,A.isXRRenderTarget===!0),Ie=yt(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ie,de,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.RENDERBUFFER,k.__webglColorRenderbuffer[re])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),De(k.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Y){t.bindTexture(i.TEXTURE_CUBE_MAP,Z.__webglTexture),He(i.TEXTURE_CUBE_MAP,v);for(let re=0;re<6;re++)if(v.mipmaps&&v.mipmaps.length>0)for(let be=0;be<v.mipmaps.length;be++)ge(k.__webglFramebuffer[re][be],A,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+re,be);else ge(k.__webglFramebuffer[re],A,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+re,0);m(v)&&d(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ee){for(let re=0,be=j.length;re<be;re++){let Se=j[re],ne=n.get(Se),de=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(de=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(de,ne.__webglTexture),He(de,Se),ge(k.__webglFramebuffer,A,Se,i.COLOR_ATTACHMENT0+re,de,0),m(Se)&&d(de)}t.unbindTexture()}else{let re=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(re=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(re,Z.__webglTexture),He(re,v),v.mipmaps&&v.mipmaps.length>0)for(let be=0;be<v.mipmaps.length;be++)ge(k.__webglFramebuffer[be],A,v,i.COLOR_ATTACHMENT0,re,be);else ge(k.__webglFramebuffer,A,v,i.COLOR_ATTACHMENT0,re,0);m(v)&&d(re),t.unbindTexture()}A.depthBuffer&&Ze(A)}function gt(A){let v=A.textures;for(let k=0,Z=v.length;k<Z;k++){let j=v[k];if(m(j)){let Y=w(A),Ee=n.get(j).__webglTexture;t.bindTexture(Y,Ee),d(Y),t.unbindTexture()}}}let Ue=[],Pe=[];function ve(A){if(A.samples>0){if(_e(A)===!1){let v=A.textures,k=A.width,Z=A.height,j=i.COLOR_BUFFER_BIT,Y=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Ee=n.get(A),re=v.length>1;if(re)for(let Se=0;Se<v.length;Se++)t.bindFramebuffer(i.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Ee.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer);let be=A.texture.mipmaps;be&&be.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer);for(let Se=0;Se<v.length;Se++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(j|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(j|=i.STENCIL_BUFFER_BIT)),re){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Ee.__webglColorRenderbuffer[Se]);let ne=n.get(v[Se]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,ne,0)}i.blitFramebuffer(0,0,k,Z,0,0,k,Z,j,i.NEAREST),c===!0&&(Ue.length=0,Pe.length=0,Ue.push(i.COLOR_ATTACHMENT0+Se),A.depthBuffer&&A.resolveDepthBuffer===!1&&(Ue.push(Y),Pe.push(Y),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Pe)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Ue))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),re)for(let Se=0;Se<v.length;Se++){t.bindFramebuffer(i.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.RENDERBUFFER,Ee.__webglColorRenderbuffer[Se]);let ne=n.get(v[Se]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Ee.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.TEXTURE_2D,ne,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&c){let v=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[v])}}}function yt(A){return Math.min(s.maxSamples,A.samples)}function _e(A){let v=n.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function Be(A){let v=a.render.frame;h.get(A)!==v&&(h.set(A,v),A.update())}function It(A,v){let k=A.colorSpace,Z=A.format,j=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||k!==Pi&&k!==ei&&($e.getTransfer(k)===it?(Z!==dn||j!==_n)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),v}function wt(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(l.width=A.naturalWidth||A.width,l.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(l.width=A.displayWidth,l.height=A.displayHeight):(l.width=A.width,l.height=A.height),l}this.allocateTextureUnit=z,this.resetTextureUnits=O,this.setTexture2D=q,this.setTexture2DArray=G,this.setTexture3D=se,this.setTextureCube=W,this.rebindTextures=Ot,this.setupRenderTarget=P,this.updateRenderTargetMipmap=gt,this.updateMultisampleRenderTarget=ve,this.setupDepthRenderbuffer=Ze,this.setupFrameBufferTexture=ge,this.useMultisampledRTT=_e}function u0(i,e){function t(n,s=ei){let r,a=$e.getTransfer(s);if(n===_n)return i.UNSIGNED_BYTE;if(n===La)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Da)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Dl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Nl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Pl)return i.BYTE;if(n===Ll)return i.SHORT;if(n===xs)return i.UNSIGNED_SHORT;if(n===Pa)return i.INT;if(n===xi)return i.UNSIGNED_INT;if(n===Pn)return i.FLOAT;if(n===vs)return i.HALF_FLOAT;if(n===Ul)return i.ALPHA;if(n===Fl)return i.RGB;if(n===dn)return i.RGBA;if(n===as)return i.DEPTH_COMPONENT;if(n===Ms)return i.DEPTH_STENCIL;if(n===Ol)return i.RED;if(n===Na)return i.RED_INTEGER;if(n===Bl)return i.RG;if(n===Ua)return i.RG_INTEGER;if(n===Fa)return i.RGBA_INTEGER;if(n===cr||n===hr||n===ur||n===dr)if(a===it)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===cr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===cr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Oa||n===Ba||n===ka||n===za)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Oa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ba)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ka)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===za)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ha||n===Va||n===Ga)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ha||n===Va)return a===it?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ga)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Wa||n===Xa||n===qa||n===Ya||n===Za||n===$a||n===Ja||n===Ka||n===ja||n===Qa||n===eo||n===to||n===no||n===io)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Wa)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Xa)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===qa)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Ya)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Za)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===$a)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ja)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ka)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ja)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Qa)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===eo)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===to)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===no)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===io)return a===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===so||n===ro||n===ao)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===so)return a===it?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ro)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ao)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===oo||n===lo||n===co||n===ho)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===oo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===lo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===co)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ho)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===_s?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var d0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,f0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,rc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Qs(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new vn({vertexShader:d0,fragmentShader:f0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new At(new $n(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ac=class extends Xn{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",c=1,l=null,h=null,u=null,f=null,p=null,g=null,y=typeof XRWebGLBinding<"u",m=new rc,d={},w=t.getContextAttributes(),E=null,b=null,R=[],C=[],T=new Ge,I=null,M=new Dt;M.viewport=new nt;let _=new Dt;_.viewport=new nt;let L=[M,_],O=new xa,z=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let Q=R[$];return Q===void 0&&(Q=new us,R[$]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function($){let Q=R[$];return Q===void 0&&(Q=new us,R[$]=Q),Q.getGripSpace()},this.getHand=function($){let Q=R[$];return Q===void 0&&(Q=new us,R[$]=Q),Q.getHandSpace()};function q($){let Q=C.indexOf($.inputSource);if(Q===-1)return;let ge=R[Q];ge!==void 0&&(ge.update($.inputSource,$.frame,l||a),ge.dispatchEvent({type:$.type,data:$.inputSource}))}function G(){s.removeEventListener("select",q),s.removeEventListener("selectstart",q),s.removeEventListener("selectend",q),s.removeEventListener("squeeze",q),s.removeEventListener("squeezestart",q),s.removeEventListener("squeezeend",q),s.removeEventListener("end",G),s.removeEventListener("inputsourceschange",se);for(let $=0;$<R.length;$++){let Q=C[$];Q!==null&&(C[$]=null,R[$].disconnect(Q))}z=null,X=null,m.reset();for(let $ in d)delete d[$];e.setRenderTarget(E),p=null,f=null,u=null,s=null,b=null,Qe.stop(),n.isPresenting=!1,e.setPixelRatio(I),e.setSize(T.width,T.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function($){l=$},this.getBaseLayer=function(){return f!==null?f:p},this.getBinding=function(){return u===null&&y&&(u=new XRWebGLBinding(s,t)),u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(E=e.getRenderTarget(),s.addEventListener("select",q),s.addEventListener("selectstart",q),s.addEventListener("selectend",q),s.addEventListener("squeeze",q),s.addEventListener("squeezestart",q),s.addEventListener("squeezeend",q),s.addEventListener("end",G),s.addEventListener("inputsourceschange",se),w.xrCompatible!==!0&&await t.makeXRCompatible(),I=e.getPixelRatio(),e.getSize(T),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let ge=null,De=null,Te=null;w.depth&&(Te=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ge=w.stencil?Ms:as,De=w.stencil?_s:xi);let Ze={colorFormat:t.RGBA8,depthFormat:Te,scaleFactor:r};u=this.getBinding(),f=u.createProjectionLayer(Ze),s.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),b=new Tn(f.textureWidth,f.textureHeight,{format:dn,type:_n,depthTexture:new js(f.textureWidth,f.textureHeight,De,void 0,void 0,void 0,void 0,void 0,void 0,ge),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{let ge={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,t,ge),s.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),b=new Tn(p.framebufferWidth,p.framebufferHeight,{format:dn,type:_n,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),Qe.setContext(s),Qe.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function se($){for(let Q=0;Q<$.removed.length;Q++){let ge=$.removed[Q],De=C.indexOf(ge);De>=0&&(C[De]=null,R[De].disconnect(ge))}for(let Q=0;Q<$.added.length;Q++){let ge=$.added[Q],De=C.indexOf(ge);if(De===-1){for(let Ze=0;Ze<R.length;Ze++)if(Ze>=C.length){C.push(ge),De=Ze;break}else if(C[Ze]===null){C[Ze]=ge,De=Ze;break}if(De===-1)break}let Te=R[De];Te&&Te.connect(ge)}}let W=new N,oe=new N;function he($,Q,ge){W.setFromMatrixPosition(Q.matrixWorld),oe.setFromMatrixPosition(ge.matrixWorld);let De=W.distanceTo(oe),Te=Q.projectionMatrix.elements,Ze=ge.projectionMatrix.elements,Ot=Te[14]/(Te[10]-1),P=Te[14]/(Te[10]+1),gt=(Te[9]+1)/Te[5],Ue=(Te[9]-1)/Te[5],Pe=(Te[8]-1)/Te[0],ve=(Ze[8]+1)/Ze[0],yt=Ot*Pe,_e=Ot*ve,Be=De/(-Pe+ve),It=Be*-Pe;if(Q.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(It),$.translateZ(Be),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Te[10]===-1)$.projectionMatrix.copy(Q.projectionMatrix),$.projectionMatrixInverse.copy(Q.projectionMatrixInverse);else{let wt=Ot+Be,A=P+Be,v=yt-It,k=_e+(De-It),Z=gt*P/A*wt,j=Ue*P/A*wt;$.projectionMatrix.makePerspective(v,k,Z,j,wt,A),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function fe($,Q){Q===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(Q.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let Q=$.near,ge=$.far;m.texture!==null&&(m.depthNear>0&&(Q=m.depthNear),m.depthFar>0&&(ge=m.depthFar)),O.near=_.near=M.near=Q,O.far=_.far=M.far=ge,(z!==O.near||X!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),z=O.near,X=O.far),O.layers.mask=$.layers.mask|6,M.layers.mask=O.layers.mask&3,_.layers.mask=O.layers.mask&5;let De=$.parent,Te=O.cameras;fe(O,De);for(let Ze=0;Ze<Te.length;Ze++)fe(Te[Ze],De);Te.length===2?he(O,M,_):O.projectionMatrix.copy(M.projectionMatrix),He($,O,De)};function He($,Q,ge){ge===null?$.matrix.copy(Q.matrixWorld):($.matrix.copy(ge.matrixWorld),$.matrix.invert(),$.matrix.multiply(Q.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(Q.projectionMatrix),$.projectionMatrixInverse.copy(Q.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=ea*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(f===null&&p===null))return c},this.setFoveation=function($){c=$,f!==null&&(f.fixedFoveation=$),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=$)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(O)},this.getCameraTexture=function($){return d[$]};let ct=null;function mt($,Q){if(h=Q.getViewerPose(l||a),g=Q,h!==null){let ge=h.views;p!==null&&(e.setRenderTargetFramebuffer(b,p.framebuffer),e.setRenderTarget(b));let De=!1;ge.length!==O.cameras.length&&(O.cameras.length=0,De=!0);for(let P=0;P<ge.length;P++){let gt=ge[P],Ue=null;if(p!==null)Ue=p.getViewport(gt);else{let ve=u.getViewSubImage(f,gt);Ue=ve.viewport,P===0&&(e.setRenderTargetTextures(b,ve.colorTexture,ve.depthStencilTexture),e.setRenderTarget(b))}let Pe=L[P];Pe===void 0&&(Pe=new Dt,Pe.layers.enable(P),Pe.viewport=new nt,L[P]=Pe),Pe.matrix.fromArray(gt.transform.matrix),Pe.matrix.decompose(Pe.position,Pe.quaternion,Pe.scale),Pe.projectionMatrix.fromArray(gt.projectionMatrix),Pe.projectionMatrixInverse.copy(Pe.projectionMatrix).invert(),Pe.viewport.set(Ue.x,Ue.y,Ue.width,Ue.height),P===0&&(O.matrix.copy(Pe.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),De===!0&&O.cameras.push(Pe)}let Te=s.enabledFeatures;if(Te&&Te.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){u=n.getBinding();let P=u.getDepthInformation(ge[0]);P&&P.isValid&&P.texture&&m.init(P,s.renderState)}if(Te&&Te.includes("camera-access")&&y){e.state.unbindTexture(),u=n.getBinding();for(let P=0;P<ge.length;P++){let gt=ge[P].camera;if(gt){let Ue=d[gt];Ue||(Ue=new Qs,d[gt]=Ue);let Pe=u.getCameraImage(gt);Ue.sourceTexture=Pe}}}}for(let ge=0;ge<R.length;ge++){let De=C[ge],Te=R[ge];De!==null&&Te!==void 0&&Te.update(De,Q,l||a)}ct&&ct($,Q),Q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Q}),g=null}let Qe=new xu;Qe.setAnimationLoop(mt),this.setAnimationLoop=function($){ct=$},this.dispose=function(){}}},zi=new xn,p0=new xt;function m0(i,e){function t(m,d){m.matrixAutoUpdate===!0&&m.updateMatrix(),d.value.copy(m.matrix)}function n(m,d){d.color.getRGB(m.fogColor.value,Gl(i)),d.isFog?(m.fogNear.value=d.near,m.fogFar.value=d.far):d.isFogExp2&&(m.fogDensity.value=d.density)}function s(m,d,w,E,b){d.isMeshBasicMaterial||d.isMeshLambertMaterial?r(m,d):d.isMeshToonMaterial?(r(m,d),u(m,d)):d.isMeshPhongMaterial?(r(m,d),h(m,d)):d.isMeshStandardMaterial?(r(m,d),f(m,d),d.isMeshPhysicalMaterial&&p(m,d,b)):d.isMeshMatcapMaterial?(r(m,d),g(m,d)):d.isMeshDepthMaterial?r(m,d):d.isMeshDistanceMaterial?(r(m,d),y(m,d)):d.isMeshNormalMaterial?r(m,d):d.isLineBasicMaterial?(a(m,d),d.isLineDashedMaterial&&o(m,d)):d.isPointsMaterial?c(m,d,w,E):d.isSpriteMaterial?l(m,d):d.isShadowMaterial?(m.color.value.copy(d.color),m.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(m,d){m.opacity.value=d.opacity,d.color&&m.diffuse.value.copy(d.color),d.emissive&&m.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(m.map.value=d.map,t(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,t(d.alphaMap,m.alphaMapTransform)),d.bumpMap&&(m.bumpMap.value=d.bumpMap,t(d.bumpMap,m.bumpMapTransform),m.bumpScale.value=d.bumpScale,d.side===Yt&&(m.bumpScale.value*=-1)),d.normalMap&&(m.normalMap.value=d.normalMap,t(d.normalMap,m.normalMapTransform),m.normalScale.value.copy(d.normalScale),d.side===Yt&&m.normalScale.value.negate()),d.displacementMap&&(m.displacementMap.value=d.displacementMap,t(d.displacementMap,m.displacementMapTransform),m.displacementScale.value=d.displacementScale,m.displacementBias.value=d.displacementBias),d.emissiveMap&&(m.emissiveMap.value=d.emissiveMap,t(d.emissiveMap,m.emissiveMapTransform)),d.specularMap&&(m.specularMap.value=d.specularMap,t(d.specularMap,m.specularMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);let w=e.get(d),E=w.envMap,b=w.envMapRotation;E&&(m.envMap.value=E,zi.copy(b),zi.x*=-1,zi.y*=-1,zi.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(zi.y*=-1,zi.z*=-1),m.envMapRotation.value.setFromMatrix4(p0.makeRotationFromEuler(zi)),m.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=d.reflectivity,m.ior.value=d.ior,m.refractionRatio.value=d.refractionRatio),d.lightMap&&(m.lightMap.value=d.lightMap,m.lightMapIntensity.value=d.lightMapIntensity,t(d.lightMap,m.lightMapTransform)),d.aoMap&&(m.aoMap.value=d.aoMap,m.aoMapIntensity.value=d.aoMapIntensity,t(d.aoMap,m.aoMapTransform))}function a(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,d.map&&(m.map.value=d.map,t(d.map,m.mapTransform))}function o(m,d){m.dashSize.value=d.dashSize,m.totalSize.value=d.dashSize+d.gapSize,m.scale.value=d.scale}function c(m,d,w,E){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.size.value=d.size*w,m.scale.value=E*.5,d.map&&(m.map.value=d.map,t(d.map,m.uvTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,t(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function l(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.rotation.value=d.rotation,d.map&&(m.map.value=d.map,t(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,t(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function h(m,d){m.specular.value.copy(d.specular),m.shininess.value=Math.max(d.shininess,1e-4)}function u(m,d){d.gradientMap&&(m.gradientMap.value=d.gradientMap)}function f(m,d){m.metalness.value=d.metalness,d.metalnessMap&&(m.metalnessMap.value=d.metalnessMap,t(d.metalnessMap,m.metalnessMapTransform)),m.roughness.value=d.roughness,d.roughnessMap&&(m.roughnessMap.value=d.roughnessMap,t(d.roughnessMap,m.roughnessMapTransform)),d.envMap&&(m.envMapIntensity.value=d.envMapIntensity)}function p(m,d,w){m.ior.value=d.ior,d.sheen>0&&(m.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),m.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(m.sheenColorMap.value=d.sheenColorMap,t(d.sheenColorMap,m.sheenColorMapTransform)),d.sheenRoughnessMap&&(m.sheenRoughnessMap.value=d.sheenRoughnessMap,t(d.sheenRoughnessMap,m.sheenRoughnessMapTransform))),d.clearcoat>0&&(m.clearcoat.value=d.clearcoat,m.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(m.clearcoatMap.value=d.clearcoatMap,t(d.clearcoatMap,m.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,t(d.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(m.clearcoatNormalMap.value=d.clearcoatNormalMap,t(d.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Yt&&m.clearcoatNormalScale.value.negate())),d.dispersion>0&&(m.dispersion.value=d.dispersion),d.iridescence>0&&(m.iridescence.value=d.iridescence,m.iridescenceIOR.value=d.iridescenceIOR,m.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(m.iridescenceMap.value=d.iridescenceMap,t(d.iridescenceMap,m.iridescenceMapTransform)),d.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=d.iridescenceThicknessMap,t(d.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),d.transmission>0&&(m.transmission.value=d.transmission,m.transmissionSamplerMap.value=w.texture,m.transmissionSamplerSize.value.set(w.width,w.height),d.transmissionMap&&(m.transmissionMap.value=d.transmissionMap,t(d.transmissionMap,m.transmissionMapTransform)),m.thickness.value=d.thickness,d.thicknessMap&&(m.thicknessMap.value=d.thicknessMap,t(d.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=d.attenuationDistance,m.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(m.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(m.anisotropyMap.value=d.anisotropyMap,t(d.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=d.specularIntensity,m.specularColor.value.copy(d.specularColor),d.specularColorMap&&(m.specularColorMap.value=d.specularColorMap,t(d.specularColorMap,m.specularColorMapTransform)),d.specularIntensityMap&&(m.specularIntensityMap.value=d.specularIntensityMap,t(d.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,d){d.matcap&&(m.matcap.value=d.matcap)}function y(m,d){let w=e.get(d).light;m.referencePosition.value.setFromMatrixPosition(w.matrixWorld),m.nearDistance.value=w.shadow.camera.near,m.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function g0(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(w,E){let b=E.program;n.uniformBlockBinding(w,b)}function l(w,E){let b=s[w.id];b===void 0&&(g(w),b=h(w),s[w.id]=b,w.addEventListener("dispose",m));let R=E.program;n.updateUBOMapping(w,R);let C=e.render.frame;r[w.id]!==C&&(f(w),r[w.id]=C)}function h(w){let E=u();w.__bindingPointIndex=E;let b=i.createBuffer(),R=w.__size,C=w.usage;return i.bindBuffer(i.UNIFORM_BUFFER,b),i.bufferData(i.UNIFORM_BUFFER,R,C),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,E,b),b}function u(){for(let w=0;w<o;w++)if(a.indexOf(w)===-1)return a.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(w){let E=s[w.id],b=w.uniforms,R=w.__cache;i.bindBuffer(i.UNIFORM_BUFFER,E);for(let C=0,T=b.length;C<T;C++){let I=Array.isArray(b[C])?b[C]:[b[C]];for(let M=0,_=I.length;M<_;M++){let L=I[M];if(p(L,C,M,R)===!0){let O=L.__offset,z=Array.isArray(L.value)?L.value:[L.value],X=0;for(let q=0;q<z.length;q++){let G=z[q],se=y(G);typeof G=="number"||typeof G=="boolean"?(L.__data[0]=G,i.bufferSubData(i.UNIFORM_BUFFER,O+X,L.__data)):G.isMatrix3?(L.__data[0]=G.elements[0],L.__data[1]=G.elements[1],L.__data[2]=G.elements[2],L.__data[3]=0,L.__data[4]=G.elements[3],L.__data[5]=G.elements[4],L.__data[6]=G.elements[5],L.__data[7]=0,L.__data[8]=G.elements[6],L.__data[9]=G.elements[7],L.__data[10]=G.elements[8],L.__data[11]=0):(G.toArray(L.__data,X),X+=se.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,O,L.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function p(w,E,b,R){let C=w.value,T=E+"_"+b;if(R[T]===void 0)return typeof C=="number"||typeof C=="boolean"?R[T]=C:R[T]=C.clone(),!0;{let I=R[T];if(typeof C=="number"||typeof C=="boolean"){if(I!==C)return R[T]=C,!0}else if(I.equals(C)===!1)return I.copy(C),!0}return!1}function g(w){let E=w.uniforms,b=0,R=16;for(let T=0,I=E.length;T<I;T++){let M=Array.isArray(E[T])?E[T]:[E[T]];for(let _=0,L=M.length;_<L;_++){let O=M[_],z=Array.isArray(O.value)?O.value:[O.value];for(let X=0,q=z.length;X<q;X++){let G=z[X],se=y(G),W=b%R,oe=W%se.boundary,he=W+oe;b+=oe,he!==0&&R-he<se.storage&&(b+=R-he),O.__data=new Float32Array(se.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=b,b+=se.storage}}}let C=b%R;return C>0&&(b+=R-C),w.__size=b,w.__cache={},this}function y(w){let E={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(E.boundary=4,E.storage=4):w.isVector2?(E.boundary=8,E.storage=8):w.isVector3||w.isColor?(E.boundary=16,E.storage=12):w.isVector4?(E.boundary=16,E.storage=16):w.isMatrix3?(E.boundary=48,E.storage=48):w.isMatrix4?(E.boundary=64,E.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),E}function m(w){let E=w.target;E.removeEventListener("dispose",m);let b=a.indexOf(E.__bindingPointIndex);a.splice(b,1),i.deleteBuffer(s[E.id]),delete s[E.id],delete r[E.id]}function d(){for(let w in s)i.deleteBuffer(s[w]);a=[],s={},r={}}return{bind:c,update:l,dispose:d}}var go=class{constructor(e={}){let{canvas:t=Wh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:f=!1}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;let g=new Uint32Array(4),y=new Int32Array(4),m=null,d=null,w=[],E=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Qn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let b=this,R=!1;this._outputColorSpace=Lt;let C=0,T=0,I=null,M=-1,_=null,L=new nt,O=new nt,z=null,X=new ke(0),q=0,G=t.width,se=t.height,W=1,oe=null,he=null,fe=new nt(0,0,G,se),He=new nt(0,0,G,se),ct=!1,mt=new fs,Qe=!1,$=!1,Q=new xt,ge=new N,De=new nt,Te={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ze=!1;function Ot(){return I===null?W:1}let P=n;function gt(S,F){return t.getContext(S,F)}try{let S={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",ae,!1),t.addEventListener("webglcontextrestored",me,!1),t.addEventListener("webglcontextcreationerror",ee,!1),P===null){let F="webgl2";if(P=gt(F,S),P===null)throw gt(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let Ue,Pe,ve,yt,_e,Be,It,wt,A,v,k,Z,j,Y,Ee,re,be,Se,ne,de,Ie,we,ce,Oe;function D(){Ue=new Nm(P),Ue.init(),we=new u0(P,Ue),Pe=new Am(P,Ue,e,we),ve=new c0(P,Ue),Pe.reversedDepthBuffer&&f&&ve.buffers.depth.setReversed(!0),yt=new Om(P),_e=new Jg,Be=new h0(P,Ue,ve,_e,Pe,we,yt),It=new Rm(b),wt=new Dm(b),A=new Vd(P),ce=new Em(P,A),v=new Um(P,A,yt,ce),k=new km(P,v,A,yt),ne=new Bm(P,Pe,Be),re=new Cm(_e),Z=new $g(b,It,wt,Ue,Pe,ce,re),j=new m0(b,_e),Y=new jg,Ee=new s0(Ue),Se=new wm(b,It,wt,ve,k,p,c),be=new o0(b,k,Pe),Oe=new g0(P,yt,Pe,ve),de=new Tm(P,Ue,yt),Ie=new Fm(P,Ue,yt),yt.programs=Z.programs,b.capabilities=Pe,b.extensions=Ue,b.properties=_e,b.renderLists=Y,b.shadowMap=be,b.state=ve,b.info=yt}D();let ie=new ac(b,P);this.xr=ie,this.getContext=function(){return P},this.getContextAttributes=function(){return P.getContextAttributes()},this.forceContextLoss=function(){let S=Ue.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=Ue.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return W},this.setPixelRatio=function(S){S!==void 0&&(W=S,this.setSize(G,se,!1))},this.getSize=function(S){return S.set(G,se)},this.setSize=function(S,F,H=!0){if(ie.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}G=S,se=F,t.width=Math.floor(S*W),t.height=Math.floor(F*W),H===!0&&(t.style.width=S+"px",t.style.height=F+"px"),this.setViewport(0,0,S,F)},this.getDrawingBufferSize=function(S){return S.set(G*W,se*W).floor()},this.setDrawingBufferSize=function(S,F,H){G=S,se=F,W=H,t.width=Math.floor(S*H),t.height=Math.floor(F*H),this.setViewport(0,0,S,F)},this.getCurrentViewport=function(S){return S.copy(L)},this.getViewport=function(S){return S.copy(fe)},this.setViewport=function(S,F,H,V){S.isVector4?fe.set(S.x,S.y,S.z,S.w):fe.set(S,F,H,V),ve.viewport(L.copy(fe).multiplyScalar(W).round())},this.getScissor=function(S){return S.copy(He)},this.setScissor=function(S,F,H,V){S.isVector4?He.set(S.x,S.y,S.z,S.w):He.set(S,F,H,V),ve.scissor(O.copy(He).multiplyScalar(W).round())},this.getScissorTest=function(){return ct},this.setScissorTest=function(S){ve.setScissorTest(ct=S)},this.setOpaqueSort=function(S){oe=S},this.setTransparentSort=function(S){he=S},this.getClearColor=function(S){return S.copy(Se.getClearColor())},this.setClearColor=function(){Se.setClearColor(...arguments)},this.getClearAlpha=function(){return Se.getClearAlpha()},this.setClearAlpha=function(){Se.setClearAlpha(...arguments)},this.clear=function(S=!0,F=!0,H=!0){let V=0;if(S){let B=!1;if(I!==null){let te=I.texture.format;B=te===Fa||te===Ua||te===Na}if(B){let te=I.texture.type,ue=te===_n||te===xi||te===xs||te===_s||te===La||te===Da,ye=Se.getClearColor(),pe=Se.getClearAlpha(),Re=ye.r,Le=ye.g,Ae=ye.b;ue?(g[0]=Re,g[1]=Le,g[2]=Ae,g[3]=pe,P.clearBufferuiv(P.COLOR,0,g)):(y[0]=Re,y[1]=Le,y[2]=Ae,y[3]=pe,P.clearBufferiv(P.COLOR,0,y))}else V|=P.COLOR_BUFFER_BIT}F&&(V|=P.DEPTH_BUFFER_BIT),H&&(V|=P.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),P.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ae,!1),t.removeEventListener("webglcontextrestored",me,!1),t.removeEventListener("webglcontextcreationerror",ee,!1),Se.dispose(),Y.dispose(),Ee.dispose(),_e.dispose(),It.dispose(),wt.dispose(),k.dispose(),ce.dispose(),Oe.dispose(),Z.dispose(),ie.dispose(),ie.removeEventListener("sessionstart",Sn),ie.removeEventListener("sessionend",bc),Mi.stop()};function ae(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),R=!0}function me(){console.log("THREE.WebGLRenderer: Context Restored."),R=!1;let S=yt.autoReset,F=be.enabled,H=be.autoUpdate,V=be.needsUpdate,B=be.type;D(),yt.autoReset=S,be.enabled=F,be.autoUpdate=H,be.needsUpdate=V,be.type=B}function ee(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function J(S){let F=S.target;F.removeEventListener("dispose",J),xe(F)}function xe(S){Ne(S),_e.remove(S)}function Ne(S){let F=_e.get(S).programs;F!==void 0&&(F.forEach(function(H){Z.releaseProgram(H)}),S.isShaderMaterial&&Z.releaseShaderCache(S))}this.renderBufferDirect=function(S,F,H,V,B,te){F===null&&(F=Te);let ue=B.isMesh&&B.matrixWorld.determinant()<0,ye=nd(S,F,H,V,B);ve.setMaterial(V,ue);let pe=H.index,Re=1;if(V.wireframe===!0){if(pe=v.getWireframeAttribute(H),pe===void 0)return;Re=2}let Le=H.drawRange,Ae=H.attributes.position,qe=Le.start*Re,rt=(Le.start+Le.count)*Re;te!==null&&(qe=Math.max(qe,te.start*Re),rt=Math.min(rt,(te.start+te.count)*Re)),pe!==null?(qe=Math.max(qe,0),rt=Math.min(rt,pe.count)):Ae!=null&&(qe=Math.max(qe,0),rt=Math.min(rt,Ae.count));let bt=rt-qe;if(bt<0||bt===1/0)return;ce.setup(B,V,ye,H,pe);let dt,ot=de;if(pe!==null&&(dt=A.get(pe),ot=Ie,ot.setIndex(dt)),B.isMesh)V.wireframe===!0?(ve.setLineWidth(V.wireframeLinewidth*Ot()),ot.setMode(P.LINES)):ot.setMode(P.TRIANGLES);else if(B.isLine){let Ce=V.linewidth;Ce===void 0&&(Ce=1),ve.setLineWidth(Ce*Ot()),B.isLineSegments?ot.setMode(P.LINES):B.isLineLoop?ot.setMode(P.LINE_LOOP):ot.setMode(P.LINE_STRIP)}else B.isPoints?ot.setMode(P.POINTS):B.isSprite&&ot.setMode(P.TRIANGLES);if(B.isBatchedMesh)if(B._multiDrawInstances!==null)os("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ot.renderMultiDrawInstances(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount,B._multiDrawInstances);else if(Ue.get("WEBGL_multi_draw"))ot.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let Ce=B._multiDrawStarts,_t=B._multiDrawCounts,Ke=B._multiDrawCount,en=pe?A.get(pe).bytesPerElement:1,qi=_e.get(V).currentProgram.getUniforms();for(let tn=0;tn<Ke;tn++)qi.setValue(P,"_gl_DrawID",tn),ot.render(Ce[tn]/en,_t[tn])}else if(B.isInstancedMesh)ot.renderInstances(qe,bt,B.count);else if(H.isInstancedBufferGeometry){let Ce=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,_t=Math.min(H.instanceCount,Ce);ot.renderInstances(qe,bt,_t)}else ot.render(qe,bt)};function ht(S,F,H){S.transparent===!0&&S.side===Kt&&S.forceSinglePass===!1?(S.side=Yt,S.needsUpdate=!0,br(S,F,H),S.side=Wn,S.needsUpdate=!0,br(S,F,H),S.side=Kt):br(S,F,H)}this.compile=function(S,F,H=null){H===null&&(H=S),d=Ee.get(H),d.init(F),E.push(d),H.traverseVisible(function(B){B.isLight&&B.layers.test(F.layers)&&(d.pushLight(B),B.castShadow&&d.pushShadow(B))}),S!==H&&S.traverseVisible(function(B){B.isLight&&B.layers.test(F.layers)&&(d.pushLight(B),B.castShadow&&d.pushShadow(B))}),d.setupLights();let V=new Set;return S.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let te=B.material;if(te)if(Array.isArray(te))for(let ue=0;ue<te.length;ue++){let ye=te[ue];ht(ye,H,B),V.add(ye)}else ht(te,H,B),V.add(te)}),d=E.pop(),V},this.compileAsync=function(S,F,H=null){let V=this.compile(S,F,H);return new Promise(B=>{function te(){if(V.forEach(function(ue){_e.get(ue).currentProgram.isReady()&&V.delete(ue)}),V.size===0){B(S);return}setTimeout(te,10)}Ue.get("KHR_parallel_shader_compile")!==null?te():setTimeout(te,10)})};let et=null;function On(S){et&&et(S)}function Sn(){Mi.stop()}function bc(){Mi.start()}let Mi=new xu;Mi.setAnimationLoop(On),typeof self<"u"&&Mi.setContext(self),this.setAnimationLoop=function(S){et=S,ie.setAnimationLoop(S),S===null?Mi.stop():Mi.start()},ie.addEventListener("sessionstart",Sn),ie.addEventListener("sessionend",bc),this.render=function(S,F){if(F!==void 0&&F.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),ie.enabled===!0&&ie.isPresenting===!0&&(ie.cameraAutoUpdate===!0&&ie.updateCamera(F),F=ie.getCamera()),S.isScene===!0&&S.onBeforeRender(b,S,F,I),d=Ee.get(S,E.length),d.init(F),E.push(d),Q.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),mt.setFromProjectionMatrix(Q,gn,F.reversedDepth),$=this.localClippingEnabled,Qe=re.init(this.clippingPlanes,$),m=Y.get(S,w.length),m.init(),w.push(m),ie.enabled===!0&&ie.isPresenting===!0){let te=b.xr.getDepthSensingMesh();te!==null&&No(te,F,-1/0,b.sortObjects)}No(S,F,0,b.sortObjects),m.finish(),b.sortObjects===!0&&m.sort(oe,he),Ze=ie.enabled===!1||ie.isPresenting===!1||ie.hasDepthSensing()===!1,Ze&&Se.addToRenderList(m,S),this.info.render.frame++,Qe===!0&&re.beginShadows();let H=d.state.shadowsArray;be.render(H,S,F),Qe===!0&&re.endShadows(),this.info.autoReset===!0&&this.info.reset();let V=m.opaque,B=m.transmissive;if(d.setupLights(),F.isArrayCamera){let te=F.cameras;if(B.length>0)for(let ue=0,ye=te.length;ue<ye;ue++){let pe=te[ue];wc(V,B,S,pe)}Ze&&Se.render(S);for(let ue=0,ye=te.length;ue<ye;ue++){let pe=te[ue];Sc(m,S,pe,pe.viewport)}}else B.length>0&&wc(V,B,S,F),Ze&&Se.render(S),Sc(m,S,F);I!==null&&T===0&&(Be.updateMultisampleRenderTarget(I),Be.updateRenderTargetMipmap(I)),S.isScene===!0&&S.onAfterRender(b,S,F),ce.resetDefaultState(),M=-1,_=null,E.pop(),E.length>0?(d=E[E.length-1],Qe===!0&&re.setGlobalState(b.clippingPlanes,d.state.camera)):d=null,w.pop(),w.length>0?m=w[w.length-1]:m=null};function No(S,F,H,V){if(S.visible===!1)return;if(S.layers.test(F.layers)){if(S.isGroup)H=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(F);else if(S.isLight)d.pushLight(S),S.castShadow&&d.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||mt.intersectsSprite(S)){V&&De.setFromMatrixPosition(S.matrixWorld).applyMatrix4(Q);let ue=k.update(S),ye=S.material;ye.visible&&m.push(S,ue,ye,H,De.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||mt.intersectsObject(S))){let ue=k.update(S),ye=S.material;if(V&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),De.copy(S.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),De.copy(ue.boundingSphere.center)),De.applyMatrix4(S.matrixWorld).applyMatrix4(Q)),Array.isArray(ye)){let pe=ue.groups;for(let Re=0,Le=pe.length;Re<Le;Re++){let Ae=pe[Re],qe=ye[Ae.materialIndex];qe&&qe.visible&&m.push(S,ue,qe,H,De.z,Ae)}}else ye.visible&&m.push(S,ue,ye,H,De.z,null)}}let te=S.children;for(let ue=0,ye=te.length;ue<ye;ue++)No(te[ue],F,H,V)}function Sc(S,F,H,V){let B=S.opaque,te=S.transmissive,ue=S.transparent;d.setupLightsView(H),Qe===!0&&re.setGlobalState(b.clippingPlanes,H),V&&ve.viewport(L.copy(V)),B.length>0&&Mr(B,F,H),te.length>0&&Mr(te,F,H),ue.length>0&&Mr(ue,F,H),ve.buffers.depth.setTest(!0),ve.buffers.depth.setMask(!0),ve.buffers.color.setMask(!0),ve.setPolygonOffset(!1)}function wc(S,F,H,V){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;d.state.transmissionRenderTarget[V.id]===void 0&&(d.state.transmissionRenderTarget[V.id]=new Tn(1,1,{generateMipmaps:!0,type:Ue.has("EXT_color_buffer_half_float")||Ue.has("EXT_color_buffer_float")?vs:_n,minFilter:yi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:$e.workingColorSpace}));let te=d.state.transmissionRenderTarget[V.id],ue=V.viewport||L;te.setSize(ue.z*b.transmissionResolutionScale,ue.w*b.transmissionResolutionScale);let ye=b.getRenderTarget(),pe=b.getActiveCubeFace(),Re=b.getActiveMipmapLevel();b.setRenderTarget(te),b.getClearColor(X),q=b.getClearAlpha(),q<1&&b.setClearColor(16777215,.5),b.clear(),Ze&&Se.render(H);let Le=b.toneMapping;b.toneMapping=Qn;let Ae=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),d.setupLightsView(V),Qe===!0&&re.setGlobalState(b.clippingPlanes,V),Mr(S,H,V),Be.updateMultisampleRenderTarget(te),Be.updateRenderTargetMipmap(te),Ue.has("WEBGL_multisampled_render_to_texture")===!1){let qe=!1;for(let rt=0,bt=F.length;rt<bt;rt++){let dt=F[rt],ot=dt.object,Ce=dt.geometry,_t=dt.material,Ke=dt.group;if(_t.side===Kt&&ot.layers.test(V.layers)){let en=_t.side;_t.side=Yt,_t.needsUpdate=!0,Ec(ot,H,V,Ce,_t,Ke),_t.side=en,_t.needsUpdate=!0,qe=!0}}qe===!0&&(Be.updateMultisampleRenderTarget(te),Be.updateRenderTargetMipmap(te))}b.setRenderTarget(ye,pe,Re),b.setClearColor(X,q),Ae!==void 0&&(V.viewport=Ae),b.toneMapping=Le}function Mr(S,F,H){let V=F.isScene===!0?F.overrideMaterial:null;for(let B=0,te=S.length;B<te;B++){let ue=S[B],ye=ue.object,pe=ue.geometry,Re=ue.group,Le=ue.material;Le.allowOverride===!0&&V!==null&&(Le=V),ye.layers.test(H.layers)&&Ec(ye,F,H,pe,Le,Re)}}function Ec(S,F,H,V,B,te){S.onBeforeRender(b,F,H,V,B,te),S.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),B.onBeforeRender(b,F,H,V,S,te),B.transparent===!0&&B.side===Kt&&B.forceSinglePass===!1?(B.side=Yt,B.needsUpdate=!0,b.renderBufferDirect(H,F,V,B,S,te),B.side=Wn,B.needsUpdate=!0,b.renderBufferDirect(H,F,V,B,S,te),B.side=Kt):b.renderBufferDirect(H,F,V,B,S,te),S.onAfterRender(b,F,H,V,B,te)}function br(S,F,H){F.isScene!==!0&&(F=Te);let V=_e.get(S),B=d.state.lights,te=d.state.shadowsArray,ue=B.state.version,ye=Z.getParameters(S,B.state,te,F,H),pe=Z.getProgramCacheKey(ye),Re=V.programs;V.environment=S.isMeshStandardMaterial?F.environment:null,V.fog=F.fog,V.envMap=(S.isMeshStandardMaterial?wt:It).get(S.envMap||V.environment),V.envMapRotation=V.environment!==null&&S.envMap===null?F.environmentRotation:S.envMapRotation,Re===void 0&&(S.addEventListener("dispose",J),Re=new Map,V.programs=Re);let Le=Re.get(pe);if(Le!==void 0){if(V.currentProgram===Le&&V.lightsStateVersion===ue)return Ac(S,ye),Le}else ye.uniforms=Z.getUniforms(S),S.onBeforeCompile(ye,b),Le=Z.acquireProgram(ye,pe),Re.set(pe,Le),V.uniforms=ye.uniforms;let Ae=V.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Ae.clippingPlanes=re.uniform),Ac(S,ye),V.needsLights=sd(S),V.lightsStateVersion=ue,V.needsLights&&(Ae.ambientLightColor.value=B.state.ambient,Ae.lightProbe.value=B.state.probe,Ae.directionalLights.value=B.state.directional,Ae.directionalLightShadows.value=B.state.directionalShadow,Ae.spotLights.value=B.state.spot,Ae.spotLightShadows.value=B.state.spotShadow,Ae.rectAreaLights.value=B.state.rectArea,Ae.ltc_1.value=B.state.rectAreaLTC1,Ae.ltc_2.value=B.state.rectAreaLTC2,Ae.pointLights.value=B.state.point,Ae.pointLightShadows.value=B.state.pointShadow,Ae.hemisphereLights.value=B.state.hemi,Ae.directionalShadowMap.value=B.state.directionalShadowMap,Ae.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ae.spotShadowMap.value=B.state.spotShadowMap,Ae.spotLightMatrix.value=B.state.spotLightMatrix,Ae.spotLightMap.value=B.state.spotLightMap,Ae.pointShadowMap.value=B.state.pointShadowMap,Ae.pointShadowMatrix.value=B.state.pointShadowMatrix),V.currentProgram=Le,V.uniformsList=null,Le}function Tc(S){if(S.uniformsList===null){let F=S.currentProgram.getUniforms();S.uniformsList=ws.seqWithValue(F.seq,S.uniforms)}return S.uniformsList}function Ac(S,F){let H=_e.get(S);H.outputColorSpace=F.outputColorSpace,H.batching=F.batching,H.batchingColor=F.batchingColor,H.instancing=F.instancing,H.instancingColor=F.instancingColor,H.instancingMorph=F.instancingMorph,H.skinning=F.skinning,H.morphTargets=F.morphTargets,H.morphNormals=F.morphNormals,H.morphColors=F.morphColors,H.morphTargetsCount=F.morphTargetsCount,H.numClippingPlanes=F.numClippingPlanes,H.numIntersection=F.numClipIntersection,H.vertexAlphas=F.vertexAlphas,H.vertexTangents=F.vertexTangents,H.toneMapping=F.toneMapping}function nd(S,F,H,V,B){F.isScene!==!0&&(F=Te),Be.resetTextureUnits();let te=F.fog,ue=V.isMeshStandardMaterial?F.environment:null,ye=I===null?b.outputColorSpace:I.isXRRenderTarget===!0?I.texture.colorSpace:Pi,pe=(V.isMeshStandardMaterial?wt:It).get(V.envMap||ue),Re=V.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Le=!!H.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Ae=!!H.morphAttributes.position,qe=!!H.morphAttributes.normal,rt=!!H.morphAttributes.color,bt=Qn;V.toneMapped&&(I===null||I.isXRRenderTarget===!0)&&(bt=b.toneMapping);let dt=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,ot=dt!==void 0?dt.length:0,Ce=_e.get(V),_t=d.state.lights;if(Qe===!0&&($===!0||S!==_)){let qt=S===_&&V.id===M;re.setState(V,S,qt)}let Ke=!1;V.version===Ce.__version?(Ce.needsLights&&Ce.lightsStateVersion!==_t.state.version||Ce.outputColorSpace!==ye||B.isBatchedMesh&&Ce.batching===!1||!B.isBatchedMesh&&Ce.batching===!0||B.isBatchedMesh&&Ce.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&Ce.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&Ce.instancing===!1||!B.isInstancedMesh&&Ce.instancing===!0||B.isSkinnedMesh&&Ce.skinning===!1||!B.isSkinnedMesh&&Ce.skinning===!0||B.isInstancedMesh&&Ce.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Ce.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&Ce.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&Ce.instancingMorph===!1&&B.morphTexture!==null||Ce.envMap!==pe||V.fog===!0&&Ce.fog!==te||Ce.numClippingPlanes!==void 0&&(Ce.numClippingPlanes!==re.numPlanes||Ce.numIntersection!==re.numIntersection)||Ce.vertexAlphas!==Re||Ce.vertexTangents!==Le||Ce.morphTargets!==Ae||Ce.morphNormals!==qe||Ce.morphColors!==rt||Ce.toneMapping!==bt||Ce.morphTargetsCount!==ot)&&(Ke=!0):(Ke=!0,Ce.__version=V.version);let en=Ce.currentProgram;Ke===!0&&(en=br(V,F,B));let qi=!1,tn=!1,Ds=!1,Mt=en.getUniforms(),ln=Ce.uniforms;if(ve.useProgram(en.program)&&(qi=!0,tn=!0,Ds=!0),V.id!==M&&(M=V.id,tn=!0),qi||_!==S){ve.buffers.depth.getReversed()&&S.reversedDepth!==!0&&(S._reversedDepth=!0,S.updateProjectionMatrix()),Mt.setValue(P,"projectionMatrix",S.projectionMatrix),Mt.setValue(P,"viewMatrix",S.matrixWorldInverse);let Zt=Mt.map.cameraPosition;Zt!==void 0&&Zt.setValue(P,ge.setFromMatrixPosition(S.matrixWorld)),Pe.logarithmicDepthBuffer&&Mt.setValue(P,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&Mt.setValue(P,"isOrthographic",S.isOrthographicCamera===!0),_!==S&&(_=S,tn=!0,Ds=!0)}if(B.isSkinnedMesh){Mt.setOptional(P,B,"bindMatrix"),Mt.setOptional(P,B,"bindMatrixInverse");let qt=B.skeleton;qt&&(qt.boneTexture===null&&qt.computeBoneTexture(),Mt.setValue(P,"boneTexture",qt.boneTexture,Be))}B.isBatchedMesh&&(Mt.setOptional(P,B,"batchingTexture"),Mt.setValue(P,"batchingTexture",B._matricesTexture,Be),Mt.setOptional(P,B,"batchingIdTexture"),Mt.setValue(P,"batchingIdTexture",B._indirectTexture,Be),Mt.setOptional(P,B,"batchingColorTexture"),B._colorsTexture!==null&&Mt.setValue(P,"batchingColorTexture",B._colorsTexture,Be));let cn=H.morphAttributes;if((cn.position!==void 0||cn.normal!==void 0||cn.color!==void 0)&&ne.update(B,H,en),(tn||Ce.receiveShadow!==B.receiveShadow)&&(Ce.receiveShadow=B.receiveShadow,Mt.setValue(P,"receiveShadow",B.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(ln.envMap.value=pe,ln.flipEnvMap.value=pe.isCubeTexture&&pe.isRenderTargetTexture===!1?-1:1),V.isMeshStandardMaterial&&V.envMap===null&&F.environment!==null&&(ln.envMapIntensity.value=F.environmentIntensity),tn&&(Mt.setValue(P,"toneMappingExposure",b.toneMappingExposure),Ce.needsLights&&id(ln,Ds),te&&V.fog===!0&&j.refreshFogUniforms(ln,te),j.refreshMaterialUniforms(ln,V,W,se,d.state.transmissionRenderTarget[S.id]),ws.upload(P,Tc(Ce),ln,Be)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(ws.upload(P,Tc(Ce),ln,Be),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&Mt.setValue(P,"center",B.center),Mt.setValue(P,"modelViewMatrix",B.modelViewMatrix),Mt.setValue(P,"normalMatrix",B.normalMatrix),Mt.setValue(P,"modelMatrix",B.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){let qt=V.uniformsGroups;for(let Zt=0,Uo=qt.length;Zt<Uo;Zt++){let bi=qt[Zt];Oe.update(bi,en),Oe.bind(bi,en)}}return en}function id(S,F){S.ambientLightColor.needsUpdate=F,S.lightProbe.needsUpdate=F,S.directionalLights.needsUpdate=F,S.directionalLightShadows.needsUpdate=F,S.pointLights.needsUpdate=F,S.pointLightShadows.needsUpdate=F,S.spotLights.needsUpdate=F,S.spotLightShadows.needsUpdate=F,S.rectAreaLights.needsUpdate=F,S.hemisphereLights.needsUpdate=F}function sd(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return I},this.setRenderTargetTextures=function(S,F,H){let V=_e.get(S);V.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),_e.get(S.texture).__webglTexture=F,_e.get(S.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:H,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,F){let H=_e.get(S);H.__webglFramebuffer=F,H.__useDefaultFramebuffer=F===void 0};let rd=P.createFramebuffer();this.setRenderTarget=function(S,F=0,H=0){I=S,C=F,T=H;let V=!0,B=null,te=!1,ue=!1;if(S){let pe=_e.get(S);if(pe.__useDefaultFramebuffer!==void 0)ve.bindFramebuffer(P.FRAMEBUFFER,null),V=!1;else if(pe.__webglFramebuffer===void 0)Be.setupRenderTarget(S);else if(pe.__hasExternalTextures)Be.rebindTextures(S,_e.get(S.texture).__webglTexture,_e.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Ae=S.depthTexture;if(pe.__boundDepthTexture!==Ae){if(Ae!==null&&_e.has(Ae)&&(S.width!==Ae.image.width||S.height!==Ae.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Be.setupDepthRenderbuffer(S)}}let Re=S.texture;(Re.isData3DTexture||Re.isDataArrayTexture||Re.isCompressedArrayTexture)&&(ue=!0);let Le=_e.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Le[F])?B=Le[F][H]:B=Le[F],te=!0):S.samples>0&&Be.useMultisampledRTT(S)===!1?B=_e.get(S).__webglMultisampledFramebuffer:Array.isArray(Le)?B=Le[H]:B=Le,L.copy(S.viewport),O.copy(S.scissor),z=S.scissorTest}else L.copy(fe).multiplyScalar(W).floor(),O.copy(He).multiplyScalar(W).floor(),z=ct;if(H!==0&&(B=rd),ve.bindFramebuffer(P.FRAMEBUFFER,B)&&V&&ve.drawBuffers(S,B),ve.viewport(L),ve.scissor(O),ve.setScissorTest(z),te){let pe=_e.get(S.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_CUBE_MAP_POSITIVE_X+F,pe.__webglTexture,H)}else if(ue){let pe=F;for(let Re=0;Re<S.textures.length;Re++){let Le=_e.get(S.textures[Re]);P.framebufferTextureLayer(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0+Re,Le.__webglTexture,H,pe)}}else if(S!==null&&H!==0){let pe=_e.get(S.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,pe.__webglTexture,H)}M=-1},this.readRenderTargetPixels=function(S,F,H,V,B,te,ue,ye=0){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let pe=_e.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ue!==void 0&&(pe=pe[ue]),pe){ve.bindFramebuffer(P.FRAMEBUFFER,pe);try{let Re=S.textures[ye],Le=Re.format,Ae=Re.type;if(!Pe.textureFormatReadable(Le)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Pe.textureTypeReadable(Ae)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=S.width-V&&H>=0&&H<=S.height-B&&(S.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+ye),P.readPixels(F,H,V,B,we.convert(Le),we.convert(Ae),te))}finally{let Re=I!==null?_e.get(I).__webglFramebuffer:null;ve.bindFramebuffer(P.FRAMEBUFFER,Re)}}},this.readRenderTargetPixelsAsync=async function(S,F,H,V,B,te,ue,ye=0){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let pe=_e.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ue!==void 0&&(pe=pe[ue]),pe)if(F>=0&&F<=S.width-V&&H>=0&&H<=S.height-B){ve.bindFramebuffer(P.FRAMEBUFFER,pe);let Re=S.textures[ye],Le=Re.format,Ae=Re.type;if(!Pe.textureFormatReadable(Le))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Pe.textureTypeReadable(Ae))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let qe=P.createBuffer();P.bindBuffer(P.PIXEL_PACK_BUFFER,qe),P.bufferData(P.PIXEL_PACK_BUFFER,te.byteLength,P.STREAM_READ),S.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+ye),P.readPixels(F,H,V,B,we.convert(Le),we.convert(Ae),0);let rt=I!==null?_e.get(I).__webglFramebuffer:null;ve.bindFramebuffer(P.FRAMEBUFFER,rt);let bt=P.fenceSync(P.SYNC_GPU_COMMANDS_COMPLETE,0);return P.flush(),await Xh(P,bt,4),P.bindBuffer(P.PIXEL_PACK_BUFFER,qe),P.getBufferSubData(P.PIXEL_PACK_BUFFER,0,te),P.deleteBuffer(qe),P.deleteSync(bt),te}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,F=null,H=0){let V=Math.pow(2,-H),B=Math.floor(S.image.width*V),te=Math.floor(S.image.height*V),ue=F!==null?F.x:0,ye=F!==null?F.y:0;Be.setTexture2D(S,0),P.copyTexSubImage2D(P.TEXTURE_2D,H,0,0,ue,ye,B,te),ve.unbindTexture()};let ad=P.createFramebuffer(),od=P.createFramebuffer();this.copyTextureToTexture=function(S,F,H=null,V=null,B=0,te=null){te===null&&(B!==0?(os("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),te=B,B=0):te=0);let ue,ye,pe,Re,Le,Ae,qe,rt,bt,dt=S.isCompressedTexture?S.mipmaps[te]:S.image;if(H!==null)ue=H.max.x-H.min.x,ye=H.max.y-H.min.y,pe=H.isBox3?H.max.z-H.min.z:1,Re=H.min.x,Le=H.min.y,Ae=H.isBox3?H.min.z:0;else{let cn=Math.pow(2,-B);ue=Math.floor(dt.width*cn),ye=Math.floor(dt.height*cn),S.isDataArrayTexture?pe=dt.depth:S.isData3DTexture?pe=Math.floor(dt.depth*cn):pe=1,Re=0,Le=0,Ae=0}V!==null?(qe=V.x,rt=V.y,bt=V.z):(qe=0,rt=0,bt=0);let ot=we.convert(F.format),Ce=we.convert(F.type),_t;F.isData3DTexture?(Be.setTexture3D(F,0),_t=P.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(Be.setTexture2DArray(F,0),_t=P.TEXTURE_2D_ARRAY):(Be.setTexture2D(F,0),_t=P.TEXTURE_2D),P.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,F.flipY),P.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),P.pixelStorei(P.UNPACK_ALIGNMENT,F.unpackAlignment);let Ke=P.getParameter(P.UNPACK_ROW_LENGTH),en=P.getParameter(P.UNPACK_IMAGE_HEIGHT),qi=P.getParameter(P.UNPACK_SKIP_PIXELS),tn=P.getParameter(P.UNPACK_SKIP_ROWS),Ds=P.getParameter(P.UNPACK_SKIP_IMAGES);P.pixelStorei(P.UNPACK_ROW_LENGTH,dt.width),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,dt.height),P.pixelStorei(P.UNPACK_SKIP_PIXELS,Re),P.pixelStorei(P.UNPACK_SKIP_ROWS,Le),P.pixelStorei(P.UNPACK_SKIP_IMAGES,Ae);let Mt=S.isDataArrayTexture||S.isData3DTexture,ln=F.isDataArrayTexture||F.isData3DTexture;if(S.isDepthTexture){let cn=_e.get(S),qt=_e.get(F),Zt=_e.get(cn.__renderTarget),Uo=_e.get(qt.__renderTarget);ve.bindFramebuffer(P.READ_FRAMEBUFFER,Zt.__webglFramebuffer),ve.bindFramebuffer(P.DRAW_FRAMEBUFFER,Uo.__webglFramebuffer);for(let bi=0;bi<pe;bi++)Mt&&(P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,_e.get(S).__webglTexture,B,Ae+bi),P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,_e.get(F).__webglTexture,te,bt+bi)),P.blitFramebuffer(Re,Le,ue,ye,qe,rt,ue,ye,P.DEPTH_BUFFER_BIT,P.NEAREST);ve.bindFramebuffer(P.READ_FRAMEBUFFER,null),ve.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else if(B!==0||S.isRenderTargetTexture||_e.has(S)){let cn=_e.get(S),qt=_e.get(F);ve.bindFramebuffer(P.READ_FRAMEBUFFER,ad),ve.bindFramebuffer(P.DRAW_FRAMEBUFFER,od);for(let Zt=0;Zt<pe;Zt++)Mt?P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,cn.__webglTexture,B,Ae+Zt):P.framebufferTexture2D(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,cn.__webglTexture,B),ln?P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,qt.__webglTexture,te,bt+Zt):P.framebufferTexture2D(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,qt.__webglTexture,te),B!==0?P.blitFramebuffer(Re,Le,ue,ye,qe,rt,ue,ye,P.COLOR_BUFFER_BIT,P.NEAREST):ln?P.copyTexSubImage3D(_t,te,qe,rt,bt+Zt,Re,Le,ue,ye):P.copyTexSubImage2D(_t,te,qe,rt,Re,Le,ue,ye);ve.bindFramebuffer(P.READ_FRAMEBUFFER,null),ve.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else ln?S.isDataTexture||S.isData3DTexture?P.texSubImage3D(_t,te,qe,rt,bt,ue,ye,pe,ot,Ce,dt.data):F.isCompressedArrayTexture?P.compressedTexSubImage3D(_t,te,qe,rt,bt,ue,ye,pe,ot,dt.data):P.texSubImage3D(_t,te,qe,rt,bt,ue,ye,pe,ot,Ce,dt):S.isDataTexture?P.texSubImage2D(P.TEXTURE_2D,te,qe,rt,ue,ye,ot,Ce,dt.data):S.isCompressedTexture?P.compressedTexSubImage2D(P.TEXTURE_2D,te,qe,rt,dt.width,dt.height,ot,dt.data):P.texSubImage2D(P.TEXTURE_2D,te,qe,rt,ue,ye,ot,Ce,dt);P.pixelStorei(P.UNPACK_ROW_LENGTH,Ke),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,en),P.pixelStorei(P.UNPACK_SKIP_PIXELS,qi),P.pixelStorei(P.UNPACK_SKIP_ROWS,tn),P.pixelStorei(P.UNPACK_SKIP_IMAGES,Ds),te===0&&F.generateMipmaps&&P.generateMipmap(_t),ve.unbindTexture()},this.initRenderTarget=function(S){_e.get(S).__webglFramebuffer===void 0&&Be.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?Be.setTextureCube(S,0):S.isData3DTexture?Be.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?Be.setTexture2DArray(S,0):Be.setTexture2D(S,0),ve.unbindTexture()},this.resetState=function(){C=0,T=0,I=null,ve.reset(),ce.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return gn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=$e._getDrawingBufferColorSpace(e),t.unpackColorSpace=$e._getUnpackColorSpace()}};var ti=(i,e=0,t=1)=>Math.max(e,Math.min(t,i)),Ts=i=>{let e=ti(i);return e*e*(3-2*e)},wu=(i,e,t)=>Ts((i-e)/.45)*(1-Ts((i-t)/.45));function lc(i,e=!1){let t=ti(i,0,26),n=ti(t/4.15),s=ti((t-6)/3.5),r=ti((t-19)/4.2);return{landerHeight:e?0:27*(1-Ts(n)),legCompression:e?0:Math.sin(ti((t-4.15)/.55)*Math.PI)*.17,engine:!e&&t<4.15?.45+.55*(1-n):0,roverTravel:e?10:10*(1-(1-s)**3),roverBrake:e?0:wu(t,8.1,9.1)*.06,cadetTravel:e?5:5*Ts(r),cadetStride:e?0:4*r*(1-r),wristCheck:e?0:wu(t,23.15,25.15),relayBearing:e?.32:-.28+.6*Ts((t-12)/3.8),relayTilt:e?.47:.35+.12*Ts((t-12)/3.8),fade:e?0:Math.max(...[6,12,19].map(a=>ti(1-Math.abs(t-a)/.16)))*.72}}function Eu(i,e,t=0,n=0,s=!1){if(s)return{hips:[0,0],knees:[0,0],shoulders:[0,0],elbows:[0,0],bodyY:0,lean:0,roll:0,headYaw:0,headPitch:0};let r=ti(t),a=ti(n),o=Math.sin(i),c=Math.cos(i);return{hips:[o*.43*r,-o*.43*r],knees:[Math.max(0,-o)*.68*r,Math.max(0,o)*.68*r],shoulders:[-o*.25*r-.62*a,o*.25*r],elbows:[.08*r-.98*a,.12*r],bodyY:Math.sin(e*1.55)*.012+Math.sin(i*2)*.035*r,lean:r*.04,roll:c*.025*r,headYaw:Math.sin(e*.45)*.045*(1-r),headPitch:a*.31}}function Tu(i,e,t,n=1.62){return{distance:Math.max(0,i)*e,height:Math.max(0,t*i-.5*n*i*i)}}var y0="#8be1cf",x0="#ff8b55";function Gi(i,e,t,n=1,s=[]){if(e.length){i.beginPath(),i.moveTo(e[0].x,e[0].y);for(let r of e.slice(1))i.lineTo(r.x,r.y);i.strokeStyle=t,i.lineWidth=n,i.setLineDash(s),i.stroke(),i.setLineDash([])}}function Wi(i,e,t,n,s,r){i.beginPath(),i.ellipse(e,t,n,s,0,0,Math.PI*2),i.fillStyle=r,i.fill()}function Au(i,e,t,n,s="",r="#c6def6",a=15){i.font=`700 ${a}px sans-serif`;let o=Math.max(i.measureText(n).width,s?i.measureText(s).width:0)+24,c=s?a*2+22:a+16;return i.fillStyle="#07111f",i.fillRect(e-o/2,t,o,c),i.strokeStyle=r,i.lineWidth=1,i.strokeRect(e-o/2,t,o,c),i.textAlign="center",i.textBaseline="top",i.fillStyle="#ffffff",i.fillText(n,e,t+8),s&&(i.font=`${a-2}px monospace`,i.fillStyle="#d0e0f0",i.fillText(s,e,t+a+13)),i.textBaseline="alphabetic",{x:e-o/2,y:t,width:o,height:c}}var xo=class{constructor(e){this.mission=e,this.assistedRoute=null}drawMini(e,t){let n=e.getContext("2d"),s=e.width,r=e.height,a=this.mission.terrain;n.clearRect(0,0,s,r);let o=s/a.width,c=r/a.height;for(let g=0;g<a.height;g++)for(let y=0;y<a.width;y++){let m=(a.heightAt(y,g)-a.min)/(a.max-a.min||1);n.fillStyle=`rgb(${Math.round(34+50*m)},${Math.round(49+54*m)},${Math.round(50+44*m)})`,n.fillRect(y*o,g*c,o+.3,c+.3)}let l=g=>({x:(g.x+.5)*o,y:(g.y+.5)*c});t?.route&&Gi(n,t.route.path.map(l),"#d9e5d19c",1.2,[3,3]),this.assistedRoute&&Gi(n,this.assistedRoute.path.map(l),this.assistedRoute.safe?"#80eadc":"#ffc07e",2),this.mission.state.trail.length&&Gi(n,this.mission.state.trail.map(l),"#80dbc595",1);for(let g of this.mission.science){let y=l(g);n.fillStyle=y0,n.fillRect(y.x-2,y.y-2,4,4)}for(let[g,y]of Object.entries(this.mission.objects)){let m=l(g==="rover"?this.mission.state.rover:y);Wi(n,m.x,m.y,3.3,3.3,g==="base"?"#e5ebdc":x0)}let h=l(this.mission.target());n.strokeStyle="#ffc185",n.lineWidth=2,n.strokeRect(h.x-5,h.y-5,10,10);let u=l(this.mission.state.player);Wi(n,u.x,u.y,6,6,"#06121f"),Wi(n,u.x,u.y,4,4,"#fff"),n.font="700 11px sans-serif";let f=Xe(u.x,24,s-24),p=Xe(u.y+11,11,r-30);Au(n,f,p,"YOU","","#fff",11)}drawOrbit(e,t){this.width=e.width,this.height=e.height;let n=e.getContext("2d");n.fillStyle="#080e19",n.fillRect(0,0,this.width,this.height),this.paintOrbit(n,t)}paintOrbit(e,t){let n=this.width/2,s=165,r=Math.max(s+180,this.height-190),a=(s+r)/2,o=Math.min(72,this.width*.13),c=Math.min(this.width*.37,(r-s)*.55),l=this.mission.astronomy(),h=this.width<600?12:16,u=[{x:n-o,y:a-o,width:o*2,height:o*2}],f=[],p=(T,I)=>T.x<I.x+I.width+8&&T.x+T.width+8>I.x&&T.y<I.y+I.height+8&&T.y+T.height+8>I.y;for(let T=1;T<=3;T++)e.strokeStyle="#acc5c320",e.lineWidth=1,e.setLineDash([3,7]),e.beginPath(),e.ellipse(n,a,o+T*(c-o)/3,(o+T*(c-o)/3)*.75,0,0,Math.PI*2),e.stroke(),e.setLineDash([]);let g=this.mission.ephemerides.bodies.find(T=>T.name==="LRO"&&T.available);if(g){let T=g.samples[0].jdTdb+(this.mission.config.startHourTdb+this.mission.state.time/3600)/24,I=g.samples.filter(M=>Math.abs(M.jdTdb-T)<65/1440).map(M=>({x:n+M.x/1737.4*o,y:a-M.y/1737.4*o}));e.shadowColor="#8af7df",e.shadowBlur=10,e.lineDashOffset=-t*10,Gi(e,I,"#a8e9d9aa",2,[3,4]),e.lineDashOffset=0,e.shadowBlur=0}let y=e.createRadialGradient(n-22,a-24,5,n,a,o);y.addColorStop(0,"#e5e7d9"),y.addColorStop(.5,"#b5bdb3"),y.addColorStop(1,"#505f5d"),Wi(e,n,a,o,o,y);let m=wn(79);e.save(),e.beginPath(),e.arc(n,a,o,0,Math.PI*2),e.clip();for(let T=0;T<32;T++){let I=n+(m()-.5)*o*2,M=a+(m()-.5)*o*2;Wi(e,I,M,2+m()*7,2+m()*4,"#35454120")}e.restore();let d=l.filter(T=>T.inCoverage).map(T=>{let I,M,_;if(T.name==="LRO")I=n+T.x/1737.4*o,M=a-T.y/1737.4*o,_=4;else{let L=Xe(Math.log10(T.distanceKm/1737.4)/5.4,0,1),O=o+55+L*Math.max(20,c-o-50),z=Math.atan2(-T.y,T.x);I=n+Math.cos(z)*O,M=a+Math.sin(z)*O*.75,_=T.name==="Earth"?12:T.name==="Sun"?15:8}return u.push({x:I-_-6,y:M-_-6,width:(_+6)*2,height:(_+6)*2}),{body:T,x:I,y:M,radius:_}});e.font=`700 ${h}px sans-serif`;let w=e.measureText("ICRF XY projection").width+24,E=h*2+22,b=a+o+16,R=[n,n-w/2-16,n+w/2+16].map(T=>({x:Xe(T,w/2+12,this.width-w/2-12),y:b})),C=R.find(T=>!u.some(I=>p({x:T.x-w/2,y:T.y,width:w,height:E},I)))||R[0];u.push({x:C.x-w/2,y:C.y,width:w,height:E}),Gi(e,[{x:n,y:a+o},{x:C.x,y:C.y}],"#c9d5e4",1),f.push({...C,title:"MOON",detail:"ICRF XY projection",color:"#c9d5e4"});for(let{body:T,x:I,y:M,radius:_}of d){T.name!=="LRO"&&Gi(e,[{x:n,y:a},{x:I,y:M}],"#8aaca430",1,[3,7]);let L={Earth:"#90c7d6",Sun:"#edb76d",Mars:"#cf8361",LRO:"#a2f0cf"},O=e.createRadialGradient(I,M,_*.3,I,M,_*3.5);O.addColorStop(0,L[T.name]+"55"),O.addColorStop(1,L[T.name]+"00"),Wi(e,I,M,_*3.5,_*3.5,O),Wi(e,I,M,_,_,L[T.name]),T.name==="LRO"&&(e.strokeStyle="#9ce6ce",e.strokeRect(I-10,M-3,5,6),e.strokeRect(I+5,M-3,5,6));let z=T.name.toUpperCase(),X=`${Math.round(T.distanceKm).toLocaleString()} km`;e.font=`700 ${h}px sans-serif`;let q=Math.max(e.measureText(z).width,e.measureText(X).width)+24,G=h*2+22,W=[T.name==="LRO"?{x:n+o+q/2+22,y:a-o-26}:{x:I,y:M+_+12},{x:I,y:M-_-G-18},{x:I+q/2+32,y:M-G/2},{x:I-q/2-32,y:M-G/2},{x:I,y:M+_+30}];for(let fe=0;fe<5;fe++)W.push({x:q/2+18,y:s+fe*(G+10)}),W.push({x:this.width-q/2-18,y:s+fe*(G+10)});let oe=W.map(fe=>({x:Xe(fe.x,q/2+12,this.width-q/2-12),y:Xe(fe.y,s,r-G)})),he=oe.find(fe=>!u.some(He=>p({x:fe.x-q/2,y:fe.y,width:q,height:G},He)))||oe[0];Gi(e,[{x:I,y:M},{x:he.x,y:he.y+G/2}],L[T.name],1),u.push({x:he.x-q/2,y:he.y,width:q,height:G}),f.push({...he,title:z,detail:X,color:L[T.name]})}this.orbitLabels=f.map(T=>({name:T.title,...Au(e,T.x,T.y,T.title,T.detail,T.color,h)})),e.textAlign="left",e.fillStyle="#c6d6e9",e.font="12px sans-serif",e.fillText("NASA / JPL \xB7 dated vectors \xB7 distances compressed",20,this.height-176,this.width-40)}};function Cu(){let i=(e,t=.7,n=.1,s={})=>new Kn({color:e,roughness:t,metalness:n,depthTest:!0,depthWrite:!0,...s});return{suit:i("#e4e5df",.83),dark:i("#202731",.64),silver:i("#a7b5c2",.34,.72),white:i("#cbd1d2",.61,.22),orange:i("#d66b36",.5,.35),gold:i("#c89438",.22,.79),blue:i("#142e50",.32,.47),foil:i("#b49b61",.56,.72),glass:i("#1f405b",.18,.76),black:i("#101317",.87),cyan:i("#7be8db",.35,.1,{emissive:"#43bba8",emissiveIntensity:1.2}),amber:i("#ee914f",.3,.1,{emissive:"#ea6431",emissiveIntensity:.8}),rock:i("#686b70",.98),regolith:i("#828589",1)}}function vt(i,e,t,n=[0,0,0],s=null,r=""){let a=new At(e,t);return a.position.set(...n),s&&a.scale.set(...s),a.castShadow=!0,a.receiveShadow=!0,a.name=r,i.add(a),a}var Me=(i,e,t,n,s,r,a,o,c="")=>vt(i,new rn(r,a,o),e,[t,n,s],null,c),Wt=(i,e,t,n,s,r,a=null,o="")=>vt(i,new Jn(r,24,16),e,[t,n,s],a,o),pt=(i,e,t,n,s,r,a,o="")=>vt(i,new Rn(r,r,a,18),e,[t,n,s],null,o);function on(i,e,t,n,s=.065){let r=new N(...t),a=new N(...n),o=a.clone().sub(r),c=vt(i,new Rn(s,s,o.length(),8),e,r.clone().add(a).multiplyScalar(.5).toArray());return c.quaternion.setFromUnitVectors(new N(0,1,0),o.normalize()),c}function cc(i){let e=new Ve;e.name="astronaut";let t=new Ve;e.add(t),t.name="suit-body",vt(t,new er(.69,.95,6,16),i.suit,[0,2.65,0],[1,1,.74]),Me(t,i.dark,0,2.95,.51,1.05,.59,.15,"chest-console"),Me(t,i.orange,0,3.05,.6,.5,.11,.07);for(let r=0;r<3;r++)Wt(t,i.cyan,-.32+r*.32,2.79,.61,.044);Me(t,i.white,0,2.7,-.69,1.28,1.73,.67,"life-support-pack"),Me(t,i.orange,0,3.35,-1.03,1.08,.14,.05);for(let r=0;r<4;r++)Me(t,i.dark,0,2.3+r*.17,-1.04,.9,.07,.05);pt(t,i.dark,0,3.63,0,.51,.23,"helmet-collar");let n=new Ve;n.position.y=4.28,n.scale.setScalar(.82),n.name="helmet-pivot",t.add(n),Wt(n,i.suit,0,0,0,.93,[1,1,.91],"helmet-shell");let s=Wt(n,i.gold,0,-.03,.56,.74,[.97,.7,.49],"gold-visor");Me(n,i.white,0,.42,.47,1.1,.1,.21);for(let r of[-1,1]){Wt(n,i.silver,r*.87,-.03,0,.18,[.7,1,1]);let a=new Ve;a.position.set(r*.85,3.18,0),t.add(a),a.name=r<0?"left-arm":"right-arm",pt(a,i.suit,0,-.46,0,.23,.9),Wt(a,i.dark,0,-.92,0,.22);let o=new Ve;o.position.y=-.92,o.name=r<0?"left-elbow":"right-elbow",a.add(o);let c=pt(o,i.suit,0,-.38,.08,.2,.63);c.rotation.x=-.13,pt(o,i.orange,0,-.61,.1,.215,.11),Wt(o,i.suit,0,-.82,.11,.235,[1,1.25,1]),r<0&&(Me(o,i.dark,0,-.49,.27,.32,.34,.08,"wrist-computer"),Me(o,i.cyan,0,-.49,.315,.23,.22,.018,"wrist-display"));let l=new Ve;l.position.set(r*.37,1.96,0),e.add(l),l.name=r<0?"left-leg":"right-leg",pt(l,i.suit,0,-.44,0,.29,.81),Wt(l,i.dark,0,-.9,0,.24);let h=new Ve;h.position.y=-.9,h.name=r<0?"left-knee":"right-knee",l.add(h),pt(h,i.suit,0,-.4,0,.25,.61),Me(h,i.dark,0,-.91,.16,.58,.3,.93,"boot"),Me(h,i.orange,0,-.7,.2,.56,.12,.49);for(let u=0;u<4;u++)Me(h,i.silver,0,-1.063,-.16+u*.2,.52,.014,.055,"boot-tread")}on(t,i.gold,[-.62,2.42,.47],[-.95,2,-.15],.045);for(let r of[-1,1]){let a=vt(t,new pi(.71,.022,5,24),i.dark,[0,2.34+r*.42,0],[1,1,.75],"suit-seam");a.rotation.x=Math.PI/2}return e.userData={body:t,visor:s,helmet:n,arms:[t.getObjectByName("left-arm"),t.getObjectByName("right-arm")],elbows:[t.getObjectByName("left-elbow"),t.getObjectByName("right-elbow")],legs:[e.getObjectByName("left-leg"),e.getObjectByName("right-leg")],knees:[e.getObjectByName("left-knee"),e.getObjectByName("right-knee")]},e}function Ru(i){let e=new Ve;e.name="echo-rover",e.rotation.order="YXZ",Me(e,i.silver,0,1.06,0,4.5,.43,3.6,"chassis"),Me(e,i.white,0,1.92,.05,4.15,1.38,2.9,"pressure-cabin"),Me(e,i.orange,0,1.82,1.53,3.7,.16,.06),Me(e,i.glass,0,2.1,1.53,3.43,.8,.06,"windshield");for(let s of[-1,1])Me(e,i.glass,s*2.1,2.12,.15,.06,.75,1.98);Me(e,i.silver,0,2.73,0,4.36,.16,3.14,"roof"),Me(e,i.white,0,1.25,-2.27,3.76,.7,1,"cargo-bay"),Me(e,i.gold,0,1.75,-2.24,3.2,.25,.82);let t=[];for(let s of[-2.55,2.55])for(let r of[-1.52,0,1.52]){let a=new Ve;a.position.set(s,.77,r),e.add(a);let o=pt(a,i.black,0,0,0,.77,.49);o.rotation.z=Math.PI/2;let c=pt(a,i.silver,s<0?-.27:.27,0,0,.43,.07);c.rotation.z=Math.PI/2;for(let l=0;l<12;l++){let h=l*Math.PI/6,u=Me(a,i.dark,0,Math.cos(h)*.76,Math.sin(h)*.76,.53,.11,.26);u.rotation.x=h}on(e,i.silver,[s*.7,1.11,r],[s,.77,r],.1),t.push(a)}pt(e,i.silver,-1.2,3.19,-.44,.095,.9),Me(e,i.dark,-1.2,3.71,-.44,.69,.31,.4,"navigation-camera"),Wt(e,i.glass,-1.2,3.71,-.21,.14),on(e,i.silver,[1.5,2.8,-.9],[1.5,4.1,-.9],.035);let n=Wt(e,i.amber,1.5,4.12,-.9,.14);for(let s of[-1.4,1.4])Wt(e,i.cyan,s,1.28,1.87,.14);return e.userData={wheels:t,beacon:n},e}function Iu(i){let e=new Ve;e.name="haven-habitat",Me(e,i.dark,0,.62,0,16.8,1.23,11.52,"foundation"),Me(e,i.white,0,4,0,15,6,10.4,"habitat-shell"),Me(e,i.silver,0,7.08,0,15.8,.35,11,"roof-shield"),Me(e,i.orange,0,2.65,5.25,14.6,.36,.12);for(let n of[-4.6,0,4.6])Me(e,i.glass,n,4.8,5.24,2.9,1.6,.13,"window");for(let n of[-7.5,7.5])for(let s of[-5.4,5.4])pt(e,i.silver,n,2.12,s,.38,4.2,"support");for(let n of[-5,-2.5,0,2.5,5])Me(e,i.dark,n,7.35,0,.1,.18,10.5);pt(e,i.silver,-5,8.48,-3.5,.48,2.55,"antenna-support");let t=vt(e,new Jn(1.5,20,12,0,Math.PI*2,0,Math.PI*.35),i.white,[-5,9.79,-3.5]);t.rotation.z=-.5,Me(e,i.gold,3.7,7.68,-2.4,3.2,.88,2.7,"thermal-module");for(let n of[-4,0,4])Me(e,i.silver,n,7.42,4.4,2.7,.3,.8);return e}function Pu(i){let e=new Ve;e.name="airlock",Me(e,i.silver,-2.3,2.43,0,.2,4.86,7.04);for(let r of[-3.4,3.4])Me(e,i.silver,0,2.43,r,4.8,4.86,.2);Me(e,i.silver,0,4.75,0,4.8,.22,7.04),Me(e,i.dark,0,.2,0,4.8,.4,7.04,"chamber-floor");let t=new Ve;e.add(t),t.name="outer-hatch",Me(t,i.white,2.43,2.2,0,.11,3.51,3.8,"airlock-door"),Me(t,i.dark,2.52,2.2,0,.1,2.8,2.7);let n=Me(t,i.cyan,2.6,3.28,0,.1,.16,2.6);Me(e,i.dark,2.6,2.1,2.6,.16,3,.6,"pressure-gauge");let s=new Ve;return s.position.set(2.7,.7,2.6),e.add(s),Me(s,i.cyan,0,1.4,0,.12,2.8,.38,"pressure-column"),Me(e,i.silver,3.07,.13,0,1.1,.27,3.5),e.userData={door:t,light:n,pressure:s},e}function Lu(i,e=.8,t=.43){let n=new Ve;n.name="solar-array";let s=e*16,r=t*16;for(let o of[-s*.31,s*.31])for(let c of[-r*.32,r*.32])pt(n,i.silver,o,1.38,c,.095,2.8);let a=new Ve;a.position.y=4.2,a.rotation.order="YXZ",n.add(a),a.name="array-gimbal",pt(n,i.silver,0,3.5,0,.3,1.5),Me(a,i.silver,0,0,0,s,.16,r),Me(a,i.blue,0,.11,0,s-.18,.08,r-.18,"photovoltaic-surface");for(let o=0;o<=8;o++)Me(a,i.silver,-s/2+.18+o*(s-.36)/8,.17,0,.035,.03,r-.16);for(let o=0;o<=4;o++)Me(a,i.silver,0,.17,-r/2+.18+o*(r-.36)/4,s-.16,.03,.035);return n.userData={pivot:a},n}function Du(i){let e=new Ve;e.name="sample-laboratory",Me(e,i.silver,0,2.7,0,7.8,.3,5.6,"lab-worktop");for(let r of[-3.3,3.3])for(let a of[-2.2,2.2])pt(e,i.silver,r,1.35,a,.13,2.7);Me(e,i.dark,-2.6,3.05,-1.5,1.8,.6,1.4,"site-record-console");let t=new Ve;t.position.set(.6,2.85,0),e.add(t),pt(t,i.gold,0,.75,0,.7,1.5,"sample-canister");let n=new Ve;n.position.set(0,1.5,-.7),t.add(n),pt(n,i.silver,0,.08,.7,.75,.16,"canister-lid");let s=Wt(t,i.amber,0,.85,.72,.12);return Me(e,i.dark,2.9,3.25,-1.2,1.2,.9,2.2,"storage-rack"),e.userData={canister:t,lid:n,identity:s},e}function Nu(i){let e=new Ve;e.name="surface-relay",Me(e,i.dark,0,.3,0,6.4,.6,6.4,"relay-base"),Me(e,i.gold,0,1.7,0,3.6,2.8,3.6,"electronics-box");for(let o of[-1,1])for(let c of[-1,1])on(e,i.silver,[o*2.6,.4,c*2.6],[0,6.4,0],.16);pt(e,i.silver,0,5.7,0,.19,8.1,"mast");let t=new Ve;t.position.set(0,10,0),t.rotation.order="YXZ",t.rotation.x=.47,e.add(t);let n=i.white.clone();n.side=Kt;let s=vt(t,new Jn(2.9,32,16,0,Math.PI*2,0,Math.PI*.4),n);s.rotation.x=Math.PI;let r=vt(t,new pi(2.76,.09,8,36),i.silver,[0,-.9,0]);r.rotation.x=Math.PI/2,on(t,i.silver,[0,-2.5,0],[0,.8,0],.065),Wt(t,i.gold,0,.86,0,.2),Me(e,i.dark,0,1.8,1.83,2.7,1.6,.1);let a=Wt(e,i.amber,.8,2.25,1.94,.15);return e.userData={dish:t,lamp:a},e}function Uu(i){let e=new Ve;return e.name="storage-tank",pt(e,i.silver,0,2.3,0,2.1,4.6),Wt(e,i.silver,0,4.6,0,2.1,[1,.38,1]),pt(e,i.orange,0,2.7,0,2.14,.25),pt(e,i.dark,0,.25,0,2.65,.5),on(e,i.gold,[2,1.4,0],[3.2,1.4,0],.1),e}function Fu(i){let e=new Ve;e.name="cinematic-orbiter",Me(e,i.gold,0,0,0,2.4,2.7,2.4);for(let t of[-1,1]){Me(e,i.silver,t*4.25,0,0,5.4,.14,3.3),Me(e,i.blue,t*4.25,.12,0,5.1,.07,3);for(let n=0;n<6;n++)Me(e,i.silver,t*1.8+t*n*.89,.17,0,.03,.03,3)}return pt(e,i.white,0,1.8,0,1.25,.35),on(e,i.silver,[0,2,0],[0,3.2,0],.04),e}function Ou(i){let e=new Ve;e.name="cinematic-lunar-lander",pt(e,i.foil,0,3.4,0,3.3,2.5,"descent-stage"),pt(e,i.dark,0,2.06,0,.72,1.35,"engine-bell");let t=vt(e,new Rn(2.5,2.9,3.6,8),i.silver,[0,6.2,0]);t.rotation.y=Math.PI/8,Me(e,i.glass,-.75,6.7,2.57,1.08,.82,.08,"pilot-window"),Me(e,i.glass,.75,6.7,2.57,1.08,.82,.08,"pilot-window"),Me(e,i.white,0,5.55,2.87,1.6,1.45,.14,"crew-hatch"),Me(e,i.orange,0,5.2,2.96,1.3,.15,.06);let n=[];for(let s=0;s<4;s++){let r=Math.PI/4+s*Math.PI/2,a=Math.cos(r),o=Math.sin(r),c=new Ve;e.add(c),n.push(c),on(c,i.silver,[a*2.8,4,o*2.8],[a*5.3,.32,o*5.3],.16),on(c,i.dark,[a*2.9,2.4,o*2.9],[a*4.5,1.3,o*4.5],.12),pt(c,i.silver,a*5.3,.16,o*5.3,1.08,.26,"landing-foot"),Me(e,i.dark,a*3.3,3.6,o*3.3,.68,.46,.68,"attitude-thruster")}for(let s=0;s<8;s++)on(e,i.silver,[-.65,5.2-s*.48,3.2],[.65,5.2-s*.48,3.2],.06);for(let s of[-.75,.75])on(e,i.silver,[s,5.6,3.2],[s,.4,3.2],.045);return on(e,i.silver,[1.4,7.8,-.8],[1.4,10.1,-.8],.06),Wt(e,i.white,1.4,10.1,-.8,.45,[1,.28,1]),e.userData={legs:n},e}function hc(i){let e=new Ve;e.name="survey-instrument",pt(e,i.silver,0,.77,0,.13,1.5),Me(e,i.white,0,1.6,0,.95,.9,.75),Wt(e,i.cyan,0,2.13,0,.16);for(let t=0;t<3;t++){let n=t*Math.PI*2/3;on(e,i.silver,[0,.8,0],[Math.cos(n)*.9,0,Math.sin(n)*.9],.05)}return e}var ut=N,mr=i=>i*i*(3-2*i),vo=class{constructor(e,t,{device:n=null,createCanvas:s=null}={}){this.canvas=e,this.mission=t,this.createCanvas=s||((a,o)=>{let c=document.createElement("canvas");return c.width=a,c.height=o,c}),this.width=1e3,this.height=720,this.dpr=1,this.zoom=1.25,this.follow=!0,this.mode="surface",this.perspective="third-person",this.elevation=!1,this.showLifeline=!0,this.assistedRoute=null,this.cameraPinned=null,this.reducedMotion=!1,this.lastDrawTime=null,this.frameTime=0,this.stepPhase=0,this.particles=[],this.bursts=[],this.yaw=Math.PI/4,this.pitch=Math.atan(.76),this.lookYaw=this.yaw+Math.PI,this.lookPitch=0,this.cameraFocusHeight=2.8,this.focus=new ut,this.raycaster=new ys,this.pointer=new Ge,this.scene=new ds,this.scene.background=new ke("#020408"),this.camera=new Dt(49,this.width/this.height,.15,3e3),this.scene.add(new sr("#c3d4e6","#292623",.55)),this.sun=new ar("#fff1d7",4.1),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048),this.sun.shadow.camera.left=-78,this.sun.shadow.camera.right=78,this.sun.shadow.camera.top=78,this.sun.shadow.camera.bottom=-78,this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=240,this.sun.shadow.bias=-35e-5,this.sun.shadow.normalBias=.14,this.scene.add(this.sun,this.sun.target),this.mat=Cu(),this.addSurfaceDetail(),this.maps=new xo(t),this.orbitCanvas=this.createCanvas(1e3,720),this.device=n||new go({canvas:e,antialias:!0,alpha:!1,powerPreference:"high-performance"}),this.device.setClearColor("#020408",1),this.device.shadowMap.enabled=!0,this.device.shadowMap.type=va,this.device.toneMapping=Aa,this.device.toneMappingExposure=1.15,this.device.outputColorSpace=Lt,this.buildTerrain(),this.buildScenery(),this.buildSky(),this.player=cc(this.mat),this.rover=Ru(this.mat),this.scene.add(this.player,this.rover),this.buildCinematic(),this.fieldSample=vt(this.scene,new ms(1.1),this.mat.rock,[0,0,0],[1.3,.6,1],"collectable-field-sample"),this.carriedSample=vt(this.player,new Rn(.32,.32,.85,12),this.mat.gold,[1.2,1.4,.45],null,"carried-sample"),this.roverCargo=this.makeCargo(),this.roverCargo.position.set(0,2.55,-2.2),this.rover.add(this.roverCargo),this.outpostCargo=this.makeCargo(),this.outpostCargo.position.set(0,3.75,-1),this.models.get("lab")?.add(this.outpostCargo),this.deliveredCargo=this.makeCargo(),this.scene.add(this.deliveredCargo),this.pathGroups={};for(let a of["lifeline","trail","active","assisted"]){let o=new Ve;o.name=a+"-path",this.pathGroups[a]=o,this.scene.add(o)}this.pathKeys={},this.fxGroup=new Ve,this.scene.add(this.fxGroup),this.marker=vt(this.scene,new pi(2,.075,6,40),this.mat.amber),this.marker.rotation.x=-Math.PI/2,this.orbitTexture=new Zn(this.orbitCanvas),this.orbitTexture.colorSpace=Lt,this.orbitScene=new ds,this.orbitCamera=new Ui(-1,1,1,-1,0,1);let r=new At(new $n(2,2),new Cn({map:this.orbitTexture,depthTest:!1,depthWrite:!1,toneMapped:!1}));this.orbitScene.add(r),this.focus.copy(this.world(t.state.player)),this.updateActors(0),this.updateCamera(0)}world(e,t=0){let n=this.mission.terrain;return new ut((e.x-(n.width-1)/2)*8,(n.heightAt(e.x,e.y)-n.min)/n.cell*8*this.mission.config.art.terrainVerticalExaggeration+t,(e.y-(n.height-1)/2)*8)}addSurfaceDetail(){let e=this.createCanvas(128,128),t=e.getContext("2d"),n=wn(174);t.fillStyle="#b8b8b8",t.fillRect(0,0,128,128);for(let c=0;c<5e3;c++){let l=Math.round(110+n()*125);t.fillStyle=`rgb(${l},${l},${l})`,t.fillRect(n()*128,n()*128,1,1)}let s=new Zn(e);s.wrapS=s.wrapT=fi,s.repeat.set(4,4),this.mat.suit.bumpMap=s,this.mat.suit.bumpScale=.016,this.mat.silver.bumpMap=s,this.mat.silver.bumpScale=.008;let r=this.createCanvas(128,128),a=r.getContext("2d");for(let c=0;c<128;c+=2)for(let l=0;l<128;l+=2){let h=Math.round(155+42*Math.sin(l*.19+Math.sin(c*.27)*3)+20*Math.cos(c*.51-l*.08)+n()*22);a.fillStyle=`rgb(${h},${h},${h})`,a.fillRect(l,c,2,2)}let o=new Zn(r);o.wrapS=o.wrapT=fi,o.repeat.set(3,2),this.mat.foil.bumpMap=o,this.mat.foil.bumpScale=.08,this.mat.foil.roughnessMap=o}buildCinematic(){this.cinemaGroup=new Ve,this.cinemaGroup.name="opening-stage",this.cinemaGroup.visible=!1,this.scene.add(this.cinemaGroup),this.lander=Ou(this.mat),this.cinemaGroup.add(this.lander);let e=this.mission.objects.base,t=[[-4,3.5],[4,3.5],[-4,-4],[4,-4]].map(([r,a])=>({x:e.x+r,y:e.y+a}));this.landingPoint=t.find(r=>this.mission.terrain.inBounds(r.x,r.y)&&!Si(r,this.mission.props,1.1))||{x:e.x+4,y:e.y+3.5},this.landingOrigin=this.world(this.landingPoint);for(let r=0;r<4;r++){let a=Math.PI/4+r*Math.PI/2;this.landingOrigin.y=Math.max(this.landingOrigin.y,this.world({x:this.landingPoint.x+Math.cos(a)*5.3/8,y:this.landingPoint.y+Math.sin(a)*5.3/8}).y)}this.mentor=cc(this.mat),this.mentor.name="flight-school-instructor",this.cinemaGroup.add(this.mentor),this.plume=vt(this.lander,new tr(.95,2.8,20,1,!0),new Cn({color:"#c4dcfa",transparent:!0,opacity:.22,depthTest:!0,depthWrite:!1}),[0,0,0],null,"vacuum-exhaust"),this.plume.castShadow=!1,this.engineLight=new rr("#bccfff",0,16,2),this.lander.add(this.engineLight),this.engineLight.position.y=1.4;let n=wn(882),s=new Di(1,0);this.cinemaDust=[];for(let r=0;r<128;r++){let a=vt(this.cinemaGroup,s,this.mat.rock);a.castShadow=!1,a.visible=!1,this.cinemaDust.push({mesh:a,kind:r<80?"lander":"rover",angle:n()*Math.PI*2,start:r<80?3.15+n()*1.8:6.1+n()*2.6,speed:r<80?3+n()*8:.7+n()*3,lift:.35+n()*1.1,life:1.25+n()*.85,size:.035+n()*.085,side:n()>.5?1:-1})}}poseAstronaut(e,t,n,s=0,r=0){let a=Eu(t,n,s,r,this.reducedMotion),o=e.userData;for(let l=0;l<2;l++)o.legs[l].rotation.x=a.hips[l],o.knees[l].rotation.x=a.knees[l],o.arms[l].rotation.x=a.shoulders[l],o.elbows[l].rotation.x=a.elbows[l],o.arms[l].rotation.z=l===0?.04:-.04;o.body.position.y=a.bodyY,o.body.rotation.set(a.lean,0,a.roll),o.helmet.rotation.set(a.headPitch,a.headYaw,0);let c=a.hips.map((l,h)=>{let u=a.knees[h],f=-.9-.91*Math.cos(u)-.16*Math.sin(u),p=-.91*Math.sin(u)+.16*Math.cos(u);return 1.96+f*Math.cos(l)-p*Math.sin(l)-.15*Math.abs(Math.cos(l+u))-.465*Math.abs(Math.sin(l+u))});e.position.y-=Math.min(...c)}terrainTexture(){let e=this.createCanvas(256,256),t=e.getContext("2d"),n=wn(2219);t.fillStyle="#9a9996",t.fillRect(0,0,256,256);for(let r=0;r<18e3;r++){let a=80+Math.round(n()*110);t.fillStyle=`rgba(${a},${a},${a},${.04+n()*.2})`,t.fillRect(n()*256,n()*256,1+n()*2,1+n()*2)}let s=new Zn(e);return s.wrapS=s.wrapT=fi,s.repeat.set(100,100),s.colorSpace=Lt,s}buildTerrain(){let e=this.mission.terrain,t=(e.width-1)*2,n=(e.height-1)*2,s=new $n((e.width-1)*8,(e.height-1)*8,t,n);s.rotateX(-Math.PI/2);let r=s.attributes.position,a=new Float32Array(r.count*3),o=new ke;for(let u=0;u<r.count;u++){let f=r.getX(u)/8+(e.width-1)/2,p=r.getZ(u)/8+(e.height-1)/2;r.setY(u,this.world({x:f,y:p}).y),o.setRGB(.62,.64,.67),a.set(o.toArray(),u*3)}s.setAttribute("color",new Vt(a,3)),s.computeVertexNormals();let c=this.terrainTexture();this.groundMaterial=new Kn({color:"#bfc0bc",map:c,bumpMap:c,bumpScale:.065,roughness:1,vertexColors:!0,metalness:0}),this.ground=vt(this.scene,s,this.groundMaterial,[0,0,0],null,"NASA-LOLA-terrain"),this.ground.castShadow=!1;let l=new At(new $n(4e3,4e3),new Kn({color:"#37393d",roughness:1}));l.rotation.x=-Math.PI/2,l.position.y=-24,l.receiveShadow=!0,l.name="illustrative-distant-ground",this.scene.add(l);let h=wn(183);this.rocks=[];for(let u=0;u<210;u++){let f={x:2+h()*(e.width-4),y:2+h()*(e.height-4)};if(this.mission.props.some(y=>Math.hypot(y.x-f.x,y.y-f.y)<3)||Math.hypot(f.x-this.mission.state.rover.x,f.y-this.mission.state.rover.y)<3)continue;let p=.15+h()*.33,g=vt(this.scene,new ms(p,0),this.mat.rock,this.world(f,p*.16).toArray(),[1.4,.52,1],"decorative-pebble");g.rotation.y=h()*Math.PI,this.rocks.push(g)}}buildScenery(){this.scenery=new Ve,this.scenery.name="solid-equipment",this.scene.add(this.scenery),this.models=new Map;for(let e of this.mission.props){let t=e.kind==="habitat"?Iu(this.mat):e.kind==="airlock"?Pu(this.mat):e.kind==="solar"?Lu(this.mat,e.halfX,e.halfY):e.kind==="relay"?Nu(this.mat):e.kind==="lab"?Du(this.mat):Uu(this.mat);t.position.copy(this.world(e)),t.userData.layout=e,this.scenery.add(t),this.models.set(e.id,t);let n=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([a,o])=>this.world({x:e.x+a*(e.halfX||e.radius),y:e.y+o*(e.halfY||e.radius)}).y),s=Math.max(t.position.y,...n),r=Math.min(t.position.y,...n)-.35;t.position.y=s,vt(t,new rn((e.halfX||e.radius)*16,s-r,(e.halfY||e.radius)*16),this.mat.regolith,[0,-(s-r)/2,0],null,"equipment-footing")}this.surveys=this.mission.science.map(e=>{let t=hc(this.mat);return t.position.copy(this.world(e)),t.userData.site=e,this.scene.add(t),t}),this.satellite=Fu(this.mat),this.satellite.position.copy(this.world(this.mission.objects.base,34)).add(new ut(25,0,-20)),this.satellite.visible=!1,this.scene.add(this.satellite)}buildSky(){let e=wn(7417),t=new Float32Array(900*3);for(let c=0;c<900;c++){let l=e()*Math.PI*2,h=.15+e()*.85,u=Math.sqrt(1-h*h);t.set([Math.cos(l)*u*1200,h*1200,Math.sin(l)*u*1200],c*3)}let n=new Ut;n.setAttribute("position",new Vt(t,3)),this.stars=new Ks(n,new ps({color:"#b2bdc8",size:1.1,sizeAttenuation:!0,depthTest:!0,depthWrite:!1})),this.scene.add(this.stars);let s=this.createCanvas(512,256),r=s.getContext("2d");r.fillStyle="#185281",r.fillRect(0,0,512,256),r.fillStyle="#678887";let a=[[[70,38],[122,20],[159,61],[113,99],[139,126],[116,170],[85,110]],[[250,48],[317,26],[357,61],[392,88],[351,120],[302,99],[287,191],[258,136]],[[413,162],[458,155],[478,198],[424,214]]];for(let c of a){r.beginPath(),r.moveTo(...c[0]);for(let l of c.slice(1))r.lineTo(...l);r.closePath(),r.fill()}r.strokeStyle="#eaf0f3",r.globalAlpha=.35,r.lineWidth=6;for(let c=0;c<40;c++)r.beginPath(),r.ellipse(e()*512,e()*256,15+e()*40,2+e()*4,-.25,0,Math.PI*1.5),r.stroke();let o=new Zn(s);o.colorSpace=Lt,this.earth=new At(new Jn(49,40,24),new Kn({map:o,color:"#a6b4c7",roughness:1})),this.earth.position.set(-340,480,-800),this.scene.add(this.earth)}resize(e,t,n=1){this.width=Math.max(1,e),this.height=Math.max(1,t),this.dpr=Math.min(n,1.6),this.device.setPixelRatio(this.dpr),this.device.setSize(this.width,this.height,!1),this.camera.aspect=this.width/this.height,this.camera.updateProjectionMatrix(),this.orbitCanvas.width=this.width,this.orbitCanvas.height=this.height,this.orbitTexture.needsUpdate=!0}setElevation(e){this.elevation=e;let t=this.mission.terrain,n=this.ground.geometry.attributes.color,s=this.ground.geometry.attributes.position;for(let r=0;r<n.count;r++){let a=s.getX(r)/8+(t.width-1)/2,o=s.getZ(r)/8+(t.height-1)/2,c=(t.heightAt(a,o)-t.min)/(t.max-t.min),l=new ke;e?l.setHSL(.58-c*.5,.53,.31+c*.3):l.setRGB(.62,.64,.67),n.setXYZ(r,l.r,l.g,l.b)}n.needsUpdate=!0}inputVector(e,t){return this.perspective==="first-person"?{dx:e*Math.cos(this.lookYaw)-t*Math.sin(this.lookYaw),dy:-e*Math.sin(this.lookYaw)-t*Math.cos(this.lookYaw)}:{dx:e*Math.cos(this.yaw)+t*Math.sin(this.yaw),dy:-e*Math.sin(this.yaw)+t*Math.cos(this.yaw)}}setPerspective(e){e!==this.perspective&&(e==="first-person"?(this.lookYaw=this.yaw+Math.PI,this.lookPitch=0,this.follow=!0,this.cameraPinned=null):(this.yaw=(this.lookYaw??this.yaw+Math.PI)-Math.PI,this.pitch=Math.atan(.76)),this.perspective=e,this.camera.fov=e==="first-person"?72:49,this.camera.updateProjectionMatrix(),this.updateCamera(0))}rotateCamera(e,t=0){this.perspective==="first-person"?(this.lookYaw+=e,this.lookPitch=Xe(this.lookPitch+t,-1.4,1.4)):(this.yaw+=e,this.pitch=Xe(this.pitch+t,.12,1.48))}panCamera(e,t){if(this.perspective==="first-person")return;let n=this.camera.position.distanceTo(this.focus),s=2*n*Math.tan(this.camera.fov*Math.PI/360)/this.height,r=-e*s,a=-t*s/Math.max(.25,Math.sin(this.pitch)),o=this.mission.terrain,c=this.cameraPinned||{x:this.focus.x/8+(o.width-1)/2,y:this.focus.z/8+(o.height-1)/2};this.routeDistance=this.cameraPinned?this.routeDistance:54,this.cameraPinned={x:Xe(c.x+(r*Math.cos(this.yaw)+a*Math.sin(this.yaw))/8,1,o.width-2),y:Xe(c.y+(-r*Math.sin(this.yaw)+a*Math.cos(this.yaw))/8,1,o.height-2)},this.follow=!1,this.focus.copy(this.world(this.cameraPinned,this.cameraFocusHeight??2.8)),this.updateCamera(0)}resetCamera(){this.yaw=Math.PI/4,this.pitch=Math.atan(.76),this.lookYaw=Math.PI/2-this.mission.state.player.heading,this.lookPitch=0,this.follow=!0,this.cameraPinned=null,this.cameraFocusHeight=2.8,this.zoom=1.2,this.focus.copy(this.world(this.mission.state.player,2.8)),this.updateCamera(0)}showObjective(){let e=this.mission.target();if(this.perspective==="first-person"){this.updateCamera(0);let t=this.world(e,4).sub(this.camera.position);t.lengthSq()>.01&&(this.lookYaw=Math.atan2(t.x,t.z),this.lookPitch=Xe(Math.atan2(t.y,Math.hypot(t.x,t.z)),-1.4,1.4))}else this.cameraPinned={...e},this.cameraFocusHeight=4,this.routeDistance=44,this.follow=!1,this.zoom=1.2,this.pitch=.65,this.focus.copy(this.world(e,4));this.updateCamera(0)}showOverview(){this.frameRoute([this.mission.state.player,this.mission.target()]),this.updateCamera(0)}inspectTraining(){this.setPerspective("third-person");let e=this.mission.lesson?.id,t=this.models.get({solar:"solar",airlock:"airlock",samples:"lab",comms:"relay",logistics:"lab",systems:"habitat",shelter:"habitat"}[e]);this.cameraPinned=t?{...t.userData.layout}:{...this.mission.target()},this.cameraFocusHeight=e==="comms"?7:3,this.follow=!1,this.routeDistance=e==="comms"?45:34,this.zoom=1.2,this.pitch=.55,this.focus.copy(this.world(this.cameraPinned,this.cameraFocusHeight)),this.updateCamera(0)}demonstrateTraining(){this.demonstration={id:this.mission.lesson.id,start:this.frameTime}}makeCargo(){let e=new Ve;return e.name="supply-crate",vt(e,new rn(2.7,1.45,1.9),this.mat.orange),vt(e,new rn(2.85,1.55,.16),this.mat.silver),vt(e,new rn(.16,1.55,2.05),this.mat.silver),e}refreshMission(){for(let e of this.surveys)this.scene.remove(e),e.traverse(t=>t.geometry?.dispose());this.surveys=this.mission.science.map(e=>{let t=hc(this.mat);return t.position.copy(this.world(e)),t.userData.site=e,this.scene.add(t),t}),this.pathKeys={},this.lastDrawTime=null,this.demonstration=null,this.updateActors(0),this.resetCamera()}screenMarker(e,t=4,n=!1){let s=this.world(e,t),r=s.clone().project(this.camera),a=s.clone().sub(this.camera.position).dot(this.camera.getWorldDirection(new ut))>0,o=a;if(n&&o){let m=this.world(e,2.5),d=this.camera.position.distanceTo(m);o=new ys(this.camera.position,m.clone().sub(this.camera.position).normalize(),0,Math.max(0,d-.35)).intersectObjects([this.scenery,this.ground,...this.mission.state.rover.occupied?[]:[this.rover]],!0).length===0}let c=(r.x+1)*this.width/2,l=(1-r.y)*this.height/2,h={x:e.x-this.mission.state.player.x,y:e.y-this.mission.state.player.y},u=this.mission.screenBasis||{right:this.inputVector(1,0),down:this.inputVector(0,1)},f=h.x*u.right.dx+h.y*u.right.dy,p=h.x*u.down.dx+h.y*u.down.dy,g=["\u2192","\u2198","\u2193","\u2199","\u2190","\u2196","\u2191","\u2197"][(Math.round(Math.atan2(p,f)/(Math.PI/4))+8)%8],y=c<110||c>this.width-110||l<190||l>this.height-145;if(!a){let m=Math.max(.01,Math.abs(f),Math.abs(p));c=this.width/2+f/m*this.width/2,l=this.height/2+p/m*this.height/2}return!n&&!a&&(o=!0),{x:Xe(c,110,Math.max(110,this.width-110)),y:Xe(l,190,Math.max(190,this.height-145)),visible:o&&(!n||!y),edge:y||!a,arrow:g}}frameRoute(e){if(!e?.length)return;this.setPerspective("third-person");let t=e.map(c=>this.world(c,3)),n=new An().setFromPoints(t),s=n.getCenter(new ut),r=this.mission.terrain;this.cameraPinned={x:s.x/8+(r.width-1)/2,y:s.z/8+(r.height-1)/2},this.cameraFocusHeight=s.y-this.world(this.cameraPinned).y;let a=Math.min(this.camera.fov*Math.PI/360,Math.atan(Math.tan(this.camera.fov*Math.PI/360)*this.camera.aspect)),o=Math.max(12,...t.map(c=>c.distanceTo(s)));this.routeDistance=Math.max(50,o/Math.sin(a)*1.55)/Math.hypot(1,.76),this.zoom=1,this.pitch=Math.max(this.pitch,.65),this.follow=!1,this.focus.copy(s)}updateCamera(e){let t=this.mission.state;if(this.perspective==="first-person"){this.follow=!0,this.cameraPinned=null,this.focus.copy(this.world(t.player,2.8));let a=this.world(t.player,t.rover.occupied?3.35:4.25+(t.player.jump||0)*1.2);this.camera.position.copy(a);let o=new ut(Math.sin(this.lookYaw)*Math.cos(this.lookPitch),Math.sin(this.lookPitch),Math.cos(this.lookYaw)*Math.cos(this.lookPitch));this.camera.lookAt(a.clone().add(o)),this.camera.updateMatrixWorld(!0),this.updateSun(),this.mission.screenBasis={right:this.inputVector(1,0),down:this.inputVector(0,1)};return}let n=this.world(this.cameraPinned||t.player,this.cameraPinned?this.cameraFocusHeight??2.8:t.rover.occupied?2:2.8),s=this.reducedMotion?1:1-Math.exp(-Math.max(e,.016)*4);this.focus.lerp(n,s);let r=(this.cameraPinned&&this.routeDistance||54)*Math.hypot(1,.76)/this.zoom;this.camera.position.copy(this.focus).add(new ut(Math.sin(this.yaw)*Math.cos(this.pitch)*r,Math.sin(this.pitch)*r,Math.cos(this.yaw)*Math.cos(this.pitch)*r)),this.keepCameraAboveGround(),this.updateSun(),this.mission.screenBasis={right:this.inputVector(1,0),down:this.inputVector(0,1)}}updateSun(){this.sun.target.position.copy(this.focus),this.sun.position.copy(this.focus).add(new ut(-70,44,40)),this.sun.target.updateMatrixWorld()}keepCameraAboveGround(){let e=this.mission.terrain,t=this.camera.position.x/8+(e.width-1)/2,n=this.camera.position.z/8+(e.height-1)/2;e.inBounds(t,n)&&(this.camera.position.y=Math.max(this.camera.position.y,this.world({x:t,y:n}).y+4)),this.camera.lookAt(this.focus)}placeRover(e,t){let n={x:Math.sin(t)*1.52/8,y:Math.cos(t)*1.52/8},s={x:Math.cos(t)*2.55/8,y:-Math.sin(t)*2.55/8},r=this.world({x:e.x+n.x,y:e.y+n.y}).y,a=this.world({x:e.x-n.x,y:e.y-n.y}).y,o=this.world({x:e.x+s.x,y:e.y+s.y}).y,c=this.world({x:e.x-s.x,y:e.y-s.y}).y;this.rover.position.copy(this.world(e,.03)),this.rover.rotation.set(-Math.atan2(r-a,3.04),t,Math.atan2(o-c,5.1),"YXZ")}updateActors(e,t=0){let n=this.mission.state;this.player.position.copy(this.world(n.player,n.player.jump*1.2)),this.player.rotation.y=Math.PI/2-n.player.heading,this.player.visible=!n.rover.occupied&&!n.training?.inside&&this.perspective!=="first-person",this.placeRover(n.rover,Math.PI/2-(n.rover.occupied?n.player.heading:0));let s=this.lastActorPosition?Math.hypot(this.player.position.x-this.lastActorPosition.x,this.player.position.z-this.lastActorPosition.z):0;n.moving&&!this.reducedMotion&&s<6&&(this.stepPhase+=s*2.45),this.lastActorPosition=this.player.position.clone();let r=n.moving&&!n.rover.occupied?1:0;this.gaitStrength=e?(this.gaitStrength||0)+(r-(this.gaitStrength||0))*(1-Math.exp(-e*9)):r,this.poseAstronaut(this.player,this.stepPhase,t,this.gaitStrength),n.training?.drill?.collected&&!n.training.drill.stowed&&(this.player.userData.arms[1].rotation.x=-.55),this.mission.lesson?.id==="airlock"&&n.training.drill?.suitChecked&&!n.training.inside&&(this.player.userData.arms[0].rotation.x=-.8),this.rover.userData.beacon.material=n.rover.repaired?this.mat.cyan:this.mat.amber;let a=this.lastRoverPosition?this.rover.position.distanceTo(this.lastRoverPosition):0;n.rover.occupied&&n.moving&&!this.reducedMotion&&a<6&&(this.wheelAngle=(this.wheelAngle||0)+a/.77),this.lastRoverPosition=this.rover.position.clone();for(let l of this.rover.userData.wheels)l.rotation.x=this.wheelAngle||0;this.rover.userData.beacon.scale.setScalar(1);let o=this.models.get("relay");o&&(o.userData.lamp.material=n.relayOnline?this.mat.cyan:this.mat.amber,o.userData.lamp.visible=!0);let c=this.mission.target();this.marker.position.copy(this.world(c,.28)),this.marker.visible=n.status!=="complete"&&!this.cinematic,this.marker.scale.setScalar(this.reducedMotion?1:1+Math.sin(t*2)*.12);for(let l of this.surveys)l.visible=!n.scans.includes(l.userData.site.id);this.satellite.visible=!1,this.updateTrainingModels(e,t)}updateTrainingModels(e,t){let n=this.mission.state,s=this.mission.lesson?.id,r=n.training?.drill,a=this.demonstration;a&&t-a.start>=7&&(this.demonstration=null,a=null);let o=a?this.reducedMotion?1:Xe((t-a.start)/5,0,1):0,c=this.models.get("solar"),l=this.models.get("airlock"),h=this.models.get("relay"),u=this.models.get("lab");if(c&&c.userData.pivot.rotation.set((s==="solar"?a?35*o:r.tilt:0)*Math.PI/180,(s==="solar"?a?110*o:r.bearing:0)*Math.PI/180,0),h&&s==="comms"?h.userData.dish.rotation.set((a?32*o:r.tilt)*Math.PI/180,(a?72*o:r.bearing)*Math.PI/180,0):h&&!this.cinematic&&h.userData.dish.rotation.set(.47,0,0),l){let g=s==="airlock"&&(a?o>.75:r.outerOpen),y=s==="airlock"?a?1-o:r.pressure/100:1,m=this.reducedMotion||e===0?1:1-Math.exp(-e*4);l.userData.door.position.z+=(g?3.4-l.userData.door.position.z:-l.userData.door.position.z)*m,l.userData.pressure.scale.y+=(Math.max(.01,y)-l.userData.pressure.scale.y)*m,l.userData.light.material=s==="airlock"&&r?.innerClosed?this.mat.amber:this.mat.cyan}let f=s==="samples",p=s==="logistics";this.fieldSample.visible=f&&!r.collected,this.carriedSample.visible=f&&r.collected&&!r.stowed&&!this.mission.near(this.mission.objects.base),this.roverCargo.visible=p&&(a?o<.8:r.loaded&&!r.delivered),this.deliveredCargo.visible=p&&(a?o>=.8:r.delivered),this.outpostCargo&&(this.outpostCargo.visible=p&&!a&&!r.loaded),this.mission.practice&&(this.fieldSample.position.copy(this.world(this.mission.practice,.6)),this.deliveredCargo.position.copy(this.world(this.mission.practice,.9))),u&&(u.userData.canister.visible=f&&(a||r.collected&&this.mission.near(this.mission.objects.base)||r?.stowed),u.userData.canister.position.x=r?.stowed?2.6:.6,u.userData.lid.rotation.x=f&&(a?o<.6:!r.sealed)?-1.8:0,u.userData.identity.material=f&&(a?o>.3:r.tagged)?this.mat.cyan:this.mat.amber)}setPath(e,t,n,s=!1){let r=this.pathGroups[e],a=(t||[]).map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join("|")+n;if(this.pathKeys[e]===a)return;this.pathKeys[e]=a;for(let p of[...r.children])p.geometry?.dispose(),p.material?.dispose(),r.remove(p);if(!t||t.length<2)return;let o=[];for(let p=1;p<t.length;p++){let g=t[p-1],y=t[p],m=Math.max(2,Math.ceil(Math.hypot(g.x-y.x,g.y-y.y)*4));for(let d=0;d<m;d++){let w=d/m;o.push(this.world({x:g.x+(y.x-g.x)*w,y:g.y+(y.y-g.y)*w},.36))}}o.push(this.world(t.at(-1),.36));let c=[],l=[],h=s?.11:.18;for(let p=0;p<o.length;p++){let g=o[Math.min(p+1,o.length-1)].clone().sub(o[Math.max(0,p-1)]),y=new ut(-g.z,0,g.x).normalize().multiplyScalar(h);if(c.push(...o[p].clone().add(y).toArray(),...o[p].clone().sub(y).toArray()),p&&(!s||p%5<3)){let m=p*2;l.push(m-2,m-1,m,m-1,m+1,m)}}let u=new Ut;u.setAttribute("position",new lt(c,3)),u.setIndex(l);let f=new Cn({color:n,side:Kt,depthTest:!0,depthWrite:!1});r.add(new At(u,f))}updatePaths(e){let t=this.mission.state;this.setPath("lifeline",this.showLifeline&&t.status!=="ready"?e?.route?.path:null,e?.safe?"#cfdddd":"#ed8b4b",!0),this.setPath("trail",t.trail,"#405c67",!0),this.setPath("active",this.mission.route?[t.player,...this.mission.route.path.slice(this.mission.route.index)]:null,"#f7a755"),this.setPath("assisted",this.assistedRoute?.path,this.assistedRoute?.safe?"#77dac6":"#ffbc7d")}toScreen(e,t=0){this.scene.updateMatrixWorld(!0),this.camera.updateMatrixWorld(!0);let n=this.world(e,t).project(this.camera);return{x:(n.x+1)*this.width/2,y:(1-n.y)*this.height/2,visible:n.z>-1&&n.z<1}}fromScreen(e,t){this.pointer.set(e/this.width*2-1,1-t/this.height*2),this.camera.updateMatrixWorld(!0),this.scene.updateMatrixWorld(!0),this.raycaster.setFromCamera(this.pointer,this.camera);let n=this.raycaster.intersectObjects([this.ground,...this.scenery.children,this.rover],!0)[0];if(!n)return null;let s=n.object;for(;s&&s!==this.scene;){if(s===this.rover)return{...this.mission.state.rover};if(s.userData.layout)return{...s.userData.layout.kind==="relay"?this.mission.objects.relay:this.mission.objects.base};s=s.parent}let r=this.mission.terrain;return{x:n.point.x/8+(r.width-1)/2,y:n.point.z/8+(r.height-1)/2}}clearEffects(){for(let e of this.particles)this.fxGroup.remove(e.mesh),e.mesh.geometry.dispose();this.particles=[],this.bursts=[]}trigger(e,t=this.mission.state.player){if(this.reducedMotion)return;let n=wn(Math.floor(this.frameTime*1e3)+72),s=e==="survey"?"#75ead0":e==="victory"?"#e7d5a3":"#ee9a54",r=new Cn({color:s,depthTest:!0,depthWrite:!1});for(let a=0;a<(e==="route"?8:26);a++){let o=vt(this.fxGroup,new Di(.06+n()*.1,0),r,this.world(t,1).toArray());o.castShadow=!1,this.particles.push({mesh:o,v:new ut((n()-.5)*5,1+n()*5,(n()-.5)*5),age:0,life:1+n()*1.2})}}updateFX(e){let t=this.mission.state;if(t.moving&&!this.reducedMotion&&this.frameTime-(this.lastDust||0)>.12){this.lastDust=this.frameTime;let n=vt(this.fxGroup,new Di(.13,0),this.mat.rock,this.world(t.player,.18).toArray());n.castShadow=!1,this.particles.push({mesh:n,v:new ut(Math.sin(this.stepPhase)*.35,.5,-.15),age:0,life:.55})}for(let n of[...this.particles])n.age+=e,n.v.y-=e*1.62,n.mesh.position.addScaledVector(n.v,e),n.mesh.scale.setScalar(Math.max(.03,1-n.age/n.life)),n.age>=n.life&&(this.fxGroup.remove(n.mesh),n.mesh.geometry.dispose(),this.particles.splice(this.particles.indexOf(n),1))}drawMini(e,t){this.maps.assistedRoute=this.assistedRoute,this.maps.drawMini(e,t)}draw(e=0,t=null){let n=this.lastDrawTime===null?0:Xe(e-this.lastDrawTime,0,.1);if(this.lastDrawTime=e,this.frameTime=e,this.updateActors(n,e),this.updateFX(n),this.mode==="orbital"){this.maps.drawOrbit(this.orbitCanvas,e),this.orbitTexture.needsUpdate=!0,this.device.render(this.orbitScene,this.orbitCamera);return}this.updatePaths(t),this.updateCamera(n),this.scene.updateMatrixWorld(!0),this.device.render(this.scene,this.camera)}cinematicFrame(e,t){this.cinematic||(this.cinemaLens={fov:this.camera.fov,exposure:this.device.toneMappingExposure}),this.cinematic=!0,this.updateActors(0,e);for(let f of Object.values(this.pathGroups))f.visible=!1;let n=lc(e,this.reducedMotion);this.cinematicFade=n.fade,this.cinemaGroup.visible=!0,this.lander.position.copy(this.landingOrigin).add(new ut(0,n.landerHeight-n.legCompression,0)),this.lander.rotation.set(this.reducedMotion?0:Math.sin(e*1.8)*.035*n.landerHeight/27,0,this.reducedMotion?0:Math.sin(e*1.3)*.025*n.landerHeight/27);for(let f of this.lander.userData.legs)f.position.y=n.legCompression;this.plume.visible=n.engine>0,this.plume.scale.set(1,n.engine*1.3,1),this.plume.position.y=1.38-1.4*n.engine*1.3,this.engineLight.intensity=n.engine*5;let s=this.mission.state,r=new ut(Math.sin(this.rover.rotation.y),0,Math.cos(this.rover.rotation.y));this.placeRover({x:s.rover.x+r.x*(n.roverTravel-10)/8,y:s.rover.y+r.z*(n.roverTravel-10)/8},this.rover.rotation.y),this.rover.rotation.x+=n.roverBrake;for(let f of this.rover.userData.wheels)f.rotation.x=n.roverTravel/.77;this.rover.userData.beacon.scale.setScalar(this.reducedMotion?1:.82+Math.max(0,Math.sin(e*5))*.18);let a=new ut(Math.sin(.35),0,Math.cos(.35)),o={x:s.player.x+a.x*(n.cadetTravel-5)/8,y:s.player.y+a.z*(n.cadetTravel-5)/8};if(this.player.position.copy(this.world(o)),this.player.rotation.y=.35,this.player.visible=!0,this.poseAstronaut(this.player,n.cadetTravel*2.45,e,n.cadetStride,n.wristCheck),this.mentor.position.copy(this.world({x:s.player.x+.32,y:s.player.y-.12})),this.mentor.rotation.y=-1.17,this.poseAstronaut(this.mentor,0,e,0,this.reducedMotion?0:.3),!this.reducedMotion){let f=mr(Xe((e-22.2)/1.4,0,1));this.mentor.userData.arms[1].rotation.x=-.46*f,this.mentor.userData.elbows[1].rotation.x=-.8*f}let c=this.models.get("relay");c.userData.dish.rotation.set(n.relayTilt,n.relayBearing,0),t==="relay"&&!this.reducedMotion&&(c.userData.lamp.visible=e%1.1<.85),this.updateCinematicDust(e,r);let l,h,u;if(t==="arrival"?(l=this.world(this.mission.objects.base,5).lerp(this.landingOrigin.clone().add(new ut(0,5,0)),.35),u=mr(Xe(e/6,0,1)),h=new ut(76-u*23,40-u*13,70-u*16)):t==="echo"?(l=this.rover.position.clone().add(new ut(0,1.9,0)),u=mr(Xe((e-6)/6,0,1)),h=new ut(-11+u*3,3.1-u*.75,14-u*3).applyAxisAngle(new ut(0,1,0),this.rover.rotation.y)):t==="relay"?(l=c.position.clone().add(new ut(0,6.5,0)),u=mr(Xe((e-12)/7,0,1)),h=new ut(17-u*5,4.8+u*1.2,19-u*5)):(l=this.player.position.clone().add(new ut(0,3,0)),u=mr(Xe((e-19)/7,0,1)),h=new ut(8-u*2.5,2.2-u*1.1,12-u*3.2)),this.reducedMotion){let f={arrival:[62,33,64],echo:[-9,3.1,14],relay:[16,5,18],astronaut:[8,2,12]};h=new ut(...f[t])}h.multiplyScalar(Math.max(1,1.1/this.camera.aspect)),this.camera.fov=46,this.camera.setViewOffset(this.width,this.height,-this.width*.1,this.height*.09,this.width,this.height),this.device.toneMappingExposure=1.1,this.focus.copy(l),this.camera.position.copy(l).add(h),this.keepCameraAboveGround(),this.updateSun(),this.scene.updateMatrixWorld(!0),this.device.render(this.scene,this.camera)}updateCinematicDust(e,t){let n=new ut(t.z,0,-t.x);for(let s of this.cinemaDust){let r=e-s.start;if(s.mesh.visible=!this.reducedMotion&&r>=0&&r<s.life,!s.mesh.visible)continue;let a,o;if(s.kind==="lander"){let l=2.1+s.size*10;a=this.world({x:this.landingPoint.x+Math.cos(s.angle)*l/8,y:this.landingPoint.y+Math.sin(s.angle)*l/8},.08),o=new ut(Math.cos(s.angle),0,Math.sin(s.angle))}else{let l=lc(s.start).roverTravel-10,h=this.world(this.mission.state.rover).addScaledVector(t,l-1.2).addScaledVector(n,s.side*2.55),u=this.mission.terrain;a=this.world({x:h.x/8+(u.width-1)/2,y:h.z/8+(u.height-1)/2},.08),o=t.clone().multiplyScalar(-.8).addScaledVector(n,s.side*(.25+Math.abs(Math.sin(s.angle))*.35)).normalize()}let c=Tu(r,s.speed,s.lift);s.mesh.position.copy(a).addScaledVector(o,c.distance),s.mesh.position.y+=c.height,s.mesh.scale.setScalar(s.size*Xe((s.life-r)/.4,0,1)),c.height===0&&r>.1&&(s.mesh.visible=!1)}}endCinematic(){this.cinematic=!1,this.cinematicFade=0,this.satellite.visible=!1,this.cinemaGroup.visible=!1,this.engineLight.intensity=0,this.camera.clearViewOffset(),this.camera.fov=this.cinemaLens?.fov??(this.perspective==="first-person"?72:49),this.camera.updateProjectionMatrix(),this.device.toneMappingExposure=this.cinemaLens?.exposure??1.15,this.cinemaLens=null;for(let e of Object.values(this.pathGroups))e.visible=!0;this.lastDrawTime=null,this.lastActorPosition=null,this.lastRoverPosition=null,this.updateActors(0,this.frameTime),this.focus.copy(this.world(this.mission.state.player,2.8)),this.updateCamera(0)}dispose(){this.scene.traverse(e=>{e.geometry?.dispose()}),this.device.dispose()}};var _o="luna-academy-guide-v1",Mo=class{constructor(e,t=null){this.mission=e,this.storage=t,this.active=!Bt(_o,{disabled:!1},t)?.disabled,this.reason=""}get steps(){return[{id:"welcome"},...this.mission.lesson.steps.map((e,t)=>({id:"task-"+t}))]}get index(){return this.mission.state.status==="ready"?0:Math.max(1,this.mission.objectiveIndex()+1)}get holdsTime(){return!1}get step(){let e=this.mission.nextAction(),t=this.mission.state.status==="repair";return{id:this.mission.state.status==="ready"?"welcome":t?this.mission.repairType==="rover"?"echo-repair":"relay-repair":"task-"+this.mission.objectiveIndex(),title:e.title,text:e.text,action:e.action,command:e.command,target:t?"circuit-grid":e.command==="scan"?"world":e.command==="interact"?"interact-button":e.command==="start"?"start-button":e.command==="orbit"?"orbit-tab":"route-button",hold:!1}}next(){}forLevel(){this.active=!Bt(_o,{disabled:!1},this.storage)?.disabled,this.reason=""}restart(){this.active=!0,this.reason="",kt(_o,{disabled:!1},this.storage)}disable(e="skipped"){this.active=!1,this.reason=e,kt(_o,{disabled:!0,reason:e},this.storage)}sync(e){e.state.status==="complete"?(this.active=!1,this.reason="lesson-complete"):e.state.status==="failed"&&(this.active=!1,this.reason="failed")}};var bo=class{constructor(e=null,t=null){this.storage=e,this.Context=t;let n=Bt("luna-audio-v1",{},e);this.muted=n?.muted===!0,this.volume=Number.isFinite(n?.volume)?Math.max(0,Math.min(1,n.volume)):.45,this.context=null,this.nextBeat=0,this.beat=0,this.mode="explore",this.activeVoices=0,this.nodes=new Set,this.lastStep=0,this.hidden=!1}save(){kt("luna-audio-v1",{muted:this.muted,volume:this.volume},this.storage)}async activate(){try{if(!this.context){let e=this.Context||globalThis.AudioContext||globalThis.webkitAudioContext;if(!e)return!1;this.context=new e,this.master=this.context.createGain(),this.master.gain.value=0,this.compressor=this.context.createDynamicsCompressor(),this.master.connect(this.compressor),this.compressor.connect(this.context.destination),this.delay=this.context.createDelay(1),this.delay.delayTime.value=.32,this.echo=this.context.createGain(),this.echo.gain.value=.22,this.delay.connect(this.echo),this.echo.connect(this.master),this.nextBeat=this.context.currentTime+.08}return this.context.state==="suspended"&&!this.hidden&&await this.context.resume(),this.applyLevel(),!0}catch{return!1}}applyLevel(e=!1){this.context&&this.master.gain.setTargetAtTime(this.muted||this.hidden?0:this.volume*(e?.14:.38),this.context.currentTime,.12)}setMuted(e){this.muted=!!e,this.save(),this.applyLevel()}setVolume(e){this.volume=Math.max(0,Math.min(1,Number(e)||0)),this.save(),this.applyLevel()}setHidden(e){this.hidden=!!e,this.applyLevel()}tone(e,t,n=.4,s=.15,r="sine",a=0){if(!this.context||this.activeVoices>=64||this.muted||this.hidden)return;let o=this.context.createOscillator(),c=this.context.createGain();o.type=r,o.frequency.value=440*2**((e-69)/12),o.detune.value=a,c.gain.setValueAtTime(1e-4,t),c.gain.exponentialRampToValueAtTime(Math.max(.001,s),t+.035),c.gain.exponentialRampToValueAtTime(1e-4,t+n),o.connect(c),c.connect(this.master),c.connect(this.delay),this.activeVoices++,this.nodes.add(o),o.onended=()=>{o.disconnect(),c.disconnect(),this.activeVoices--,this.nodes.delete(o)},o.start(t),o.stop(t+n+.02)}cue(e){if(!this.context||this.muted||this.hidden)return;({launch:[50,57,62,69],repair:[62,65,69,74],board:[50,57,62],survey:[74,81,86],victory:[62,66,69,74,78,81],fail:[50,48,45],click:[81],step:[34],landing:[33,40,45],radio:[76,69,64],ready:[69,74,81]}[e]||[69]).forEach((n,s)=>this.tone(n,this.context.currentTime+s*.12,e==="victory"?1.2:.25,e==="step"?.04:.23,"triangle"))}updateOpening(e){let t=this.lastOpeningTime??e;if(this.lastOpeningTime=e,!(!this.context||this.context.state!=="running"||this.hidden||this.muted)){this.update({status:"opening",rover:{occupied:!1},moving:!1},null,!1);for(let[n,s]of[[4.15,"landing"],[8.8,"radio"],[23.6,"ready"]])t<n&&e>=n&&this.cue(s)}}update(e,t,n=!1){if(!this.context||this.context.state!=="running"||this.hidden)return;let s=this.context.currentTime;if(this.mode=e.status==="opening"?"opening":e.status==="complete"?"home":e.status==="repair"?"repair":e.status==="failed"||t&&!t.safe?"tension":e.rover.occupied?"drive":"explore",this.applyLevel(n||e.status==="paused"),this.muted){this.nextBeat=s+.05;return}this.nextBeat<s-.2&&(this.nextBeat=s+.03);let r={opening:76,explore:72,repair:88,tension:96,drive:84,home:72}[this.mode],a=this.mode==="home"?[[50,57,62,66],[43,55,59,62],[45,57,61,64],[50,57,62,66]]:[[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,60]],o=0;for(;this.nextBeat<s+.18&&o++<4;){let c=this.nextBeat,l=a[Math.floor(this.beat/16)%a.length],h=this.beat%16;h===0&&l.forEach(f=>this.tone(f,c,3.2,.055,"triangle",-4));let u=l[[0,2,1,3,2,1,3,2][this.beat%8]]+12;this.tone(u,c,.75,this.mode==="tension"?.12:.08),this.beat%4===0&&this.tone(l[0]-12,c,.9,.17,"sine"),["drive","tension"].includes(this.mode)&&h%2===0&&this.tone(30,c,.1,.12),this.nextBeat+=60/r/2,this.beat++}e.status==="playing"&&e.moving&&s-this.lastStep>(e.rover.occupied?.8:.42)&&(this.lastStep=s,this.cue((e.rover.occupied,"step")))}dispose(){for(let e of this.nodes)try{e.stop()}catch{}this.nodes.clear(),this.context&&this.context.close()}};function v0(i,e,t,n=12){let s=(t.left||0)+n,r=(t.top||0)+n,a=Math.max(s,(t.left||0)+t.width-e.width-n),o=Math.max(r,(t.top||0)+t.height-e.height-n);return{x:Math.min(a,Math.max(s,i.x)),y:Math.min(o,Math.max(r,i.y))}}var _0=i=>i&&Number.isFinite(i.x)&&Number.isFinite(i.y),gr=class{constructor({panel:e,handle:t,resetButton:n,storage:s=null,storageKey:r,view:a=globalThis.window,onGrab:o=()=>{}}){this.panel=e,this.handle=t,this.storage=s,this.storageKey=r,this.view=a,this.onGrab=o;let c=Bt(r,null,s);this.position=_0(c)?{x:c.x,y:c.y}:null,this.userPosition=!!this.position,this.drag=null,t.addEventListener("pointerdown",l=>this.begin(l)),a.addEventListener("pointermove",l=>this.move(l)),a.addEventListener("pointerup",l=>this.finish(l)),a.addEventListener("pointercancel",l=>this.finish(l)),t.addEventListener("lostpointercapture",l=>this.finish(l)),t.addEventListener("keydown",l=>this.moveWithKeys(l)),n?.addEventListener("click",()=>this.reset()),a.addEventListener("resize",()=>this.refresh()),a.visualViewport?.addEventListener("resize",()=>this.refresh()),a.visualViewport?.addEventListener("scroll",()=>this.refresh()),a.ResizeObserver&&new a.ResizeObserver(()=>this.refresh()).observe(e)}viewport(){let e=this.view.visualViewport;return{width:e?.width||this.view.innerWidth,height:e?.height||this.view.innerHeight,left:e?.offsetLeft||0,top:e?.offsetTop||0}}place(e){this.panel.style.maxHeight=Math.max(96,this.viewport().height-24)+"px";let t=this.panel.getBoundingClientRect();this.position=v0(e,t,this.viewport()),Object.assign(this.panel.style,{left:this.position.x+"px",top:this.position.y+"px",right:"auto",bottom:"auto"})}refresh(){if(!(!this.panel.getClientRects().length||this.drag))if(this.userPosition)this.place(this.position);else{Object.assign(this.panel.style,{left:"",top:"",right:"",bottom:""});let e=this.panel.getBoundingClientRect();this.place({x:e.left,y:e.top})}}begin(e){if(e.button!==0||e.isPrimary===!1||this.drag)return;e.preventDefault(),e.stopPropagation(),this.onGrab(),this.panel.classList.add("is-dragging"),this.refresh();let t=this.panel.getBoundingClientRect();this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:t.left,top:t.top},this.handle.focus({preventScroll:!0});try{this.handle.setPointerCapture(e.pointerId)}catch{}}move(e){!this.drag||e.pointerId!==this.drag.id||(e.preventDefault(),this.userPosition=!0,this.place({x:this.drag.left+e.clientX-this.drag.x,y:this.drag.top+e.clientY-this.drag.y}))}finish(e){if(!this.drag||e.pointerId!==this.drag.id)return;let t=this.drag.id;this.drag=null,this.panel.classList.remove("is-dragging");try{this.handle.hasPointerCapture?.(t)&&this.handle.releasePointerCapture(t)}catch{}this.userPosition&&kt(this.storageKey,this.position,this.storage),this.refresh()}moveWithKeys(e){let t={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(e.key!=="Home"&&!t[e.key])return;if(e.preventDefault(),e.stopPropagation(),this.onGrab(),e.key==="Home"){this.reset();return}this.refresh();let[n,s]=t[e.key],r=e.shiftKey?40:10;this.userPosition=!0,this.place({x:this.position.x+n*r,y:this.position.y+s*r}),kt(this.storageKey,this.position,this.storage)}reset(){this.drag=null,this.userPosition=!1,this.position=null,this.panel.classList.remove("is-dragging"),kt(this.storageKey,null,this.storage),this.refresh()}};function M0(i,e){let t=i.geo(e),n=Math.hypot(t.x,t.y);return n?{north:{x:t.x/n,y:-t.y/n},east:{x:t.y/n,y:t.x/n}}:null}function Bu(i,e){let t=e.toLowerCase().replace(/[−–]/g,"-").trim(),n=/\b(route|path|navigate|go|take|head|walk|drive|travel|guide|lead|plot|show|find|reach|where)\b/.test(t),s=t.match(/\b(north[ -]?east|north[ -]?west|south[ -]?east|south[ -]?west|north|south|east|west|up|down|left|right)\b/),r=t.match(/\bx\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*[,; ]+y\s*[:=]?\s*(-?\d+(?:\.\d+)?)/),a=/^(?:survey|research|science)(?:\s+\d+)?\s*[.!?]?$/.test(t);if(!n&&!r&&!a&&!(s&&/^\s*(north|south|east|west|up|down|left|right)/.test(t)))return null;if(/\b(route|path|navigate|go|walk|drive|travel|plot|reach)\b/.test(t)&&/\b(earth|mars|sun|satellite|lro|orbit)\b/.test(t))return{error:"I can plot routes within this lunar surface sector. Open Orbital to inspect the dated celestial positions; those bodies are not surface destinations."};if(r){let o={x:Number(r[1]),y:Number(r[2])};return i.terrain.inBounds(o.x,o.y)?{target:o,label:`Grid ${o.x.toFixed(1)}, ${o.y.toFixed(1)}`}:{error:"Those grid coordinates are outside the playable NASA terrain crop. Select a point on the surface tracker instead."}}if(n||a){if(/\b(haven|home|base|outpost)\b/.test(t))return{target:{...i.objects.base},label:"Haven"};if(/\b(echo|rover|vehicle)\b/.test(t))return{target:{...i.state.rover},label:"Echo"};if(/\b(relay|signal)\b/.test(t))return{target:{...i.objects.relay},label:"Surface relay"};if(/\b(objective|mission|next)\b/.test(t))return{target:{...i.target()},label:i.target().name};let o=t.match(/\b(?:survey|research|science)(?:\s+(\d+))?\b/);if(o){let c=i.science.filter(h=>!i.state.scans.includes(h.id)),l=o[1]?i.science[Number(o[1])-1]:c.sort((h,u)=>St(h,i.state.player)-St(u,i.state.player))[0];return l?{target:{...l},label:l.name}:{error:"No matching uncollected survey remains. Try \u201Csurvey 1\u201D, \u201Csurvey 2\u201D, or \u201Csurvey 3\u201D to revisit a site."}}}if(s){let o=s[1].replace(/[ -]/g,""),c=M0(i.terrain,i.state.player),l,h=i.screenBasis,u=h?{up:[-h.down.dx,-h.down.dy],down:[h.down.dx,h.down.dy],left:[-h.right.dx,-h.right.dy],right:[h.right.dx,h.right.dy]}:{up:[-1,-1],down:[1,1],left:[-1,1],right:[1,-1]};if(u[o])l={x:u[o][0],y:u[o][1]};else{if(!c)return{error:"Compass north is undefined at the pole. Select a map point or use screen directions."};let E=o.includes("north")?1:o.includes("south")?-1:0,b=o.includes("east")?1:o.includes("west")?-1:0;l={x:c.north.x*E+c.east.x*b,y:c.north.y*E+c.east.y*b}}let f=Math.hypot(l.x,l.y);l.x/=f,l.y/=f;let p=t.match(/(-?\d+(?:\.\d+)?)\s*(km|kilomet(?:er|re)s?|m|met(?:er|re)s?)\b/),g=p?Number(p[1])*(p[2].startsWith("k")?1e3:1):i.terrain.cell*5;if(!(g>0))return{error:"Choose a positive distance, for example \u201Cnorth 200 m\u201D."};let y=i.state.player,m=g/i.terrain.cell,d=i.terrain,w=m;for(let[E,b]of[["x",d.width-2],["y",d.height-2]])l[E]>0&&(w=Math.min(w,(b-y[E])/l[E])),l[E]<0&&(w=Math.min(w,(1-y[E])/l[E]));return w<.5?{error:"You are already at this sector\u2019s boundary in that direction. Choose another direction or a destination."}:{target:{x:Xe(y.x+l.x*w,1,d.width-2),y:Xe(y.y+l.y*w,1,d.height-2)},label:o.toUpperCase()+(u[o]?" (screen direction)":" (lunar compass)"),clipped:w<m-.01,requestedMetres:g}}return n&&/\b(route|path|navigate|plot)\b/.test(t)?{error:"Tell me a destination: \u201Croute to Echo\u201D, \u201Croute to Haven\u201D, \u201Cnorth 200 m\u201D, \u201Csurvey 2\u201D, or \u201Cx 25 y 40\u201D. You can also choose a point on the map."}:null}function So(i,e){if(e.error)return{error:e.error};let t=i.terrain,n=i.state,s=i.config;if(!t.inBounds(e.target.x,e.target.y))return{error:"That point is outside the playable terrain crop."};let r=i.accessibleDestination(e.target);if(!r)return{error:"That destination is occupied by equipment. Choose open ground beside it.",request:e};let a=t.route(n.player,r,i.maxSlope());if(!a||a.path.slice(1).some((w,E)=>!t.canStep(a.path[E],w,i.maxSlope())))return{error:`No traversable path to ${e.label} fits this equipment\u2019s ${i.maxSlope()}\xB0 slope limit. Choose a different endpoint or approach.`,request:e};let o=t.route(r,i.objects.base,i.maxSlope()),c=n.rover.occupied?s.roverMetresPerSecond:s.walkMetresPerSecond,l=[a,o].filter(Boolean),h=l.reduce((w,E)=>w+E.metres/c,0),u=1+s.returnReserveFraction,f=l.reduce((w,E)=>w+E.metres/c*(n.rover.occupied?1:1.12*(1+E.maxGrade/160)),0),p=f/60*u,g=f/3600*s.suit.waterLitresPerHour*u,y=h/3600*(n.rover.occupied?s.suit.idleWatts:s.suit.movingWatts)*u,m=n.rover.occupied?(h/3600*s.rover.driveWatts+l.reduce((w,E)=>w+E.metres,0)*s.rover.consumptionWhPerMetre)*u:0,d=!!o&&n.oxygen>p&&n.water>g&&n.suitWh>y&&(!n.rover.occupied||n.rover.wh>m);return{...a,target:r,label:e.label,request:e,from:{...n.player},rover:n.rover.occupied,safe:d,hasReturnPath:!!o,oxygenNeed:p,waterNeed:g,suitNeed:y,roverNeed:m,minutes:a.metres/c/60,message:`I found a ${(a.metres/1e3).toFixed(2)} km path to ${e.label}. The steepest traversed segment is ${a.maxGrade.toFixed(1)}\xB0, within your ${i.maxSlope()}\xB0 limit. ${e.clipped?"The destination is clipped to the edge of this NASA terrain crop. ":""}${d?"Your modeled supplies cover the journey and return to Haven, including the reserve.":"The journey plus return exceeds a modeled reserve, or no return path is available."} The ${d?"cyan":"amber"} line previews the path; choose Follow route to travel.`}}var ku="luna-story-enabled-v1",zu=26,Hu=[{start:0,end:6,shot:"arrival",kicker:"CHAPTER 01 / A NEW FRONTIER",title:"Somewhere beyond home.",speaker:"MISSION CONTROL",caption:"Haven is our first foothold at the lunar south pole. Every expedition keeps it alive."},{start:6,end:12,shot:"echo",kicker:"CHAPTER 02 / THE SILENT ROVER",title:"Then the signal vanished.",speaker:"ECHO / LAST TRANSMISSION",caption:"Power bus failure. Drive systems offline. Research secured. Awaiting recovery\u2026"},{start:12,end:19,shot:"relay",kicker:"CHAPTER 03 / FLIGHT SCHOOL",title:"Every crew member starts here.",speaker:"ASTRA",caption:"Before the recovery, learn to move safely, repair systems and protect your return reserves. I will guide each action."},{start:19,end:26,shot:"astronaut",kicker:"CHAPTER 04 / JUNIOR ASTRONAUT",title:"Your first moonwalk.",speaker:"ASTRA",caption:"Ten practical missions. Start at the training beacon, learn to operate the equipment, earn your badges, and join the crew."}],wo=class{constructor(e=null){this.storage=e,this.enabled=Bt(ku,!0,e)!==!1,this.state="idle",this.elapsed=0}get shouldPlay(){return this.enabled&&this.state==="idle"}setEnabled(e){this.enabled=e===!0,kt(ku,this.enabled,this.storage)}get active(){return this.state==="playing"}get chapter(){return Hu.find(e=>this.elapsed<e.end)||Hu.at(-1)}start(){return this.shouldPlay?(this.state="playing",this.elapsed=0,!0):!1}update(e,t=!1){return!this.active||t?!1:(this.elapsed=Math.min(zu,this.elapsed+Math.max(0,Math.min(e,.1))),this.elapsed>=zu-1e-8?(this.finish(),!0):!1)}finish(e=!1){this.active&&(this.state=e?"skipped":"finished")}};var x=i=>document.getElementById(i),je=new Set,U,K,ni,st,We,Tt,Ao,As,jt=null,Un=!1,Ls=!1,xr=0,uc=0,Vu,Gu,Co="",dc=!1,yr=null,vc="",Wu="",at=null,ii=!1,Mn=!1,_i=!0,fc="",bn=!1,Fn=!1,Eo="third-person",pc=new Map,b0=i=>{let e=Math.max(0,Math.floor(i));return[Math.floor(e/3600)%24,Math.floor(e/60)%60,e%60].map(t=>String(t).padStart(2,"0")).join(":")},S0=i=>(i/1e3).toFixed(2)+" km",Cs=()=>document.querySelector("dialog[open]");function Ro(i=440,e=.08){We?.cue("click")}function _c(i,e,t){let n=x("event-banner");clearTimeout(Gu),x("event-kicker").textContent=i,x("event-title").textContent=e,x("event-caption").textContent=t,n.hidden=!0,n.offsetWidth,n.hidden=!1,Gu=setTimeout(()=>n.hidden=!0,Un?2e3:3600)}function vi(){document.body.classList.toggle("audio-muted",We.muted),document.body.classList.toggle("motion-reduced",Un),x("sound-button").setAttribute("aria-pressed",String(!We.muted)),x("sound-button").setAttribute("aria-label",We.muted?"Enable soundtrack":"Mute soundtrack"),x("sound-button").title=We.muted?"Enable soundtrack":"Mute soundtrack",x("sound-button").innerHTML=We.muted?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-4v12l-4-4H3V8Zm11-1 4 6m0-6-4 6"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-4v12l-4-4H3V8Zm10-2c4 2 4 6 0 8m0-6c2 1 2 3 0 4"/></svg>',x("music-toggle").textContent=We.muted?"Music and effects off":"Music and effects on",x("music-toggle").setAttribute("aria-pressed",String(!We.muted)),x("music-volume").value=String(Math.round(We.volume*100)),x("music-volume-value").textContent=Math.round(We.volume*100)+"%",x("motion-button").textContent=Un?"Reduced motion enabled":"Full cinematic motion",x("motion-button").setAttribute("aria-pressed",String(Un)),K.reducedMotion=Un,x("opening-toggle").textContent=Tt.enabled?"Opening animation on":"Opening animation off",x("opening-toggle").setAttribute("aria-pressed",String(Tt.enabled));let i=Bt("luna-academy-guide-v1",{disabled:!1},jt)?.disabled!==!0;for(let e of["tutorial-toggle","tutorial-setting-toggle"])x(e).textContent=i?"Tutorial on":"Tutorial off",x(e).setAttribute("aria-pressed",String(i));x("tutorial-setting").textContent=i?"ASTRA explains each action as you perform it. Each new level has its own guide.":"Tutorial hidden. Turn it on or show it below; your mission progress is kept.",x("labels-button").textContent=_i?"High contrast world labels on":"World labels off",x("labels-button").setAttribute("aria-pressed",String(_i))}function Rs(){if(!st)return;let i=st.active;st.sync(U),i&&!st.active&&st.reason==="lesson-complete"&&Xt("Level complete. Badge earned; the next level is ready.","success");let e=x("tutorial-card"),t=Cs(),n=st.active&&!bn&&(!t||t.id==="repair-dialog");if(e.hidden=!n,!n){yr?.classList.remove("tutorial-target"),yr=null,vi();return}let s=st.step,r=t?.id==="repair-dialog",a=r?x("repair-dialog"):document.querySelector(".playfield");e.parentElement!==a&&a.append(e),e.classList.toggle("in-dialog",r),e.dataset.step=s.id,x("tutorial-step").textContent="LEVEL "+(U.levelIndex+1)+" / "+U.academy.levels.length+" \xB7 "+(U.state.status==="ready"?"BRIEFING":"TASK "+Math.min(U.lesson.steps.length,Math.max(1,U.objectiveIndex()+1))+" / "+U.lesson.steps.length),x("tutorial-title").textContent=s.title,x("tutorial-text").textContent=s.text,s.id==="astra"&&Ls&&(x("tutorial-text").textContent="ASTRA is reading your actual mission state. Try another prompt or type a question. When you are ready, continue below to close ASTRA and return to the expedition.");let o=["relay-repair","echo-repair"].includes(s.id)&&U.circuit?.connected();o?x("tutorial-text").textContent="The output is powered! Select Apply repair below the circuit, or use the button here. You solved the actual connection, so the equipment can now be restored.":vc===s.id&&U.circuit&&(x("tutorial-text").textContent=U.circuit.hint()),x("tutorial-action").textContent=o?"Apply the connected repair \u2192":s.id==="astra"&&Ls?"Continue the expedition \u2192":s.id==="orbital"&&K.mode==="orbital"?"Return to the surface \u2192":s.action+" \u2192",x("tutorial-clock").textContent=K.mode==="orbital"||s.hold||U.state.status==="repair"?"MISSION TIME PAUSED WHILE YOU LEARN":"LEARN BY DOING \xB7 HIDE ANYTIME";let c=x(s.target);s.id==="astra"&&!x("astra-card").hidden&&(c=x("astra-message")),r&&s.target!=="circuit-grid"&&(c=x("circuit-grid")),yr!==c&&(yr?.classList.remove("tutorial-target"),yr=c),c&&c.getClientRects().length&&c.classList.add("tutorial-target"),Co!==s.id&&(Co=s.id,x("tutorial-progress").replaceChildren(...st.steps.map((l,h)=>{let u=document.createElement("i");return u.className=h<st.index?"done":h===st.index?"current":"",u})),c&&!["world","astra-button","astra-message"].includes(c.id)&&!r&&c.scrollIntoView({block:"nearest",behavior:Un?"instant":"smooth"})),Ao?.refresh(),vi()}function $u(){Tt?.active||Cs()||(We.activate(),U.start(),K.trigger("launch",U.state.player),_c("TRAINING LEVEL "+(U.levelIndex+1)+" / "+U.academy.levels.length,U.lesson.title.toUpperCase(),U.lesson.skill),We.cue("launch"),Is(),Ft(),tt(),x("world").focus({preventScroll:!0}))}function w0(){st.active&&Ju(st.step.command)}function Ju(i){Tt?.active||(We.activate(),i==="start"?$u():i==="next"?st.next():i==="astra"?Ls?(Dn(!1,!1),st.next(),Ls=!1):Dn(!0,!1):i==="route"?Io():i==="interact"?(U.interact(),Ft()):i==="scan"?(U.scanNearby(),Ft()):i==="review"?Do():i==="advance"?yc():i==="hint"?U.circuit?.connected()?U.completeRepair()&&(x("repair-dialog").close(),Ft()):(vc=st.step.id,We.cue("click")):i==="orbit"?Qt("orbital"):i==="home"&&(Qt("surface"),Io()),tt())}function Xt(i,e="info"){Wu=i,x("notice").textContent=i,x("notice").className="mission-notice "+e,x("notice").hidden=!1,clearTimeout(Vu),Vu=setTimeout(()=>{Wu===i&&(x("notice").hidden=!0)},5200)}function Nn(i){i.open||(Dn(!1,!1),Mn=!1,je.clear(),U?.state.status==="playing"?(U.state.status="paused",i.dataset.resumeMission="yes"):i.dataset.resumeMission="no",i.showModal(),tt())}function Qt(i){je.clear(),K.mode=i,x("surface-tab").classList.toggle("active",i==="surface"),x("orbit-tab").classList.toggle("active",i==="orbital"),x("surface-tab").setAttribute("aria-pressed",String(i==="surface")),x("orbit-tab").setAttribute("aria-pressed",String(i==="orbital")),x("sector-label").textContent=i==="surface"?"NASA LOLA / SOUTH POLAR SECTOR":"JPL HORIZONS / 04 OCT 2026 / TDB",x("render-mode").textContent=i==="surface"?"3D terrain \xB7 NASA elevation \xB7 artistic lighting":"Dated positions \xB7 mission time paused",document.querySelector(".world-tools").hidden=i!=="surface",x("orbital-tools").hidden=i!=="orbital",x("world-wayfinding").hidden=i!=="surface"||!_i,x("location-card").hidden=i!=="surface",x("briefing-card").hidden=U.state.status!=="ready"||i!=="surface",document.querySelector(".world-footer>span:first-child").innerHTML=i==="surface"?'<span class="footer-cross">+</span> TERRAIN: NASA LRO / LOLA':'<span class="footer-cross">+</span> POSITIONS: NASA / JPL HORIZONS',tt()}function Io(){if(U.state.status!=="playing")return;Xi(),Qt("surface");let i=U.target();U.navigate(i)&&Xt("Route plotted. You can take over with WASD at any time."),K.trigger("route",i),Ft()}function vr(i){let e=Bu(U,i);e?mc(e):x("astra-message").textContent=U.astra(i),Ro(530,.1),st?.active&&st.step.id==="astra"&&!x("astra-card").hidden&&(Ls=!0,Rs()),As?.refresh()}function Dn(i,e=!0,t=!0){let n=x("astra-card");je.clear(),n.hidden=!i,x("astra-button").setAttribute("aria-expanded",String(i)),x("astra-button").setAttribute("aria-label",i?"Close ASTRA mission companion":"Open ASTRA mission companion"),i?(As?.refresh(),t&&!at&&vr("next"),e&&x("astra-input").focus({preventScroll:!0})):e&&x("astra-button").focus({preventScroll:!0})}function Xi(){ii&&(U.route=null),at=null,ii=!1,Mn=!1,K.assistedRoute=null,K.cameraPinned=null,K.follow=!0,x("follow-button").setAttribute("aria-pressed","true"),x("astra-route-card").hidden=!0}function mc(i){Xi();let e=So(U,i);x("astra-message").textContent=e.error||e.message,!e.error&&(at=e,K.assistedRoute=e,Qt("surface"),K.frameRoute?.(e.path),x("follow-button").setAttribute("aria-pressed","false"),Ku(),As?.refresh())}function Ku(){if(!at)return;let i=U.state;if(["complete","failed"].includes(i.status)){Xi();return}if(Math.hypot(i.player.x-at.from.x,i.player.y-at.from.y)>1||i.rover.occupied!==at.rover){let t=So(U,at.request);if(t.error){Xi(),x("astra-message").textContent=t.error;return}at=t}at.safe=i.oxygen>at.oxygenNeed&&i.water>at.waterNeed&&i.suitWh>at.suitNeed&&(!i.rover.occupied||i.rover.wh>at.roverNeed)&&at.hasReturnPath;let e=Math.hypot(i.player.x-at.target.x,i.player.y-at.target.y)<.1;ii&&!U.route&&(ii=!1),K.assistedRoute=ii||e?null:at,x("astra-route-card").hidden=!1,x("astra-route-card").classList.toggle("caution",!at.safe),x("astra-route-destination").textContent=at.label,x("astra-route-distance").textContent=(e?0:at.metres/1e3).toFixed(2)+" km",x("astra-route-time").textContent=(e?0:at.minutes).toFixed(1)+" mission min",x("astra-route-status").textContent=e?"DESTINATION REACHED":ii?"FOLLOWING ROUTE":i.status==="ready"?"BEGIN EXPEDITION TO FOLLOW":at.safe?"JOURNEY + RETURN WITHIN RESERVES":"JOURNEY + RETURN RESERVE WARNING",x("astra-follow-route").disabled=i.status!=="playing"||e||ii,x("astra-follow-route").textContent=ii?"Following route\u2026":"Follow route \u2192"}function E0(){if(!at||U.state.status!=="playing")return;let i=So(U,at.request);if(i.error){Xi(),x("astra-message").textContent=i.error;return}at=i,U.navigate(at.target)&&(ii=!0,K.assistedRoute=null,K.cameraPinned=null,K.follow=!0,x("follow-button").setAttribute("aria-pressed","true"),st.active&&st.step.id==="astra"&&(st.next(),Ls=!1),Dn(!1,!1),Xt("Following ASTRA\u2019s route to "+at.label+". WASD takes over at any time."),x("world").focus({preventScroll:!0})),Ft(),tt()}function T0(){Tt.start()&&(je.clear(),document.body.classList.add("in-story"),Nn(x("story-dialog")),Mc())}function Mc(){let i=Tt.chapter;x("story-dialog").dataset.shot!==i.shot&&(x("story-dialog").dataset.shot=i.shot,x("story-chapter").textContent=i.kicker,x("story-title").textContent=i.title,x("story-speaker").textContent=i.speaker,x("story-caption").textContent=i.caption,x("story-caption-card").classList.remove("story-caption-enter"),x("story-caption-card").offsetWidth,x("story-caption-card").classList.add("story-caption-enter")),x("story-sound").textContent=We.context&&!We.muted?"Mute music":"Enable music"}function gc(i=!1){Tt.finish(i),x("story-dialog").close()}function Is(){K.setPerspective?.(Eo),K.resetCamera?.(),K.zoom=1.2,K.follow=!0,K.cameraPinned=null,Fn=!1,x("camera-mode-button").textContent="Pan terrain",x("camera-mode-button").setAttribute("aria-pressed","false"),x("follow-button").setAttribute("aria-pressed","true"),Po()}function Xu(){Eo=K.perspective==="first-person"?"third-person":"first-person",K.setPerspective?.(Eo),Fn=!1,je.clear(),tt(),Xt(Eo==="first-person"?"Astronaut view: drag to look all around, WASD to walk, E to interact. Show objective turns your helmet toward the destination.":"Orbit view: drag to look, Shift-drag or Pan terrain to explore, Show objective to inspect the destination.")}function Po(){let i=K.perspective==="first-person",e=i?K.lookYaw:K.yaw;x("camera-readout").textContent=(i?U.state.rover.occupied?"ECHO DRIVER VIEW":"ASTRONAUT VIEW":"360\xB0 ORBIT VIEW")+" \xB7 "+Math.round(((e||0)*180/Math.PI%360+360)%360)+"\xB0",x("first-person-button").setAttribute("aria-pressed",String(i)),x("first-person-button").textContent=i?"Astronaut view \u2713 \xB7 F":"Astronaut view \xB7 F",x("camera-mode-button").disabled=i,x("camera-mode-button").setAttribute("aria-pressed",String(Fn&&!i)),x("camera-mode-button").textContent=Fn&&!i?"Pan terrain \u2713":"Pan terrain",x("camera-home").textContent=i?"Reset helmet view \u21BA":"Follow astronaut \u21BA",x("camera-hint").textContent=i?"Drag to look \xB7 WASD to walk":"Drag to look \xB7 Shift-drag to pan",x("camera-aim").hidden=!i||K.mode!=="surface"||Tt?.active===!0,x("world").style.cursor=Fn&&!i?"grab":"move";for(let t of["zoom-in","zoom-out","follow-button"])x(t).disabled=i;x("camera-controls").hidden=K.mode!=="surface"}function ju(){bn&&Ps(),st.restart(),Co="",Ao?.reset(),x("settings-dialog").open&&x("settings-dialog").close(),["complete","failed"].includes(U.state.status)?Do():(Qt("surface"),tt())}function qu(){Bt("luna-academy-guide-v1",{disabled:!1},jt)?.disabled!==!0?(st.disable(),tt()):ju()}function Lo(){Ps(!1),Fn=!1,x("camera-mode-button").setAttribute("aria-pressed","false"),je.clear(),Xi(),K.clearEffects(),K.refreshMission?.(),Is(),st.forLevel(),Co="",vc="",fc="",dc=!1,x("notice").hidden=!0,x("event-banner").hidden=!0,x("astra-message").textContent=U.astra("next"),Qt("surface"),tt()}function A0(){let i=U.lesson;fc!==i.id&&(fc=i.id,x("world-title").textContent=i.title,x("world-kicker").textContent="JUNIOR ASTRONAUT / LEVEL "+(U.levelIndex+1)+" OF "+U.academy.levels.length,x("mission-title").textContent=i.title,x("learning-goal").textContent="Learn: "+i.skill+".",x("briefing-kicker").textContent="LEVEL "+(U.levelIndex+1)+" / TRAINING BRIEFING",x("briefing-title").textContent=i.title,x("briefing-description").textContent=i.brief,x("briefing-skill").textContent=i.skill.toUpperCase(),x("start-button").textContent="Start level "+(U.levelIndex+1)+" \u2192",x("objectives").replaceChildren(...i.steps.map((e,t)=>{let n=document.createElement("li"),s=document.createElement("span"),r=document.createElement("div"),a=document.createElement("strong"),o=document.createElement("span");return s.className="objective-number",s.textContent=String(t+1).padStart(2,"0"),a.textContent=e,r.append(a),o.className="objective-check",o.textContent="\u2197",n.append(s,r,o),n})))}function C0(){x("cadet-rank").textContent=U.rank,x("academy-summary").textContent=U.completed.length+" / "+U.academy.levels.length+" badges \xB7 "+U.xp+" XP",x("academy-badges").replaceChildren(...U.academy.levels.map((i,e)=>{let t=document.createElement("span"),n=U.completed.some(s=>s.id===i.id);return t.className=n?"earned":"",t.textContent=n?"\u2713 "+i.badge:String(e+1),t.title=n?i.skill:i.badge+" \xB7 complete level "+(e+1),t}))}function Qu(){x("level-list").replaceChildren(...U.academy.levels.map((i,e)=>{let t=document.createElement("section"),n=document.createElement("span"),s=document.createElement("div"),r=document.createElement("h3"),a=document.createElement("p"),o=document.createElement("small"),c=document.createElement("button"),l=U.completed.find(u=>u.id===i.id),h=e>U.unlocked;return t.className="level-row"+(h?" locked":""),n.className="level-number",n.textContent=l?"\u2713":String(e+1).padStart(2,"0"),r.textContent=i.title,a.textContent=i.skill,o.textContent=l?i.badge+" \xB7 "+l.xp+" XP earned":h?"Complete level "+e+" to unlock":"Ready to train",s.append(r,a,o),c.className="secondary-button",c.disabled=h,c.textContent=h?"Locked":l?"Replay":"Start",c.addEventListener("click",()=>{U.loadLevel(e)&&(x("levels-dialog").close(),Lo())}),t.append(n,s,c),t}))}function Yu(i){let e=U.astronomy().find(t=>t.name===i);if(x("orbital-readout").textContent=e?.inCoverage?i+" \xB7 "+Math.round(e.distanceKm).toLocaleString()+" km from the Moon \xB7 interpolated dated JPL samples, not live telemetry.":i+" \xB7 no sample coverage at this mission time.",U.inspect(i)){let t=U.state.training.inspected;x("orbital-readout").textContent+=" Training observations: "+t.join(" + ")+"."+(t.length===2&&U.state.scans.length===2?" Both recorded. Return to play, then check in at Haven.":"")}tt()}function R0(){let i=U.lesson.id==="shelter",e=U.powerPlan({life:2,food:2,comms:1});x("systems-title").textContent=i?"Shelter drill: protect the crew.":"Power the essential systems.",x("systems-description").textContent=i?"Training alert: the supply is reduced to 8 kW. Confirm the crew is inside, seal the shelter, cover each minimum demand and leave at least 1 kW spare.":"The bus is repaired. You have 12 kW available. Set each allocation to cover its minimum demand, and leave at least 1 kW spare. More power is not always better.";for(let t of["life","food","comms"])x("power-"+t).max=String(e.supply),x("power-"+t).value=String(U.state.training.allocations?.[t]??(t==="comms"?1:2)),x("demand-"+t).textContent="Needs "+e.demands[t]+" kW minimum";x("seal-control").hidden=!i,x("shelter-seal").checked=U.state.training.sealed,To(),Nn(x("systems-dialog"))}function To(){let i=Object.fromEntries(["life","food","comms"].map(t=>[t,Number(x("power-"+t).value)])),e=U.powerPlan(i,x("shelter-seal").checked);U.state.training.powerPreview=e,x("power-supply").textContent=e.supply+" kW available",x("power-budget").textContent=e.total+" kW allocated \xB7 "+e.reserve+" kW spare";for(let t of["life","food","comms"])x("value-"+t).textContent=i[t]+" kW \xB7 "+Math.round(e.coverage[t]*100)+"% demand covered";return x("apply-power").disabled=!e.valid,x("power-feedback").textContent=e.reserve<0?"Over budget. Reduce allocations to fit the available supply.":e.covered?e.reserve<1?"Leave at least 1 kW spare.":e.emergency&&!e.sealed?"Power is balanced. Confirm the crew is inside and seal the shelter.":"All essential systems covered. Reserve protected. Ready to confirm.":"One or more systems are below their minimum demand. Adjust the sliders.",x("power-feedback").classList.toggle("valid",e.valid),i}function I0(){if(U.drillView()){Qt("surface"),je.clear(),U.route=null,U.state.status==="playing"&&(U.state.status="paused"),bn=!0,x("training-workbench").hidden=!1,K.inspectTraining?.(),K.demonstrateTraining?.(),x("demo-status").textContent="Instructor demonstration \xB7 watch the equipment, then try the controls.",pc.clear(),x("workbench-ranges").replaceChildren();for(let i of U.drillView().ranges){let e=document.createElement("label"),t=document.createElement("span"),n=document.createElement("output"),s=document.createElement("input");s.type="range",s.min=String(i.min),s.max=String(i.max),s.step="1",s.value=String(i.value),s.setAttribute("aria-label",i.label),t.textContent=i.label,n.textContent=i.value+"\xB0",e.append(t,n,s),x("workbench-ranges").append(e),pc.set(i.key,{input:s,output:n}),s.addEventListener("input",()=>{K.demonstration=null,U.adjustDrill(i.key,Number(s.value))&&(x("demo-status").textContent="Your turn \xB7 the 3D equipment follows your controls.",_r())})}_r(),tt()}}function _r(){if(!bn)return;let i=U.drillView(),e=U.state.status==="complete";x("workbench-title").textContent=e?"Practical task complete":i.title,x("workbench-text").textContent=e?U.lesson.badge+" earned. Your next lesson is unlocked. You can continue directly.":i.instruction,x("workbench-readout").textContent=i.readout,x("workbench-action").textContent=i.label+" \u2192",x("workbench-action").disabled=!i.enabled,x("workbench-next").hidden=!e,x("workbench-next").textContent=U.nextAction().action+" \u2192";for(let[t,{input:n,output:s}]of pc)s.textContent=U.state.training.drill[t]+"\xB0",n.disabled=e}function Ps(i=!0){bn=!1,x("training-workbench").hidden=!0,K&&(K.demonstration=null),i&&U.state.status==="paused"&&(U.state.status="playing"),i&&Is()}function yc(){U.state.status==="complete"&&(Ps(!1),x("debrief-dialog").close(),U.nextLevel()?Lo():(Qu(),Nn(x("levels-dialog"))))}function ed(){if(!K.screenMarker||K.mode!=="surface"||!_i||Tt.active){x("world-wayfinding").hidden=!0;return}x("world-wayfinding").hidden=!1;for(let[i,e,t,n]of[["you-tag",U.state.player,5,!0],["goal-tag",U.target(),4,!1]]){let s=K.screenMarker(e,t,n),r=x(i);r.hidden=!s.visible,r.style.left=s.x+"px",r.style.top=s.y+"px",i==="you-tag"&&(r.textContent=U.state.rover.occupied?"YOU \xB7 ECHO":"YOU",(U.state.training.inside||K.perspective==="first-person")&&(r.hidden=!0)),i==="goal-tag"&&(r.textContent=(s.edge?s.arrow+" ":"")+(e.name||"OBJECTIVE")+" \xB7 "+Math.round(Math.hypot(e.x-U.state.player.x,e.y-U.state.player.y)*U.terrain.cell)+" m")}}function tt(){if(!U)return;let i=U.state,e=U.config,t=U.terrain.geo(i.player);ni=U.lifeline(),A0(),C0();let n=U.nextAction();x("next-action-title").textContent=n.title,x("next-action-text").textContent=n.text,x("next-action-button").textContent=n.action+" \u2192",x("next-action-button").disabled=["paused","repair"].includes(i.status)||Tt?.active===!0,x("briefing-card").hidden=i.status!=="ready"||K.mode!=="surface"||st.active,x("paused-banner").hidden=i.status!=="paused"||!!Cs()||bn,x("touch-controls").hidden=i.status!=="playing"||K.mode!=="surface",x("latitude").textContent=Math.abs(t.lat).toFixed(4)+"\xB0 S",x("longitude").textContent=t.lon.toFixed(4)+"\xB0 E",x("elevation").textContent=Math.round(t.elevation)+" m elevation",x("distance-travelled").textContent=S0(i.distanceMetres)+" travelled",x("actor-mode").textContent=i.rover.occupied?"ECHO / ROVER":"ASTRONAUT / EVA",x("equipment-label").textContent=i.rover.occupied?"ROVER & SUIT":"EVA SUIT",x("oxygen-value").textContent=i.oxygen.toFixed(1)+" min";let s=Xe(i.oxygen/e.suit.oxygenMinutes*100,0,100);x("oxygen-bar").style.width=s+"%",x("oxygen-bar").style.background=s<25?"#f3a079":"#b6d5b8",x("oxygen-bar").parentElement.setAttribute("aria-valuenow",String(Math.round(s)));let r=i.rover.occupied?i.rover.wh:i.suitWh,a=i.rover.occupied?e.rover.capacityWh:e.suit.batteryWh;x("battery-title").textContent=i.rover.occupied?"Rover energy":"Suit energy",x("battery-value").textContent=Math.round(r/a*100)+"%",x("battery-bar").style.width=Xe(r/a*100,0,100)+"%",x("battery-bar").parentElement.setAttribute("aria-valuenow",String(Math.round(r/a*100))),x("battery-detail").textContent=r.toFixed(0)+" Wh available",x("water-value").textContent=i.water.toFixed(2)+" L",x("science-value").textContent=U.science.length?i.scans.length+" / "+U.science.length:"\u2014",x("lifeline-status").textContent=ni.status,x("lifeline-detail").textContent=ni.reason,x("lifeline-card").classList.toggle("danger",!ni.safe),x("lifeline-card").classList.toggle("caution",ni.safe&&ni.margin<15);let o=U.objectiveIndex();document.querySelectorAll(".objectives li").forEach((l,h)=>{let u=h<o||i.status==="complete";l.classList.toggle("active",h===o&&i.status!=="complete"),l.classList.toggle("complete",u),l.querySelector(".objective-check").textContent=u?"\u2713":"\u2197",l.querySelector(".objective-number").textContent=u?"\u2713":String(h+1).padStart(2,"0")}),document.querySelector(".mission-number").textContent=String(U.levelIndex+1).padStart(2,"0")+" / "+String(U.academy.levels.length).padStart(2,"0"),x("mission-status").textContent={ready:"READY",playing:"TRAINING",paused:bn?"PRACTICE":"PAUSED",repair:"REPAIRING",complete:"COMPLETE",failed:"RETRY"}[i.status],x("route-button").disabled=i.status!=="playing";let c=U.nearby();x("interaction-prompt").hidden=!c||i.status!=="playing"||K.mode!=="surface",c&&(x("interact-label").textContent=c.label),x("clock").textContent=b0(e.startHourTdb*3600+i.time),x("pause-button").setAttribute("aria-label",i.status==="paused"?"Resume expedition":["complete","failed"].includes(i.status)?"Show expedition debrief":"Pause expedition"),x("pause-button").title=x("pause-button").getAttribute("aria-label"),x("pause-button").innerHTML=i.status==="paused"?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 8 6-8 6V4Z"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4v12m6-12v12"/></svg>',x("tracker-status").textContent="CREW & EQUIPMENT",x("world-subtitle").textContent=K.mode==="orbital"?"Observation view \xB7 use Return to play to move on the surface":i.status==="ready"?U.lesson.skill:n.title,K.drawMini(x("minimap"),ni),Po(),_r(),x("follow-button").setAttribute("aria-pressed",String(K.follow)),Ku(),i.rover.occupied!==dc&&(dc=i.rover.occupied,i.rover.occupied&&(K.trigger("board",i.player),We.cue("board"),_c("ECHO / ROVER","MOTORS ONLINE",U.lesson.id==="science"?"Drive to the survey markers. Press Q to scan.":U.lesson.id==="logistics"?"Drive to the field supply marker. Press E to unload.":"Drive to Haven. Press E to dock."))),Rs()}function Ft(){for(let i of U.events.splice(0)){if(i.type==="notice"&&(Xt(i.message,i.kind),i.kind==="success"&&Ro(690,.12)),i.type==="repair"&&(td(),Nn(x("repair-dialog")),Ro(440,.12)),i.type==="systems"&&R0(),i.type==="drill"&&I0(),i.type==="repaired"){let e=U.state.phase==="recover",t=U.repairType==="outpost";K.trigger("repair",t?U.objects.base:e?U.objects.relay:U.state.rover),We.cue("repair"),_c(t?"HAVEN / SYSTEMS":e?"SURFACE RELAY / A":"ECHO / 03",e?"SIGNAL RESTORED":"POWER RESTORED",t?"Press E again to balance essential systems.":e?"The recovery location is confirmed.":"Board Echo. Bring it home.")}if(i.type==="notice"&&i.kind==="success"&&U.state.journal.at(-1)?.type==="science"&&(K.trigger("survey",U.state.player),We.cue("survey")),(i.type==="repaired"||i.type==="started"||i.type==="replayed")&&vr("next"),i.type==="ended"){let e=U.state.status==="complete";K.trigger(e?"victory":"fail",U.state.player),We.cue(e?"victory":"fail"),Rs(),bn&&e?_r():Do()}}}function td(){let i=U.circuit;if(!i)return;x("repair-title").innerHTML=U.repairType==="outpost"?"Reconnect Haven\u2019s power bus<span>.</span>":U.repairType==="relay"?"Restore the surface relay<span>.</span>":"Reconnect Echo\u2019s power bus<span>.</span>",x("repair-description").textContent=i.instructions,x("circuit-design").textContent=i.name,x("circuit-frame").dataset.design=i.design;for(let[s,r]of[["circuit-input",i.input],["circuit-output",i.output]]){let a=i.terminalPosition(r);x(s).style.gridRow=String(a.row),x(s).style.gridColumn=String(a.column)}x("circuit-grid").setAttribute("aria-label",i.name+". "+i.instructions);let e=i.powered(),t=i.connected(),n=[[30,0],[60,30],[30,60],[0,30]];x("circuit-grid").replaceChildren();for(let s=0;s<9;s++){let r=document.createElement("button");r.type="button",r.className="circuit-tile"+(e.has(s)?" powered":""),r.setAttribute("aria-label","Rotate circuit tile "+(s+1));let a=i.connections(s).map(o=>`<path d="M30 30 L${n[o][0]} ${n[o][1]}"/>`).join("");r.innerHTML=`<svg viewBox="0 0 60 60" aria-hidden="true">${a}<circle cx="30" cy="30" r="4" fill="currentColor" stroke="none"/></svg>`,r.addEventListener("click",()=>{i.rotate(s),Ro(370+(e.has(s)?90:0),.035),td(),x("circuit-grid").children[s].focus({preventScroll:!0})}),x("circuit-grid").append(r)}x("circuit-feedback").textContent=t?"Power path connected \xB7 ready to apply":"Connect input \u2192 output",x("circuit-feedback").style.color=t?"#ccebc0":"#a6c2a5",x("circuit-moves").textContent=i.moves+" rotations",x("output-indicator").classList.toggle("connected",t),x("apply-repair").disabled=!t}function Do(){let i=U.debrief();x("debrief-dialog").dataset.success=String(i.success),x("debrief-title").textContent=i.success?"Level complete. Badge earned.":"Every explorer learns.",x("debrief-description").textContent=i.success?U.lesson.badge+" earned by completing "+U.lesson.title+". "+(U.courseComplete?"Your training course is complete.":"The next level is unlocked. Continue below, or try the optional 100 XP question."):i.failureReason+". Retry this lesson with a safer route. Previously earned badges are kept.",x("debrief-emblem").textContent=i.success?"\u2726":"\u21BB",x("debrief-rank").textContent=i.success?U.rank:U.lesson.skill;let e=[[i.timeMinutes.toFixed(1),"MISSION MINUTES"],[i.distanceKm.toFixed(2)+" km","DISTANCE TRAVELLED"],[U.science.length?i.scans+" / "+U.science.length:"\u2014","TERRAIN OBSERVATIONS"],[i.oxygenPercent.toFixed(0)+"%","OXYGEN RETURNED"],[String(i.repairs),"SYSTEMS RESTORED"],[String(i.success?i.score:0),"LESSON POINTS"]];x("debrief-metrics").replaceChildren();for(let[t,n]of e){let s=document.createElement("div"),r=document.createElement("strong"),a=document.createElement("span");r.textContent=t,a.textContent=n,s.append(r,a),x("debrief-metrics").append(s)}x("debrief-learning").textContent=i.success?"Skill demonstrated: "+U.lesson.skill+". "+U.lesson.explanation:"Longer routes, waiting in the field, and sprinting affect your reserves. Go to objective follows a calculated terrain route. Watch the Lifeline before taking a detour.",x("skill-check").hidden=!i.success,x("review-question").textContent=U.lesson.question,x("review-feedback").textContent=U.reviewPassed?"\u2713 "+U.lesson.badge+" earned. "+U.lesson.explanation:"",x("review-answers").replaceChildren(...U.lesson.answers.map((t,n)=>{let s=document.createElement("button");return s.className="review-answer",s.textContent=t,s.disabled=U.reviewPassed,s.addEventListener("click",()=>{let r=U.qualify(n);if(x("review-feedback").textContent=(r.correct?"\u2713 ":"Try again. ")+r.message,x("review-feedback").classList.toggle("valid",r.correct),r.correct){We.cue("victory");for(let a of x("review-answers").children)a.disabled=!0;x("debrief-title").textContent="Badge earned.",x("debrief-rank").textContent=U.rank,Zu(),tt()}}),s})),Zu(),x("debrief-journal").replaceChildren();for(let t of i.journal.filter(n=>n.type!=="briefing").slice(-10)){let n=document.createElement("div"),s=document.createElement("time"),r=document.createElement("span");s.textContent=(t.time/60).toFixed(1)+"m",r.textContent=t.message,n.append(s,r),x("debrief-journal").append(n)}try{let t=Number(localStorage.getItem("luna-best")||0);i.success&&i.score>t&&localStorage.setItem("luna-best",String(i.score))}catch{}Nn(x("debrief-dialog"))}function Zu(){x("next-level-button").hidden=U.state.status!=="complete",x("next-level-button").textContent=U.levelIndex===U.academy.levels.length-1?"View training record \u2192":"Start level "+(U.levelIndex+2)+" \u2192",x("course-certificate").hidden=!U.courseComplete,x("course-certificate").textContent=U.courseComplete?"QUALIFIED JUNIOR ASTRONAUT \xB7 "+U.xp+" XP \xB7 All "+U.academy.levels.length+" practical skills completed: "+U.academy.levels.map(i=>i.badge).join(" \xB7 "):""}function P0(){let i=U.terrain.data,t=U.ephemerides.bodies.filter(s=>s.available).map(s=>`${s.name}: ${s.samples.length} samples (${s.samplingSeconds===60?"1 minute":"1 hour"} spacing)`).join(" \xB7 "),n=[{label:"NASA DATA \xB7 TERRAIN",title:"LRO / LOLA south polar elevation map",text:`6,400 elevation cells, cropped from ${i.source.product} ${i.source.productVersion}. Native spacing: 20 m; the prototype averages 2 \xD7 2 cells to a 40 m grid. Elevations are relative to a 1,737.4 km reference sphere. Source observations: July 2009\u2013February 2017.`,detail:"Measured elevation range in this crop: "+U.terrain.min.toFixed(1)+" to "+U.terrain.max.toFixed(1)+" m. Routes and surface coordinates are derived from this grid.",url:i.source.labelUrl,link:"Open original NASA PDS label \u2197"},{label:"NASA / JPL \xB7 CELESTIAL POSITIONS",title:"Horizons geometric ephemerides",text:t+". Mission coverage: 04\u201305 October 2026, TDB. The orbital view interpolates these dated vectors in Moon-centred ICRF.",detail:"Spacecraft ephemerides may include predicted trajectories. This is not live telemetry. Distances in the diagram are compressed, the Moon artwork is illustrative, and the displayed projection is ICRF XY.",url:"https://ssd.jpl.nasa.gov/horizons/",link:"Explore NASA / JPL Horizons \u2197"},{label:"CALCULATED FROM YOUR ACTIONS",title:"Resources, routes, tracking & the Lifeline",text:"Location, distance travelled, oxygen, water, suit energy and rover energy update from movement and mission time. ASTRA plans paths using the terrain grid, solid equipment footprints, and the selected equipment\u2019s slope limit, with a modeled journey-plus-return estimate. Compass directions use the lunar projection; up/down/left/right follow the current camera. The Lifeline includes a 20% modeled return reserve.",detail:"The 3D terrain follows the measured elevation grid, with vertical exaggeration. Models are enlarged for readability. Characters, equipment, the backdrop Earth, starlight, regolith grain, shadows, navigation effects, dust and sparks are artistic illustrations. They do not represent observed sky positions, sub-grid hazards, lunar illumination, radiation dose, or radio line-of-sight. The opening is an original fictional animation rendered in the game world. Use Orbital for dated celestial vectors."},{label:"AUTHORED GAME CONTENT",title:"Ten practical missions in the Junior Astronaut Academy",text:"EVA basics, power balance, rover recovery, observation, shelter response, solar calibration, airlock cycling, sample handling, antenna pointing and cargo delivery form the campaign. Haven, Echo, crew, equipment targets and teaching budgets are fictional content stored separately from NASA data.",detail:"Mission time advances 10\xD7 while playing. Briefings, puzzles, workbenches and information views freeze the clock. Equipment responds to your inputs; solar and radio readouts are authored models. Lunar gravity of approximately 1.62 m/s\xB2 is used for the jump animation.",url:U.config.physics.source,link:"Lunar physical reference \u2197"}];for(let s of n){let r=document.createElement("section");r.className="source-card";let a=document.createElement("div"),o=document.createElement("h3"),c=document.createElement("p"),l=document.createElement("p");if(a.className="source-label",a.textContent=s.label,o.textContent=s.title,c.textContent=s.text,l.textContent=s.detail,r.append(a,o,c,l),s.url){let h=document.createElement("a");h.href=s.url,h.textContent=s.link,h.target="_blank",h.rel="noopener noreferrer",r.append(h)}x("source-cards").append(r)}for(let s of U.config.assumptions){let r=document.createElement("li");r.textContent=s,x("assumptions-list").append(r)}}function L0(){x("workbench-close").addEventListener("click",()=>{Ps(),tt()}),x("workbench-next").addEventListener("click",yc),x("workbench-demo").addEventListener("click",()=>{K.demonstrateTraining?.(),x("demo-status").textContent="Instructor demonstration \xB7 observe the equipment. Your task progress is kept."}),x("workbench-action").addEventListener("click",()=>{K.demonstration=null,U.performDrill(U.drillView().action)&&(We.cue("repair"),x("demo-status").textContent="Action performed \xB7 watch the equipment respond.",U.lesson.id==="logistics"&&U.state.training.drill.loaded&&(Ps(),Is(),Xt("Crate secured. Board Echo with E, then drive to the field supply marker.","success")),Ft(),_r(),tt())}),x("camera-mode-button").addEventListener("click",()=>{K.perspective!=="first-person"&&(Fn=!Fn,je.clear(),Po())}),x("first-person-button").addEventListener("click",Xu),x("camera-overview").addEventListener("click",()=>{K.showOverview?.(),Fn=!1,je.clear(),tt(),Xt("Mission overview: YOU and the gold objective are framed together. Drag to orbit, or pan to inspect the terrain.")}),x("orbit-left").addEventListener("click",()=>K.rotateCamera?.(-Math.PI/8)),x("orbit-right").addEventListener("click",()=>K.rotateCamera?.(Math.PI/8)),x("tilt-up").addEventListener("click",()=>K.rotateCamera?.(0,.15)),x("tilt-down").addEventListener("click",()=>K.rotateCamera?.(0,-.15)),x("inspect-objective").addEventListener("click",()=>{K.showObjective?.(),tt(),Xt(K.perspective==="first-person"?"Helmet facing the objective. Follow the gold marker; nearby structures and terrain can block the view.":"Objective framed. Drag to inspect it from every side; Follow astronaut returns to your position.")}),x("camera-home").addEventListener("click",Is),x("story-sound").addEventListener("click",()=>{We.setMuted(We.context?!We.muted:!1),We.activate(),Mc(),vi()}),x("story-skip").addEventListener("click",()=>gc(!0)),x("story-dialog").addEventListener("cancel",s=>{s.preventDefault(),gc(!0)}),x("story-dialog").addEventListener("close",()=>{Tt.finish(!0),document.body.classList.remove("in-story"),K.endCinematic?.(),We.setHidden(document.hidden),je.clear(),xr=0}),x("astra-follow-route").addEventListener("click",E0),x("astra-clear-route").addEventListener("click",()=>{Xi(),vr("next"),As.refresh()}),x("astra-pick-point").addEventListener("click",()=>{Mn=!Mn,Qt("surface"),Mn&&(U.route=null,Dn(!1,!1),Xt("ASTRA: tap a point on the terrain or surface tracker. Escape cancels selection."),x("world").focus({preventScroll:!0}))}),Ao=new gr({panel:x("tutorial-card"),handle:x("tutorial-drag-handle"),resetButton:x("tutorial-position-reset"),storage:jt,storageKey:"luna-tutorial-position-v2",view:window,onGrab:()=>je.clear()}),As=new gr({panel:x("astra-card"),handle:x("astra-drag-handle"),resetButton:x("astra-position-reset"),storage:jt,storageKey:"luna-astra-position-v1",view:window,onGrab:()=>je.clear()}),x("astra-button").disabled=!1,x("astra-button").addEventListener("click",()=>{We.activate(),Dn(x("astra-card").hidden),Rs()}),x("astra-close").addEventListener("click",()=>{Dn(!1),Rs()}),x("astra-card").addEventListener("keydown",s=>{s.key==="Escape"&&(s.preventDefault(),s.stopPropagation(),Dn(!1),Rs())}),[x("astra-card"),x("tutorial-card")].forEach(s=>s.addEventListener("pointerdown",()=>je.clear())),x("start-button").addEventListener("click",$u),x("tutorial-action").addEventListener("click",w0),x("tutorial-skip").addEventListener("click",()=>{st.disable("skipped"),Xt("Tutorial hidden. Turn it on with Tutorial or Settings. Your progress is kept."),tt()}),x("tutorial-restart").addEventListener("click",ju),x("tutorial-toggle").addEventListener("click",qu),x("tutorial-setting-toggle").addEventListener("click",qu),x("settings-button").addEventListener("click",()=>Nn(x("settings-dialog"))),x("labels-button").addEventListener("click",()=>{_i=!_i,kt("luna-labels-v1",_i,jt),vi(),ed()}),x("reset-camera").addEventListener("click",()=>{Is(),x("settings-dialog").close(),Qt("surface"),Xt("Camera reset. Follow the gold objective marker or use Go to objective.")}),x("reset-panels").addEventListener("click",()=>{Ao.reset(),As.reset(),Xt("Tutorial and ASTRA positions reset.")}),x("levels-button").addEventListener("click",()=>{Qu(),Nn(x("levels-dialog"))}),x("next-action-button").addEventListener("click",()=>Ju(U.nextAction().command)),x("return-surface").addEventListener("click",()=>Qt("surface")),x("inspect-earth").addEventListener("click",()=>Yu("Earth")),x("inspect-lro").addEventListener("click",()=>Yu("LRO"));for(let s of["life","food","comms"])x("power-"+s).addEventListener("input",To);x("shelter-seal").addEventListener("change",To),x("apply-power").addEventListener("click",()=>{U.applyPower(To(),x("shelter-seal").checked)&&(x("systems-dialog").close(),Ft(),tt())}),x("brand-home").addEventListener("click",s=>{s.preventDefault(),Nn(x("help-dialog"))}),x("help-button").addEventListener("click",()=>Nn(x("help-dialog"))),x("data-button").addEventListener("click",()=>Nn(x("data-dialog"))),x("route-button").addEventListener("click",Io),x("interact-button").addEventListener("click",()=>{U.interact(),Ft(),tt()}),x("touch-interact").addEventListener("click",()=>{U.interact(),Ft(),tt()}),x("surface-tab").addEventListener("click",()=>Qt("surface")),x("orbit-tab").addEventListener("click",()=>Qt("orbital")),x("zoom-in").addEventListener("click",()=>K.zoom=Xe(K.zoom*1.15,.3,3.2)),x("zoom-out").addEventListener("click",()=>K.zoom=Xe(K.zoom/1.15,.3,3.2)),x("camera-button").addEventListener("click",()=>{K.rotateCamera?.(Math.PI/4),Xt("Camera rotated. WASD follows the current view.")}),x("follow-button").addEventListener("click",()=>{K.perspective!=="first-person"&&(K.follow=!K.follow,K.cameraPinned=K.follow?null:{...U.state.player},K.cameraFocusHeight=2.8,K.routeDistance=54,x("follow-button").setAttribute("aria-pressed",String(K.follow)))}),x("elevation-button").addEventListener("click",()=>{K.setElevation(!K.elevation),x("elevation-button").setAttribute("aria-pressed",String(K.elevation)),Xt(K.elevation?"Elevation layer enabled. Colours are derived from the NASA height grid.":"Surface illustration restored.")}),x("lifeline-button").addEventListener("click",()=>{K.showLifeline=!K.showLifeline,x("lifeline-button").setAttribute("aria-pressed",String(K.showLifeline)),x("lifeline-button").innerHTML=(K.showLifeline?"Return ribbon visible":"Show the return ribbon")+' <span aria-hidden="true">\u2197</span>'});let i=()=>{if(We.activate(),bn){Ps(),tt();return}["complete","failed"].includes(U.state.status)?Do():(U.pause(),je.clear(),tt())};x("pause-button").addEventListener("click",i),x("resume-button").addEventListener("click",i);let e=()=>{We.setMuted(!We.muted),We.activate(),vi()};x("sound-button").addEventListener("click",e),x("music-toggle").addEventListener("click",e),x("music-volume").addEventListener("input",()=>{We.setVolume(Number(x("music-volume").value)/100),We.activate(),vi()}),x("motion-button").addEventListener("click",()=>{Un=!Un,kt("luna-motion-v1",Un,jt),K.clearEffects(),vi()}),x("opening-toggle").addEventListener("click",()=>{Tt.setEnabled(!Tt.enabled),vi()}),x("apply-repair").addEventListener("click",()=>{U.completeRepair()&&(x("repair-dialog").close(),Ft(),tt())}),x("replay-button").addEventListener("click",()=>{x("debrief-dialog").close(),U.replayCheckpoint(),U.reviewPassed=!1,Lo(),Ft(),tt()}),x("restart-button").addEventListener("click",()=>{x("debrief-dialog").close(),U.reset(),Lo()}),x("next-level-button").addEventListener("click",yc),document.querySelectorAll("[data-close]").forEach(s=>s.addEventListener("click",()=>s.closest("dialog").close())),document.querySelectorAll("dialog").forEach(s=>s.addEventListener("close",()=>{s.id==="repair-dialog"&&U.state.status==="repair"&&U.cancelRepair(),s.dataset.resumeMission==="yes"&&U.state.status==="paused"&&(U.state.status="playing"),je.clear(),tt()})),document.querySelectorAll("[data-question]").forEach(s=>s.addEventListener("click",()=>vr(s.dataset.question))),x("astra-form").addEventListener("submit",s=>{s.preventDefault();let r=x("astra-input").value.trim();r&&(vr(r),x("astra-input").value="")}),document.addEventListener("keydown",s=>{if(s.key==="Escape"&&Mn){Mn=!1,Xt("Map selection cancelled.");return}if(s.target.closest('input, textarea, [contenteditable="true"], [data-floating-panel]')||Cs())return;let r=s.key.toLowerCase();if(r==="f"&&K.mode==="surface"){s.preventDefault(),s.repeat||Xu();return}if(["[","]",",","."].includes(r)){s.preventDefault(),K.rotateCamera?.(r==="["?-.15:r==="]"?.15:0,r===","?-.1:r==="."?.1:0);return}bn||r===" "&&s.target.closest("button, a, summary")||(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," ","shift","e","q","m","p"].includes(r)&&s.preventDefault(),je.add(r),!s.repeat&&(r==="e"&&K.mode==="surface"&&(U.interact(),Ft(),tt()),r==="q"&&K.mode==="surface"&&(U.scanNearby(),Ft(),tt()),r==="m"&&Qt(K.mode==="surface"?"orbital":"surface"),r==="p"&&i()))}),document.addEventListener("keyup",s=>je.delete(s.key.toLowerCase())),window.addEventListener("blur",()=>je.clear()),document.addEventListener("visibilitychange",()=>{We.setHidden(document.hidden),xr=0,document.hidden&&U.state.status==="playing"&&(U.pause(),je.clear(),tt())});let t=null;x("world").addEventListener("contextmenu",s=>s.preventDefault()),x("world").addEventListener("pointerdown",s=>{K.mode!=="surface"||Cs()||t||![0,1,2].includes(s.button)||(s.preventDefault(),x("world").focus({preventScroll:!0}),t={id:s.pointerId,button:s.button,startX:s.clientX,startY:s.clientY,x:s.clientX,y:s.clientY,moved:!1,pan:K.perspective!=="first-person"&&(s.button===1||s.button===0&&(Fn||s.shiftKey))},x("world").setPointerCapture(s.pointerId))}),x("world").addEventListener("pointermove",s=>{if(!t||t.id!==s.pointerId)return;let r=t;!r.moved&&Math.hypot(s.clientX-r.startX,s.clientY-r.startY)<6||(r.moved=!0,r.pan?K.panCamera?.(s.clientX-r.x,s.clientY-r.y):K.rotateCamera?.((s.clientX-r.x)*.007,(s.clientY-r.y)*.005*(K.perspective==="first-person"?-1:1)),r.x=s.clientX,r.y=s.clientY,Po())}),x("world").addEventListener("pointerup",s=>{if(!t||t.id!==s.pointerId)return;let r=t;t=null,x("world").hasPointerCapture?.(s.pointerId)&&x("world").releasePointerCapture(s.pointerId);let a=s.clientX??r.x,o=s.clientY??r.y;if(r.moved||Math.hypot(a-r.startX,o-r.startY)>=6||r.button!==0||r.pan||bn||Cs()||K.mode!=="surface")return;let c=x("world").getBoundingClientRect(),l=K.fromScreen(a-c.left,o-c.top);if(!l){Xt("Select the lunar surface or use the surface tracker.");return}if(Mn){Mn=!1,mc({target:l,label:"Selected map point"}),Dn(!0,!1,!1);return}U.navigate(l),Ft(),x("world").focus({preventScroll:!0})});for(let s of["pointercancel","lostpointercapture"])x("world").addEventListener(s,r=>{t?.id===r.pointerId&&(t=null)});x("world").addEventListener("wheel",s=>{s.preventDefault(),K.mode==="surface"&&K.perspective!=="first-person"&&(K.zoom=Xe(K.zoom*(s.deltaY>0?.94:1.06),.3,3.2))},{passive:!1}),x("minimap").addEventListener("pointerdown",s=>{let r=x("minimap").getBoundingClientRect(),a={x:(s.clientX-r.left)/r.width*U.terrain.width-.5,y:(s.clientY-r.top)/r.height*U.terrain.height-.5};if(Mn){Mn=!1,mc({target:a,label:"Selected map point"}),Dn(!0,!1,!1);return}Qt("surface"),U.navigate(a),Ft()}),x("minimap").addEventListener("keydown",s=>{s.key==="Enter"&&(s.preventDefault(),Io())}),document.querySelectorAll("[data-direction]").forEach(s=>{let r="arrow"+s.dataset.direction;s.addEventListener("pointerdown",o=>{o.preventDefault(),s.setPointerCapture(o.pointerId),je.add(r)});let a=()=>je.delete(r);s.addEventListener("pointerup",a),s.addEventListener("pointercancel",a),s.addEventListener("lostpointercapture",a)});let n=()=>{let s=x("world").getBoundingClientRect();K.resize(s.width,s.height,window.devicePixelRatio||1)};new ResizeObserver(n).observe(x("world")),n(),window.LUNA_DATA&&(x("download-button").hidden=!0)}function xc(i){let e=xr?Math.min((i-xr)/1e3,.1):0;if(xr=i,Tt.active){let r=Tt.update(e,document.hidden);Mc(),K.cinematicFrame?.(Tt.elapsed,Tt.chapter.shot),x("story-cut").style.opacity=String(K.cinematicFade||0),We.updateOpening(Tt.elapsed),r&&gc(),requestAnimationFrame(xc);return}let t=(je.has("d")||je.has("arrowright")?1:0)-(je.has("a")||je.has("arrowleft")?1:0),n=(je.has("s")||je.has("arrowdown")?1:0)-(je.has("w")||je.has("arrowup")?1:0),s=K.inputVector?.(t,n)||{dx:t+n,dy:-t+n};!st.holdsTime&&K.mode==="surface"?U.update(e,{...s,sprint:je.has("shift"),jump:je.has(" ")}):U.state.moving=!1,Ft(),uc+=e,uc>=.25&&(tt(),uc=0),We.update(U.state,ni,st.holdsTime),x("story-dialog").open||(K.draw(i/1e3,ni),ed()),requestAnimationFrame(xc)}async function D0(){try{let i=window.LUNA_DATA||await Promise.all(["terrain.json","mission.json","ephemerides.json","academy.json"].map(async t=>{let n=await fetch("data/"+t,{cache:"no-cache"});if(!n.ok)throw new Error("Could not load "+t);return n.json()})).then(([t,n,s,r])=>({terrain:t,config:n,ephemerides:s,academy:r}));try{jt=window.localStorage}catch{jt=null}U=new Cr(i.terrain,i.config,i.ephemerides,i.academy,jt),K=new vo(x("world"),U),st=new Mo(U,jt),We=new bo(jt),Tt=new wo(jt),_i=Bt("luna-labels-v1",!0,jt)!==!1;let e=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches||!1;Un=Bt("luna-motion-v1",e,jt)===!0,L0(),P0(),tt(),x("loading").hidden=!0,T0(),window.luna={mission:U,renderer:K,tutorial:st,audio:We,story:Tt},requestAnimationFrame(xc)}catch(i){console.error(i),x("loading").replaceChildren();let e=document.createElement("p");e.textContent="Your expedition could not load.";let t=document.createElement("small");t.textContent="LUNA now needs WebGL 2. Enable hardware acceleration in your browser, or try a current Chrome, Edge or Firefox browser.";let n=document.createElement("button");n.textContent="Try again",n.className="secondary-button",n.style.marginTop="18px",n.addEventListener("click",()=>location.reload()),x("loading").append(e,t,n)}}D0();})();
