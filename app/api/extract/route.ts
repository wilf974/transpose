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
