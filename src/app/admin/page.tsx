// Server component: protects the /admin page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function AdminPage() {
  const supabase = await supabaseServer();

  // Server-side auth check (relies on cookies set by /api/auth)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Optional: restrict to admin email via env
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    redirect('/'); // not an admin
  }

  const displayName = user.email ?? 'Treasurer';

  const cards: Array<{ title: string; desc: string; href: string; icon: string }> = [
    {
      href: '/admin/upload',
      title: 'Upload statement',
      desc: 'Bring a new PDF into the treasury. The Vajra pipeline parses, deduplicates, and stores transactions automatically.',
      icon: '📜',
    },
    {
      href: '/admin/categories',
      title: 'Manage categories',
      desc: 'Shape or retune the categories that organise giving, projects, and household outgoings.',
      icon: '🪷',
    },
    {
      href: '/admin/users',
      title: 'Manage users',
      desc: 'Invite caretakers or retire access. Audit-ready metadata keeps the sangha accountable.',
      icon: '👥',
    },
    {
      href: '/api/reports',
      title: 'Reports',
      desc: 'Illuminate inflow, outflow, and net balance by category with gentle variance cues.',
      icon: '🔱',
    },
    {
      href: '/api/transactions',
      title: 'Transactions',
      desc: 'Review parsed entries from the latest statement and tidy descriptions or references.',
      icon: '💠',
    },
  ];

  return (
    <main className="vajra-shell">
      <div className="vajra-container">
        <section className="vajra-panel" data-tone="sunrise">
          <div className="vajra-ornament" aria-hidden />
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl space-y-4">
              <span className="vajra-kicker">Admin console</span>
              <h1 className="vajra-heading mt-2">Welcome back, {displayName}</h1>
              <p className="vajra-subtext">
                Steward the Maratika ledger with a calm, minimal toolkit. Each action is a
                focused ritual: upload statements, refine categories, and illuminate
                insights for the sangha.
              </p>
            </div>
            <form action="/api/auth/signout" method="post" className="shrink-0">
              <button type="submit" className="vajra-button vajra-button--ghost" data-size="sm">
                Sign out
              </button>
            </form>
          </div>
        </section>

        <section className="vajra-panel">
          <div className="flex flex-col gap-6">
            <div>
              <p className="vajra-kicker">Primary actions</p>
              <h2 className="vajra-heading mt-3 text-[clamp(1.8rem,4vw,2.3rem)]">Your Vajra toolkit</h2>
              <p className="vajra-subtext mt-2">
                Navigate straight to the flows you need. Cards open into full-screen workspaces with
                a softened, modern palette inspired by Himalayan temples.
              </p>
            </div>
            <div className="vajra-card-grid">
              {cards.map(card => (
                <Card key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section className="vajra-panel" data-tone="horizon">
          <div className="space-y-3">
            <span className="vajra-kicker">Need a reminder?</span>
            <p className="vajra-subtext">
              Upload PDFs immediately after monthly reconciliation. The transaction view always
              shows the most recent statement so you can gently correct descriptions and note
              variances before sharing reports with the community.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: string }) {
  return (
    <Link href={href} className="vajra-card">
      <span className="vajra-card__icon" aria-hidden>
        {icon}
      </span>
      <span className="vajra-card__title">{title}</span>
      <span className="vajra-card__desc">{desc}</span>
    </Link>
  );
}
