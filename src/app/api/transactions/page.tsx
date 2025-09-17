// src/app/admin/transactions/page.tsx
import 'server-only';
import { supabaseServer } from '@/lib/supabaseServer';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminTransactionsPage() {
  const supa = await supabaseServer();

  // Gate: must be signed in
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');

  // Latest statement
  const { data: latestStmt, error: stmtErr } = await supa
    .from('statements')
    .select('id, account_name, file_name, created_at')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (stmtErr) {
    return (
      <main className="vajra-shell">
        <div className="vajra-container">
          <section className="vajra-panel">
            <div className="vajra-toast" role="alert">
              Error loading statement: {stmtErr.message}
            </div>
          </section>
        </div>
      </main>
    );
  }
  if (!latestStmt) {
    return (
      <main className="vajra-shell">
        <div className="vajra-container">
          <section className="vajra-panel">
            <div className="space-y-3">
              <span className="vajra-kicker">Transactions</span>
              <p className="vajra-subtext">No statements yet. Upload one from the Admin dashboard.</p>
              <Link className="vajra-button" data-size="sm" href="/admin/upload">
                Upload a statement
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // Transactions for that statement
  const { data: txs, error: txErr } = await supa
    .from('transactions')
    .select('id, trx_date, description, credit, debit, balance, transaction_no, unique_key')
    .eq('statement_id', latestStmt.id)
    .order('trx_date', { ascending: true })
    .order('id', { ascending: true });

  if (txErr) {
    return (
      <main className="vajra-shell">
        <div className="vajra-container">
          <section className="vajra-panel">
            <div className="vajra-toast" role="alert">
              Error loading transactions: {txErr.message}
            </div>
          </section>
        </div>
      </main>
    );
  }

  const uploadedDisplay = new Date(latestStmt.created_at).toLocaleString();

  return (
    <main className="vajra-shell">
      <div className="vajra-container">
        <section className="vajra-panel" data-tone="sunrise">
          <div className="vajra-ornament" aria-hidden />
          <div className="space-y-4">
            <span className="vajra-kicker">Transactions</span>
            <h1 className="vajra-heading text-[clamp(1.9rem,4vw,2.4rem)]">Latest statement</h1>
            <p className="vajra-subtext">
              Review parsed entries before sharing reports. Adjust categories from the admin view
              after confirming each description and amount.
            </p>
            <div className="vajra-stat-grid">
              <div className="vajra-stat">
                <span className="vajra-stat__label">Statement ID</span>
                <span className="vajra-stat__value">{latestStmt.id}</span>
                <span className="vajra-hint">Unique identifier for this upload.</span>
              </div>
              <div className="vajra-stat">
                <span className="vajra-stat__label">Account</span>
                <span className="vajra-stat__value">{latestStmt.account_name}</span>
                <span className="vajra-hint">As provided during upload.</span>
              </div>
              <div className="vajra-stat">
                <span className="vajra-stat__label">Uploaded</span>
                <span className="vajra-stat__value">{uploadedDisplay}</span>
                <span className="vajra-hint">Local timezone display.</span>
              </div>
            </div>
            <p className="vajra-hint">Source file: {latestStmt.file_name}</p>
          </div>
        </section>

        <section className="vajra-panel">
          {!txs?.length ? (
            <div className="vajra-hint">No transactions parsed for this statement yet.</div>
          ) : (
            <div className="vajra-table-wrapper overflow-x-auto">
              <table className="vajra-table">
                <thead>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Description</th>
                    <th className="text-right">Credit</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Balance</th>
                    <th className="text-left">Txn No</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map(t => (
                    <tr key={t.id}>
                      <td>{t.trx_date}</td>
                      <td>{t.description ?? ''}</td>
                      <td className="text-right">{t.credit?.toLocaleString()}</td>
                      <td className="text-right">{t.debit?.toLocaleString()}</td>
                      <td className="text-right">{t.balance ?? ''}</td>
                      <td>{t.transaction_no ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
