import { NextRequest, NextResponse } from 'next/server';
import { transposeSong } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { text, toKey } = await req.json() as {
      text: string;
      toKey: string;
    };

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    if (!toKey) {
      return NextResponse.json({ error: 'toKey is required' }, { status: 400 });
    }

    const result = await transposeSong(text, toKey);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transposition failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
