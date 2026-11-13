# Playing LUNA: your first expedition

1. **Watch the opening.** Choose Begin story with music, or Watch without music. The opening has no voice-over: each chapter's caption stays on screen long enough to read. Skip goes to destination selection. Settings → Replay opening lets you watch again without resetting surface progress.
2. **Choose your world.** Moon uses Mare Tranquillitatis; Mars uses Jezero. Keep Guided outpost mission selected for seven linked stages. Flight school is the separate ten-lesson course.
3. **Board Odyssey.** Watch your astronaut enter the spacecraft. Drag to look around. Press the visible launch switch, the Launch button, or E when the cockpit is ready.
4. **Fly to your destination.** At the transfer fault, isolate the nonessential circuit or spend backup fuel. Skipping travel still leads to the landing exercise.
5. **Land.** Lock descent speed in the green 1–3 m/s band, then lock tilt within −5° to +5°. Use Space or Lock. For steadier controls, expand Steady landing controls, move each slider and then lock it. Unsafe settings command a go-around. After touchdown, click Disembark; landing does not automatically start surface play.
6. **Start the outpost mission.** Read ASTRA's objective, then choose I understand. The reading step pauses mission time. Go to objective plots a route; WASD or arrows let you steer. Follow the gold marker. Travel consumes suit resources.
7. **Operate the equipment.** Press E or the task button when nearby. Turn circuit tiles 45° per click (right-click turns back; diagonal wires link to diagonal neighbours) until INPUT reaches OUTPUT, then Apply repair. You have 45 seconds; when time runs out you may buy 15 more seconds for 3% oxygen, at most twice, after which the level restarts. Boards grow from 3×3 to 5×5 as you progress. Airlock actions must happen in order: check suit, close inner hatch, vent, open outer hatch. Samples require scan, collect, tag and seal. Opening a panel or arriving at a marker does not complete a procedure.
8. **Compare and decide.** After the procedure, review the plan cards. Click Review this plan, inspect before/after values and suit reserves, then Confirm. No time or resources are spent by previewing. A confirmation applies the work and its time cost once.
9. **Read the consequence.** The result panel explains the actual change and the next objective. Continue when ready. Follow this loop through all seven stages. Finishing needs a working relay, enough science, a sound habitat and a four-hour resupply margin.
10. **Review or retry.** The debrief lists your decisions. Retry checkpoint returns to the last saved decision stage. Restart mission starts again. Flight → choose the other destination begins another expedition.

## Three main readings

- **Power:** stored habitat battery energy. A negative supply balance drains it.
- **Oxygen:** hours of supply for all four crew. This is separate from your suit's oxygen minutes.
- **Crew condition:** a simplified 0–100 teaching indicator, not medical advice or a real astronaut health score.

Expand Advanced habitat instruments for water, food, fatigue, kits, fuel and illustrative radiation. Your suit readings and Lifeline describe your ability to return from an EVA, not the entire habitat inventory.

## The greenhouse

Inspect greenhouse shows actual light allocation, crop progress, harvests, food and water. Walk to the greenhouse brings you beside the visible dome. A botanist and two other coworkers rotate between stations; you are the fourth crew member. Their inspection animation never completes your tasks or spends extra resources.

Growing costs electricity now and extra water at higher light settings. Food appears when a crop cycle completes. Change food-power allocation through the operating plans. Crop cycles are deliberately accelerated for this lesson; real plants do not grow in a few game hours.

## Ask Earth

Expand Earth communication and choose Ask Earth. A message uses 0.15 kWh, once per stage. A reply requires a round trip at light speed using the cached Earth/site positions. Close reading panels and return to play for mission time to advance. Moon replies are quick; Mars replies can arrive after you have already made a decision. Old advice reflects the time you asked. ASTRA runs locally and answers immediately.

## Controls and accessibility

| Control | Action |
| --- | --- |
| WASD / arrows / touch direction buttons | Move; manual steering takes over a plotted route |
| E | Interact, board or leave Echo when prompted |
| Q | Survey / scan when available |
| F | First-person or third-person view |
| Drag | Look around through 360 degrees |
| Shift-drag / Pan terrain | Move the third-person camera |
| Go to objective | Plot a traversable route |
| Show objective / Follow astronaut | Reframe the camera |
| Tutorial on/off | Hide or resume current guidance without resetting progress |
| Settings | Music, effects, volume, graphics and reduced motion |
| ASTRA | Movable local assistant, questions and route previews |

Reading dialogs, ASTRA, repair puzzles, tutorial objective cards and astronomy exploration pause surface mission time. Backgrounding pauses audio and the mission; resume the mission with its pause/play control after returning if needed. Flight clocks also pause when a dialog is open or the tab is hidden.

The game has no spoken narration. ASTRA, the tutorial and mission guidance appear as on-screen text. Music and sound effects have separate switches; turn music down if you prefer a quieter lesson.

In Flight school, complete the practical task to earn the badge and unlock the next lesson. The review question is optional. These ten lessons cover movement, circuits, outpost power, recovery, science, shelter, solar alignment, airlocks, samples, communications and logistics across the existing course structure; consult the in-game lesson list for the exact ten-level order.

**Mission recap quiz.** After every completed flight-school level, answer at least 2 of 4 recap questions correctly to earn the badge and unlock the next level. A wrong answer shows a hint and gives one more try (options are reshuffled). If you score under 2, take a new quiz.

**ASTRA chat.** Open ASTRA and type anything: greetings, how you feel, “what should I do next?”, mission questions (oxygen, risk, power, routes like “route to Echo”), space facts or even a joke. ASTRA replies in the chat with your live mission numbers and works offline. Optional: put an Anthropic API key in `.env` as `ANTHROPIC_API_KEY=...` and restart `npm.cmd start` to let ASTRA hold free-form conversations; without it, the built-in replies are used.
