'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, Session } from '@supabase/supabase-js';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Supabase env vars are missing');
  return { url, anon };
}

export default function LoginPage() {
  const router = useRouter();
  const [{ url, anon }] = useState(getEnv);
  const supabase = createClient(url, anon);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // prevent multiple redirects
  const navigating = useRef(false);

  async function syncCookie(event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session?: Session | null) {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event,
        session: session
          ? { access_token: session.access_token, refresh_token: session.refresh_token }
          : null,
      }),
    });
  }

  // If already signed in on the client: sync cookie first, then go to /admin
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session && !navigating.current) {
        navigating.current = true;
        await syncCookie('SIGNED_IN', data.session); // <-- important
        router.replace('/admin');
        // No router.refresh() here; /admin is a new page.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      await syncCookie('SIGNED_IN', data.session);
      if (!navigating.current) {
        navigating.current = true;
        router.replace('/admin');
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-soft to-accent-warm flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-display">M</span>
          </div>
          <h1 className="text-3xl font-display font-semibold text-foreground mb-2">Maratika Thuchi</h1>
          <p className="text-foreground/70">Financial Management System</p>
        </div>

        {/* Login form */}
        <div className="rounded-2xl bg-surface-1/50 backdrop-blur-sm border border-surface-2 p-8">
          <h2 className="text-2xl font-display font-semibold text-foreground mb-6 text-center">Sign In</h2>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                className="w-full rounded-xl bg-surface-2/50 border border-surface-2 px-4 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-soft/50 focus:border-accent-soft transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <input
                type="password"
                className="w-full rounded-xl bg-surface-2/50 border border-surface-2 px-4 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-soft/50 focus:border-accent-soft transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-accent-soft to-accent-warm text-white py-3 font-medium disabled:opacity-60 hover:shadow-lg hover:shadow-accent-soft/25 transition-all duration-200 disabled:hover:shadow-none"
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-foreground/60">
              Welcome to your journey of financial clarity
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
