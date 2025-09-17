// src/app/api/parse/route.ts (only the imports shown here)
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { sha256 } from 'js-sha256';
import { supabaseServerAdmin } from '@/lib/supabaseServer';


export async function POST(req: NextRequest) {
  const { statementId } = await req.json();
  if (!statementId) {
    return NextResponse.json({ error: 'statementId is required' }, { status: 400 });
  }

  const supabase = supabaseServerAdmin();

  // Fetch the PDF file from storage
  const { data: fileData, error: fileError } = await supabase
    .storage
    .from('statements')
    .download(statementId);

  if (fileError || !fileData) {
    return NextResponse.json({ error: fileError?.message ?? 'File not found' }, { status: 404 });
  }

  // Parse the PDF file
  const pdfArrayBuffer = await fileData.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  const pdfText = await pdf(pdfBuffer);

  // TODO: Implement actual parsing logic
  const newStatements = [];
  const duplicateStatements = [];
  const errors = [];

  // Simulate parsing
  pdfText.text.split('\n').forEach(line => {
    const hash = sha256(line);
    if (hash.startsWith('a')) {
      newStatements.push(line);
    } else if (hash.startsWith('b')) {
      duplicateStatements.push(line);
    } else {
      errors.push(line);
    }
  });

  return NextResponse.json({ new: newStatements.length, dup: duplicateStatements.length, err: errors.length });
}