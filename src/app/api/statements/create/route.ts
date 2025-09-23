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
// Look for lines that start with date and contain transaction info
const dateRe = /^(\d{2}\/\d{2}\/\d{4})/;
// Transaction number pattern for Vietnamese banks - FT followed by digits, optionally ending with \BNK
const txnNoRe = /(FT\d+(?:\\BNK)?|IBFT\d+(?:\\BNK)?|BFT\d+(?:\\BNK)?)/;
// Amount patterns - Vietnamese format with commas as thousands separators
const amountRe = /(\d{1,3}(?:,\d{3})*)/g;
// Alternative amount pattern for amounts without commas
const amountReSimple = /(\d+)/g;
// Look for lines that have both date and amounts
const transactionLineRe = /^(\d{2}\/\d{2}\/\d{4}).*?(\d{1,3}(?:,\d{3})*).*?(\d{1,3}(?:,\d{3})*)$/;

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

    // Helper function to parse amounts from text
    function parseAmounts(text: string): number[] {
      // Try multiple amount patterns
      let amounts = text.match(amountRe);
      if (!amounts || amounts.length === 0) {
        amounts = text.match(amountReSimple);
      }
      
      if (amounts) {
        return amounts.map(amt => {
          const cleanAmt = amt.replace(/,/g, '');
          const num = parseFloat(cleanAmt);
          return Math.round(num);
        }).filter(amt => amt > 0);
      }
      return [];
    }

    // Helper function to determine debit/credit from Vietnamese keywords
    function determineDebitCredit(text: string, amounts: number[]): { debit: number; credit: number; balance: number } {
      const lineText = text.toLowerCase();
      let debit = 0;
      let credit = 0;
      let balance = 0;
      
      if (amounts.length >= 3) {
        debit = amounts[0];
        credit = amounts[1];
        balance = amounts[2];
      } else if (amounts.length === 2) {
        if (lineText.includes('chi') || lineText.includes('rut') || lineText.includes('debit') ||
            lineText.includes('thanh toan') || lineText.includes('chuyen tien') || lineText.includes('rut tien')) {
          debit = amounts[0];
          balance = amounts[1];
        } else if (lineText.includes('thu') || lineText.includes('nap') || lineText.includes('credit') ||
                   lineText.includes('nhan tien') || lineText.includes('nap tien') || lineText.includes('thu tien')) {
          credit = amounts[0];
          balance = amounts[1];
        } else {
          debit = amounts[0];
          balance = amounts[1];
        }
      } else if (amounts.length === 1) {
        if (lineText.includes('chi') || lineText.includes('rut') || lineText.includes('debit') ||
            lineText.includes('thanh toan') || lineText.includes('chuyen tien') || lineText.includes('rut tien')) {
          debit = amounts[0];
        } else if (lineText.includes('thu') || lineText.includes('nap') || lineText.includes('credit') ||
                   lineText.includes('nhan tien') || lineText.includes('nap tien') || lineText.includes('thu tien')) {
          credit = amounts[0];
        } else {
          debit = amounts[0];
        }
      }
      
      return { debit, credit, balance };
    }

    // Parse Vietnamese bank statement format
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip obviously non-transaction lines
      if (line.length < 5 || 
          line.includes('NGÂN HÀNG') || 
          line.includes('BANK STATEMENT') || 
          line.includes('Customer name') ||
          line.includes('Account no') ||
          line.includes('Opening balance') ||
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

      // Parse date (DD/MM/YYYY format)
      const [day, month, year] = dateMatch[1].split('/');
      const trxDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      console.log(`Processing line ${i}: "${line}"`);

      // For Vietnamese bank statements, we need to parse the structured format
      // The line should contain: Date, Remitter, Remitter Bank, Details, Transaction No, Debit, Credit, Balance
      
      let description = '';
      let transactionNo = null;
      let debit = 0;
      let credit = 0;
      let balance = 0;
      
      // Look for transaction number first
      const txnMatch = line.match(txnNoRe);
      if (txnMatch) {
        transactionNo = txnMatch[1];
        console.log(`Found transaction number: ${transactionNo}`);
      }
      
      // Parse amounts from the line
      const amounts = line.match(amountRe);
      console.log(`Amounts found:`, amounts);
      
      if (amounts && amounts.length >= 2) {
        // In Vietnamese bank statements, typically: Credit, Balance
        // Debit is usually empty for credit transactions
        const parsedAmounts = amounts.map(amt => parseInt(amt.replace(/,/g, ''))).filter(amt => amt > 0);
        console.log(`Parsed amounts:`, parsedAmounts);
        
        if (parsedAmounts.length >= 2) {
          // First amount is usually credit, second is balance
          credit = parsedAmounts[0];
          balance = parsedAmounts[1];
          console.log(`Set credit=${credit}, balance=${balance}`);
        } else if (parsedAmounts.length === 1) {
          // Single amount - determine if it's debit or credit based on context
          const lineText = line.toLowerCase();
          if (lineText.includes('chi') || lineText.includes('rut') || lineText.includes('debit') ||
              lineText.includes('thanh toan') || lineText.includes('chuyen tien') || lineText.includes('rut tien')) {
            debit = parsedAmounts[0];
            console.log(`Set debit=${debit}`);
          } else {
            credit = parsedAmounts[0];
            console.log(`Set credit=${credit}`);
          }
        }
      }
      
      // Extract description by removing date, amounts, and transaction number
      let lineDescription = line.replace(dateRe, '').trim();
      
      // Remove amounts from description
      if (amounts) {
        amounts.forEach(amt => {
          lineDescription = lineDescription.replace(amt, '').trim();
        });
      }
      
      // Remove transaction number from description
      if (txnMatch) {
        lineDescription = lineDescription.replace(txnMatch[1], '').trim();
      }
      
      // Clean up description
      lineDescription = lineDescription.replace(/\s+/g, ' ').trim();
      
      if (lineDescription && lineDescription.length > 3) {
        description = lineDescription;
      }
      
      // If we don't have enough data, look at next lines
      if (!description || (debit === 0 && credit === 0)) {
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const nextLine = lines[j];
          
          // Stop if we hit another date
          if (nextLine.match(dateRe)) {
            break;
          }
          
          // Look for transaction number
          if (!transactionNo) {
            const txnMatch = nextLine.match(txnNoRe);
            if (txnMatch) {
              transactionNo = txnMatch[1];
            }
          }
          
          // Look for amounts if we don't have them yet
          if (debit === 0 && credit === 0) {
            const nextLineAmounts = nextLine.match(amountRe);
            if (nextLineAmounts && nextLineAmounts.length >= 2) {
              const parsedAmounts = nextLineAmounts.map(amt => parseInt(amt.replace(/,/g, ''))).filter(amt => amt > 0);
              if (parsedAmounts.length >= 2) {
                credit = parsedAmounts[0];
                balance = parsedAmounts[1];
              }
            }
          }
          
          // Collect description text
          if (!description && nextLine.length > 3 && !nextLine.match(/^\d+$/) && !nextLine.includes('\\BNK')) {
            description = nextLine.trim();
          }
        }
      }
      
      // Create transaction if we have meaningful data
      if (description && description.length > 3 && (debit > 0 || credit > 0)) {
        // Clean up description
        description = description
          .replace(/\s+/g, ' ')
          .replace(/^NGAN HANG\s+/i, '')
          .replace(/^TMCP\s+/i, '')
          .replace(/\\BNK.*$/, '')
          .trim();

        console.log(`Creating transaction: date=${trxDate}, description="${description}", credit=${credit}, debit=${debit}, balance=${balance}, txnNo=${transactionNo}`);

        candidates.push({
          statement_id: statementId,
          trx_date: trxDate,
          description: description || null,
          credit,
          debit,
          balance,
          transaction_no: transactionNo,
        });
      }
    }

    // If no candidates found with the main logic, try a more permissive approach
    if (candidates.length === 0) {
      console.log('No candidates found with main logic, trying fallback approach...');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Only skip obviously non-transaction lines
        if (line.length < 5 || 
            line.includes('NGÂN HÀNG') || 
            line.includes('BANK STATEMENT') || 
            line.includes('Customer name') ||
            line.includes('Account no') ||
            line.includes('Opening balance') ||
            line.includes('Ending balance')) {
          continue;
        }

        // Check if line contains a date anywhere
        const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (!dateMatch) continue;

        // Parse date (DD/MM/YYYY format)
        const [day, month, year] = dateMatch[1].split('/');
        const trxDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Parse amounts using helper function
        const parsedAmounts = parseAmounts(line);
        if (parsedAmounts.length === 0) continue;

        // Look for transaction number
        const txnMatch = line.match(txnNoRe);
        const transactionNo = txnMatch ? txnMatch[1] : null;
        
        // Extract description - remove date, amounts, and transaction number
        let description = line.replace(/(\d{2}\/\d{2}\/\d{4})/, '').trim();
        
        // Remove amounts from description
        const amountsInLine = line.match(amountRe) || line.match(amountReSimple) || [];
        amountsInLine.forEach(amt => {
          description = description.replace(amt, '').trim();
        });
        
        // Remove transaction number from description
        if (txnMatch) {
          description = description.replace(txnMatch[1], '').trim();
        }
        
        description = description.replace(/\s+/g, ' ').trim();
        
        if (description && description.length > 3) {
          // Determine debit/credit using helper function
          const { debit, credit, balance } = determineDebitCredit(line, parsedAmounts);

          // Clean up description
          description = description
            .replace(/\s+/g, ' ')
            .replace(/^NGAN HANG\s+/i, '')
            .replace(/^TMCP\s+/i, '')
            .replace(/\\BNK.*$/, '')
            .trim();

          candidates.push({
            statement_id: statementId,
            trx_date: trxDate,
            description: description || null,
            credit,
            debit,
            balance,
            transaction_no: transactionNo,
          });
        }
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
      debug: {
        total_lines: lines.length,
        candidates_sample: candidates.slice(0, 3),
        lines_with_dates: lines.filter(line => line.match(dateRe)).slice(0, 5)
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = async (request: Request) => handleStatementPost(request);
