// src/app/api/statements/create/route.ts
export const runtime = 'nodejs'; // IMPORTANT: pdf-parse needs Node runtime
export const dynamic = 'force-dynamic';

import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getPdfParse } from '@/lib/pdfParse';
import { supabaseServerAdmin } from '@/lib/supabaseServer';

type ParsePdfFn = (buffer: Buffer) => Promise<{ text?: string }>; // compatible with pdf-parse result

export type StatementUploadDependencies = {
  createSupabaseClient: () => SupabaseClient;
  parsePdf?: ParsePdfFn;
  now: () => Date;
};

function createMockDependencies(): StatementUploadDependencies {
  let nextStatementId = 1;

  const client = {
    from(table: string) {
      if (table === 'statements') {
        return {
          insert: (payload: Record<string, unknown> | Array<Record<string, unknown>>) => ({
            select: () => ({
              single: async () => {
                const rows = Array.isArray(payload) ? payload : [payload];
                const [row] = rows;
                const data = { ...row, id: nextStatementId++ };
                return { data, error: null };
              },
            }),
          }),
        };
      }

      if (table === 'transactions') {
        return {
          upsert: async (rows: Array<Record<string, unknown>>) => ({
            error: null,
            count: rows.length,
          }),
        };
      }

      throw new Error(`Mock Supabase does not support table: ${table}`);
    },
  };

  return {
    createSupabaseClient: () => client as unknown as SupabaseClient,
    parsePdf: async () => ({ text: '2024-01-01 Mock Transaction +100.00' }),
    now: () => new Date(),
  };
}

const defaultDependencies: StatementUploadDependencies =
  process.env.MOCK_SUPABASE === '1'
    ? createMockDependencies()
    : {
        createSupabaseClient: () => supabaseServerAdmin(),
        now: () => new Date(),
      };

type TransactionRow = {
  statement_id: number;
  trx_date: string;
  description: string | null;
  credit: number;
  debit: number;
  balance: number | null;
  transaction_no: string | null;
};

// Enhanced regex patterns to handle multiple date formats including Vietnamese DD/MM/YYYY
const dateRe =
  /^(?<d>\d{1,2})[\/\-](?<m>\d{1,2})[\/\-](?<y>\d{4})\b|^(?<y2>\d{4})-(?<m2>\d{2})-(?<d2>\d{2})\b|(?<d3>\d{1,2})\/(?<m3>\d{1,2})\/(?<y3>\d{4})/;
// Enhanced amount regex to handle Vietnamese format with commas and various decimal places
const amtRe = /([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/;

function resolveStatementId(rawId: unknown): number | null {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) return rawId;
  if (typeof rawId === 'string') {
    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getFileName(file: Blob & Partial<File>): string {
  const name = typeof file.name === 'string' ? file.name.trim() : '';
  return name.length > 0 ? name : 'statement.pdf';
}

export async function handleStatementPost(
  request: Request,
  dependencies: StatementUploadDependencies = defaultDependencies
): Promise<Response> {
  try {
    const form = await request.formData();
    const fileEntry = form.get('file');
    const accountName = String(form.get('accountName') ?? '').trim();

    if (!(fileEntry instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!accountName) {
      return NextResponse.json({ error: 'accountName is required' }, { status: 400 });
    }

    const fileBlob = fileEntry as Blob & Partial<File>;
    const buf = Buffer.from(await fileBlob.arrayBuffer());
    const fileName = getFileName(fileBlob);

    const supabase = dependencies.createSupabaseClient();
    const createdAt = dependencies.now().toISOString();

    const { data: stmtIns, error: stmtErr } = await supabase
      .from('statements')
      .insert({
        account_name: accountName,
        file_name: fileName,
        created_at: createdAt,
      })
      .select('id')
      .single();

    const statementId = resolveStatementId(stmtIns?.id);
    if (stmtErr || statementId === null) {
      return NextResponse.json(
        { error: 'Failed to create statement', details: stmtErr ?? { message: 'Missing statement id' } },
        { status: 500 }
      );
    }

    const parsePdf = dependencies.parsePdf ?? ((await getPdfParse()) as ParsePdfFn);
    const parsed = await parsePdf(buf);
    const text = parsed.text ?? '';
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    const candidates: TransactionRow[] = [];

    for (const line of lines) {
      const dMatch = line.match(dateRe);
      const aMatch = line.match(amtRe);
      if (!dMatch || !aMatch) continue;

      const groups = dMatch.groups ?? {};
      // Handle different date formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY (Vietnamese)
      let year, month, day;
      
      if (groups.y2 && groups.m2 && groups.d2) {
        // YYYY-MM-DD format
        year = groups.y2;
        month = groups.m2;
        day = groups.d2;
      } else if (groups.y3 && groups.m3 && groups.d3) {
        // DD/MM/YYYY format (Vietnamese)
        year = groups.y3;
        month = groups.m3;
        day = groups.d3;
      } else if (groups.y && groups.m && groups.d) {
        // MM/DD/YYYY format
        year = groups.y;
        month = groups.m;
        day = groups.d;
      } else {
        continue;
      }
      
      if (!year || !month || !day) continue;

      const trxDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const amtStr = aMatch[0];
      // Remove commas and handle Vietnamese currency format
      const raw = amtStr.replace(/,/g, '').replace(/[^\d.-]/g, '');
      const amt = Number(raw);
      if (!Number.isFinite(amt)) continue;

      const credit = amt >= 0 ? amt : 0;
      const debit = amt < 0 ? Math.abs(amt) : 0;

      // Extract description by removing date and amount from the line
      let description = line.replace(dateRe, '').trim();
      // Remove the amount string from the description
      const tail = description.lastIndexOf(amtStr);
      if (tail >= 0) {
        description = description.slice(0, tail).trim();
      }
      // Clean up Vietnamese text and remove extra spaces
      description = description.replace(/\s+/g, ' ').trim();
      const normalizedDescription = description.length > 0 ? description : null;

      candidates.push({
        statement_id: statementId,
        trx_date: trxDate,
        description: normalizedDescription,
        credit,
        debit,
        balance: null,
        transaction_no: null,
      });
    }

    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < candidates.length; i += batchSize) {
      const slice = candidates.slice(i, i + batchSize);
      if (!slice.length) continue;

      const { error: insErr, count } = await supabase
        .from('transactions')
        .upsert(slice, { onConflict: 'unique_key', ignoreDuplicates: true, count: 'exact' });

      if (insErr) {
        return NextResponse.json(
          {
            statement_id: statementId,
            parsed_rows: candidates.length,
            inserted_rows: inserted,
            error: 'Insert error',
            details: insErr,
          },
          { status: 207 }
        );
      }

      inserted += count ?? 0;
    }

    return NextResponse.json({
      statement_id: statementId,
      parsed_rows: candidates.length,
      inserted_rows: inserted,
      ok: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = async (request: Request) => handleStatementPost(request);
