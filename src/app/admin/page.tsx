// src/app/admin/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic'; // ensure cookies/session are read fresh

export default async function AdminPage() {
  const supabase = supabaseServer();

  // 1) Check session (server-side)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    // If something went wrong reading the session, treat like unauthenticated
    redirect('/login');
  }

  if (!session) {
    redirect('/login');
  }

  // 2) Check role from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('user_id', session.user.id)
    .maybeSingle();

  // If no profile row yet, or any error, block access
  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/'); // or redirect('/login') — your choice
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">
        Admin Dashboard{profile?.full_name ? ` — ${profile.full_name}` : ''}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        You are signed in as <span className="font-medium">{session.user.email}</span>.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          title="Upload Statement"
          desc="Import a bank PDF and parse to transactions."
          href="/upload"
        />
        <AdminCard
          title="Transactions"
          desc="Review, hide, and categorize transactions."
          href="/admin/transactions"
        />
        <AdminCard
          title="Categories"
          desc="Create and manage categories & targets."
          href="/admin/categories"
        />
        <AdminCard
          title="Reports"
          desc="Totals in/out, by category, and details."
          href="/reports"
        />
        <AdminCard
          title="Users"
          desc="Create, edit, or delete application users."
          href="/admin/users"
        />
      </section>
    </main>
  );
}

function AdminCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-gray-200 p-5 shadow-sm transition hover:shadow-md"
    >
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
      <span className="mt-3 inline-block text-sm font-medium text-blue-600">
        Open →
      </span>
    </Link>
  );
}
