"""Cache JPL vectors and local horizons; NASA MOLA terrain and Blue Marble. Offline at runtime."""
import urllib.request,urllib.parse,json,struct,math,hashlib,datetime,re,io
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'dist/data'; A=ROOT/'dist/assets'; CACHE=OUT/'horizons'
for d in [OUT,A,CACHE]:d.mkdir(exist_ok=True)
def fetch(url,headers=None):
 for i in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers=headers or {}),timeout=50) as r:return r.status,r.read()
  except Exception:
   if i==2:raise

def query(name,params):
 url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode({'format':'json',**{k:"'"+str(v)+"'" for k,v in params.items()}})
 f=CACHE/(name+'.txt')
 if f.exists():s=f.read_text()
 else:
  _,b=fetch(url);d=json.loads(b);s=d.get('result','')
  if '$$SOE' not in s:raise ValueError(d.get('error',s[:200]))
  f.write_text(s)
 rows=[[c.strip() for c in l.split(',')] for l in s.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines()]
 print(name,len(rows),flush=True);return rows,url
# Distinct measured Mars elevation crop near Jezero; MOLA samples metres above areoid.
base='https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/'
f=OUT/'terrain-mars.json'
if not f.exists():
 _,b=fetch(base+'megt44n000hb.lbl');label=b.decode();(OUT/'mars-terrain-source.lbl').write_bytes(b)
 def n(k):return float(re.search(r'^\s*'+k+r'\s*=\s*([-\d.]+)',label,re.M).group(1))
 samples=int(n('LINE_SAMPLES'));row=int((n('MAXIMUM_LATITUDE')-18.44)*128)-40;col=int((77.45-n('WESTERNMOST_LONGITUDE'))*128)-40;count=80
 first=row*samples*2;last=(row+count)*samples*2-1
 status,raw=fetch(base+'megt44n000hb.img',{'Range':f'bytes={first}-{last}'})
 if status!=206 or len(raw)!=last-first+1:raise ValueError('MOLA range mismatch')
 heights=[]
 for y in range(count):heights.extend(struct.unpack_from('>80h',raw,(y*samples+col)*2))
 if -32768 in heights:raise ValueError('Missing MOLA cell')
 cell=2*math.pi*3396000/360/128
 payload={'schema':1,'width':80,'height':80,'cellMetres':cell,'heights':heights,'projection':{'type':'equirectangular','radiusMetres':3396000,'x0':0,'y0':0,'latitude0':n('MAXIMUM_LATITUDE')-(row+.5)/128,'longitude0':(col+.5)/128,'degreesPerCell':1/128},'source':{'name':'NASA MGS / MOLA Jezero regional topography','datasetId':'MGS-M-MOLA-5-MEGDR-L3-V1.0','product':'MEGT44N000HB','productVersion':'2.0','url':base+'megt44n000hb.img','labelUrl':base+'megt44n000hb.lbl','processing':'80 x 80 original signed big-endian int16 topographic cells. Metres above areoid; no invented heights. East-west distance adjusted for latitude in routing.','range':{'firstByte':first,'lastByte':last,'rowStartZeroBased':row,'columnStartZeroBased':col},'rasterRangeSha256':hashlib.sha256(raw).hexdigest()}}
 f.write_text(json.dumps(payload,separators=(',',':'))+'\n');print('MOLA',min(heights),max(heights),flush=True)
# Earth texture, original NASA Blue Marble composite (downsample only).
url='https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.jpg'
if not (A/'earth.jpg').exists():
 _,b=fetch(url);im=Image.open(io.BytesIO(b));im.thumbnail((2048,1024));im.save(A/'earth.jpg',quality=88);print('NASA Earth texture',flush=True)
moonurl='https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg'
if not (A/'moon.jpg').exists():
 _,b=fetch(moonurl);(A/'moon.jpg').write_bytes(b);print('NASA Moon texture',flush=True)
# Cached vectors in the same frame, same epoch for the solar system.
ids={'Sun':'10','Mercury':'199','Venus':'299','Earth':'399','Moon':'301','Mars':'499','Jupiter':'599','Saturn':'699','Uranus':'799','Neptune':'899'}
common={'MAKE_EPHEM':'YES','START_TIME':'2026-10-04 00:00','STOP_TIME':'2026-10-05 00:00','STEP_SIZE':'1 h','CSV_FORMAT':'YES'}
result={'schema':1,'epoch':'2026-10-04T12:00:00 TDB','source':'NASA/JPL Horizons','frame':'Sun-centered J2000 ecliptic','vectors':{},'observers':{},'assets':{'Earth':{'url':url,'credit':'NASA Blue Marble / MODIS / Robert Simmon and Reto Stockli','data':'data:image/jpeg;base64,'+__import__('base64').b64encode((A/'earth.jpg').read_bytes()).decode()}},'classification':'Dated cached ephemerides. Planet surfaces except NASA Earth texture are authored illustrations. Flight route and craft are fictional.'}
result['assets']['Moon']={'url':moonurl,'credit':"NASA Scientific Visualization Studio / LROC / Ernie Wright",'data':'data:image/jpeg;base64,'+__import__('base64').b64encode((A/'moon.jpg').read_bytes()).decode()}
for name,id in ids.items():
 rows,u=query('vector-'+name,{**common,'COMMAND':id,'CENTER':'500@10','EPHEM_TYPE':'VECTORS','VEC_TABLE':'2','OUT_UNITS':'KM-S','REF_PLANE':'ECLIPTIC','REF_SYSTEM':'ICRF','VEC_CORR':'NONE'})
 result['vectors'][name]={'url':u,'samples':[{'jdTdb':float(r[0]),'x':float(r[2]),'y':float(r[3]),'z':float(r[4])} for r in rows]}
# Moon observer matches the DEM crop's mean coordinates.
t=json.loads((OUT/'terrain.json').read_text());p=t['projection'];x=p['x0']+39.5*t['cellMetres'];y=p['y0']-39.5*t['cellMetres'];lat=-90+2*math.atan(math.hypot(x,y)/(2*p['radiusMetres']))*180/math.pi;lon=math.degrees(math.atan2(x,y))%360
for world,body,coords in [('moon','301',(lon,lat,0)),('mars','499',(-77.45,18.44,-2.6))]:
 obs={'longitude':(abs(coords[0]) if world=='mars' else coords[0]),'latitude':coords[1],'altitudeKm':coords[2],'start':'2026-10-04T00:00:00 UTC','bodies':{}}
 for name,id in ids.items():
  if id==body:continue
  rows,u=query(world+'-'+name,{**common,'COMMAND':id,'CENTER':'coord@'+body,'COORD_TYPE':'GEODETIC','SITE_COORD':','.join(map(str,coords)),'EPHEM_TYPE':'OBSERVER','TIME_TYPE':'UT','QUANTITIES':'4,13,20','ANG_FORMAT':'DEG','RANGE_UNITS':'KM','APPARENT':'AIRLESS'})
  # date, daylight, lunar-presence, azimuth, elevation, angular diameter, range, range rate
  samples=[]
  for h,r in enumerate(rows):
   try:samples.append({'hour':h,'azimuth':float(r[3]),'altitude':float(r[4]),'diameterArcsec':float(r[5]),'distanceKm':float(r[6])})
   except ValueError:raise ValueError('Unexpected observer fields '+repr(r))
  obs['bodies'][name]={'url':u,'samples':samples}
 result['observers'][world]=obs
(OUT/'solar-system.json').write_text(json.dumps(result,separators=(',',':'))+'\n');print('Voyage dataset complete',flush=True)
