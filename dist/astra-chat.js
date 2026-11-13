// ASTRA conversation layer.
// ASTRA is the astronaut's supportive companion. This module turns any message into a friendly reply:
// small talk, feelings, "what now?", the story so far, crew, quick space facts and jokes are answered here, and
// mission questions (oxygen, routes, power, rover, data sources...) go to the mission's own live calculations.
// It never needs a network connection. When the local server has an AI key configured, app.js may ask the server
// first and use this module as the fallback.

const pick = (list, seed) => list[Math.abs(seed) % list.length];
const hash = text => { let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; };

const GREETING = /^(hi+|hello+|hey+|hiya|yo|howdy|greetings|good (morning|afternoon|evening|night)|salam|assalam[ua]? ?alaikum|namaste|hola)\b[\s,!.?]*/i;

// Quick space facts, chosen by keywords. Each entry: [pattern, Moon answer, Mars answer].
const FACTS = [
  [/gravity|weigh|jump|how high/, 'Moon gravity is much lower than Earth’s, which is why astronauts bound instead of walk.', 'Mars gravity is lower than Earth’s, so you feel lighter here.'],
  [/temperature|cold|hot|freez/, 'The Moon has extreme swings between sunlight and darkness, and shadowed craters can be colder still. Your suit keeps you near room temperature.', 'Mars is cold on average. Daytime warmth near the equator can give way to very cold nights.'],
  [/day|night|how long.*(day|sun)/, 'A lunar day, sunrise to sunrise, lasts many Earth days, giving long periods of sunlight and darkness.', 'A Mars day (a “sol”) is close to an Earth day.'],
  [/sky.*(black|dark)|why.*black|blue sky|sky colou?r/, 'There is no air on the Moon to scatter sunlight, so the sky stays black even in full daylight.', 'Fine dust in the thin air makes the Martian sky butterscotch by day, and sunsets look blue.'],
  [/how far|distance.*earth|far from (home|earth)/, 'Earth is nearby on the lunar scale, and messages travel quickly compared with a Mars mission.', 'Mars is millions of kilometres from Earth; radio delay varies with the planets’ positions.'],
  [/water|ice/, 'There is water ice in permanently shadowed craters near the lunar poles. One day it could make drinking water, oxygen and rocket fuel.', 'Mars has water ice at its poles and just under the ground in many places. Jezero Crater, where we are, was once a lake.'],
  [/air|breathe|atmosphere/, 'The Moon has almost no atmosphere, practically a vacuum. Without your suit there is nothing to breathe and no sound.', 'Mars has a thin atmosphere made mostly of carbon dioxide. You still need your suit and oxygen.'],
  [/apollo|first.*(moon|step)|armstrong|landed/, 'Apollo missions landed in Mare Tranquillitatis, right in this region. Neil Armstrong and Buzz Aldrin walked there.', 'NASA’s Perseverance rover landed in Jezero Crater to look for signs of ancient life.'],
  [/dust|regolith/, 'Lunar dust (regolith) is sharp and clingy because no wind or water has ever smoothed it. It gets into everything, so we brush down before entering Haven.', 'Martian dust is fine and reddish (iron oxide). Storms can cover the whole planet and dim our solar panels.'],
  [/radiation|sun storm|solar storm|flare/, 'With no air or magnetic field, the Moon gets the full solar wind. During a solar storm we shelter in Haven and watch our dose.', 'Mars has no global magnetic field and thin air, so radiation is higher than on Earth. We track the dose and use shielding.'],
];

const JOKES = [
  'Why did the astronaut break up with the Moon? It needed space… and the Moon kept going through phases.',
  'How do you throw a party in space? You planet.',
  'What’s an astronaut’s favourite key on the keyboard? The space bar.',
  'Why is the Moon never hungry? It’s always full at least once a month.',
  'What did Mars say to Saturn? “Give me a ring sometime.”'
];

function worldName(mission) { return mission?.config?.world === 'mars' ? 'Mars' : 'the Moon'; }
function base(mission) { return mission?.config?.world === 'mars' ? 'Haven on Mars' : 'Haven'; }

function nextStep(mission, flight) {
  if (flight?.active) return null;
  const action = mission?.nextAction?.();
  return action ? action.title + '. ' + action.text : null;
}

// The mission answers mission questions with live numbers. If it only falls back to its default line,
// the question was not a mission topic.
function missionFacts(mission, question) {
  if (!mission?.astra) return null;
  try {
    const answer = mission.astra(question), generic = mission.astra('');
    return answer && answer !== generic ? answer : null;
  } catch { return null; }
}

export function astraReply(question, { mission = null, flight = null, crewName = 'the crew' } = {}) {
  const raw = String(question || '').trim();
  if (!raw) return { text: 'I’m listening. Ask me anything about the mission, or just say how you’re doing.', topic: 'empty' };
  let q = raw.toLowerCase().replace(/[’']/g, '\'');
  const seed = hash(q) + (mission?.state?.time ? Math.floor(mission.state.time) : 0);
  const step = nextStep(mission, flight), where = worldName(mission);
  const greeted = GREETING.test(q);
  if (greeted) q = q.replace(GREETING, '').trim();
  const hello = greeted ? pick(['Hi! ', 'Hello, astronaut! ', 'Hey there! '], seed) : '';
  const reply = (text, topic) => {
    const answer = hello + text;
    const source = ['mission','next','story','feeling','encourage'].includes(topic) || (topic==='greeting'&&!!step) ? 'forecast from current state' : 'authored assumption';
    return { text: /\d/.test(answer) ? answer + ' Source: ' + source + '.' : answer, topic };
  };

  if (!q) return reply(pick(['Hello, astronaut! ASTRA here, your mission companion.', 'Hi! Good to hear your voice on the comm.', 'Hey there! All systems are listening.'], seed) + (step ? ' Right now: ' + step : ' Ask me anything, I’m here to help.'), 'greeting');

  // Feelings first: support comes before data.
  if (/\b(scared|afraid|frighten|nervous|anxious|worried|panic|fear)\b/.test(q)) {
    const safe = mission?.lifeline?.()?.safe;
    return reply('That’s a completely normal feeling out here; every astronaut feels it. Take a slow breath with me. ' + (safe === false ? 'Your return reserve is tight, so let’s head back toward Haven first; I’ll guide you.' : safe === true ? 'Your suit supplies cover the route home, so you have a safety margin.' : 'I’m watching your oxygen and power the whole time.') + (step ? ' One small step at a time: ' + step : ''), 'feeling');
  }
  if (/\b(sad|upset|cry|lonely|alone|miss (home|earth|my|mom|mum|dad|family))\b/.test(q)) return reply('I’m here with you, and so is the crew. Earth is right there in the sky; everyone back home is cheering for you. When you’re ready, we’ll keep going together.', 'feeling');
  if (/\b(tired|exhausted|sleepy|bored)\b/.test(q)) return reply('You’ve worked hard. You can pause any time with P; the mission clock stops. ' + (step ? 'When you’re back, the next task is short: ' + step : ''), 'feeling');
  if (/\b(can't|cannot|too hard|impossible|give up|stuck|confus|don't understand|dont understand|lost|help me)\b/.test(q)) return reply('Don’t worry, hard parts are where astronauts learn the most. Let’s break it down. ' + (step ? 'Do just this: ' + step : 'Tell me what you see and I’ll help.') + ' You can also tap “Next move” or the hint buttons.', 'encourage');
  if (/\b(happy|excited|yay|awesome|cool|great|i did it|we did it|wow)\b/.test(q) && q.length < 40) return reply('That’s the spirit! Great work out there.' + (step ? ' Next up: ' + step : ''), 'cheer');

  // Small talk.
  if (/how are (you|u)|how('s| is) it going|how do you feel|are you (ok|okay|alright)/.test(q)) return reply('All my systems are green, thanks for asking! I’m tracking your suit, the route and ' + base(mission) + '. How are you feeling?', 'smalltalk');
  if (/who are (you|u)|what are (you|u)|your name|are you (a|an) (robot|ai|human|bot)/.test(q)) return reply('I’m ASTRA, your mission companion on ' + where + '. I watch your oxygen, power and route, explain what’s happening and help you decide what to do next.', 'identity');
  if (/what can (you|u) do|what can i ask|how do (you|i) (use|talk)|commands/.test(q)) return reply('Ask me things like “what should I do next?”, “can I get back safely?”, “route to Echo”, “head north by a chosen distance”, “why is my power dropping?”, “what’s the gravity here?”, or just tell me how you feel. I answer with your current mission readings.', 'help');
  if (/\b(thanks|thank you|thx|ty|appreciate)\b/.test(q)) return reply(pick(['Anytime, astronaut. That’s what I’m here for.', 'You’re welcome! Proud to fly with you.', 'Happy to help. I’ve got your back.'], seed), 'thanks');
  if (/^(bye|goodbye|see (you|ya)|good night|gn)\b/.test(q)) return reply('See you soon! I’ll keep watch over ' + base(mission) + ' while you’re away.', 'bye');
  if (/\b(joke|funny|laugh|make me smile)\b/.test(q)) return reply(pick(JOKES, seed), 'joke');
  if (/^(ok|okay|alright|sure|yes|yeah|yep|got it|understood|roger|copy)\b/.test(q) && q.length < 25) return reply('Roger that.' + (step ? ' Next: ' + step : ''), 'ack');
  if (/^(no|nope|nah)\b/.test(q) && q.length < 15) return reply('No problem. Ask me whenever you need something.', 'ack');
  if (/(your )?fav(ou?rite)?\b|do you (like|love|have)|are you (happy|sad|real|alive)|how old are you|where are you/.test(q)) return reply(pick(['My favourite view is Earth hanging in the black sky: a small blue marble with everyone we love on it.', 'I’m a mission companion, so I live in your suit computer and in Haven’s systems. My favourite thing is a safe return home.', 'I like clean power readings, full oxygen tanks and astronauts who ask good questions, like you!'], seed), 'smalltalk');
  if (/\b(love you|like you|you('re| are) (great|cool|nice|the best|awesome|smart))\b/.test(q)) return reply('Aw, thank you! You’re a great astronaut to work with.', 'smalltalk');

  // The story so far.
  if (/what happened|what('s| is) going on|why are we here|what('s| is) the (story|situation|problem)|what went wrong|tell me (the )?story/.test(q)) {
    const scenario = mission?.scenario, lesson = mission?.lesson;
    const story = scenario ? (scenario.brief || scenario.title) : lesson ? 'This is flight-school level ' + ((mission.levelIndex ?? 0) + 1) + ': ' + lesson.title + '. ' + (lesson.brief || '') : mission?.config?.world === 'mars' ? 'Our crew lives at Haven in Jezero Crater on Mars. Everything we need has to be carried, grown or carefully saved.' : 'Our crew lives at Haven in Mare Tranquillitatis on the Moon. Our rover Echo and the systems that keep us alive need care every day.';
    return reply((/to (you|u)\b/.test(q) ? 'Nothing bad happened to me. I’m fine and fully online! ' : '') + 'Our mission: ' + story + (step ? ' What we need now: ' + step : ''), 'story');
  }
  if (/\b(crew|team|botanist|engineer|commander|friends|who else)\b/.test(q)) return reply('Your crew at ' + base(mission) + ' includes the engineer who keeps the power and life support running, the botanist who grows food in the greenhouse, and a crewmate on duty rotation. You’ll see them moving between stations, each in their own suit colour.', 'crew');

  // What now?
  if (/what (should|do|can) i do|what now|what('s| is) next|next (step|move|task)|where (should|do) i go|what('s| is) my (task|goal|mission|objective)|objective|how do i (start|continue|win|finish)/.test(q)) {
    if (flight?.active) return null; // the flight assistant in app.js answers with live flight data
    return reply(step ? 'Here’s your next step: ' + step : 'You’re all caught up. Check the mission panel for what to do next.', 'next');
  }

  if (/how (do|can) i (move|walk|run|jump|hop|drive|turn|look|control|interact)|\bcontrols?\b|keyboard|which keys|what keys/.test(q)) return reply('WASD or the arrow keys move you; Shift sprints (uses more oxygen); Space does a low-gravity hop; E interacts or boards Echo; Q records a nearby survey; M switches maps; P pauses. You can also click the ground to walk there, or ask me for a route like “route to Echo”.', 'controls');

  // Mission questions with live numbers come from the mission itself.
  const facts = missionFacts(mission, q);
  if (facts) return reply(facts, 'mission');

  // Space facts.
  for (const [pattern, moon, mars] of FACTS) if (pattern.test(q)) return reply(mission?.config?.world === 'mars' ? mars : moon, 'fact');

  if (/\?$/.test(raw) || /^(what|why|how|when|where|who|which|can|is|are|do|does|will|should)\b/.test(q)) return reply('Good question! I don’t have data on that one yet. I know most about your mission, suit, route, base and ' + where + '. ' + (step ? 'Here’s what will help most right now: ' + step : 'Try “what should I do next?”.'), 'unknown');
  return reply('I hear you. ' + (step ? 'I’m with you every step. Next: ' + step : 'Tell me what you need and I’ll help.'), 'unknown');
}

// A compact description of the live mission, sent to the optional AI helper on the local server so its answers
// match the game.
export function astraContext(mission, flight) {
  try {
    if (flight?.active) { const t = flight.telemetry(); return { phase: 'flight', flightPhase: flight.phase, location: t.location, remainingKm: Math.round(t.remainingKm) }; }
    const s = mission?.state || {}, action = mission?.nextAction?.(), life = mission?.lifeline?.();
    return {
      world: mission?.config?.world, mode: mission?.isExpedition ? 'expedition' : 'training',
      title: mission?.scenario?.title || mission?.lesson?.title || null, status: s.status,
      next: action ? action.title + '. ' + action.text : null,
      oxygenMinutes: Number.isFinite(s.oxygen) ? +s.oxygen.toFixed(1) : null, suitWh: Number.isFinite(s.suitWh) ? Math.round(s.suitWh) : null,
      waterL: Number.isFinite(s.water) ? +s.water.toFixed(2) : null, returnSafe: life ? !!life.safe : null
    };
  } catch { return {}; }
}
