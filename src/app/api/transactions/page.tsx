// src/app/admin/transactions/page.tsx
import 'server-only';
import { supabaseServer } from '@/lib/supabaseServer';
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
    return <div className="p-6 text-red-600">Error loading statement: {stmtErr.message}</div>;
  }
  if (!latestStmt) {
    return <div className="p-6">No statements yet. Upload one from the Admin dashboard.</div>;
  }

  // Transactions for that statement
  const { data: txs, error: txErr } = await supa
    .from('transactions')
    .select('id, trx_date, description, credit, debit, balance, transaction_no, unique_key')
    .eq('statement_id', latestStmt.id)
    .order('trx_date', { ascending: true })
    .order('id', { ascending: true });

  if (txErr) {
    return <div className="p-6 text-red-600">Error loading transactions: {txErr.message}</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Transactions – Latest Statement</h1>
      <div className="text-sm text-gray-600">
        <div><span className="font-medium">Statement ID:</span> {latestStmt.id}</div>
        <div><span className="font-medium">Account:</span> {latestStmt.account_name}</div>
        <div><span className="font-medium">File:</span> {latestStmt.file_name}</div>
        <div><span className="font-medium">Uploaded:</span> {new Date(latestStmt.created_at).toLocaleString()}</div>
      </div>

      {!txs?.length ? (
        <div className="text-gray-600">No transactions parsed for this statement yet.</div>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-right">Credit</th>
                <th className="px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2 text-left">Txn No</th>
              </tr>
            </thead>
            <tbody>
              {txs.map(t => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2">{t.trx_date}</td>
                  <td className="px-3 py-2">{t.description ?? ''}</td>
                  <td className="px-3 py-2 text-right">{t.credit?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{t.debit?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{t.balance ?? ''}</td>
                  <td className="px-3 py-2">{t.transaction_no ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
