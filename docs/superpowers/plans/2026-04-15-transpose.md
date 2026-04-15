# Transpose — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first web app that transposes song chords (text/TXT/PDF input) between musical keys using OpenAI, with PDF and TXT export.

**Architecture:** Next.js 14 App Router full-stack app. OpenAI GPT-4o handles transposition via a secured API route. `@react-pdf/renderer` generates PDFs client-side. `pdf-parse` extracts text from uploaded PDFs server-side. Entire stack runs in Docker.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, OpenAI SDK, @react-pdf/renderer, pdf-parse, Jest + ts-jest, Docker

---

## File Map

```
app/
  layout.tsx              Root layout, metadata, fonts
  page.tsx                Main page — wires all components together
  globals.css             Global styles + Tailwind base
  api/
    transpose/route.ts    POST: receives text+keys, calls OpenAI, returns TransposeResult
    extract/route.ts      POST: receives PDF buffer, returns extracted text

components/
  InputPanel.tsx          3-tab input: paste text / upload TXT / upload PDF
  KeySelector.tsx         Source key + target key dropdowns (12 keys each)
  SongPreview.tsx         Renders chords above lyrics from TransposeResult
  ExportBar.tsx           TXT download button + mounts PdfExportButton
  PdfDocument.tsx         @react-pdf/renderer Document template
  PdfExportButton.tsx     PDFDownloadLink wrapper (dynamically imported, ssr:false)

lib/
  types.ts                Shared TypeScript types (SongLine, ChordPosition, etc.)
  parser.ts               Parses raw text → TransposeResult (chordpro + chord-above-lyrics)
  openai.ts               OpenAI client + transposeSong() function
  pdfExtract.ts           pdf-parse wrapper (server-only)

__tests__/
  lib/parser.test.ts      Unit tests for parser (TDD)
  lib/openai.test.ts      Unit tests for openai.ts (mocked client)

Dockerfile                Production image (node:20-alpine, standalone output)
Dockerfile.dev            Dev image (node:20-alpine, hot-reload)
docker-compose.yml        Dev stack: port 3000, volume mount, env_file
.dockerignore             Excludes node_modules, .next, .env*
.env.example              Template for .env.local
next.config.ts            output: standalone
jest.config.ts            Jest + ts-jest configuration
```

---

## Task 1: Bootstrap Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder)
- Create: `.env.example`, `.gitignore`

- [ ] **Step 1: Scaffold the project**

Run from `C:\Users\w.maillot\Documents\Transpose`:
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```
Expected: project files created, `npm install` run automatically.

- [ ] **Step 2: Install project dependencies**

```bash
npm install openai pdf-parse @react-pdf/renderer
npm install -D @types/pdf-parse jest ts-jest @types/jest jest-environment-jsdom
```

- [ ] **Step 3: Configure Next.js for standalone Docker output**

Replace content of `next.config.ts`:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathPattern: '__tests__',
};

export default config;
```

- [ ] **Step 5: Create .env.example**

Create `.env.example`:
```
OPENAI_API_KEY=sk-...
```

- [ ] **Step 6: Create .env.local**

Create `.env.local` (not committed):
```
OPENAI_API_KEY=your-key-here
```

- [ ] **Step 7: Update .gitignore**

Append to `.gitignore`:
```
.env.local
.env*.local
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```
Expected: server running on http://localhost:3000, no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Next.js project with dependencies"
```

---

## Task 2: Docker configuration

**Files:**
- Create: `Dockerfile`
- Create: `Dockerfile.dev`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

- [ ] **Step 1: Create .dockerignore**

Create `.dockerignore`:
```
node_modules
.next
.git
.env*
*.md
__tests__
```

- [ ] **Step 2: Create Dockerfile.dev**

Create `Dockerfile.dev`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true

CMD ["npm", "run", "dev"]
```

- [ ] **Step 3: Create Dockerfile (production)**

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 4: Create docker-compose.yml**

Create `docker-compose.yml`:
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    env_file:
      - .env.local
    restart: unless-stopped
```

- [ ] **Step 5: Verify Docker build**

```bash
docker compose up --build
```
Expected: container starts, app accessible at http://localhost:3000.

- [ ] **Step 6: Commit**

```bash
git add Dockerfile Dockerfile.dev docker-compose.yml .dockerignore
git commit -m "chore: add Docker dev and production configuration"
```

---

## Task 3: Shared TypeScript types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create lib/types.ts**

Create `lib/types.ts`:
```typescript
export type MusicalKey =
  | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E'
  | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A'
  | 'A#' | 'Bb' | 'B';

export const MUSICAL_KEYS: MusicalKey[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

export interface ChordPosition {
  /** The word above which the chord appears */
  word: string;
  /** The chord symbol, e.g. "Am", "G7", "F#m" */
  chord: string;
}

export interface SongLine {
  /** The lyric text for this line */
  lyrics: string;
  /** Chords positioned at specific words in this line */
  chords: ChordPosition[];
}

export interface TransposeResult {
  lines: SongLine[];
}

export type InputMode = 'text' | 'txt' | 'pdf';
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 4: Parser (TDD)

**Files:**
- Create: `lib/parser.ts`
- Create: `__tests__/lib/parser.test.ts`

- [ ] **Step 1: Create test file with failing tests**

Create `__tests__/lib/parser.test.ts`:
```typescript
import { parseRawText } from '@/lib/parser';

describe('parseRawText', () => {
  it('parses chordpro format [Am]Amazing [G]grace', () => {
    const input = '[Am]Amazing [G]grace, how sweet the sound';
    const result = parseRawText(input);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].lyrics).toBe('Amazing grace, how sweet the sound');
    expect(result.lines[0].chords).toEqual([
      { word: 'Amazing', chord: 'Am' },
      { word: 'grace,', chord: 'G' },
    ]);
  });

  it('parses chord-above-lyrics format', () => {
    const input = 'Am       G\nAmazing grace';
    const result = parseRawText(input);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].lyrics).toBe('Amazing grace');
    expect(result.lines[0].chords.length).toBeGreaterThanOrEqual(1);
    expect(result.lines[0].chords[0].chord).toBe('Am');
  });

  it('parses plain lyrics with no chords', () => {
    const input = 'Amazing grace how sweet the sound';
    const result = parseRawText(input);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].lyrics).toBe('Amazing grace how sweet the sound');
    expect(result.lines[0].chords).toEqual([]);
  });

  it('handles multiple chordpro lines', () => {
    const input = '[Am]Amazing [G]grace\n[F]How sweet [C]the sound';
    const result = parseRawText(input);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[1].chords[0]).toEqual({ word: 'How', chord: 'F' });
  });

  it('handles empty string', () => {
    const result = parseRawText('');
    expect(result.lines).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/parser.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/parser'`

- [ ] **Step 3: Implement lib/parser.ts**

Create `lib/parser.ts`:
```typescript
import type { TransposeResult, SongLine, ChordPosition } from './types';

const CHORD_REGEX = /^[A-G][b#]?(m|maj|min|dim|aug|sus|add)?[0-9]*(\/[A-G][b#]?)?$/;

function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length === 0) return false;
  return tokens.every(t => CHORD_REGEX.test(t));
}

function parseChordproLine(line: string): SongLine {
  const chords: ChordPosition[] = [];
  const lyrics = line.replace(/\[([A-G][^\]]*)\](\S*)/g, (_, chord, word) => {
    chords.push({ word: word || '', chord });
    return word;
  });
  return { lyrics, chords };
}

function parseChordAboveLyrics(chordLine: string, lyricLine: string): SongLine {
  const chords: ChordPosition[] = [];
  const chordMatches = [...chordLine.matchAll(/([A-G][b#]?[^\s]*)\s*/g)];
  const lyricWords = lyricLine.split(/\s+/);

  for (const match of chordMatches) {
    const charPos = match.index ?? 0;
    // Find the word closest to the chord's character position
    let pos = 0;
    let bestWord = lyricWords[0] ?? '';
    for (const word of lyricWords) {
      if (pos <= charPos) bestWord = word;
      pos += word.length + 1;
    }
    chords.push({ word: bestWord, chord: match[1] });
  }

  return { lyrics: lyricLine, chords };
}

export function parseRawText(text: string): TransposeResult {
  if (!text.trim()) return { lines: [] };

  // Detect if any line uses chordpro format
  const hasChordpro = /\[[A-G][^\]]*\]/.test(text);

  if (hasChordpro) {
    const lines: SongLine[] = text
      .split('\n')
      .filter(l => l.trim())
      .map(parseChordproLine);
    return { lines };
  }

  // chord-above-lyrics format: pair chord lines with lyric lines
  const rawLines = text.split('\n');
  const lines: SongLine[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const current = rawLines[i];
    const next = rawLines[i + 1];

    if (isChordLine(current) && next !== undefined && !isChordLine(next)) {
      lines.push(parseChordAboveLyrics(current, next));
      i += 2;
    } else if (current.trim()) {
      lines.push({ lyrics: current, chords: [] });
      i++;
    } else {
      i++;
    }
  }

  return { lines };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/parser.test.ts --no-coverage
```
Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/parser.ts __tests__/lib/parser.test.ts
git commit -m "feat: add song text parser with TDD (chordpro + chord-above-lyrics)"
```

---

## Task 5: OpenAI transposition lib

**Files:**
- Create: `lib/openai.ts`
- Create: `__tests__/lib/openai.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/openai.test.ts`:
```typescript
import { transposeSong } from '@/lib/openai';

// Mock the OpenAI module
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  lines: [
                    { lyrics: 'Amazing grace', chords: [{ word: 'Amazing', chord: 'Am' }] }
                  ]
                })
              }
            }]
          })
        }
      }
    }))
  };
});

describe('transposeSong', () => {
  it('returns a TransposeResult with lines', async () => {
    const result = await transposeSong('Amazing grace', 'D', 'C');
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].lyrics).toBe('Amazing grace');
    expect(result.lines[0].chords[0].chord).toBe('Am');
  });

  it('throws if OpenAI returns malformed JSON', async () => {
    const { default: OpenAI } = await import('openai');
    const mockInstance = new (OpenAI as jest.MockedClass<typeof OpenAI>)();
    (mockInstance.chat.completions.create as jest.Mock).mockResolvedValueOnce({
      choices: [{ message: { content: 'not json' } }]
    });
    await expect(transposeSong('test', 'D', 'C')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/openai.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/openai'`

- [ ] **Step 3: Implement lib/openai.ts**

Create `lib/openai.ts`:
```typescript
import OpenAI from 'openai';
import type { TransposeResult } from './types';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Tu es un expert en transposition musicale.
Reçois un texte de chant avec accords (format libre ou chordpro).
Transpose tous les accords de la tonalité source vers la tonalité cible.
Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "lines": [
    { "lyrics": "texte de la ligne", "chords": [{ "word": "mot", "chord": "accord" }] }
  ]
}
Ne modifie jamais les paroles. Si un accord est ambigu, conserve-le tel quel.`;

export async function transposeSong(
  text: string,
  fromKey: string,
  toKey: string
): Promise<TransposeResult> {
  const userMessage = `Tonalité source : ${fromKey}\nTonalité cible : ${toKey}\n\nChant :\n${text}`;

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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/openai.test.ts --no-coverage
```
Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/openai.ts __tests__/lib/openai.test.ts
git commit -m "feat: add OpenAI transposition client with mocked tests"
```

---

## Task 6: PDF extraction lib + API route

**Files:**
- Create: `lib/pdfExtract.ts`
- Create: `app/api/extract/route.ts`

- [ ] **Step 1: Create lib/pdfExtract.ts**

Create `lib/pdfExtract.ts`:
```typescript
// Use direct module path to avoid pdf-parse reading test files at Next.js boot
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
  buffer: Buffer
) => Promise<{ text: string }>;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
```

- [ ] **Step 2: Create app/api/extract/route.ts**

Create `app/api/extract/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/lib/pdfExtract';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromPdf(buffer);

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: 'Failed to extract PDF. File may be protected or corrupted.' },
      { status: 422 }
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/pdfExtract.ts app/api/extract/route.ts
git commit -m "feat: add PDF extraction lib and API route"
```

---

## Task 7: Transpose API route

**Files:**
- Create: `app/api/transpose/route.ts`

- [ ] **Step 1: Create app/api/transpose/route.ts**

Create `app/api/transpose/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { transposeSong } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { text, fromKey, toKey } = await req.json() as {
      text: string;
      fromKey: string;
      toKey: string;
    };

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    if (!fromKey || !toKey) {
      return NextResponse.json({ error: 'fromKey and toKey are required' }, { status: 400 });
    }

    const result = await transposeSong(text, fromKey, toKey);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transposition failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/transpose/route.ts
git commit -m "feat: add transpose API route"
```

---

## Task 8: KeySelector component

**Files:**
- Create: `components/KeySelector.tsx`

- [ ] **Step 1: Create components/KeySelector.tsx**

Create `components/KeySelector.tsx`:
```tsx
'use client';

import { MUSICAL_KEYS, type MusicalKey } from '@/lib/types';

interface KeySelectorProps {
  fromKey: MusicalKey;
  toKey: MusicalKey;
  onFromChange: (key: MusicalKey) => void;
  onToChange: (key: MusicalKey) => void;
  onTranspose: () => void;
  loading: boolean;
}

export default function KeySelector({
  fromKey,
  toKey,
  onFromChange,
  onToChange,
  onTranspose,
  loading,
}: KeySelectorProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap justify-center py-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-400">De</label>
        <select
          value={fromKey}
          onChange={e => onFromChange(e.target.value as MusicalKey)}
          className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {MUSICAL_KEYS.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <span className="text-zinc-500 text-lg">→</span>

      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-400">Vers</label>
        <select
          value={toKey}
          onChange={e => onToChange(e.target.value as MusicalKey)}
          className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {MUSICAL_KEYS.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <button
        onClick={onTranspose}
        disabled={loading}
        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Transposition…' : 'Transposer'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/KeySelector.tsx
git commit -m "feat: add KeySelector component"
```

---

## Task 9: InputPanel component

**Files:**
- Create: `components/InputPanel.tsx`

- [ ] **Step 1: Create components/InputPanel.tsx**

Create `components/InputPanel.tsx`:
```tsx
'use client';

import { useState, type ChangeEvent } from 'react';
import type { InputMode } from '@/lib/types';

interface InputPanelProps {
  onTextReady: (text: string) => void;
}

export default function InputPanel({ onTextReady }: InputPanelProps) {
  const [mode, setMode] = useState<InputMode>('text');
  const [textValue, setTextValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabs: { id: InputMode; label: string }[] = [
    { id: 'text', label: '✏️ Texte' },
    { id: 'txt', label: '📄 TXT' },
    { id: 'pdf', label: '📑 PDF' },
  ];

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setTextValue(e.target.value);
    onTextReady(e.target.value);
  }

  async function handleTxtUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onTextReady(text);
  }

  async function handlePdfUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/extract', { method: 'POST', body: formData });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Extraction échouée');
      onTextReady(data.text ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex border-b border-zinc-700 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === tab.id
                ? 'border-b-2 border-violet-500 text-violet-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {mode === 'text' && (
        <textarea
          value={textValue}
          onChange={handleTextChange}
          placeholder={"Collez vos accords et paroles ici…\n\nExemple chordpro : [Am]Amazing [G]grace\nOu accords au-dessus : Am  G\n                      Amazing grace"}
          className="w-full h-48 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
        />
      )}

      {mode === 'txt' && (
        <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-700 rounded-lg gap-2">
          <p className="text-zinc-400 text-sm">Sélectionnez un fichier .txt</p>
          <input
            type="file"
            accept=".txt"
            onChange={handleTxtUpload}
            className="text-sm text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-violet-600 file:text-white file:cursor-pointer"
          />
        </div>
      )}

      {mode === 'pdf' && (
        <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-700 rounded-lg gap-2">
          {loading ? (
            <p className="text-zinc-400 text-sm animate-pulse">Extraction en cours…</p>
          ) : (
            <>
              <p className="text-zinc-400 text-sm">Sélectionnez un fichier .pdf</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="text-sm text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-violet-600 file:text-white file:cursor-pointer"
              />
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/InputPanel.tsx
git commit -m "feat: add InputPanel component (text/TXT/PDF tabs)"
```

---

## Task 10: SongPreview component

**Files:**
- Create: `components/SongPreview.tsx`

- [ ] **Step 1: Create components/SongPreview.tsx**

Create `components/SongPreview.tsx`:
```tsx
'use client';

import type { TransposeResult } from '@/lib/types';

interface SongPreviewProps {
  result: TransposeResult | null;
  loading: boolean;
}

export default function SongPreview({ result, loading }: SongPreviewProps) {
  if (loading) {
    return (
      <div className="w-full space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-zinc-700 rounded w-1/3" />
            <div className="h-4 bg-zinc-800 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="w-full font-mono text-sm space-y-4 overflow-x-auto">
      {result.lines.map((line, i) => (
        <div key={i} className="relative">
          {/* Chord row */}
          {line.chords.length > 0 && (
            <div className="flex gap-x-4 text-violet-400 font-bold text-xs mb-0.5">
              {line.chords.map((cp, j) => (
                <span key={j}>{cp.chord}</span>
              ))}
            </div>
          )}
          {/* Lyric row */}
          <p className="text-white leading-relaxed">{line.lyrics}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/SongPreview.tsx
git commit -m "feat: add SongPreview component (chords above lyrics)"
```

---

## Task 11: PdfDocument + PdfExportButton components

**Files:**
- Create: `components/PdfDocument.tsx`
- Create: `components/PdfExportButton.tsx`

- [ ] **Step 1: Create components/PdfDocument.tsx**

Create `components/PdfDocument.tsx`:
```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { TransposeResult } from '@/lib/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Courier',
  },
  line: {
    marginBottom: 12,
  },
  chordRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 1,
  },
  chord: {
    fontSize: 9,
    color: '#6d28d9',
    fontWeight: 'bold',
  },
  lyrics: {
    fontSize: 11,
    color: '#1a1a1a',
  },
});

interface PdfDocumentProps {
  result: TransposeResult;
  title?: string;
}

export default function TransposePdfDocument({ result, title }: PdfDocumentProps) {
  return (
    <Document title={title ?? 'Transpose'}>
      <Page size="A4" style={styles.page}>
        {result.lines.map((line, i) => (
          <View key={i} style={styles.line}>
            {line.chords.length > 0 && (
              <View style={styles.chordRow}>
                {line.chords.map((cp, j) => (
                  <Text key={j} style={styles.chord}>{cp.chord}</Text>
                ))}
              </View>
            )}
            <Text style={styles.lyrics}>{line.lyrics}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Create components/PdfExportButton.tsx**

This component wraps `PDFDownloadLink` and `PdfDocument` together.
It is always imported via `dynamic(..., { ssr: false })` from `ExportBar`.

Create `components/PdfExportButton.tsx`:
```tsx
'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import TransposePdfDocument from './PdfDocument';
import type { TransposeResult } from '@/lib/types';

interface PdfExportButtonProps {
  result: TransposeResult;
}

export default function PdfExportButton({ result }: PdfExportButtonProps) {
  return (
    <PDFDownloadLink
      document={<TransposePdfDocument result={result} />}
      fileName="chant-transpose.pdf"
    >
      {({ loading: pdfLoading }) => (
        <button
          disabled={pdfLoading}
          className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {pdfLoading ? '…' : '⬇ PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/PdfDocument.tsx components/PdfExportButton.tsx
git commit -m "feat: add PdfDocument and PdfExportButton components"
```

---

## Task 12: ExportBar component

**Files:**
- Create: `components/ExportBar.tsx`

- [ ] **Step 1: Create components/ExportBar.tsx**

`PdfExportButton` is imported via `dynamic(..., { ssr: false })` to avoid SSR issues with `@react-pdf/renderer`.

Create `components/ExportBar.tsx`:
```tsx
'use client';

import dynamic from 'next/dynamic';
import type { TransposeResult } from '@/lib/types';

// Must be ssr:false — @react-pdf/renderer is browser-only
const PdfExportButton = dynamic(() => import('./PdfExportButton'), {
  ssr: false,
  loading: () => (
    <button disabled className="bg-zinc-700 opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">
      ⬇ PDF
    </button>
  ),
});

interface ExportBarProps {
  result: TransposeResult;
}

function buildTxt(result: TransposeResult): string {
  return result.lines
    .map(line => {
      if (line.chords.length === 0) return line.lyrics;
      const chordRow = line.chords.map(cp => cp.chord).join('  ');
      return `${chordRow}\n${line.lyrics}`;
    })
    .join('\n');
}

export default function ExportBar({ result }: ExportBarProps) {
  function downloadTxt() {
    const content = buildTxt(result);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chant-transpose.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-3 flex-wrap justify-center pt-4 border-t border-zinc-800">
      <PdfExportButton result={result} />
      <button
        onClick={downloadTxt}
        className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
      >
        ⬇ TXT
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ExportBar.tsx
git commit -m "feat: add ExportBar component (PDF + TXT download)"
```

---

## Task 13: Main page — wire everything together

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update app/globals.css**

Replace content of `app/globals.css`:
```css
@import "tailwindcss";

:root {
  --background: #0f0f0f;
  --foreground: #f4f4f5;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 2: Update app/layout.tsx**

Replace content of `app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Transpose — Transposez vos chants',
  description: 'Transposez facilement vos chants entre tonalités',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Update app/page.tsx**

Replace content of `app/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
// parseRawText imported dynamically in handleTranspose for chord detection
import InputPanel from '@/components/InputPanel';
import KeySelector from '@/components/KeySelector';
import SongPreview from '@/components/SongPreview';
import ExportBar from '@/components/ExportBar';
import type { TransposeResult, MusicalKey } from '@/lib/types';

export default function Home() {
  const [text, setText] = useState('');
  const [fromKey, setFromKey] = useState<MusicalKey>('D');
  const [toKey, setToKey] = useState<MusicalKey>('C');
  const [result, setResult] = useState<TransposeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTranspose() {
    if (!text.trim()) {
      setError('Veuillez saisir ou importer un chant.');
      return;
    }
    // Quick local check: warn if no chords detected
    const { parseRawText } = await import('@/lib/parser');
    const preview = parseRawText(text);
    const hasChords = preview.lines.some(l => l.chords.length > 0);
    if (!hasChords) {
      setError('Aucun accord détecté. Vérifiez le format (ex : [Am]Parole ou ligne d\'accords au-dessus des paroles).');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/transpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fromKey, toKey }),
      });
      const data = await res.json() as TransposeResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erreur de transposition');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">🎵 Transpose</h1>
          <p className="text-zinc-400 text-sm mt-1">Changez la tonalité de vos chants en quelques secondes</p>
        </header>

        {/* Input */}
        <section className="bg-zinc-900 rounded-2xl p-5">
          <InputPanel onTextReady={setText} />
        </section>

        {/* Keys + Transpose button */}
        <section className="bg-zinc-900 rounded-2xl p-4">
          <KeySelector
            fromKey={fromKey}
            toKey={toKey}
            onFromChange={setFromKey}
            onToChange={setToKey}
            onTranspose={handleTranspose}
            loading={loading}
          />
          {error && <p className="text-center text-red-400 text-sm mt-2">{error}</p>}
        </section>

        {/* Preview */}
        {(loading || result) && (
          <section className="bg-zinc-900 rounded-2xl p-5">
            <h2 className="text-zinc-400 text-xs uppercase tracking-wider mb-4">Aperçu</h2>
            <SongPreview result={result} loading={loading} />
          </section>
        )}

        {/* Export */}
        {result && (
          <section className="bg-zinc-900 rounded-2xl p-4">
            <ExportBar result={result} />
          </section>
        )}

      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify full flow in browser**

```bash
docker compose up --build
```
Open http://localhost:3000. Test:
1. Paste `[Am]Amazing [G]grace` → select D→C → click Transposer → verify chords change
2. Upload a .txt file → transpose
3. Upload a .pdf → transpose
4. Download PDF → verify layout
5. Download TXT → verify format

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx app/globals.css
git commit -m "feat: wire main page — full transpose flow end to end"
```

---

## Task 14: Run all tests + final commit

**Files:** No new files

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```
Expected: all tests pass (parser + openai mock).

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no type errors.

- [ ] **Step 3: Verify Docker production build**

```bash
docker build -t transpose-prod .
docker run -p 3000:3000 -e OPENAI_API_KEY=your-key transpose-prod
```
Open http://localhost:3000 — verify app works in production mode.

- [ ] **Step 4: Update CLAUDE.md with iteration 1**

Append to the `## Itérations` section of `CLAUDE.md`:

```markdown
### Itération 1 — 2026-04-15
- Bootstrap Next.js + TypeScript + Tailwind
- Docker dev + production configurés
- Types partagés (lib/types.ts)
- Parser chordpro + chord-above-lyrics avec tests (TDD)
- Client OpenAI GPT-4o avec tests mockés
- Extraction PDF (pdf-parse, serveur)
- Routes API : /api/transpose, /api/extract
- Composants : InputPanel, KeySelector, SongPreview, ExportBar, PdfDocument
- Page principale câblée end-to-end
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: update CLAUDE.md after iteration 1"
```
