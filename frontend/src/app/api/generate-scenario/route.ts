import { NextResponse } from 'next/server';
import { generateScenario } from '@/lib/groq';
import type { ScenarioInput } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScenarioInput;
    const { module, playerState } = body;
    if (!module || !playerState) {
      return NextResponse.json({ error: 'module and playerState required' }, { status: 400 });
    }
    const scenario = await generateScenario({ module, playerState });
    return NextResponse.json(scenario);
  } catch (e) {
    console.error('generate-scenario', e);
    return NextResponse.json({ error: 'Failed to generate scenario' }, { status: 500 });
  }
}
