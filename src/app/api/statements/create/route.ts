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

// Enhanced regex patterns for Vietnamese bank statements
// Look for transaction lines that start with date followed by bank/transaction info
const transactionLineRe = /^(\d{2}\/\d{2}\/\d{4})(.+?)(FT\d+|IBFT\d+|BFT\d+)(.+?)(\d{1,3}(?:,\d{3})*)(\d{1,3}(?:,\d{3})*)$/;
// Alternative pattern for lines with different formats
const altTransactionRe = /^(\d{2}\/\d{2}\/\d{4})(.+?)(\d{1,3}(?:,\d{3})*)(\d{1,3}(?:,\d{3})*)$/;
// Transaction number pattern
const txnNoRe = /(FT\d+|IBFT\d+|BFT\d+)/;
// Amount patterns (Vietnamese format with commas)
const amountRe = /(\d{1,3}(?:,\d{3})*)/g;

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
      // Skip header lines and empty lines
      if (line.length < 20 || line.includes('NGÂN HÀNG') || line.includes('BANK STATEMENT') || line.includes('Transaction Date')) {
        continue;
      }

      // Try to match the main transaction pattern first
      let match = line.match(transactionLineRe);
      if (match) {
        const [, dateStr, descriptionPart, txnNo, balancePart, creditStr, balanceStr] = match;
        
        // Parse date (DD/MM/YYYY format)
        const [day, month, year] = dateStr.split('/');
        const trxDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        // Extract description from the middle part
        let description = descriptionPart.trim();
        // Clean up the description
        description = description
          .replace(/\s+/g, ' ')
          .replace(/^NGAN HANG\s+/i, '')
          .replace(/^TMCP\s+/i, '')
          .trim();
        
        // Parse amounts
        const credit = parseInt(creditStr.replace(/,/g, '')) || 0;
        const balance = parseInt(balanceStr.replace(/,/g, '')) || null;
        
        // Determine if this is a debit or credit
        const debit = 0; // Based on the format, these appear to be credits
        
        candidates.push({
          statement_id: statementId,
          trx_date: trxDate,
          description: description || null,
          credit,
          debit,
          balance,
          transaction_no: txnNo,
        });
        continue;
      }

      // Try alternative pattern for different transaction formats
      match = line.match(altTransactionRe);
      if (match) {
        const [, dateStr, descriptionPart, amountStr1, amountStr2] = match;
        
        // Parse date (DD/MM/YYYY format)
        const [day, month, year] = dateStr.split('/');
        const trxDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        // Extract description
        let description = descriptionPart.trim();
        description = description.replace(/\s+/g, ' ').trim();
        
        // Parse amounts - determine which is credit/debit based on context
        const amount1 = parseInt(amountStr1.replace(/,/g, '')) || 0;
        const amount2 = parseInt(amountStr2.replace(/,/g, '')) || 0;
        
        // Look for transaction number in the description
        const txnMatch = description.match(txnNoRe);
        const transactionNo = txnMatch ? txnMatch[0] : null;
        
        // For now, assume first amount is credit, second is balance
        const credit = amount1;
        const debit = 0;
        const balance = amount2;
        
        candidates.push({
          statement_id: statementId,
          trx_date: trxDate,
          description: description || null,
          credit,
          debit,
          balance,
          transaction_no: transactionNo,
        });
        continue;
      }
    }

    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < candidates.length; i += batchSize) {
      const slice = candidates.slice(i, i + batchSize);
      if (!slice.length) continue;

      // For duplicate detection, we'll use a combination of statement_id, trx_date, amount, and transaction_no
      // First, check for existing transactions with the same transaction_no
      const transactionsToInsert = [];
      const transactionsToUpdate = [];
      
      for (const candidate of slice) {
        if (candidate.transaction_no) {
          // Check if transaction with this transaction_no already exists
          const { data: existing } = await supabase
            .from('transactions')
            .select('id, statement_id, trx_date, credit, debit, description')
            .eq('transaction_no', candidate.transaction_no)
            .single();
          
          if (existing) {
            // Update existing transaction if it's from a different statement or has different details
            if (existing.statement_id !== candidate.statement_id || 
                existing.trx_date !== candidate.trx_date ||
                existing.credit !== candidate.credit ||
                existing.debit !== candidate.debit ||
                existing.description !== candidate.description) {
              transactionsToUpdate.push({ ...candidate, id: existing.id });
            }
            // Skip if it's identical
          } else {
            transactionsToInsert.push(candidate);
          }
        } else {
          // For transactions without transaction_no, use the old method
          transactionsToInsert.push(candidate);
        }
      }
      
      let insertedCount = 0;
      
      // Insert new transactions
      if (transactionsToInsert.length > 0) {
        const { error: insErr, count } = await supabase
          .from('transactions')
          .upsert(transactionsToInsert, { onConflict: 'unique_key', ignoreDuplicates: true, count: 'exact' });
        
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
        insertedCount += count ?? 0;
      }
      
      // Update existing transactions
      for (const updateTx of transactionsToUpdate) {
        const { error: updateErr } = await supabase
          .from('transactions')
          .update({
            statement_id: updateTx.statement_id,
            trx_date: updateTx.trx_date,
            description: updateTx.description,
            credit: updateTx.credit,
            debit: updateTx.debit,
            balance: updateTx.balance
          })
          .eq('id', updateTx.id);
        
        if (updateErr) {
          console.log('Update error for transaction:', updateTx.id, updateErr);
        } else {
          insertedCount++;
        }
      }
      
      inserted += insertedCount;
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
