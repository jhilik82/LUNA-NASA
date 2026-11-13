// Mission recap quiz: four questions on the gist of the mission the player just finished.
// Questions are built from what actually happened in this run (the lesson or expedition, where it took place,
// the decisions the player made, the journal and how they managed oxygen), so every run gets its own recap.
// Every question carries a hint, shown after a wrong first try. Options are shuffled with a fresh seed every
// time the quiz is built, and the correct answer is spread over different positions.

export const RECAP_QUESTIONS = 4;
export const RECAP_PASS_MARK = 2;     // correct answers needed to continue
export const RECAP_TRIES = 2;         // tries per question

const SITES = { moon: 'Mare Tranquillitatis on the Moon', mars: 'Jezero Crater on Mars' };
const GRAVITY = { moon: '1.62 m/s² (about one-sixth of Earth’s)', mars: '3.73 m/s² (about three-eighths of Earth’s)' };
const OXYGEN_BANDS = [[90, 'More than 90%'], [70, 'Between 70% and 90%'], [50, 'Between 50% and 70%'], [-1, 'Less than 50%']];

function rng(seed) { let a = (Math.abs(Math.floor(seed)) || 1) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(list, random) { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const unique = list => [...new Set(list.filter(Boolean))];

function question(id, prompt, correct, wrong, explain, hint, random) {
  const options = shuffle(unique([correct, ...wrong.filter(w => w !== correct)]).slice(0, 4), random);
  return { id, prompt, options, answer: options.indexOf(correct), explain, hint };
}

// New order for a question's options (used before a second try); keeps the answer index correct.
export function reshuffleQuestion(q, random = Math.random) {
  const correct = q.options[q.answer], options = shuffle(q.options, random);
  return { ...q, options, answer: options.indexOf(correct) };
}

function oxygenQuestion(percent, random) {
  const band = OXYGEN_BANDS.find(([min]) => percent > min)[1];
  return question('oxygen', 'How much suit oxygen did you have left at the end?', band, OXYGEN_BANDS.map(b => b[1]).filter(b => b !== band),
    'You finished with ' + Math.max(0, percent).toFixed(0) + '% of your suit oxygen. Every route, sprint and repair extension spends it.',
    'Look at OXYGEN RETURNED in the mission numbers at the top of this debrief.', random);
}

export function buildRecapQuiz(mission, debrief, { seed = Math.floor(Math.random() * 2 ** 31), scenarios = null } = {}) {
  const random = rng(seed), world = mission.config?.world === 'mars' ? 'mars' : 'moon', other = world === 'mars' ? 'moon' : 'mars';
  const questions = [];

  if (mission.isExpedition && mission.scenario) {
    const scenario = mission.scenario, stages = scenario.stages || [], others = scenarios?.[other];
    questions.push(question('goal', 'What was this expedition mainly about?', scenario.skill,
      [others?.skill || 'Dust response, life support and surface science', 'Building a launch pad for a return rocket', 'Mapping the far side from orbit'],
      scenario.brief, 'Think back to the expedition briefing: ' + String(scenario.brief || '').split('.')[0] + '.', random));
    const decisions = debrief.decisions || [];
    const picks = decisions.length > 2 ? [decisions[0], decisions[Math.floor(decisions.length / 2)]] : decisions;
    for (const [i, d] of picks.entries()) {
      const stage = stages.find(s => s.id === d.stage), chosen = stage?.options?.find(o => o.id === d.choice);
      const alternatives = (stage?.options || []).map(o => o.label).filter(l => l !== d.label);
      if (alternatives.length) questions.push(question('decision-' + i, 'At “' + d.title + '”, which plan did you choose?', d.label, alternatives,
        chosen?.explanation || 'This was your call; the debrief journal shows how it changed the outpost.',
        'Your decisions are listed, in order, in the log at the bottom of this debrief.', random));
    }
  } else if (mission.lesson) {
    const lesson = mission.lesson, levels = mission.academy?.levels || [];
    const skills = shuffle(levels.filter(l => l.id !== lesson.id), random).slice(0, 3).map(l => l.skill);
    questions.push(question('skill', 'What was this mission mainly about?', lesson.skill, skills, lesson.explanation || lesson.brief,
      'The badge you are earning here is “' + lesson.badge + '”.', random));
  }

  questions.push(question('site', 'Where did this mission take place?', SITES[world], [SITES[other], 'The Earth launch site', 'Low Earth orbit'],
    world === 'moon' ? 'Mare Tranquillitatis is a dark basalt plain on the Moon’s near side, where Apollo 11 landed in 1969.' : 'Jezero is an ancient Martian lake crater, the landing site of NASA’s Perseverance rover.',
    world === 'moon' ? 'You walked in a vacuum under a black sky, with Earth hanging overhead.' : 'The sky was butterscotch and the dust was red.', random));

  const happened = (debrief.journal || []).filter(e => !['briefing', 'launch'].includes(e.type)).map(e => e.message);
  if (happened.length) {
    const pool = ['Echo’s power bus repaired.', 'Surface relay restored.', 'A basalt sample was dropped and lost.', 'The habitat was evacuated to orbit.', 'The rover was abandoned at the crater rim.', 'A second lander delivered extra oxygen.'];
    const fact = happened[Math.floor(random() * happened.length)];
    questions.push(question('event', 'Which of these happened during your mission?', fact, pool.filter(p => !happened.includes(p)).slice(0, 3),
      'From your mission journal: “' + fact + '”', 'Everything that happened is written in the mission journal at the bottom of this debrief.', random));
  }

  const percent = debrief.oxygenPercent;
  if (Number.isFinite(percent)) questions.push(oxygenQuestion(percent, random));

  // Always four questions: top up with facts about the world the player just explored.
  if (questions.length < RECAP_QUESTIONS) questions.push(question('gravity', 'What was the surface gravity where you worked?', GRAVITY[world],
    [GRAVITY[other], '9.81 m/s² (the same as Earth’s)', '0 m/s² (no gravity at all)'],
    'Gravity on ' + (world === 'moon' ? 'the Moon' : 'Mars') + ' is ' + GRAVITY[world] + ', which is why every step is a long, slow bound.',
    'The location card on the mission panel shows “g” for the world you are on.', random));
  if (questions.length < RECAP_QUESTIONS) questions.push(question('lifeline', 'What does the Lifeline card tell you?', 'Whether you can still get back to base with your reserves',
    ['How many survey points are left', 'The weather forecast for tomorrow', 'Which crew member is on duty'],
    'The Lifeline compares the return route with your oxygen, energy and water, so you know when to turn back.',
    'It is the card with the heartbeat line, under your reserves.', random));

  const picked = questions.slice(0, RECAP_QUESTIONS);
  // Spread the correct answers: no two questions in a row with the answer in the same position.
  for (let i = 1; i < picked.length; i++) for (let k = 0; k < 6 && picked[i].answer === picked[i - 1].answer; k++) picked[i] = reshuffleQuestion(picked[i], random);
  return { title: debrief.success ? 'Mission recap' : 'What happened on this attempt?', questions: picked, passMark: RECAP_PASS_MARK, tries: RECAP_TRIES };
}

export function scoreRecap(quiz, answers) {
  return quiz.questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
}
