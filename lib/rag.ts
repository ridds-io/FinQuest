import { createServerSupabase } from './supabase-server';
import { callGrok } from './groq';
import type { GameState } from '@/types';

/**
 * RAG: get embedding for query (optional OpenAI/HuggingFace), then Supabase vector search.
 * If no embedding API, fallback to Grok with context only.
 */

async function getEmbedding(query: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

export async function queryRAG(query: string, context: GameState): Promise<string> {
  const supabase = createServerSupabase();
  let ragSources = '';

  if (supabase) {
    const embedding = await getEmbedding(query);
    if (embedding) {
      const { data } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.78,
        match_count: 3,
      });
      if (data && Array.isArray(data)) {
        ragSources = data.map((d: { content?: string }) => d?.content ?? '').filter(Boolean).join('\n\n');
      }
    }
  }

  const tutorPrompt = `
FinQuest Socratic Tutor for Indian college students.
Player state: ${JSON.stringify(context)}
${ragSources ? `RAG Sources:\n${ragSources}\n\n` : ''}
Ask 1–2 Socratic questions about budgeting/discounts. Indian context: ₹, UPI, PG rent, chai, NoBroker.
Example: "Why did roommate skip UPI rent? What NoBroker discount could save?"
Keep response short (2–4 sentences). End with a thought-provoking question. No lectures.
`.trim();

  return callGrok(
    [{ role: 'user', content: tutorPrompt }],
    { max_tokens: 300, temperature: 0.7 }
  );
}
