import OpenAI from 'openai';
import type { TransposeResult } from './types';

const SYSTEM_PROMPT = `Tu es un expert en transposition musicale.
Reçois un texte de chant avec accords (format libre ou chordpro).
Détecte automatiquement la tonalité actuelle des accords, puis transpose-les tous vers la tonalité cible demandée.
Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "lines": [
    { "lyrics": "texte de la ligne", "chords": [{ "word": "mot", "chord": "accord" }] }
  ]
}
Ne modifie jamais les paroles. Si un accord est ambigu, conserve-le tel quel.`;

export async function transposeSong(
  text: string,
  toKey: string
): Promise<TransposeResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const userMessage = `Tonalité cible : ${toKey}\n\nChant :\n${text}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty response');

  const parsed = JSON.parse(content) as TransposeResult;
  if (!parsed.lines || !Array.isArray(parsed.lines)) {
    throw new Error('OpenAI response missing lines array');
  }

  return parsed;
}
