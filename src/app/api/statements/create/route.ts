export const runtime = 'nodejs'; // ensure Node, not Edge

import { NextResponse } from 'next/server';
import { supabaseServerAdmin } from '@/lib/supabaseServer';
// Optional: import pdf-parse if you’re actually parsing transactions
// import pdf from 'pdf-parse';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const accountName = (form.get('accountName') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read the file into a Buffer
    const arrayBuf = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    // TODO: parse PDF content if needed:
    // const parsed = await pdf(buf);
    // const text = parsed.text;

    const supa = supabaseServerAdmin();

    // 1) Create a statement row first
    const { data: statement, error: stErr } = await supa
      .from('statements')
      .insert({
        account_name: accountName,
        file_name: file.name,
        // You can store original bytes or upload to Supabase Storage; here we just store metadata.
        // Add additional columns as your schema allows (period_from, period_to, etc.)
      })
      .select()
      .single();

    if (stErr) {
      return NextResponse.json({ error: stErr.message }, { status: 400 });
    }

    // 2) If you parse transactions, insert them here using statement.id
    // Example (pseudo):
    // const rows = extractTransactions(text);
    // const { error: trErr } = await supa.from('transactions').insert(
    //   rows.map(r => ({ ...r, statement_id: statement.id }))
    // );
    // if (trErr) return NextResponse.json({ error: trErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, statementId: statement.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
