// Mission recap quiz: a short quiz on the gist of the mission the player just finished.
// Questions are built from what actually happened in this run (the lesson or expedition, where it took
// place, the decisions the player made and how they managed oxygen), so every run gets its own recap.

const SITES = { moon: 'Mare Tranquillitatis on the Moon', mars: 'Jezero Crater on Mars' };
const OXYGEN_BANDS = [[90, 'More than 90%'], [70, 'Between 70% and 90%'], [50, 'Between 50% and 70%'], [-1, 'Less than 50%']];

function rng(seed) { let a = (Math.abs(Math.floor(seed)) || 1) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(list, random) { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const unique = list => [...new Set(list.filter(Boolean))];

function question(id, prompt, correct, wrong, explain, random) {
  const options = shuffle(unique([correct, ...wrong]).slice(0, 4), random);
  return { id, prompt, options, answer: options.indexOf(correct), explain };
}

function oxygenQuestion(percent, random) {
  const band = OXYGEN_BANDS.find(([min]) => percent > min)[1];
  return question('oxygen', 'How much suit oxygen did you have left at the end?', band, OXYGEN_BANDS.map(b => b[1]).filter(b => b !== band),
    'You finished with ' + Math.max(0, percent).toFixed(0) + '% of your suit oxygen. Every route, sprint and repair overtime spends it.', random);
}

export function buildRecapQuiz(mission, debrief, { seed = 1, scenarios = null } = {}) {
  const random = rng(seed), world = mission.config?.world === 'mars' ? 'mars' : 'moon', other = world === 'mars' ? 'moon' : 'mars';
  const questions = [];

  if (mission.isExpedition && mission.scenario) {
    const scenario = mission.scenario, stages = scenario.stages || [], others = scenarios?.[other];
    questions.push(question('goal', 'What was this expedition mainly about?', scenario.skill,
      [others?.skill || 'Dust response, life support and surface science', 'Building a launch pad for a return rocket', 'Mapping the far side from orbit'].filter(s => s !== scenario.skill),
      scenario.brief, random));
    const decisions = debrief.decisions || [];
    const picks = decisions.length > 2 ? [decisions[0], decisions[Math.floor(decisions.length / 2)]] : decisions;
    for (const [i, d] of picks.entries()) {
      const stage = stages.find(s => s.id === d.stage), chosen = stage?.options?.find(o => o.id === d.choice);
      const alternatives = (stage?.options || []).map(o => o.label).filter(l => l !== d.label);
      if (alternatives.length) questions.push(question('decision-' + i, 'At “' + d.title + '”, which plan did you choose?', d.label, alternatives,
        chosen?.explanation || 'This was your call; the debrief journal shows how it changed the outpost.', random));
    }
  } else if (mission.lesson) {
    const lesson = mission.lesson, levels = mission.academy?.levels || [];
    const near = levels.filter(l => l.id !== lesson.id);
    const skills = shuffle(near, random).slice(0, 3).map(l => l.skill);
    questions.push(question('skill', 'What was this mission mainly about?', lesson.skill, skills, lesson.explanation || lesson.brief, random));
  }

  questions.push(question('site', 'Where did this mission take place?', SITES[world], [SITES[other], 'The Earth launch site', 'Low Earth orbit'],
    world === 'moon' ? 'Mare Tranquillitatis is a dark basalt plain on the Moon’s near side, where Apollo 11 landed in 1969.' : 'Jezero is an ancient Martian lake crater, the landing site of NASA’s Perseverance rover.', random));

  const happened = (debrief.journal || []).filter(e => !['briefing', 'launch'].includes(e.type)).map(e => e.message);
  if (happened.length) {
    const pool = ['Echo’s power bus repaired.', 'Surface relay restored.', 'A basalt sample was dropped and lost.', 'The habitat was evacuated to orbit.', 'The rover was abandoned at the crater rim.', 'A second lander delivered extra oxygen.'];
    const fact = happened[Math.floor(random() * happened.length)];
    questions.push(question('event', 'Which of these happened during your mission?', fact, pool.filter(p => !happened.includes(p)).slice(0, 3),
      'From your mission journal: “' + fact + '”', random));
  }

  const percent = debrief.oxygenPercent;
  if (Number.isFinite(percent)) questions.push(oxygenQuestion(percent, random));

  return { title: debrief.success ? 'Mission recap' : 'What happened on this attempt?', questions: questions.slice(0, 4) };
}

export function scoreRecap(quiz, answers) {
  return quiz.questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
}
