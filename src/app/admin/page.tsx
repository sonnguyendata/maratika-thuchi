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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <form action="/api/auth/signout" method="post">
            <button className="rounded-md bg-black px-3 py-2 text-white">Sign out</button>
          </form>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card href="/upload" title="Upload statement" desc="Parse a bank statement PDF and store transactions." />
          <Card href="/admin/categories" title="Manage categories" desc="Create, edit or delete categories." />
          <Card href="/admin/users" title="Manage users" desc="Create, edit or delete app users." />
          <Card href="/reports" title="Reports" desc="View monthly summaries and category breakdowns." />
          <Card href="/transactions" title="Transactions" desc="Search, view, and categorize transactions." />
        </section>
      </div>
    </main>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <h2 className="mb-1 text-lg font-medium">{title}</h2>
      <p className="text-sm text-gray-600">{desc}</p>
    </Link>
  );
}
