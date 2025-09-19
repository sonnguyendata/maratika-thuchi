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

    // Debug: Show what would be processed as transactions
    const processedTransactions = [];
    for (let i = 0; i < Math.min(lines.length, 100); i++) {
      const line = lines[i];
      
      // Skip header lines, empty lines, and summary lines
      if (line.length < 5 || 
          line.includes('NGÂN HÀNG') || 
          line.includes('BANK STATEMENT') || 
          line.includes('Transaction Date') ||
          line.includes('SỔ PHỤ') ||
          line.includes('Customer name') ||
          line.includes('Account no') ||
          line.includes('Opening balance') ||
          line.includes('Diễn giải') ||
          line.includes('Details') ||
          line.includes('Số bút toán') ||
          line.includes('Transaction No') ||
          line.includes('Nợ TKTT') ||
          line.includes('Debit') ||
          line.includes('Có TKTT') ||
          line.includes('Credit') ||
          line.includes('Số dư') ||
          line.includes('Balance') ||
          line.includes('Ending balance') ||
          line.includes('TECHCOMBANK Tra lai') ||
          line.includes('Ngày giao dịch: Là ngày') ||
          line.includes('Số dư: Là số dư') ||
          line.includes('Transaction Date: is the next') ||
          line.includes('Balance: is total power')) {
        continue;
      }

      // Check if line starts with a date
      const dateMatch = line.match(dateRe);
      if (!dateMatch) continue;

      processedTransactions.push({
        lineNumber: i,
        line: line,
        nextLines: lines.slice(i + 1, i + 6)
      });
    }

    return NextResponse.json({
      totalLines: lines.length,
      sampleLines: sampleLines,
      linesWithDates: linesWithDates.slice(0, 20),
      linesWithAmounts: linesWithAmounts.slice(0, 20),
      potentialTransactions: potentialTransactions.slice(0, 20),
      processedTransactions: processedTransactions.slice(0, 10),
      rawTextSample: text.substring(0, 2000)
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
