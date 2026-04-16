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
