'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

type Summary = { total_in: number; total_out: number; net: number; };

export default function AdminHome() {
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/me").then(r => r.json());
        setRole(me?.role ?? null);
        setEmail(me?.user?.email ?? null);
        const s = await fetch("/api/reports/summary").then(r => r.json());
        if (s?.error) throw new Error(s.error);
        setSummary(s);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load");
      }
    })();
  }, []);

  if (role !== "admin") {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="p-3 border rounded bg-amber-50">
          {email
            ? <>Your account <b>{email}</b> is not an admin. Please ask an admin to grant access.</>
            : <>You’re not signed in. Please <Link className="underline" href="/login">log in</Link>.</>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">Signed in as {email}</div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi title="Total In" value={summary?.total_in} />
        <Kpi title="Total Out" value={summary?.total_out} />
        <Kpi title="Net" value={summary?.net} />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ActionCard
          title="Upload Bank Statement (PDF)"
          desc="Parse PDF, store file, and insert transactions. Duplicates auto-skip."
          href="/upload"
          cta="Go to Upload"
        />
        <ActionCard
          title="Categorize & Hide Transactions"
          desc="Assign categories, hide non-report items, search & filter."
          href="/admin/transactions"
          cta="Manage Transactions"
        />
        <ActionCard
          title="Manage Categories"
          desc="Create, rename, delete categories and set targets."
          href="/admin/categories"
          cta="Manage Categories"
        />
        <ActionCard
          title="Reports"
          desc="Totals and by-category breakdowns."
          href="/reports"
          cta="View Reports"
        />
        <ActionCard
          title="Export Data (coming soon)"
          desc="CSV export for sharing or backups."
          href="#"
          cta="(Soon)"
          disabled
        />
        <ActionCard
          title="User Access (coming soon)"
          desc="Grant admin role to a signed-up user."
          href="#"
          cta="(Soon)"
          disabled
        />
      </div>

      {err && <div className="p-3 border rounded text-red-600">{err}</div>}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value?: number | null }) {
  return (
    <div className="p-4 border rounded">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value != null ? value.toLocaleString() : "-"}</div>
    </div>
  );
}

function ActionCard({
  title, desc, href, cta, disabled,
}: { title: string; desc: string; href: string; cta: string; disabled?: boolean }) {
  return (
    <div className={`p-5 border rounded-lg ${disabled ? 'opacity-50' : ''}`}>
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-sm text-gray-600 mt-2">{desc}</p>
      <div className="mt-4">
        {disabled ? (
          <button className="px-3 py-2 border rounded cursor-not-allowed">{cta}</button>
        ) : (
          <Link href={href} className="px-3 py-2 border rounded hover:bg-gray-50 inline-block">
            {cta}
          </Link>
        )}
      </div>
    </div>
  );
}
