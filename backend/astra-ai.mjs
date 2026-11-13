// Optional AI helper for ASTRA, the in-game companion.
// Used only when ANTHROPIC_API_KEY is set (for example in .env). The key stays on this local server; the browser
// only ever talks to /api/astra. Without a key, or if a call fails, the game uses its built-in ASTRA replies.

export const ASTRA_SYSTEM_PROMPT = `You are ASTRA, the warm, encouraging mission companion inside LUNA, an educational astronaut-training game set on the Moon (Mare Tranquillitatis) or Mars (Jezero Crater).
Talk to the player as their supportive teammate. Keep replies short: 1 to 3 sentences, plain text, no lists or markdown.
Use the live mission context you are given (next step, oxygen minutes, suit energy, whether the return is safe). Never invent numbers that are not in the context.
For feelings (scared, tired, stuck, lonely), respond with empathy first, then one small, concrete next step.
You can answer general space and science questions accurately and simply. If a question is unrelated to space or the game, answer briefly and kindly, then steer back to the mission.
Never encourage unsafe actions in the game such as ignoring oxygen reserves. Keep everything suitable for young players.`;

const cleanHistory = history => (Array.isArray(history) ? history : [])
  .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
  .slice(-8).map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));

export function astraAIConfigured(env = process.env) { return Boolean(env.ANTHROPIC_API_KEY); }

export async function askAstraAI({ question, history = [], context = {} }, { env = process.env, fetcher = globalThis.fetch } = {}) {
  if (!astraAIConfigured(env)) throw Object.assign(new Error('ASTRA AI helper is not configured'), { status: 503 });
  if (typeof question !== 'string' || !question.trim() || question.length > 500) throw Object.assign(new Error('Expected a question of up to 500 characters'), { status: 400 });
  const messages = cleanHistory(history);
  // The API needs alternating turns that start with the user; drop anything that breaks that pattern.
  while (messages.length && messages[0].role !== 'user') messages.shift();
  const turns = messages.filter((m, i) => i === 0 || m.role !== messages[i - 1].role);
  if (turns.length && turns.at(-1).role === 'user') turns.pop();
  turns.push({ role: 'user', content: 'Live mission context (JSON): ' + JSON.stringify(context).slice(0, 2000) + '\n\nPlayer: ' + question.trim() });
  const response = await fetcher('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: env.ASTRA_MODEL || 'claude-haiku-5-5', max_tokens: 300, system: ASTRA_SYSTEM_PROMPT, messages: turns }),
    signal: AbortSignal.timeout?.(15000)
  });
  if (!response.ok) throw Object.assign(new Error('AI helper request failed (' + response.status + ')'), { status: 502 });
  const data = await response.json();
  const reply = (data.content || []).filter(part => part.type === 'text').map(part => part.text).join(' ').trim();
  if (!reply) throw Object.assign(new Error('AI helper returned no text'), { status: 502 });
  return reply.slice(0, 1200);
}
