import { NextResponse } from 'next/server';
import { queryRAG } from '@/lib/rag';
import type { GameState } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query: string; gameState: GameState };
    const { query, gameState } = body;
    if (!query) {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }
    const question = await queryRAG(query, gameState ?? { gold: 15000, level: 1 });
    return NextResponse.json({ question });
  } catch (e) {
    console.error('rag-query', e);
    return NextResponse.json({ error: 'RAG query failed' }, { status: 500 });
  }
}
