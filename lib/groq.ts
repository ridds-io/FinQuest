

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant';

export async function callGroq(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { max_tokens?: number; temperature?: number }
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.warn('GROQ_API_KEY not set');
    return "AI not connected. Add GROQ_API_KEY to .env.local";
  }

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: options?.max_tokens ?? 500,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Groq API error:', { status: res.status, body: err });
    return 'Sorry, AI service unavailable. Try again.';
  }

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

export interface ScenarioInput {
  module: string;
  playerState: { gold: number; level: number; avatar?: string };
}

export interface GeneratedScenario {
  situation: string;
  character: string;
  choices: string[];
  costs: number[];
  outcomes: Array<{ debt?: number; skill?: string; xp?: number; gold?: number; lesson: string }>;
}

export async function generateScenario(input: ScenarioInput): Promise<GeneratedScenario> {
  const SCENARIO_TYPES = [
    'roommate_conflict',
    'unexpected_expense',
    'peer_pressure_spending',
    'discount_opportunity',
    'part_time_job_offer',
    'subscription_trap',
    'family_financial_request',
    'semester_budget_crunch',
    'second_hand_vs_new',
    'group_outing_budget',
    'exam_prep_expense',
    'festival_spending',
  ] as const;

  const SCENARIO_DESCRIPTIONS: Record<(typeof SCENARIO_TYPES)[number], string> = {
    roommate_conflict: 'A situation involving shared living expenses, rent splitting, or roommate financial disagreements',
    unexpected_expense: 'An unexpected bill, repair, or emergency cost that disrupts the monthly budget',
    peer_pressure_spending: 'Friends want to go somewhere expensive or buy something the student cannot really afford',
    discount_opportunity: 'A student discount or cashback opportunity that requires a decision',
    part_time_job_offer: 'A part-time work opportunity with financial trade-offs like time vs money',
    subscription_trap: 'Multiple overlapping subscriptions or a tempting new subscription offer',
    family_financial_request: 'Family asking for money or the student feeling pressure to send money home',
    semester_budget_crunch: 'End of semester when budget is tight and multiple expenses hit at once',
    second_hand_vs_new: 'Decision between buying something used/refurbished vs brand new',
    group_outing_budget: 'A group trip, dinner, or outing where everyone is spending more than the student wants to',
    exam_prep_expense: 'Cost of study materials, coaching, courses or resources for exams',
    festival_spending: 'Festival season pressure to buy gifts, clothes, or celebrate expensively',
  };

  // Deterministic-but-varied selector based on player state
  const basis = `${input.playerState.level}|${input.playerState.gold}|${input.playerState.avatar ?? ''}|${input.module}`;
  let hash = 0;
  for (let i = 0; i < basis.length; i++) {
    hash = (hash * 31 + basis.charCodeAt(i)) >>> 0;
  }
  const scenarioType = SCENARIO_TYPES[hash % SCENARIO_TYPES.length];

  const prompt = `Generate a JSON financial dilemma for an Indian college student in Pune.
Scenario type: ${scenarioType} — ${SCENARIO_DESCRIPTIONS[scenarioType]}
Player state: Level ${input.playerState.level}, Gold Rs ${input.playerState.gold}, Avatar: ${input.playerState.avatar}

The scenario must:
- Be about "${SCENARIO_DESCRIPTIONS[scenarioType]}" specifically — NOT about anything else
- Feature a realistic Indian student situation with specific Rs amounts
- Have 3 meaningfully different choices (not just variations of the same choice)
- Have real financial consequences — one option should be clearly better long-term but harder short-term

Respond with ONLY valid JSON, no markdown:
{
  "situation": "2-3 sentence scenario description with specific Rs amounts and Indian context",
  "character": "Name and role of the other person in the scenario (e.g. Priya, your classmate)",
  "choices": ["Choice A text", "Choice B text", "Choice C text"],
  "costs": [number, number, number],
  "outcomes": [
    {"xp": 30, "gold": -2000, "lesson": "one sentence financial lesson"},
    {"xp": 60, "gold": -500, "lesson": "one sentence financial lesson"},
    {"xp": 100, "gold": 200, "lesson": "one sentence financial lesson"}
  ]
}`.trim();

  const raw = await callGroq(
    [{ role: 'user', content: prompt }],
    { max_tokens: 450, temperature: 0.7 }
  );
  try {
    const cleaned = raw.replace(/```json?\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleaned) as GeneratedScenario;
    if (
      !parsed.situation ||
      !parsed.character ||
      !Array.isArray(parsed.choices) ||
      !Array.isArray(parsed.costs) ||
      !Array.isArray(parsed.outcomes)
    ) {
      throw new Error('Invalid shape');
    }
    return parsed;
  } catch {
    return {
      situation: 'Your roommate says they’ll pay their share of the ₹10,000 PG rent next week via UPI. What do you do?',
      character: 'Rahul, your roommate',
      choices: [
        'Agree to split ₹6k/₹4k + Spotify — you pay ₹4,075/month',
        'Equal split ₹5k each. Decline Spotify.',
        'Equal split after using NoBroker discount — ~₹4,500 each',
      ],
      costs: [4075, 5000, 4500],
      outcomes: [
        { debt: 0, skill: 'none', xp: 30, gold: 0, lesson: 'Late payments break budgets—set clear UPI deadlines to protect cash flow and friendships.' },
        { xp: 60, gold: 150, lesson: 'Clear, documented splits reduce conflict and make monthly budgeting predictable.' },
        { xp: 100, gold: 300, lesson: 'Optimize the total cost first (discounts/negotiation), then split fairly for the best long-term outcome.' },
      ],
    };
  }
}
