// Server component: protects the /admin page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import Layout from '@/components/Layout';
import Card from '@/components/Card';

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

  // Check if user has admin role in profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/'); // not an admin
  }

  return (
    <Layout 
      title="Dashboard" 
      description="Welcome to Maratika Thuchi - Your financial management center"
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card
          href="/admin/upload"
          title="Upload Statement"
          description="Parse bank statement PDFs and automatically extract transaction data with our advanced Vietnamese banking format support."
          icon="📄"
        />
        <Card
          href="/admin/categories"
          title="Manage Categories"
          description="Create, edit, and organize transaction categories to better understand your spending patterns and financial habits."
          icon="🏷️"
        />
        <Card
          href="/admin/users"
          title="User Management"
          description="Manage user accounts, roles, and permissions to control access to your financial management system."
          icon="👥"
        />
        <Card
          href="/reports"
          title="Financial Reports"
          description="View comprehensive financial summaries, category breakdowns, and insights into your spending and income patterns."
          icon="📊"
        />
        <Card
          href="/transactions"
          title="Transaction History"
          description="Browse, search, and categorize your transaction history with detailed filtering and analysis tools."
          icon="💰"
        />
      </div>

      {/* Welcome message */}
      <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-accent-soft/10 to-accent-warm/10 border border-accent-soft/20">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-soft to-accent-warm flex items-center justify-center">
            <span className="text-2xl">🙏</span>
          </div>
          <div>
            <h2 className="text-2xl font-display font-semibold text-foreground">Welcome to Maratika Thuchi</h2>
            <p className="text-foreground/70">Your journey to financial clarity begins here</p>
          </div>
        </div>
        <p className="text-foreground/80 leading-relaxed">
          Maratika Thuchi combines modern financial technology with timeless wisdom, 
          helping you achieve clarity and insight into your financial journey. 
          Upload your bank statements, categorize transactions, and gain meaningful 
          insights into your spending patterns.
        </p>
      </div>
    </Layout>
  );
}
