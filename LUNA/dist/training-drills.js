// Authored procedures and equipment targets; these are educational game scenarios.
export const DRILL_IDS = ['solar','airlock','samples','comms','logistics'];
export const angleError=(a,b)=>Math.abs(((a-b+540)%360)-180);
export function equipmentReadout(id,d) {
  if(id==='solar') {
    const alignment=Math.max(0,Math.cos((d.tilt-35)*Math.PI/180)*Math.cos(angleError(d.bearing,110)*Math.PI/180));
    return{value:6*alignment,valid:angleError(d.bearing,110)<=5&&Math.abs(d.tilt-35)<=5};
  }
  if(id==='comms') {
    const alignment=Math.max(0,Math.cos(angleError(d.bearing,72)*Math.PI/180)*Math.cos((d.tilt-32)*Math.PI/180));
    return{value:100*alignment,valid:angleError(d.bearing,72)<=5&&Math.abs(d.tilt-32)<=5};
  }
  return{value:0,valid:false};
}
export function initialDrill(id) {
  return{type:id,tilt:0,bearing:0,suitChecked:false,innerClosed:false,pressure:100,outerOpen:false,collected:false,tagged:false,sealed:false,stowed:false,loaded:false,delivered:false};
}
export function drillView(id,d) {
  const done=d.complete;
  if(id==='solar'||id==='comms') {
    const solar=id==='solar',r=equipmentReadout(id,d);
    return{title:solar?'Align the solar array':'Point the relay antenna',instruction:solar?'Set tilt to 35° and bearing to 110°. Watch the actual panel rotate and the output change. Connect when both axes are within 5°.':'Point toward the authored training beacon: bearing 72°, elevation 32°. Watch the dish turn. Establish a link when both axes are within 5°.',
      readout:solar?r.value.toFixed(2)+' / 6 kW modeled output':r.value.toFixed(0)+'% modeled signal quality',
      ranges:[{key:'tilt',label:solar?'Panel tilt':'Dish elevation',min:0,max:85,value:d.tilt},{key:'bearing',label:'Bearing',min:0,max:360,value:d.bearing}],
      action:solar?'connect-solar':'connect-comms',label:done?'Equipment commissioned':solar?'Connect the array':'Establish the link',enabled:r.valid&&!done};
  }
  if(id==='airlock') {
    const actions=[['check-suit','Check suit reserves','Check that the suit can support the EVA before you isolate the chamber.'],['seal-inner','Seal the inner hatch','Close the inner hatch before venting. Watch the hatch indicator and pressure column.'],['vent','Depressurise the chamber','The inner hatch is sealed. Vent the chamber; its visible pressure column will fall.'],['open-outer','Open the outer hatch','The chamber is vented. Open the outer hatch and step out onto the surface.']];
    const i=!d.suitChecked?0:!d.innerClosed?1:d.pressure>0?2:3,a=actions[i];
    return{title:'Practise an EVA airlock cycle',instruction:a[2],readout:d.pressure+'% chamber pressure · inner '+(d.innerClosed?'sealed':'open')+' · outer '+(d.outerOpen?'open':'sealed'),ranges:[],action:a[0],label:done?'EVA cycle complete':a[1],enabled:!done};
  }
  if(id==='samples') {
    const a=!d.tagged?['tag-sample','Attach the site record','Attach the coordinates and elevation recorded where you picked up the sample. Watch its identity light turn green.']:!d.sealed?['seal-sample','Seal the canister','Close the visible canister lid to isolate the sample before storage.']:['stow-sample','Stow in the sample rack','Place the sealed, labelled canister into the laboratory rack.'];
    const site=d.tagged&&d.site?' · '+Math.abs(d.site.lat).toFixed(4)+'° S, '+d.site.lon.toFixed(4)+'° E · '+Math.round(d.site.elevation)+' m elevation':'';
    return{title:'Prepare the lunar sample',instruction:a[2],readout:(d.collected?'Sample collected':'Collect the field sample first')+' · '+(d.tagged?'labelled':'unlabelled')+' · '+(d.sealed?'sealed':'open')+site,ranges:[],action:a[0],label:done?'Sample archived':a[1],enabled:d.collected&&!done};
  }
  return{title:'Load a rover supply crate',instruction:'Secure a life-support supply crate to Echo. Board the rover, deliver it at the gold field marker, then drive home and dock. The crate appears on the rover and at the delivery site.',readout:d.delivered?'Crate delivered':d.loaded?'Crate secured to Echo':'Cargo rack empty',ranges:[],action:'load-cargo',label:'Secure the supply crate',enabled:!d.loaded&&!done};
}
