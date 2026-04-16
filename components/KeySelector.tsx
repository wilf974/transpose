'use client';

import { MUSICAL_KEYS, type MusicalKey } from '@/lib/types';

interface KeySelectorProps {
  toKey: MusicalKey;
  onToChange: (key: MusicalKey) => void;
  onTranspose: () => void;
  loading: boolean;
}

export default function KeySelector({
  toKey,
  onToChange,
  onTranspose,
  loading,
}: KeySelectorProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap justify-center py-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-400">Transposer vers</label>
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
