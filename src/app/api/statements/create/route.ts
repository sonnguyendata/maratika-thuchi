// src/app/api/statements/create/route.ts
import { NextResponse } from 'next/server';
//import { supabaseServerAdmin } from '@/lib/supabaseServer';
import pdf from 'pdf-parse'; // if you parse PDFs here

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const accountName = (form.get('accountName') as string | null)?.trim();

    if (!file || !accountName) {
      return NextResponse.json({ error: 'Missing file or accountName' }, { status: 400 });
    }

    // Example: read bytes for parsing
    const buf = Buffer.from(await file.arrayBuffer());

    // Parse PDF…
    // const parsed = await pdf(buf);
    // const txns = parseYourBankText(parsed.text);

    // Insert to DB, etc.
    const supa = supabaseServerAdmin();
    // await supa.from('statements').insert(...);
    // await supa.from('transactions').insert(txns);

    return NextResponse.json({ ok: true, inserted: /* txns.length */ 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
