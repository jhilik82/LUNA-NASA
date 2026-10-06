# Run LUNA in Visual Studio Code

This is the complete source of LUNA 0.9.0: ten practical 3D training levels,
the opening storyline, 360-degree camera controls, ASTRA, and all included data.

## Start the included game

1. Extract the ZIP. Do not run it from inside the compressed folder.
2. Open Visual Studio Code and choose **File > Open Folder**.
3. Select the **LUNA** folder that contains **package.json**.
4. Open **Terminal > New Terminal** in VS Code.
5. With Node.js and npm installed, run:

```sh
npm start
```

6. Open **http://localhost:3000** in your browser.

The ZIP includes the built game, so installing dependencies is not required for
this first run. Leave the terminal open while playing. Press **Ctrl+C** to stop.

## Install dependencies and edit the source

In the same LUNA terminal:

```sh
npm ci
npm run build
npm start
```

`npm ci` installs the exact versions from package-lock.json. If you already have
the server running, use a second terminal for the build, then refresh the browser.
Run **npm run build after changing JavaScript, CSS, HTML or data**. It rebuilds
the browser bundle and the single-file offline copy. The browser entry is game.js;
edit the readable source modules below, then rebuild.

In VS Code, **Terminal > Run Task** also offers Install dependencies, Build game,
Start game, and Run tests. Build game is the default build task.

## Files to edit

| File | Purpose |
| --- | --- |
| dist/index.html | Game interface, settings, panels and buttons |
| dist/styles.css | Layout, colours, contrast and responsive design |
| dist/app.js | Inputs, interface events, story and workbench wiring |
| dist/engine.js | Terrain, movement, resources, circuits and original mission |
| dist/academy.js | Ten-level progression, equipment tasks and saved badges |
| dist/training-drills.js | Equipment controls, procedures and training targets |
| dist/data/academy.json | Mission briefings, objectives, rewards and questions |
| dist/render-3d.js | Camera, 3D world, demonstrations and visual state |
| dist/models.js | Jointed astronaut, rover, lander, habitat, airlock, array and laboratory models |
| dist/animation.js | Landing, braking, astronaut poses and ballistic dust |
| dist/story.js | Automatic opening sequence and its captions |
| dist/academy-guide.js | Action-by-action tutorial |
| dist/audio.js | Music, effects, mute and volume |
| dist/navigation.js | ASTRA route requests and terrain planning |
| dist/maps.js | Minimap and dated orbital tracking view |
| dist/data/terrain.json | Included NASA elevation pack |
| dist/data/ephemerides.json | Included dated NASA/JPL celestial vectors |
| dist/data/mission.json | Movement, reserves and mission configuration |
| tests/ | Automated mission, controller, camera and equipment checks |

The built **dist/game.js** and **dist/luna-playable.html** are generated files.
The single-file HTML can also be opened directly for offline play. The normal
**dist/index.html** must be served through `npm start`; do not double-click it.

## Check your changes

```sh
npm test
npm run check
npm run build
```

The supplied release passed 62 automated checks. Its 3D geometry was checked;
full browser layout, GPU rendering and audible playback were not verified here.

## Play

Each repair has a different circuit route: Haven runs top to bottom, the relay
bridges left to right, and Echo runs bottom to top. Follow the current INPUT,
OUTPUT and ASTRA hint rather than reusing a previous wire pattern.

- The opening plays once on entry: lander touchdown, rover recovery, relay and cadet preparation.
- Jointed character motion, surface dust and timed sound cues accompany the story.
- Skip goes straight to the briefing. Settings controls future openings and reduced motion.
- Read **Next action**. **Go to objective** follows a calculated terrain route.
- **WASD / arrow keys** move; **E** interacts; **Q** records a nearby survey.
- **Drag** with the mouse or one finger to look around; drag vertically to tilt.
- **Shift-drag**, middle-drag or **Pan terrain** moves the orbit camera across the surface.
- **Show objective** frames your destination; **Overview** shows you and the goal together.
- **Astronaut view / F** switches to visor-height first-person view. Drag to look; WASD follows your view.
- In astronaut view, **Show objective** turns your helmet toward the destination.
- Camera buttons work on touch screens. **Follow astronaut** returns to your position.
- Complete a practical task and choose **Continue**. Knowledge checks are optional.
- In equipment lessons, watch the demonstration, then operate the live controls.
- Settings includes music, effects, tutorial, labels, motion and camera reset.

## If something does not run

- **npm is not recognised**: install Node.js from https://nodejs.org/, then restart VS Code.
- **npm.ps1 cannot be loaded**: use the VS Code terminal dropdown to select
  **Command Prompt**, or use `npm.cmd` instead of `npm` on Windows.
- **Cannot find package.json**: open the extracted LUNA folder, not its parent.
- **Changes do not appear**: run `npm run build`, refresh, and ensure this browser tab
  is using localhost:3000 instead of the hosted Site or a previous offline copy.
- **Port 3000 is in use**: stop the old server with Ctrl+C. Or, in Windows Command
  Prompt, run `set PORT=3001` followed by `npm start`, then open localhost:3001.
- **3D world does not load**: use a browser with WebGL 2 and hardware acceleration enabled.

This project runs locally. The included NASA data packs do not need to be downloaded
again. `tools/acquire_data.py` is an optional data-acquisition utility, not a step
required to play. Authored training targets, hardware and scenarios are educational
game models; the provenance and limitations are explained in README.md and in-game.
