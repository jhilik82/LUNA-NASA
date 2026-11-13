"""Compose the original, seamless LUNA ambient score using Python's standard library.
Run: python tools/compose_ambience.py [--wav-only]
FFmpeg (optional) encodes the generated PCM to the browser's small MP3 asset.
No music service, downloaded recording, runtime synthesis, or API key is needed.
"""
from array import array
from math import cos, exp, pi, sin
from pathlib import Path
import subprocess
import sys
import wave
ROOT = Path(__file__).resolve().parents[1]
RATE, LENGTH = 22050, 48
CHORDS = [(146.83,220,261.63,329.63),(116.54,174.61,220,261.63),(130.81,196,261.63,293.66),(98,146.83,196,246.94)]

def render():
    target = ROOT / 'dist/assets/audio'
    target.mkdir(parents=True, exist_ok=True)
    pcm = array('h')
    # Whole-cycle frequencies and circular envelopes ensure a continuous loop.
    voices = [(round(f*LENGTH)/LENGTH, c*12, i) for c,chord in enumerate(CHORDS) for i,f in enumerate(chord)]
    for n in range(RATE*LENGTH):
        t=n/RATE; left=right=0.0
        for f,center,i in voices:
            d=(t-center+LENGTH/2)%LENGTH-LENGTH/2
            if abs(d)>=12: continue
            envelope=(.5+.5*cos(pi*d/12))**1.7
            tone=(sin(2*pi*f*t)+.10*sin(4*pi*f*t)+.025*sin(6*pi*f*t))*.042*envelope
            pan=.35*sin(i*1.7+center)
            left+=tone*(1-pan); right+=tone*(1+pan)
        # A slow, restrained glimmer; a sustained pad remains the focus.
        for start,f in [(5,587.33),(17,523.25),(30,440),(41,392)]:
            age=(t-start)%LENGTH
            if age<6:
                env=(1-exp(-age*3))*exp(-age*.9)
                bell=sin(2*pi*(round(f*LENGTH)/LENGTH)*t)*env*.010
                left+=bell;right+=bell*.8
        pcm.extend((round(max(-.9,min(.9,left))*32767),round(max(-.9,min(.9,right))*32767)))
    path=target/'quiet-orbit.wav'
    with wave.open(str(path),'wb') as out:
        out.setnchannels(2);out.setsampwidth(2);out.setframerate(RATE);out.writeframes(pcm.tobytes())
    if '--wav-only' not in sys.argv:
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(path),'-codec:a','libmp3lame','-b:a','96k',str(target/'quiet-orbit.mp3')],check=True)
        path.unlink()
    print('Composed original LUNA score:', target)
if __name__=='__main__': render()
