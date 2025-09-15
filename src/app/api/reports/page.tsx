'use client';

import { useEffect, useState } from "react";

type Summary = { total_in: number; total_out: number; net: number; };
type Row = { category: string | null; type: 'income'|'expense'|null; target_amount: number|null;
  total_in: number|null; total_out: number|null; net: number|null; };

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch("/api/reports/summary").then(r => r.json());
        if (s?.error) throw new Error(s.error);
        setSummary(s);
        const c = await fetch("/api/reports/by-category").then(r => r.json());
        if (c?.error) throw new Error(c.error);
        setRows(c);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load reports");
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>

      {err && <div className="p-3 border rounded text-red-600">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total In</div>
          <div className="text-xl font-bold">{summary?.total_in?.toLocaleString() ?? "-"}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total Out</div>
          <div className="text-xl font-bold">{summary?.total_out?.toLocaleString() ?? "-"}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Net</div>
          <div className="text-xl font-bold">{summary?.net?.toLocaleString() ?? "-"}</div>
        </div>
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Category</th>
              <th className="text-right p-2">Total In</th>
              <th className="text-right p-2">Total Out</th>
              <th className="text-right p-2">Net</th>
              <th className="text-right p-2">Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{r.type ?? "-"}</td>
                <td className="p-2">{r.category ?? "(uncategorized)"}</td>
                <td className="p-2 text-right">{(r.total_in ?? 0).toLocaleString()}</td>
                <td className="p-2 text-right">{(r.total_out ?? 0).toLocaleString()}</td>
                <td className="p-2 text-right">{(r.net ?? 0).toLocaleString()}</td>
                <td className="p-2 text-right">{(r.target_amount ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
