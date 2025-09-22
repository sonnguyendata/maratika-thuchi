import { NextRequest, NextResponse } from 'next/server';
import { getPdfParse } from '@/lib/pdfParse';

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

    // Enhanced regex patterns for Vietnamese bank statements
    const dateRe = /^(\d{2}\/\d{2}\/\d{4})/;
    const txnNoRe = /(FT\d+|IBFT\d+|BFT\d+)/;
    const amountRe = /(\d{1,3}(?:,\d{3})*)/g;

    console.log('=== PDF PARSING DEBUG ===');
    console.log('Total lines:', lines.length);
    console.log('First 20 lines:', lines.slice(0, 20));

    // Find lines with dates
    const linesWithDates = lines.filter(line => line.match(dateRe));
    console.log('Lines with dates:', linesWithDates.slice(0, 10));

    // Find lines with amounts
    const linesWithAmounts = lines.filter(line => {
      const matches = line.match(amountRe);
      return matches && matches.length > 0;
    });
    console.log('Lines with amounts:', linesWithAmounts.slice(0, 10));

    // Find lines with transaction numbers
    const linesWithTxnNo = lines.filter(line => line.match(txnNoRe));
    console.log('Lines with transaction numbers:', linesWithTxnNo.slice(0, 10));

    // Test parsing on a few sample lines
    const sampleLines = linesWithDates.slice(0, 5);
    const parsedSamples = [];

    for (const line of sampleLines) {
      console.log('\n--- Parsing line:', line);
      
      const dateMatch = line.match(dateRe);
      const amounts = line.match(amountRe);
      const txnMatch = line.match(txnNoRe);
      
      console.log('Date match:', dateMatch);
      console.log('Amounts found:', amounts);
      console.log('Transaction number match:', txnMatch);
      
      if (amounts) {
        const parsedAmounts = amounts.map(amt => parseInt(amt.replace(/,/g, ''))).filter(amt => amt > 0);
        console.log('Parsed amounts:', parsedAmounts);
      }
      
      parsedSamples.push({
        line,
        dateMatch,
        amounts,
        txnMatch,
        parsedAmounts: amounts ? amounts.map(amt => parseInt(amt.replace(/,/g, ''))).filter(amt => amt > 0) : []
      });
    }

    return NextResponse.json({
      total_lines: lines.length,
      lines_with_dates: linesWithDates.slice(0, 10),
      lines_with_amounts: linesWithAmounts.slice(0, 10),
      lines_with_txn_no: linesWithTxnNo.slice(0, 10),
      parsed_samples: parsedSamples,
      raw_text_sample: text.substring(0, 2000),
      sample_lines: lines.slice(0, 30)
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
