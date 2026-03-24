import { NextResponse } from 'next/server';
import { callGroq } from '@/lib/groq';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const categories = ['needs', 'wants', 'savings'];
  const prompt = `Generate 12 realistic monthly expenses for an Indian college student in Pune earning Rs 15,000/month.
Mix of: rent/PG costs, food, transport, mobile, entertainment, investments, subscriptions, education costs.
Vary the order randomly — do not always start with rent.

Respond with ONLY valid JSON array, no markdown:
[
  {"id": "unique_id", "icon": "single emoji", "name": "short name max 8 chars", "amount": number, "correct": "needs|wants|savings", "description": "3-4 word description"}
]

Rules:
- Exactly 12 items
- 5 needs, 4 wants, 3 savings
- All amounts realistic for Pune student (Rs 50 to Rs 6000)
- Names MUST be max 8 characters so they fit in the card
- Vary which expenses appear — sometimes include fest ticket, sometimes coaching fee, etc
- The order should be randomized each call`;

  void categories;

  try {
    const raw = await callGroq(
      [{ role: 'user', content: prompt }],
      { max_tokens: 800, temperature: 0.9 }
    );
    const cleaned = raw.replace(/```json?\s*|\s*```/g, '').trim();
    const expenses = JSON.parse(cleaned);
    return NextResponse.json({ expenses });
  } catch {
    // Return hardcoded fallback
    return NextResponse.json({ expenses: null });
  }
}

