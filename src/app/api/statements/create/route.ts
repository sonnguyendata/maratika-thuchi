// src/app/api/statements/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { supabaseServerAdmin } from '@/lib/supabaseServer';

/**
 * POST /api/statements/create
 * FormData:
 *  - file: PDF
 *  - accountName: string (e.g., "Cherry's Techcombank")
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const accountName = String(form.get('accountName') ?? '').trim();

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!accountName) {
      return NextResponse.json({ error: 'accountName is required' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || 'statement.pdf';

    // 1) Insert a minimal statement row first (so we have statement_id)
    const supa = supabaseServerAdmin();
    const { data: stmtIns, error: stmtErr } = await supa
      .from('statements')
      .insert({
        account_name: accountName,
        file_name: fileName,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (stmtErr || !stmtIns) {
      return NextResponse.json({ error: 'Failed to create statement', details: stmtErr }, { status: 500 });
    }

    const statementId = stmtIns.id as number;

    // 2) Parse the PDF text
    const parsed = await pdf(buf);
    const text = parsed.text || '';

    // 3) Very simple line parser:
    //    Looks for lines that start with a date, then has description, then an amount.
    //    Adjust this for your bank’s exact layout as needed.
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    type Row = {
      statement_id: number;
      trx_date: string;         // YYYY-MM-DD
      description: string | null;
      credit: number;
      debit: number;
      balance: number | null;
      transaction_no: string | null;
    };

    const candidates: Row[] = [];

    // Match dates like: 15/08/2025 or 15-08-2025 or 2025-08-15
    const dateRe =
      /^(?<d>\d{1,2})[\/\-](?<m>\d{1,2})[\/\-](?<y>\d{4})\b|^(?<y2>\d{4})-(?<m2>\d{2})-(?<d2>\d{2})\b/;

    // Match amount like: 1,234.56 or -1,234.56
    const amtRe = /[-+]?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})|\d+(?:\.\d{1,2})/;

    for (const line of lines) {
      const dMatch = line.match(dateRe);
      const aMatch = line.match(amtRe);

      if (!dMatch || !aMatch) continue;

      // Normalize date to YYYY-MM-DD
      let y: string, m: string, d: string;
      if (dMatch.groups?.y2) {
        y = dMatch.groups.y2;
        m = dMatch.groups.m2;
        d = dMatch.groups.d2;
      } else {
        const dd = dMatch.groups!;
        y = dd.y;
        m = dd.m.padStart(2, '0');
        d = dd.d.padStart(2, '0');
      }
      const trx_date = `${y}-${m}-${d}`;

      // Pull description = line minus the date and the 1st amount we found
      const lineNoDate = line.replace(dateRe, '').trim();
      let description = lineNoDate;
      // if the amount appears at the end, try to remove it from description tail
      const amtStr = aMatch[0];
      const tail = description.lastIndexOf(amtStr);
      if (tail >= 0) {
        description = description.slice(0, tail).trim();
      }
      if (!description) description = null;

      // Normalize amount
      const raw = amtStr.replace(/,/g, '');
      const amt = Number(raw);
      const credit = amt >= 0 ? amt : 0;
      const debit = amt < 0 ? Math.abs(amt) : 0;

      candidates.push({
        statement_id: statementId,
        trx_date,
        description,
        credit,
        debit,
        balance: null,
        transaction_no: null,
      });
    }

    // 4) Insert in batches; rely on trigger to fill unique_key; dedupe via upsert on unique_key
    //    (We created a UNIQUE index on unique_key earlier.)
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < candidates.length; i += batchSize) {
      const slice = candidates.slice(i, i + batchSize);
      if (!slice.length) continue;

      const { error: insErr, count } = await supa
        .from('transactions')
        .upsert(slice, { onConflict: 'unique_key', ignoreDuplicates: true, count: 'exact' });

      if (insErr) {
        // If parsing is imperfect, we still want to keep the statement row.
        // Return partial success with details.
        return NextResponse.json(
          {
            statement_id: statementId,
            parsed_rows: candidates.length,
            inserted_rows: inserted,
            error: 'Insert error',
            details: insErr,
          },
          { status: 207 } // Multi-Status: partial success
        );
      }
      inserted += count ?? 0;
    }

    return NextResponse.json({
      statement_id: statementId,
      parsed_rows: candidates.length,
      inserted_rows: inserted,
      message: 'OK',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
