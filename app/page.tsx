'use client';

import { useState } from 'react';
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
      setError("Aucun accord détecté. Vérifiez le format (ex : [Am]Parole ou ligne d'accords au-dessus des paroles).");
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
