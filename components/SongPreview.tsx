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
          {line.chords.length > 0 && (
            <div className="flex gap-x-4 text-violet-400 font-bold text-xs mb-0.5">
              {line.chords.map((cp, j) => (
                <span key={j}>{cp.chord}</span>
              ))}
            </div>
          )}
          <p className="text-white leading-relaxed">{line.lyrics}</p>
        </div>
      ))}
    </div>
  );
}
