// src/app/api/debug-pdf-content/route.ts
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { getPdfParse } from '@/lib/pdfParse';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const fileEntry = form.get('file');
    
    if (!(fileEntry instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buf = Buffer.from(await fileEntry.arrayBuffer());
    const parsePdf = await getPdfParse();
    const parsed = await parsePdf(buf);
    const text = parsed.text ?? '';
    
    // Split into lines and analyze
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    // Enhanced regex patterns
    const dateRe = /^(?<d>\d{1,2})[\/\-](?<m>\d{1,2})[\/\-](?<y>\d{4})\b|^(?<y2>\d{4})-(?<m2>\d{2})-(?<d2>\d{2})\b|(?<d3>\d{1,2})\/(?<m3>\d{1,2})\/(?<y3>\d{4})/;
    const amtRe = /([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/;
    
    // Look for transaction number patterns
    const txnNoRe = /(?:Txn|Transaction|Ref|Reference|No|Number)[\s:]*([A-Z0-9\-]+)/i;
    
    const analysis = {
      totalLines: lines.length,
      linesWithDates: 0,
      linesWithAmounts: 0,
      linesWithTxnNos: 0,
      sampleLines: lines.slice(0, 20),
      transactionCandidates: [] as any[],
      rawText: text.substring(0, 2000) // First 2000 chars
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const dMatch = line.match(dateRe);
      const aMatch = line.match(amtRe);
      const txnMatch = line.match(txnNoRe);
      
      if (dMatch) analysis.linesWithDates++;
      if (aMatch) analysis.linesWithAmounts++;
      if (txnMatch) analysis.linesWithTxnNos++;
      
      // If this looks like a transaction line
      if (dMatch && aMatch) {
        const groups = dMatch.groups ?? {};
        let year, month, day;
        
        if (groups.y2 && groups.m2 && groups.d2) {
          year = groups.y2;
          month = groups.m2;
          day = groups.d2;
        } else if (groups.y3 && groups.m3 && groups.d3) {
          year = groups.y3;
          month = groups.m3;
          day = groups.d3;
        } else if (groups.y && groups.m && groups.d) {
          year = groups.y;
          month = groups.m;
          day = groups.d;
        }
        
        if (year && month && day) {
          const trxDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          const amtStr = aMatch[0];
          const raw = amtStr.replace(/,/g, '').replace(/[^\d.-]/g, '');
          const amt = Number(raw);
          
          if (Number.isFinite(amt)) {
            let description = line.replace(dateRe, '').trim();
            const tail = description.lastIndexOf(amtStr);
            if (tail >= 0) {
              description = description.slice(0, tail).trim();
            }
            description = description.replace(/\s+/g, ' ').trim();
            
            analysis.transactionCandidates.push({
              lineNumber: i + 1,
              originalLine: line,
              date: trxDate,
              amount: amt,
              description: description || null,
              transactionNo: txnMatch ? txnMatch[1] : null,
              hasDescription: description.length > 0
            });
          }
        }
      }
    }

    return NextResponse.json(analysis);
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
