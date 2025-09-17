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
    <main className="vajra-shell">
      <div className="vajra-container">
        <section className="vajra-panel max-w-md mx-auto" data-tone="sunrise">
          <div className="vajra-ornament" aria-hidden />
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="vajra-kicker">Admin access</span>
              <h1 className="vajra-heading text-[clamp(1.8rem,5vw,2.3rem)]">Enter the treasury</h1>
              <p className="vajra-subtext">
                Sign in with your Supabase credentials to continue. Sessions sync back to the
                server so the Vajra workspace can greet you instantly.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,246,230,0.75)] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="vajra-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  placeholder="you@example.org"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,246,230,0.75)] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  className="vajra-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="vajra-toast" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="vajra-button w-full justify-center">
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
