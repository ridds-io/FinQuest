import { NextResponse } from 'next/server';
import { queryRAG } from '@/lib/rag';
import type { GameState } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query: string;
      gameState: GameState;
      history?: Message[];
    };
    const { query, gameState, history = [] } = body;
    if (!query) {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }
    const question = await queryRAG(query, gameState ?? { gold: 15000, level: 1 }, history);
    return NextResponse.json({ question });
  } catch (e) {
    console.error('rag-query error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}