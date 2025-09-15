'use client';

import { useEffect, useMemo, useState } from "react";

type Tx = {
  id: number;
  trx_date: string;
  description: string | null;
  credit: number | null;
  debit: number | null;
  balance: number | null;
  transaction_no: string | null;
  category_id: number | null;
  hidden: boolean | null;
};

type Category = { id: number; name: string; type: 'income'|'expense' };

export default function AdminTransactionsPage() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [onlyUncat, setOnlyUncat] = useState(false);
  const [err, setErr] = useState("");

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (onlyUncat && r.category_id) return false;
      if (!q) return true;
      const hay = `${r.description ?? ""} ${r.transaction_no ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [rows, q, onlyUncat]);

  useEffect(() => {
    (async () => {
      try {
        const [txr, cr] = await Promise.all([
          fetch("/api/admin/transactions/list").then(r => r.json()),
          fetch("/api/admin/categories/list").then(r => r.json()),
        ]);
        if (txr?.error) throw new Error(txr.error);
        if (cr?.error) throw new Error(cr.error);
        setRows(txr);
        setCats(cr);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load");
      }
    })();
  }, []);

  async function saveRow(id: number, patch: Partial<Tx>) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(r => r.json());
    if (res?.error) alert(res.error);
    setRows(prev => prev.map(x => x.id === id ? { ...x, ...patch } as Tx : x));
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin • Transactions</h1>

      {err && <div className="p-3 border rounded text-red-600">{err}</div>}

      <div className="flex gap-3">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search description / transaction no…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={onlyUncat} onChange={e => setOnlyUncat(e.target.checked)} />
          Only uncategorized
        </label>
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Description</th>
              <th className="text-right p-2">Credit</th>
              <th className="text-right p-2">Debit</th>
              <th className="text-left p-2">Category</th>
              <th className="text-center p-2">Hidden</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{r.trx_date}</td>
                <td className="p-2">{r.description}</td>
                <td className="p-2 text-right">{(r.credit ?? 0).toLocaleString()}</td>
                <td className="p-2 text-right">{(r.debit ?? 0).toLocaleString()}</td>
                <td className="p-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={String(r.category_id ?? "")}
                    onChange={e => saveRow(r.id, { category_id: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">— choose —</option>
                    {cats.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(r.hidden)}
                    onChange={e => saveRow(r.id, { hidden: e.target.checked })}
                  />
                </td>
                <td className="p-2 text-right">
                  <code className="text-xs text-gray-500">#{r.id}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
