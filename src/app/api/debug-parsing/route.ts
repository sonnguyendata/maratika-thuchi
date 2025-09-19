import { NextRequest, NextResponse } from 'next/server';
import { getPdfParse } from '@/lib/pdfParse';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const parsePdf = await getPdfParse();
    const parsed = await parsePdf(Buffer.from(buf));
    const text = parsed.text ?? '';
    
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    // Debug: Show first 50 lines
    const sampleLines = lines.slice(0, 50);
    
    // Debug: Find lines that start with dates
    const dateRe = /^(\d{2}\/\d{2}\/\d{4})/;
    const linesWithDates = lines.filter(line => dateRe.test(line));
    
    // Debug: Find lines with amounts
    const amountRe = /(\d{1,3}(?:,\d{3})*)/g;
    const linesWithAmounts = lines.filter(line => {
      const matches = line.match(amountRe);
      return matches && matches.length >= 2;
    });
    
    // Debug: Show potential transaction lines
    const potentialTransactions = lines.filter(line => {
      const hasDate = dateRe.test(line);
      const matches = line.match(amountRe);
      const hasAmounts = matches && matches.length >= 2;
      return hasDate && hasAmounts && line.length > 20;
    });

    return NextResponse.json({
      totalLines: lines.length,
      sampleLines: sampleLines,
      linesWithDates: linesWithDates.slice(0, 20),
      linesWithAmounts: linesWithAmounts.slice(0, 20),
      potentialTransactions: potentialTransactions.slice(0, 20),
      rawTextSample: text.substring(0, 2000)
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
