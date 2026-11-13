import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDestinationMission } from '../dist/worlds.js';
import { AstronomicalWorld } from '../dist/astronomy-world.js';
import { astraReply, astraContext } from '../dist/astra-chat.js';
import { askAstraAI, ASTRA_SYSTEM_PROMPT } from '../backend/astra-ai.mjs';
import { createLunaServer } from '../backend/server.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL('../dist/data/' + name + '.json', import.meta.url)));
const files = { terrain: 'terrain', config: 'mission', ephemerides: 'ephemerides', academy: 'academy', marsTerrain: 'terrain-mars', solar: 'solar-system', tranquillitatis: 'terrain-tranquillitatis', astronomy: 'astronomy', stars: 'stars', scenarios: 'scenarios' };
const pack = Object.fromEntries(Object.entries(files).map(([k, n]) => [k, read(n)]));
const storage = () => { const d = new Map(); return { getItem: k => d.get(k) ?? null, setItem: (k, v) => d.set(k, v) }; };
const mission = (world, mode) => { const m = createDestinationMission(pack, world, storage(), mode, new AstronomicalWorld(pack.astronomy, pack.stars)); m.start?.(); return m; };

test('ASTRA answers the messages from the bug report with something new, not the objective already on screen', () => {
  const m = mission('moon', 'expedition'), onScreen = m.astra('');
  const next = astraReply('hi, what should I do next', { mission: m });
  assert.match(next.text, /^(Hi!|Hello, astronaut!|Hey there!) Here’s your next step: /); assert.equal(next.topic, 'next');
  const you = astraReply('what happened to you', { mission: m });
  assert.equal(you.topic, 'story'); assert.match(you.text, /Nothing bad happened to me/); assert.notEqual(you.text, onScreen);
  assert.equal(astraReply('hi', { mission: m }).topic, 'greeting');
});

test('ASTRA is a supportive companion: feelings, small talk, jokes, controls and space facts', () => {
  const m = mission('moon', 'training');
  const cases = {
    'I am scared': 'feeling', 'i feel lonely out here': 'feeling', 'I\'m tired': 'feeling', 'this is too hard, I\'m stuck': 'encourage',
    'how are you?': 'smalltalk', 'who are you': 'identity', 'what can you do': 'help', 'thank you!': 'thanks', 'tell me a joke': 'joke',
    'how do I move?': 'controls', 'why is the sky black?': 'fact', 'what is the gravity here': 'fact', 'who is on the crew': 'crew', 'ok': 'ack'
  };
  for (const [q, topic] of Object.entries(cases)) assert.equal(astraReply(q, { mission: m }).topic, topic, q);
  assert.match(astraReply('I am scared', { mission: m }).text, /normal feeling/);
  assert.match(astraReply('why is the sky black?', { mission: mission('mars', 'training') }).text, /butterscotch/, 'Mars facts on Mars');
});

test('mission questions still use live mission numbers; unknown questions get an honest answer plus the next step', () => {
  const m = mission('moon', 'training');
  assert.match(astraReply('Is my return reserve safe?', { mission: m }).text, /Source: forecast from current state\./);
  assert.equal(astraReply('Is my return reserve safe?', { mission: m }).topic, 'mission');
  const unknown = astraReply('what is the capital of peru?', { mission: m });
  assert.equal(unknown.topic, 'unknown'); assert.match(unknown.text, /don’t have data on that/); assert.match(unknown.text, new RegExp(m.nextAction().title));
  const ctx = astraContext(m, null); assert.equal(ctx.world, 'moon'); assert.ok(ctx.next); assert.ok(Number.isFinite(ctx.oxygenMinutes));
});

test('optional AI helper: sends the question with mission context and a kid-safe persona, and returns the reply text', async () => {
  let sent = null;
  const fetcher = async (url, options) => { sent = { url, headers: options.headers, body: JSON.parse(options.body) }; return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'You’ve got this! Head to the bus first.' }] }) }; };
  const reply = await askAstraAI({ question: 'what now?', history: [{ role: 'assistant', content: 'hello' }, { role: 'user', content: 'hi' }, { role: 'assistant', content: 'Hi!' }], context: { next: 'Restore the bus.' } }, { env: { ANTHROPIC_API_KEY: 'test-key' }, fetcher });
  assert.equal(reply, 'You’ve got this! Head to the bus first.');
  assert.equal(sent.url, 'https://api.anthropic.com/v1/messages'); assert.equal(sent.headers['x-api-key'], 'test-key');
  assert.equal(sent.body.system, ASTRA_SYSTEM_PROMPT); assert.equal(sent.body.messages[0].role, 'user', 'turns start with the player');
  assert.match(sent.body.messages.at(-1).content, /Restore the bus\.[\s\S]*Player: what now\?/);
  for (let i = 1; i < sent.body.messages.length; i++) assert.notEqual(sent.body.messages[i].role, sent.body.messages[i - 1].role, 'turns alternate');
  await assert.rejects(askAstraAI({ question: 'x' }, { env: {} }), /not configured/);
});

test('server: /api/astra reports 503 without a key so the game uses built-in replies; health says whether AI is on', async t => {
  const saved = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'luna-astra-'));
  const instance = await createLunaServer({ dataDirectory: directory });
  const base = await new Promise(resolve => instance.server.listen(0, '127.0.0.1', () => resolve('http://127.0.0.1:' + instance.server.address().port)));
  t.after(() => { instance.server.close(); instance.server.closeAllConnections(); fs.rmSync(directory, { recursive: true, force: true }); if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved; });
  assert.equal((await (await fetch(base + '/api/health')).json()).astraAI, false);
  const r = await fetch(base + '/api/astra', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'hi' }) });
  assert.equal(r.status, 503);
});
