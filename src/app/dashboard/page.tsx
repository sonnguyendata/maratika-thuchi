import Link from 'next/link';

const statPlaceholders = [
  { label: 'Total in', value: '—', hint: 'Connect a statement to populate.' },
  { label: 'Total out', value: '—', hint: 'Upload the latest PDF first.' },
  { label: 'Net balance', value: '—', hint: 'Net updates after parsing.' },
];

export default function Dashboard() {
  return (
    <main className="vajra-shell">
      <div className="vajra-container">
        <section className="vajra-panel" data-tone="sunrise">
          <div className="vajra-ornament" aria-hidden />
          <div className="space-y-4">
            <span className="vajra-kicker">Community pulse</span>
            <h1 className="vajra-heading text-[clamp(1.9rem,4vw,2.4rem)]">Finance dashboard</h1>
            <p className="vajra-subtext">
              Once statements are ingested the dashboard will surface totals and trends for the
              sangha at a glance. Share it as a read-only window into collective generosity.
            </p>
            <Link href="/api/reports" className="vajra-button" data-size="sm">
              Explore admin reports
            </Link>
          </div>
        </section>

        <section className="vajra-panel">
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="vajra-kicker">At a glance</span>
              <span className="vajra-hint">Values appear after the first upload completes.</span>
            </div>
            <div className="vajra-stat-grid">
              {statPlaceholders.map(item => (
                <div className="vajra-stat" key={item.label}>
                  <span className="vajra-stat__label">{item.label}</span>
                  <span className="vajra-stat__value">{item.value}</span>
                  <span className="vajra-hint">{item.hint}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/upload" className="vajra-button" data-size="sm">
                Upload a statement
              </Link>
              <Link href="/api/transactions" className="vajra-button vajra-button--ghost" data-size="sm">
                Review latest transactions
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}