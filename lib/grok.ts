/**
 * xAI Grok API client (OpenAI-compatible endpoint).
 * Replace ALL Claude/Anthropic calls with Grok.
 * Base URL: https://api.x.ai/v1
 */

const GROK_BASE = 'https://api.x.ai/v1';
const GROK_MODEL = 'grok-beta'; // or grok-beta per xAI docs

export async function callGrok(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { max_tokens?: number; temperature?: number }
): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    console.warn('XAI_API_KEY not set');
    return 'I couldn’t connect to the AI. Please add XAI_API_KEY in .env.local and try again.';
  }
  const res = await fetch(`${GROK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages,
      max_tokens: options?.max_tokens ?? 500,
      temperature: options?.temperature ?? 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Grok API error details:', { status: res.status, body: err, key: key ? 'SET' : 'MISSING' });
    return 'Sorry, the AI service is temporarily unavailable. Try again in a moment.';
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  return content.trim();
}

export interface ScenarioInput {
  module: string;
  playerState: { gold: number; level: number; avatar?: string };
}

export interface GeneratedScenario {
  situation: string;
  choices: string[];
  costs: number[];
  outcomes: Array<{ debt?: number; skill?: string; xp?: number; gold?: number }>;
}

export async function generateScenario(input: ScenarioInput): Promise<GeneratedScenario> {
  const prompt = `
Generate a JSON financial dilemma for an Indian college student in FinQuest module: ${input.module}.
Player state: ${JSON.stringify(input.playerState)}

Respond with ONLY valid JSON in this exact format (no markdown, no code block):
{
  "situation": "Roommate skipped ₹10k PG rent UPI payment...",
  "choices": ["Pay full ₹10k", "Negotiate NoBroker split", "Find subletter"],
  "costs": [10000, 4500, 3000],
  "outcomes": [{"debt": 10000, "skill": "none"}, {"xp": 50, "gold": 100}, {"xp": 100, "gold": 300}]
}

Indian context: PG rents ₹8–12k Pune, UPI, chai ₹20, student discounts, NoBroker.
Exactly 3 choices and 3 outcomes. costs and outcomes must be arrays of 3.
`.trim();

  const raw = await callGrok(
    [{ role: 'user', content: prompt }],
    { max_tokens: 450, temperature: 0.7 }
  );
  try {
    const cleaned = raw.replace(/```json?\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleaned) as GeneratedScenario;
    if (!parsed.situation || !Array.isArray(parsed.choices) || !Array.isArray(parsed.costs) || !Array.isArray(parsed.outcomes)) {
      throw new Error('Invalid shape');
    }
    return parsed;
  } catch {
    return {
      situation: 'Your roommate says they’ll pay their share of the ₹10,000 PG rent next week via UPI. What do you do?',
      choices: [
        'Agree to split ₹6k/₹4k + Spotify — you pay ₹4,075/month',
        'Equal split ₹5k each. Decline Spotify.',
        'Equal split after using NoBroker discount — ~₹4,500 each',
      ],
      costs: [4075, 5000, 4500],
      outcomes: [
        { debt: 0, skill: 'none' },
        { xp: 60, gold: 150 },
        { xp: 100, gold: 300 },
      ],
    };
  }
}
