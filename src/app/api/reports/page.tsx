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
      } catch (error: unknown) {
        setErr(error instanceof Error ? error.message : "Failed to load reports");
      }
    })();
  }, []);

  return (
    <main className="vajra-shell">
      <div className="vajra-container">
        <section className="vajra-panel" data-tone="sunrise">
          <div className="vajra-ornament" aria-hidden />
          <div className="space-y-4">
            <span className="vajra-kicker">Insight reports</span>
            <h1 className="vajra-heading text-[clamp(1.9rem,4vw,2.4rem)]">Monthly balance overview</h1>
            <p className="vajra-subtext">
              Understand the flow of dana and operations at a glance. Summary tiles show totals,
              while the table below reveals how each category contributes toward intentions.
            </p>
            {err && (
              <div className="vajra-toast" role="alert">
                {err}
              </div>
            )}
          </div>
        </section>

        <section className="vajra-panel">
          <div className="space-y-6">
            <div className="vajra-stat-grid">
              <div className="vajra-stat">
                <span className="vajra-stat__label">Total in</span>
                <span className="vajra-stat__value">{summary?.total_in?.toLocaleString() ?? '—'}</span>
                <span className="vajra-hint">Includes all income categories.</span>
              </div>
              <div className="vajra-stat">
                <span className="vajra-stat__label">Total out</span>
                <span className="vajra-stat__value">{summary?.total_out?.toLocaleString() ?? '—'}</span>
                <span className="vajra-hint">Covers expenses and operational spend.</span>
              </div>
              <div className="vajra-stat">
                <span className="vajra-stat__label">Net balance</span>
                <span className="vajra-stat__value">{summary?.net?.toLocaleString() ?? '—'}</span>
                <span className="vajra-hint">Positive numbers indicate surplus.</span>
              </div>
            </div>

            <div className="vajra-table-wrapper overflow-x-auto">
              <table className="vajra-table">
                <thead>
                  <tr>
                    <th className="text-left">Type</th>
                    <th className="text-left">Category</th>
                    <th className="text-right">Total in</th>
                    <th className="text-right">Total out</th>
                    <th className="text-right">Net</th>
                    <th className="text-right">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.type ?? '-'}</td>
                      <td>{r.category ?? '(uncategorised)'}</td>
                      <td className="text-right">{(r.total_in ?? 0).toLocaleString()}</td>
                      <td className="text-right">{(r.total_out ?? 0).toLocaleString()}</td>
                      <td className="text-right">{(r.net ?? 0).toLocaleString()}</td>
                      <td className="text-right">{(r.target_amount ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
