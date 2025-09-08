'use client';                  // <-- must be first

export const dynamic = 'force-dynamic';

import { useCallback, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key, ok: Boolean(url && key) };
}

export default function LoginPage() {
  const [msg, setMsg] = useState<string>('');
  const env = useMemo(getEnv, []);

  const signIn = useCallback(async () => {
    try {
      if (!env.ok) {
        setMsg('Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel.');
        return;
      }
      const supabase = createClient(env.url!, env.key!);
      const email = prompt('Enter email for magic link:');
      if (!email) return;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      setMsg(error ? error.message : 'Check your email for the login link.');
    } catch (e: any) {
      setMsg(e?.message ?? 'Unexpected error');
    }
  }, [env]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>

        {!env.ok && (
          <div className="p-3 rounded border text-sm">
            Missing env vars. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel → Project → Settings → Environment Variables.
          </div>
        )}

        <button onClick={signIn} className="px-4 py-2 rounded bg-black text-white w-full">
          Send magic link
        </button>

        {msg && <div className="text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  );
}