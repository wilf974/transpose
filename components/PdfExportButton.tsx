'use client';

import { useState } from 'react';
import type { TransposeResult } from '@/lib/types';

interface PdfExportButtonProps {
  result: TransposeResult;
}

export default function PdfExportButton({ result }: PdfExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { default: TransposePdfDocument } = await import('./PdfDocument');
      const { createElement } = await import('react');

      const blob = await pdf(createElement(TransposePdfDocument, { result })).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chant-transpose.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2"
    >
      {loading ? 'Generation...' : 'PDF'}
    </button>
  );
}