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
