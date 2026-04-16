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
