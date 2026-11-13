// Authored visual motion; never changes the mission or its resource clock.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
const pulse=(t,start,end)=>ease((t-start)/.45)*(1-ease((t-end)/.45));

export function openingMotion(elapsed,reduced=false){
  const time=clamp(elapsed,0,26),landing=clamp(time/4.15),drive=clamp((time-6)/3.5),walk=clamp((time-19)/4.2);
  return {
    landerHeight:reduced?0:27*(1-ease(landing)),
    legCompression:reduced?0:Math.sin(clamp((time-4.15)/.55)*Math.PI)*.17,
    engine:!reduced&&time<4.15?(.45+.55*(1-landing)):0,
    roverTravel:reduced?10:10*(1-(1-drive)**3),
    roverBrake:reduced?0:pulse(time,8.1,9.1)*.06,
    cadetTravel:reduced?5:5*ease(walk),
    cadetStride:reduced?0:4*walk*(1-walk),
    wristCheck:reduced?0:pulse(time,23.15,25.15),
    relayBearing:reduced?.32:-.28+.60*ease((time-12)/3.8),
    relayTilt:reduced?.47:.35+.12*ease((time-12)/3.8),
    fade:reduced?0:Math.max(...[6,12,19].map(c=>clamp(1-Math.abs(time-c)/.16)))*.72
  };
}

export function astronautPose(phase,time,strength=0,checking=0,reduced=false){
  if(reduced)return{hips:[0,0],knees:[0,0],shoulders:[0,0],elbows:[0,0],bodyY:0,lean:0,roll:0,headYaw:0,headPitch:0};
  const stride=clamp(strength),check=clamp(checking),s=Math.sin(phase),c=Math.cos(phase);
  return {
    hips:[s*.43*stride,-s*.43*stride],
    knees:[Math.max(0,-s)*.68*stride,Math.max(0,s)*.68*stride],
    shoulders:[-s*.25*stride-.62*check,s*.25*stride],
    elbows:[.08*stride-.98*check,.12*stride],
    bodyY:Math.sin(time*1.55)*.012+Math.sin(phase*2)*.035*stride,
    lean:stride*.04,roll:c*.025*stride,
    headYaw:Math.sin(time*.45)*.045*(1-stride),
    headPitch:check*.31
  };
}

// Dust follows ballistic arcs in lunar gravity; no smoke drifting through air.
export function ballisticDust(age,speed,lift,gravity=1.62){
  return {distance:Math.max(0,age)*speed,height:Math.max(0,lift*age-.5*gravity*age*age)};
}
