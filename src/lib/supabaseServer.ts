// src/lib/supabaseServer.ts
import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/** User-scoped server client (anon key + auth cookies) */
export function supabaseServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return store.get(name)?.value;
        },
        set(name, value, options) {
          store.set({ name, value, ...options });
        },
        remove(name, options) {
          store.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );
}

/** Admin client for server tasks (SERVICE ROLE key) */
export function supabaseServerAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only env
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
