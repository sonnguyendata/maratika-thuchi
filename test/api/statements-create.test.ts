import { describe, expect, it } from 'vitest';

import { handleStatementPost, type StatementUploadDependencies } from '@/app/api/statements/create/route';

type MutableRecord = Record<string, unknown>;

function createRequest(formData: FormData) {
  return new Request('http://localhost/api/statements/create', {
    method: 'POST',
    body: formData,
  });
}

function createBaseDeps(overrides: Partial<StatementUploadDependencies> = {}): StatementUploadDependencies {
  return {
    createSupabaseClient: () => {
      throw new Error('createSupabaseClient should not be called');
    },
    parsePdf: async () => ({ text: '' }),
    now: () => new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('handleStatementPost', () => {
  it('returns 400 when file is missing', async () => {
    const form = new FormData();
    form.set('accountName', 'Test Account');

    const response = await handleStatementPost(createRequest(form), createBaseDeps());

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'No file uploaded' });
  });

  it('returns 400 when accountName is missing', async () => {
    const form = new FormData();
    const file = new File([new Uint8Array([1, 2, 3])], 'missing-name.pdf', { type: 'application/pdf' });
    form.set('file', file);

    const response = await handleStatementPost(createRequest(form), createBaseDeps());

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'accountName is required' });
  });

  it('returns 500 when the statement insert fails', async () => {
    const form = new FormData();
    const file = new File([new Uint8Array([1, 2, 3])], 'insert-fail.pdf', { type: 'application/pdf' });
    form.set('file', file);
    form.set('accountName', 'Example');

    const deps = createBaseDeps({
      createSupabaseClient: () => ({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'insert failed' } }),
            }),
          }),
        }),
      }),
    });

    const response = await handleStatementPost(createRequest(form), deps);

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: 'Failed to create statement' });
  });

  it('inserts transactions parsed from the PDF text', async () => {
    const form = new FormData();
    const file = new File([new Uint8Array([1, 2, 3])], 'statement.pdf', { type: 'application/pdf' });
    form.set('file', file);
    form.set('accountName', '  Checking  ');

    const insertedStatements: MutableRecord[] = [];
    const transactionBatches: MutableRecord[][] = [];

    const deps = createBaseDeps({
      parsePdf: async () => ({
        text: [
          '2024-01-05 Grocery Store -12.34', 
          '2024-01-06 Paycheck +200.00',
          '01/08/2025 CHUYỂN KHOẢN NHẬN TIỀN +500,000.00',
          '02/08/2025 RÚT TIỀN ATM -200,000.00',
          'Random line'
        ].join('\n'),
      }),
      createSupabaseClient: () => ({
        from: (table: string) => {
          if (table === 'statements') {
            return {
              insert: (payload: MutableRecord | MutableRecord[]) => {
                const row = Array.isArray(payload) ? payload[0] : payload;
                const record = { ...row, id: 42 };
                insertedStatements.push(record);
                return {
                  select: () => ({
                    single: async () => ({ data: record, error: null }),
                  }),
                };
              },
            };
          }

          if (table === 'transactions') {
            return {
              upsert: async (rows: MutableRecord[]) => {
                transactionBatches.push([...rows]);
                return { error: null, count: rows.length };
              },
            };
          }

          throw new Error(`Unexpected table ${table}`);
        },
      }),
      now: () => new Date('2024-02-01T12:00:00.000Z'),
    });

    const response = await handleStatementPost(createRequest(form), deps);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      statement_id: 42,
      parsed_rows: 4,
      inserted_rows: 4,
      ok: true,
    });

    expect(insertedStatements).toHaveLength(1);
    expect(insertedStatements[0]).toMatchObject({
      account_name: 'Checking',
      file_name: 'statement.pdf',
      created_at: '2024-02-01T12:00:00.000Z',
      id: 42,
    });

    expect(transactionBatches).toHaveLength(1);
    expect(transactionBatches[0]).toHaveLength(4);
    
    // Check the first transaction (US format)
    expect(transactionBatches[0][0]).toMatchObject({
      statement_id: 42,
      trx_date: '2024-01-05',
      debit: 12.34,
      credit: 0,
      description: 'Grocery Store',
    });
    
    // Check the second transaction (US format)
    expect(transactionBatches[0][1]).toMatchObject({
      statement_id: 42,
      trx_date: '2024-01-06',
      credit: 200,
      debit: 0,
      description: 'Paycheck',
    });
    
    // Check the third transaction (Vietnamese format)
    expect(transactionBatches[0][2]).toMatchObject({
      statement_id: 42,
      trx_date: '2025-08-01',
      credit: 500000,
      debit: 0,
      description: 'CHUYỂN KHOẢN NHẬN TIỀN',
    });
    
    // Check the fourth transaction (Vietnamese format)
    expect(transactionBatches[0][3]).toMatchObject({
      statement_id: 42,
      trx_date: '2025-08-02',
      debit: 200000,
      credit: 0,
      description: 'RÚT TIỀN ATM',
    });
  });

  it('returns 207 when transaction upsert fails mid-way', async () => {
    const form = new FormData();
    const file = new File([new Uint8Array([1, 2, 3])], 'statement.pdf', { type: 'application/pdf' });
    form.set('file', file);
    form.set('accountName', 'Example');

    const deps = createBaseDeps({
      parsePdf: async () => ({ text: '2024-01-05 Grocery -12.34\n2024-01-06 Paycheck +200.00\n01/08/2025 CHUYỂN KHOẢN +500,000.00' }),
      createSupabaseClient: () => ({
        from: (table: string) => {
          if (table === 'statements') {
            return {
              insert: (payload: MutableRecord | MutableRecord[]) => ({
                select: () => ({
                  single: async () => ({ data: { ...(Array.isArray(payload) ? payload[0] : payload), id: 7 }, error: null }),
                }),
              }),
            };
          }

          if (table === 'transactions') {
            return {
              upsert: async () => ({ error: { message: 'duplicate key' }, count: 0 }),
            };
          }

          throw new Error(`Unexpected table ${table}`);
        },
      }),
    });

    const response = await handleStatementPost(createRequest(form), deps);

    expect(response.status).toBe(207);
    expect(await response.json()).toMatchObject({
      statement_id: 7,
      parsed_rows: 3,
      inserted_rows: 0,
      error: 'Insert error',
    });
  });
});
