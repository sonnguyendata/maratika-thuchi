// src/app/api/debug-pdf/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getPdfParse } from '@/lib/pdfParse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsePdf = await getPdfParse();
    const result = await parsePdf(buffer);
    
    const text = result.text;
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    // Test the regex patterns
    const dateRe = /^(?<d>\d{1,2})[\/\-](?<m>\d{1,2})[\/\-](?<y>\d{4})\b|^(?<y2>\d{4})-(?<m2>\d{2})-(?<d2>\d{2})\b/;
    const amtRe = /[-+]?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})|\d+(?:\.\d{1,2})/;

    const linesWithDates = lines.map((line, i) => {
      const dMatch = line.match(dateRe);
      return dMatch ? { lineNumber: i + 1, line, match: dMatch[0] } : null;
    }).filter(Boolean);

    const linesWithAmounts = lines.map((line, i) => {
      const aMatch = line.match(amtRe);
      return aMatch ? { lineNumber: i + 1, line, match: aMatch[0] } : null;
    }).filter(Boolean);

    const linesWithBoth = lines.map((line, i) => {
      const dMatch = line.match(dateRe);
      const aMatch = line.match(amtRe);
      return (dMatch && aMatch) ? { lineNumber: i + 1, line, dateMatch: dMatch[0], amountMatch: aMatch[0] } : null;
    }).filter(Boolean);

    return NextResponse.json({
      fileSize: buffer.length,
      textLength: text.length,
      totalLines: lines.length,
      first500Chars: text.substring(0, 500),
      first20Lines: lines.slice(0, 20),
      linesWithDates: linesWithDates.slice(0, 10), // Limit to first 10
      linesWithAmounts: linesWithAmounts.slice(0, 10), // Limit to first 10
      linesWithBoth: linesWithBoth.slice(0, 10), // Limit to first 10
      regexPatterns: {
        date: dateRe.toString(),
        amount: amtRe.toString()
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
