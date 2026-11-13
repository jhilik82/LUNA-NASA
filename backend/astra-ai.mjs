import { astraReply } from '../dist/astra-chat.js';

const DEFAULT_MODEL = process.env.ASTRA_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
const DEFAULT_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

export function astraAIConfigured() {
  return Boolean(
    process.env.OPENAI_API_KEY ||
    process.env.ASTRA_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OLLAMA_BASE_URL ||
    process.env.ASTRA_MODEL ||
    process.env.OPENAI_MODEL
  );
}

function fallbackReply(question = '', history = [], context = {}) {
  const q = String(question || '').trim();
  const world = context?.world === 'mars' ? 'Mars' : 'the Moon';
  const next = context?.next ? `Current mission note: ${context.next}.` : 'Your current mission state is being tracked locally.';
  const reply = astraReply(q || 'hello', { mission: null, flight: null });
  return typeof reply?.text === 'string' && reply.text.trim() ? reply.text : `ASTRA is monitoring ${world}. ${next} Ask about the route, oxygen, power, crew status, or the next task.`;
}

async function callOpenAI(question, history = [], context = {}) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ASTRA_API_KEY;
  if (!apiKey) throw Object.assign(new Error('No OpenAI-compatible API key configured'), { status: 503 });

  const response = await fetch(`${DEFAULT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: `You are ASTRA, the mission companion for a Moon/Mars outpost game. Keep replies concise, supportive, and grounded in the mission state. In this game, the user is not asking for real-world safety advice; they are playing a simulation. Refer to the world in the provided context. If the state is missing, answer generally.`
        },
        ...history.map(entry => ({
          role: entry?.role === 'assistant' ? 'assistant' : 'user',
          content: String(entry?.content || '')
        })),
        {
          role: 'user',
          content: `Question: ${String(question || '')}\nContext: ${JSON.stringify(context)}`
        }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw Object.assign(new Error(`AI request failed (${response.status}): ${message.slice(0, 200)}`), { status: response.status >= 500 ? 502 : response.status });
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw Object.assign(new Error('OpenAI reply was empty'), { status: 502 });
  return reply;
}

async function callOllama(question, history = [], context = {}) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.1';

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: 'You are ASTRA, a friendly mission companion for the LUNA game.' },
        ...history.map(entry => ({ role: entry?.role === 'assistant' ? 'assistant' : 'user', content: String(entry?.content || '') })),
        { role: 'user', content: `Question: ${String(question || '')}\nContext: ${JSON.stringify(context)}` }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw Object.assign(new Error(`Ollama request failed (${response.status}): ${message.slice(0, 200)}`), { status: 502 });
  }

  const data = await response.json();
  const reply = data?.message?.content?.trim();
  if (!reply) throw Object.assign(new Error('Ollama reply was empty'), { status: 502 });
  return reply;
}

export async function askAstraAI(input = {}) {
  const question = String(input?.question || '');
  const history = Array.isArray(input?.history) ? input.history : [];
  const context = input?.context && typeof input.context === 'object' ? input.context : {};

  try {
    if (process.env.OPENAI_API_KEY || process.env.ASTRA_API_KEY) return await callOpenAI(question, history, context);
    if (process.env.OLLAMA_BASE_URL) return await callOllama(question, history, context);
    return fallbackReply(question, history, context);
  } catch (error) {
    if (error?.status === 503) throw error;
    return fallbackReply(question, history, context);
  }
}
