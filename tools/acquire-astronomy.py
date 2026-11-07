"""Rebuild LUNA's one-frame astronomy pack from primary datasets. Offline at runtime.
Python 3 standard library; run from project root. JPL requests are sequential.
"""
import base64, urllib.request, urllib.parse, json, math, re, struct, hashlib, gzip, datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'dist/data'; CACHE=OUT/'astronomy-source';CACHE.mkdir(exist_ok=True)
START='2026-10-03 00:00';STOP='2027-05-06 00:00'
def fetch(url,headers=None):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers=headers or {}),timeout=50) as r:return r.status,r.read()
  except Exception:
   if attempt==2:raise
def query(key,p):
 u='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode({'format':'json',**{k:"'"+str(v)+"'" for k,v in p.items()}});f=CACHE/(key+'.txt')
 if f.exists():s=f.read_text()
 else:
  _,b=fetch(u);d=json.loads(b);s=d.get('result','')
  if '$$SOE' not in s:raise ValueError(d.get('error',s[:500]))
  f.write_text(s)
 rows=[[v.strip() for v in l.split(',')] for l in s.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines()]
 return rows,u,s

def terrain():
 base='https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/';prod='ldem_1024_00n_15n_000_030';f=OUT/'terrain-tranquillitatis.json'
 if f.exists():return
 _,b=fetch(base+prod+'.lbl');s=b.decode();(OUT/'tranquillitatis-source.lbl').write_bytes(b)
 def n(k):return float(re.search(r'^\s*'+k+r'\s*=\s*([-\d.]+)',s,re.M).group(1))
 width=int(n('LINE_SAMPLES'));scale=n('SCALING_FACTOR');offset=n('OFFSET');ppd=n('MAP_RESOLUTION');radius=1737400;lat=0.67408;lon=23.47297;count=80
 row=round((n('MAXIMUM_LATITUDE')-lat)*ppd)-40;col=round((lon-n('WESTERNMOST_LONGITUDE'))*ppd)-40;first=row*width*2;last=(row+count)*width*2-1
 status,b=fetch(base+prod+'.img',{'Range':f'bytes={first}-{last}'})
 if status!=206 or len(b)!=last-first+1:raise ValueError('LOLA exact byte range unavailable')
 endian='<' if 'LSB_INTEGER' in s else '>';h=[]
 for y in range(count):h.extend(struct.unpack_from(endian+'80h',b,(y*width+col)*2))
 if -32768 in h:raise ValueError('LOLA missing cell')
 # PDS radius DN offset is 1,737,400 m: retain elevation relative to reference sphere.
 heights=[round(v*scale+offset-radius,3) for v in h]
 result={'schema':1,'width':80,'height':80,'cellMetres':2*math.pi*radius/360/ppd,'heights':heights,'projection':{'type':'equirectangular','radiusMetres':radius,'latitude0':n('MAXIMUM_LATITUDE')-(row+.5)/ppd,'longitude0':n('WESTERNMOST_LONGITUDE')+(col+.5)/ppd,'degreesPerCell':1/ppd,'longitudeDirection':'east','latitudeType':'planetocentric','frame':'LOLA Mean Earth / polar axis of DE421'},'source':{'name':'NASA LRO / LOLA — Mare Tranquillitatis','product':prod.upper(),'datasetId':'LRO-L-LOLA-4-GDR-V1.0','url':base+prod+'.img','labelUrl':base+prod+'.lbl','nativeResolutionMetres':2*math.pi*radius/360/ppd,'processing':'80 x 80 original radius samples; little-endian int16 x 0.5 m + label offset minus 1,737,400 m reference sphere. No synthetic elevations.','rasterRangeSha256':hashlib.sha256(b).hexdigest(),'range':{'firstByte':first,'lastByte':last,'rowStartZeroBased':row,'columnStartZeroBased':col}}}
 f.write_text(json.dumps(result,separators=(',',':'))+'\n');print('LOLA Mare Tranquillitatis',min(heights),max(heights),flush=True)

def stars():
 f=OUT/'stars.json'
 if f.exists():return
 u='https://heasarc.gsfc.nasa.gov/FTP/heasarc/dbase/dump/heasarc_bsc5p.tdat.gz';_,b=fetch(u);s=gzip.decompress(b).decode();(CACHE/'bsc5p.tdat').write_text(s)
 header=s.split('<DATA>')[0];print(header[-2500:],flush=True)
 fields=re.search(r'line\[1\]\s*=\s*(.+)',header).group(1).split();rows=[]
 for l in s.split('<DATA>')[1].split('</DATA>')[0].strip().splitlines():
  r=dict(zip(fields,l.split('|')))
  try:
   ra=float(r['ra']);dec=float(r['dec']);mag=float(r['vmag']);bv=float(r.get('bv_color') or .65)
   if mag<=6.5:rows.append([r.get('name',''),ra,dec,mag,bv,float(r.get('pm_ra') or 0),float(r.get('pm_dec') or 0)])
  except (ValueError,KeyError):continue
 if len(rows)<3000:raise ValueError('Star schema mismatch '+repr(fields))
 f.write_text(json.dumps({'source':{'name':'Yale Bright Star Catalog, 5th revised edition / NASA HEASARC BSC5P','url':u,'documentation':'https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html','frame':'J2000 equatorial / FK5 treated as ICRF at game precision','sha256':hashlib.sha256(b).hexdigest(),'columns':['name','raDeg','decDeg','visualMagnitude','BminusV','pmRaArcsecYear','pmDecArcsecYear'],'processing':'Objects with V magnitude <=6.5 and valid J2000 positions. Proper motion retained; colors estimated from B-V.'},'stars':rows},separators=(',',':'))+'\n');print('Catalogued stars',len(rows),flush=True)

def astro():
 ids={'Sun':('10',695700,'star'),'Mercury':('199',2439.7,'planet'),'Venus':('299',6051.8,'planet'),'Earth':('399',6378.137,'planet'),'Moon':('301',1737.4,'moon'),'Mars':('499',3396.19,'planet'),'Jupiter':('599',71492,'gas giant'),'Saturn':('699',60268,'gas giant'),'Uranus':('799',25559,'ice giant'),'Neptune':('899',24764,'ice giant'),'Phobos':('401',11.1,'moon'),'Deimos':('402',6.2,'moon'),'Io':('501',1821.6,'moon'),'Europa':('502',1560.8,'moon'),'Ganymede':('503',2634.1,'moon'),'Callisto':('504',2410.3,'moon'),'Titan':('606',2574.7,'moon'),'Enceladus':('602',252.1,'moon'),'Titania':('703',788.9,'moon'),'Triton':('801',1353.4,'moon'),'Pluto':('999',1188.3,'dwarf planet'),'Charon':('901',606,'moon'),'Ceres':('1;',469.7,'dwarf planet'),'Vesta':('4;',262.7,'asteroid'),'Eris':('136199;',1163,'dwarf planet'),'Halley':('90000030',5.5,'comet')}
 common={'MAKE_EPHEM':'YES','START_TIME':START,'STOP_TIME':STOP,'CSV_FORMAT':'YES'}
 old=json.loads((OUT/'solar-system.json').read_text());out={'schema':2,'epoch':'2026-10-04T12:00:00Z','start':'2026-10-03T00:00:00Z','stop':'2027-05-05T23:00:00Z','frame':'Sun-centered ICRF; km; UTC samples converted to TDB with 69.184 s approximation','source':'NASA/JPL Horizons','assets':old['assets'],'bodies':{},'sites':{'moon':{'name':'Mare Tranquillitatis / Apollo 11 region','latitude':.67408,'longitude':23.47297,'altitudeKm':0,'host':'Moon'},'mars':{'name':'Jezero Crater','latitude':18.44,'longitude':77.45,'altitudeKm':-2.6,'host':'Mars'}},'frames':{},'validation':{},'classification':'Cached ephemerides; Hermite vector interpolation. Mission hazards, flight route, terrain microdetail and weather are authored.'}
 for name,(id,r,kind) in ids.items():
  step='20 min' if name=='Phobos' else '1 h' if name=='Deimos' else '3 h' if kind=='moon' else '6 h'
  rows,u,_=query('icrf-'+name,{**common,'STEP_SIZE':step,'COMMAND':id,'CENTER':'500@10','EPHEM_TYPE':'VECTORS','VEC_TABLE':'2','OUT_UNITS':'KM-S','REF_PLANE':'FRAME','REF_SYSTEM':'ICRF','VEC_CORR':'NONE'})
  # One day of earlier vectors supports retarded light-time at the usable coverage boundary.
  prefix,_,_=query('padding-'+name,{**common,'START_TIME':'2026-10-02 00:00','STOP_TIME':START,'STEP_SIZE':step,'COMMAND':id,'CENTER':'500@10','EPHEM_TYPE':'VECTORS','VEC_TABLE':'2','OUT_UNITS':'KM-S','REF_PLANE':'FRAME','REF_SYSTEM':'ICRF','VEC_CORR':'NONE'})
  rows=prefix[:-1]+rows
  out['bodies'][name]={'radiusKm':r,'kind':kind,'sourceUrl':u,'step':step,'samples':[[round((float(a[0])-2440587.5)*86400-69.184,3),*[float(v) for v in a[2:8]]] for a in rows]};print('ICRF',name,len(rows),flush=True)
 for world,body,lon,lat in [('moon','301',23.47297,.67408),('mars','499',-77.45,18.645)]:
  tables={}
  for target,id in [('Sun','10'),('Earth','399')]:
   rows,u,_=query('frame-'+world+'-'+target,{**common,'STEP_SIZE':'1 h','COMMAND':id,'CENTER':'coord@'+body,'COORD_TYPE':'GEODETIC','SITE_COORD':f'{lon},{lat},{out["sites"][world]["altitudeKm"]}','EPHEM_TYPE':'OBSERVER','TIME_TYPE':'UT','QUANTITIES':'4,13,20,24,45','ANG_FORMAT':'DEG','RANGE_UNITS':'KM','APPARENT':'AIRLESS','EXTRA_PREC':'YES'})
   start=datetime.datetime(2026,10,3,tzinfo=datetime.timezone.utc).timestamp();tables[target]={'url':u,'samples':[[start+i*3600,*[float(v) for v in a[3:11]]] for i,a in enumerate(rows)]};print('Frame',world,target,len(rows),a[3:11] if (a:=rows[0]) else [],flush=True)
  out['frames'][world]=tables
  # Independent observer-specific checks for objects not used to derive the frame.
  for target,id in [('Mars','499')] if world=='moon' else [('Jupiter','599')]:
   rows,u,_=query('check-'+world+'-'+target,{**common,'STOP_TIME':'2026-10-05 00:00','STEP_SIZE':'1 h','COMMAND':id,'CENTER':'coord@'+body,'COORD_TYPE':'GEODETIC','SITE_COORD':f'{lon},{lat},{out["sites"][world]["altitudeKm"]}','EPHEM_TYPE':'OBSERVER','TIME_TYPE':'UT','QUANTITIES':'4,13,20,24,45','ANG_FORMAT':'DEG','RANGE_UNITS':'KM','APPARENT':'AIRLESS','EXTRA_PREC':'YES'})
   start=datetime.datetime(2026,10,3,tzinfo=datetime.timezone.utc).timestamp();out['validation'][world]={'name':target,'url':u,'samples':[[start+i*3600,*[float(v) for v in a[3:11]]] for i,a in enumerate(rows)]}
 # Mean IAU rotational coefficients from NASA NAIF; periodic nutation terms are not applied.
 pck=CACHE/'pck00011.tpc';pckUrl='https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc'
 if not pck.exists():pck.write_bytes(fetch(pckUrl)[1])
 raw='\n'.join(re.findall(r'\\begindata(.*?)(?=\\begintext|$)',pck.read_text(),re.S));out['orientationSource']={'url':pckUrl,'model':'NAIF PCK 00011 mean IAU RA/DEC/W polynomial; periodic libration/nutation omitted; lunar and Martian surface axes use the observer frames.'};out['orientation']={}
 for name,(id,_,_) in ids.items():
  fields={};id={'Ceres':'2000001','Vesta':'2000004'}.get(name,id)
  for key in ['POLE_RA','POLE_DEC','PM']:
   match=re.search(r'BODY'+re.escape(id)+r'_'+key+r'\s*=\s*\((.*?)\)',raw,re.S)
   if match:fields[key]=[float(x.replace('D','E').replace('d','e')) for x in re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[EDed][-+]?\d+)?',match.group(1))]
  if len(fields)==3:out['orientation'][name]=fields
 reference=ROOT/'dist/assets/jezero-reference.jpg';referenceUrl='https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA25325.jpg'
 if not reference.exists():reference.write_bytes(fetch(referenceUrl)[1])
 out['visualReferences']={'Mars':{'title':'Enchanted Lake, Jezero — Perseverance visual reference','url':'https://www.jpl.nasa.gov/images/pia25325-enchanted-view-of-jezero-rocks/','imageUrl':referenceUrl,'credit':'NASA/JPL-Caltech','publishedResolution':'5120 × 2880 publication image','acquired':'2022-04-30','purpose':'Reference for layered rock shapes and colour; not an orthorectified texture or a surveyed mesh of the playable site.','sha256':hashlib.sha256(reference.read_bytes()).hexdigest(),'data':'data:image/jpeg;base64,'+base64.b64encode(reference.read_bytes()).decode()}}
 out['validationArrival']={}
 for world,host,lon,lat,target,ident,date,end in [('moon','301',23.47297,.67408,'Mars','499','2026-10-07 00:00','2026-10-09 00:00'),('mars','499',-77.45,18.645,'Jupiter','599','2027-05-02 00:00','2027-05-04 00:00')]:
  rows,u,_=query('check-arrival-'+world,{**common,'START_TIME':date,'STOP_TIME':end,'STEP_SIZE':'1 h','COMMAND':ident,'CENTER':'coord@'+host,'COORD_TYPE':'GEODETIC','SITE_COORD':f'{lon},{lat},{out["sites"][world]["altitudeKm"]}','EPHEM_TYPE':'OBSERVER','TIME_TYPE':'UT','QUANTITIES':'4,13,20,24,45','ANG_FORMAT':'DEG','RANGE_UNITS':'KM','APPARENT':'AIRLESS','EXTRA_PREC':'YES'})
  start=datetime.datetime.fromisoformat(date).replace(tzinfo=datetime.timezone.utc).timestamp();out['validationArrival'][world]={'name':target,'url':u,'samples':[[start+i*3600,*[float(v) for v in a[3:11]]] for i,a in enumerate(rows)]}
 (OUT/'astronomy.json').write_text(json.dumps(out,separators=(',',':'))+'\n');print('Shared astronomy pack complete',flush=True)
if __name__=='__main__':
 terrain();stars();astro()
